import { NextResponse, type NextRequest } from 'next/server';
import { get_text_config, get_config, save_config } from "@/lib/config";

// get /api/config accepts optional params: format="text"|"json" force="true"|"false"
export async function GET(request: NextRequest) {
  // accept text format request
  const force = request.nextUrl.searchParams.get("force") == "true" ? true : false;
  if (request.nextUrl.searchParams.get("format") == "text") {
    const content = await get_text_config(force);
    return Response.json({ configdata: content })
  }
  // by default, return json
  else {
    const content = await get_config(force);
    return Response.json({ configdata: content })

  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  await save_config(body.configdata);
  return new NextResponse();
}
