import { NextResponse } from "next/server";

// Teable analytics beacon is intentionally disabled in the standalone version.
export async function POST() {
  return new NextResponse(null, { status: 204 });
}
