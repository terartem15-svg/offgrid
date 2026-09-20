"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { createProduct, deleteProduct, updateProduct } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, slugify } from "@/lib/utils";

type VariantRow = {
  key: string;
  id?: string;
  size: string;
  color: string;
  stock: string;
  priceOverride: string;
};

type BrandOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

export type ProductFormInitial = {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  brandId: string;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  images: string[];
  variants: {
    id: string;
    size: string;
    color: string;
    stock: number;
    priceOverride: number | null;
  }[];
};

type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
  brands: BrandOption[];
  categories: CategoryOption[];
  initial?: ProductFormInitial;
};

let rowKeySeq = 0;
const nextKey = () => `row-${rowKeySeq++}`;

/**
 * `redirect()` inside the Server Action throws a special NEXT_REDIRECT error
 * that propagates all the way back to this client call site — it must be
 * re-thrown, never swallowed, or the navigation on success silently breaks.
 */
function isNextRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function toVariantRows(initial?: ProductFormInitial): VariantRow[] {
  if (!initial || initial.variants.length === 0) {
    return [{ key: nextKey(), size: "", color: "", stock: "0", priceOverride: "" }];
  }
  return initial.variants.map((v) => ({
    key: nextKey(),
    id: v.id,
    size: v.size,
    color: v.color,
    stock: String(v.stock),
    priceOverride: v.priceOverride != null ? String(v.priceOverride) : "",
  }));
}

export function ProductForm({ mode, productId, brands, categories, initial }: ProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [basePrice, setBasePrice] = useState(initial ? String(initial.basePrice) : "");
  const [brandId, setBrandId] = useState(initial?.brandId ?? brands[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [images, setImages] = useState(
    initial?.images && initial.images.length > 0 ? initial.images : [""],
  );
  const [variants, setVariants] = useState<VariantRow[]>(() => toVariantRows(initial));

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const updateVariant = (key: string, patch: Partial<VariantRow>) =>
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaved(false);

    const payload = {
      name,
      slug,
      description,
      basePrice: Number(basePrice) || 0,
      brandId,
      categoryId,
      status,
      isFeatured,
      images: images.map((i) => i.trim()).filter(Boolean),
      variants: variants
        .filter((v) => v.size.trim() && v.color.trim())
        .map((v) => ({
          id: v.id,
          size: v.size.trim(),
          color: v.color.trim(),
          stock: Number(v.stock) || 0,
          priceOverride: v.priceOverride.trim() ? Number(v.priceOverride) : null,
        })),
    };

    if (payload.images.length === 0) {
      setError("Add at least one image URL");
      return;
    }
    if (payload.variants.length === 0) {
      setError("Add at least one variant (size + color)");
      return;
    }

    setSaving(true);
    try {
      const result =
        mode === "create"
          ? await createProduct(payload)
          : await updateProduct(productId!, payload);

      if (result && "error" in result) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      if (isNextRedirectError(err)) throw err; // successful create — let Next navigate
      console.error(err);
      setError("Unexpected error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    if (!window.confirm("Delete this product permanently? This cannot be undone.")) return;

    setError(null);
    try {
      const result = await deleteProduct(productId);
      if (result && "error" in result) setError(result.error);
    } catch (err) {
      if (isNextRedirectError(err)) throw err; // successful delete — let Next navigate
      console.error(err);
      setError("Unexpected error — please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={cn(fieldError("name") && "border-red-400 focus:border-red-500")}
          />
          {fieldError("name") && <p className="mt-1 text-xs text-red-600">{fieldError("name")}</p>}
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={cn(fieldError("slug") && "border-red-400 focus:border-red-500")}
          />
          {fieldError("slug") && <p className="mt-1 text-xs text-red-600">{fieldError("slug")}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={cn(
            "w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink",
            fieldError("description") && "border-red-400 focus:border-red-500",
          )}
        />
        {fieldError("description") && (
          <p className="mt-1 text-xs text-red-600">{fieldError("description")}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="basePrice">Base Price (EUR)</Label>
          <Input
            id="basePrice"
            type="number"
            min={0}
            step="0.01"
            required
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className={cn(fieldError("basePrice") && "border-red-400 focus:border-red-500")}
          />
          {fieldError("basePrice") && (
            <p className="mt-1 text-xs text-red-600">{fieldError("basePrice")}</p>
          )}
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Select id="brand" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-ink/25 text-ink focus:ring-ink"
        />
        Featured product
      </label>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
            Images (URL per row)
          </p>
          <button
            type="button"
            onClick={() => setImages((rows) => [...rows, ""])}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add image
          </button>
        </div>
        {fieldError("images") && <p className="mt-1 text-xs text-red-600">{fieldError("images")}</p>}
        <div className="mt-3 space-y-2">
          {images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={url}
                placeholder="https://…"
                onChange={(e) =>
                  setImages((rows) => rows.map((r, idx) => (idx === i ? e.target.value : r)))
                }
              />
              <button
                type="button"
                onClick={() => setImages((rows) => rows.filter((_, idx) => idx !== i))}
                aria-label="Remove image"
                disabled={images.length === 1}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-ink/20 text-ink/50 hover:border-red-400 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
            Variants (size / color / stock)
          </p>
          <button
            type="button"
            onClick={() =>
              setVariants((rows) => [
                ...rows,
                { key: nextKey(), size: "", color: "", stock: "0", priceOverride: "" },
              ])
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add variant
          </button>
        </div>
        {fieldError("variants") && (
          <p className="mt-1 text-xs text-red-600">{fieldError("variants")}</p>
        )}
        <div className="mt-3 space-y-2">
          {variants.map((row) => (
            <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
              <Input
                placeholder="Size (e.g. M, 42)"
                value={row.size}
                onChange={(e) => updateVariant(row.key, { size: e.target.value })}
              />
              <Input
                placeholder="Color"
                value={row.color}
                onChange={(e) => updateVariant(row.key, { color: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                placeholder="Stock"
                value={row.stock}
                onChange={(e) => updateVariant(row.key, { stock: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Price override (optional)"
                value={row.priceOverride}
                onChange={(e) => updateVariant(row.key, { priceOverride: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setVariants((rows) => rows.filter((r) => r.key !== row.key))}
                aria-label="Remove variant"
                disabled={variants.length === 1}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-ink/20 text-ink/50 hover:border-red-400 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}

      <div className="flex items-center justify-between border-t border-ink/10 pt-6">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
        </Button>

        {mode === "edit" && (
          <Button type="button" variant="outline" onClick={handleDelete} className="text-red-600">
            Delete Product
          </Button>
        )}
      </div>
    </form>
  );
}
