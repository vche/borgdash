import type { NextRequest } from 'next/server';
import { load_logfile } from "@/lib/report";

export async function POST(request: NextRequest) {
  const url = request.nextUrl;
  const body = await request.json();

  console.log("pipo tarace " + url);
  console.log(body);

  const content = await load_logfile(body.filepath);
  return Response.json({ filecontent: content })
}
