import { NextRequest, NextResponse } from "next/server";

import { searchProducts } from "@/lib/products";
import { cleanText } from "@/lib/query-params";

export async function GET(request: NextRequest) {
  const q = cleanText(request.nextUrl.searchParams.get("q") ?? "");
  const results = await searchProducts(q);
  return NextResponse.json({ results });
}
