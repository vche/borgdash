import type { NextRequest } from 'next/server';
import { load_report_data } from "@/lib/report";

export async function GET(request: NextRequest) {
  const content = await load_report_data();
  return Response.json({ reportdata: content })
}
