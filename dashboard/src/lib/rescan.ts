import { ChildProcess, spawn } from "child_process";
import { get_config } from "@/lib/config";

export type tRescanStatus = { status: "success" | "error" | "running" | null, stdout: string | null, stderr: string | null };

// Global variable to store the current rescan process
let rescanProcess: ChildProcess | null = null;
let rescanStdout: string = "";
let rescanStderr: string = "";

export function rescan_is_running() {
  // If there is a process, and no exit code, it is running
  return (rescanProcess && rescanProcess.exitCode == null && !rescanProcess.killed) ? true : false;
}

export function rescan_get_status() {
  const scan_status: tRescanStatus = { status: null, stdout: null, stderr: null };
  if (rescanProcess) {
    if (rescanProcess.exitCode == null && !rescanProcess.killed) scan_status.status = "running";
    else if (rescanProcess.exitCode == 0) scan_status.status = "success";
    else scan_status.status = "error";
    scan_status.stdout = rescanStdout ? rescanStdout : null;
    scan_status.stderr = rescanStderr ? rescanStderr : null;
  }

  return scan_status;
}

export async function rescan_stop() {
  console.log("process killed");
  rescanProcess?.kill();
}

export async function rescan_start() {
  const config = await get_config();
  rescanProcess = spawn(config.dashboard.reporter_path, [], { timeout: config.dashboard.rescan_timeout_ms });
  rescanStdout = "";
  rescanStderr = "";

  // add event listeners
  rescanProcess.stdout?.on("data", data => {
    console.log(`stdout: ${data}`);
    rescanStdout = rescanStdout.concat(data);
  });
  rescanProcess.stderr?.on("data", data => {
    console.log(`stderr: ${data}`);
    rescanStderr = rescanStderr.concat(data);
  });
  rescanProcess.on('error', (error) => { console.log(`error: ${error.message}`); });
  rescanProcess.on("close", code => { console.log(`child process exited with code ${code}`); });
}
