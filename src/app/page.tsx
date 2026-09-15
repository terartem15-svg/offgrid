import { FeaturesBar } from "@/components/home/features-bar";
import { Hero } from "@/components/home/hero";
import { PromoBanners } from "@/components/home/promo-banners";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { TrendingNow } from "@/components/home/trending-now";
import { getCategoryTiles, getTrendingProducts } from "@/lib/products";

// Homepage rails read live catalog data — render on request rather than at
// build time so `next build` never needs a database connection.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, trending] = await Promise.all([
    getCategoryTiles(),
    getTrendingProducts(6),
  ]);

  return (
    <>
      <Hero />
      <FeaturesBar />
      <ShopByCategory categories={categories} />
      <TrendingNow products={trending} />
      <PromoBanners />
    </>
  );
}
