import { load_report_data } from "@/lib/report";

export async function GET() {
  const content = await load_report_data(true);
  return Response.json({ reportdata: content })
}
