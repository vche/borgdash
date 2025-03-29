import { NextResponse, type NextRequest } from 'next/server';
import { get_config, save_config } from "@/lib/config";

export async function GET() {
  const content = await get_config();
  return Response.json({ configdata: content })
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  await save_config(body.configdata);
  return new NextResponse();
}
