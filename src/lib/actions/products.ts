"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().min(1).max(20),
  color: z.string().min(1).max(60),
  stock: z.number().int().min(0),
  priceOverride: z.number().min(0).nullable(),
});

const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, letters/numbers and hyphens only"),
  description: z.string().min(1),
  basePrice: z.number().min(0),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isFeatured: z.boolean(),
  images: z.array(z.string().url()).min(1, "At least one image URL is required"),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

export type ProductFormInput = z.infer<typeof productSchema>;
export type ProductFormResult =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | { success: true };

function skuFor(slug: string, size: string, color: string) {
  return `${slug}-${size}-${color}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCents(euros: number) {
  return Math.round(euros * 100);
}

/** Turns a Zod failure into a form-friendly result — never let a raw ZodError escape a Server Action. */
function validationError(error: z.ZodError): { error: string; fieldErrors: Record<string, string[]> } {
  const { fieldErrors } = error.flatten();
  const cleaned = Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1]?.length)),
  );
  const [firstField, firstMessages] = Object.entries(cleaned)[0] ?? [];
  return {
    error: firstField ? `${firstField}: ${firstMessages![0]}` : "Invalid input",
    fieldErrors: cleaned,
  };
}

export async function createProduct(input: ProductFormInput): Promise<ProductFormResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;

  let newProductId: string;
  try {
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) return { error: "A product with this slug already exists" };

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        basePrice: toCents(data.basePrice),
        status: data.status,
        isFeatured: data.isFeatured,
        brandId: data.brandId,
        categoryId: data.categoryId,
        images: { create: data.images.map((url, i) => ({ url, position: i })) },
        variants: {
          create: data.variants.map((v) => ({
            sku: skuFor(data.slug, v.size, v.color),
            size: v.size,
            color: v.color,
            stock: v.stock,
            priceOverride: v.priceOverride != null ? toCents(v.priceOverride) : null,
          })),
        },
      },
    });
    newProductId = product.id;
  } catch (err) {
    console.error("createProduct failed:", err);
    return { error: "Something went wrong while creating the product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
  redirect(`/admin/products/${newProductId}`);
}

export async function updateProduct(
  id: string,
  input: ProductFormInput,
): Promise<ProductFormResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;

  try {
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing && existing.id !== id) {
      return { error: "A product with this slug already exists" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          basePrice: toCents(data.basePrice),
          status: data.status,
          isFeatured: data.isFeatured,
          brandId: data.brandId,
          categoryId: data.categoryId,
        },
      });

      // The form only submits image URLs, so match them to the rows already stored instead of
      // deleting and recreating everything: a recreated row would lose its `color` (which the
      // storefront gallery filters on) and its `alt` text. Only URLs the admin removed are deleted.
      const storedImages = await tx.productImage.findMany({ where: { productId: id } });
      const storedByUrl = new Map<string, (typeof storedImages)[number]>();
      for (const image of storedImages) if (!storedByUrl.has(image.url)) storedByUrl.set(image.url, image);

      const keptImageIds: string[] = [];
      for (const [position, url] of data.images.entries()) {
        const stored = storedByUrl.get(url);
        if (stored) {
          storedByUrl.delete(url); // a URL listed twice keeps one row and creates one new row
          keptImageIds.push(stored.id);
          if (stored.position !== position) {
            await tx.productImage.update({ where: { id: stored.id }, data: { position } });
          }
        } else {
          const created = await tx.productImage.create({ data: { productId: id, url, position } });
          keptImageIds.push(created.id);
        }
      }
      await tx.productImage.deleteMany({ where: { productId: id, id: { notIn: keptImageIds } } });

      const keepIds = data.variants.filter((v) => v.id).map((v) => v.id!);
      // `notIn: []` (no existing variants kept) correctly matches — and
      // deletes — every current variant for this product.
      await tx.productVariant.deleteMany({
        where: { productId: id, id: { notIn: keepIds } },
      });

      for (const v of data.variants) {
        const priceOverride = v.priceOverride != null ? toCents(v.priceOverride) : null;
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: { size: v.size, color: v.color, stock: v.stock, priceOverride },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              sku: skuFor(data.slug, v.size, v.color),
              size: v.size,
              color: v.color,
              stock: v.stock,
              priceOverride,
            },
          });
        }
      }
    });
  } catch (err) {
    console.error("updateProduct failed:", err);
    return { error: "Something went wrong while saving the product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/catalog");
  revalidatePath(`/products/${data.slug}`);
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(id: string): Promise<{ error: string } | never> {
  await requireAdmin();

  try {
    await prisma.product.delete({ where: { id } });
  } catch (err) {
    console.error("deleteProduct failed:", err);
    return { error: "Something went wrong while deleting the product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
  redirect("/admin/products");
}
