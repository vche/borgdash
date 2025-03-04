import { promises as fs } from "fs";

type tBorgLog = {
  archive: string | null;
  datetime: string | null;
  fullpath: string;
  name: string;
  status: string | null;
};
type tBorgArchive = {
  datetime: string | null;
  log: tBorgLog;
  name: string;
  sizes: number[];
};
export type tBorgRepo = {
  archives: { [k: string]: tBorgArchive };
  last_run: tBorgLog | null;
  last_backup: tBorgArchive | null;
  logfiles: { [k: string]: tBorgLog };
  logspath: string;
  name: string;
  repopath: string;
  script: string;
  sizes: number[];
};
type tBorgReport = tBorgRepo[] | null | undefined;

// Report caching to avoid reloading
let report_cache: tBorgReport = null;

export async function load_report_data(force: boolean = false) {
  // Reload if there's no cache or a force reload is required
  if (!report_cache || force) {
    const file = await fs.readFile("/tmp/bordash.json", "utf8");
    report_cache = JSON.parse(file);
    console.log("File loaded yo");
  }
  return report_cache;
}
