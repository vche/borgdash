import { NextResponse, type NextRequest } from 'next/server';
import { load_crontab, write_crontab } from "@/lib/crontab";

export async function GET() {
  // accept text format request
  const content = await load_crontab();
  return Response.json({ cronconfig: content })
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  await write_crontab(body.cronconfig);
  return new NextResponse();
}
