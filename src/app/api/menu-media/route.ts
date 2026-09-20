import { Gender } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getMenuMedia } from "@/lib/products";

const GENDER_BY_PARAM: Record<string, Gender> = {
  men: Gender.MEN,
  women: Gender.WOMEN,
  unisex: Gender.UNISEX,
};

export async function GET(request: NextRequest) {
  const gender = GENDER_BY_PARAM[request.nextUrl.searchParams.get("gender") ?? ""];
  if (!gender) {
    return NextResponse.json({ error: "Unknown gender" }, { status: 400 });
  }

  const media = await getMenuMedia(gender);
  // The menu is opened on hover, so let the CDN absorb repeat hits — a few
  // minutes of staleness is invisible for "newest product per brand" photos.
  return NextResponse.json(media, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
