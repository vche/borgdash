import type { NextRequest } from 'next/server';
import { load_logfile } from "@/lib/report";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const content = await load_logfile(body.filepath);
  return Response.json({ filecontent: content })
}
