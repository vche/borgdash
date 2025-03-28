import { rescan_is_running, rescan_get_status, rescan_start } from "@/lib/rescan"

// Start a scan if none is running, and return the current status
export async function PUT() {
  if (!rescan_is_running()) {
    console.log("Starting rescan process");
    rescan_start();
  }
  else {
    console.log("process aleady running...");
  }

  return Response.json(rescan_get_status())
}

// Return the current scan status
export async function GET() {
  return Response.json(rescan_get_status())
}
