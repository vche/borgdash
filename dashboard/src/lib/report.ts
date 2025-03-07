import { promises as fs } from "fs";

export type tBorgSize = {
  osize: number;
  csize: number;
  dsize: number;
};

export type tBorgLog = {
  archive: string | null;
  datetime: string | null;
  fullpath: string;
  name: string;
  status: string | null;
};
export type tBorgArchive = {
  datetime: string | null;
  log: tBorgLog;
  name: string;
  sizes: tBorgSize;
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
  sizes: tBorgSize;
  status: boolean | null;
};
export type tBorgReport = {
  timestamp: string;
  repos: { [k: string]: tBorgRepo } | null | undefined;
} | null | undefined;

// Report caching to avoid reloading
let report_cache: tBorgReport = undefined;

export async function load_report_data(force: boolean = false) {
  // Reload if there's no cache or a force reload is required
  if (!report_cache || force) {
    try {
      const file = await fs.readFile("/tmp/bordash.json", "utf8");
      report_cache = JSON.parse(file);
      console.log("File loaded yo");
    } catch (error) {
      console.log("Error loading file:" + error);
    }
  }
  return report_cache;
}

export function get_repos_statuses(report: tBorgReport) {
  // Return status count of each report: [successes, errors, unkown]
  const statuses = [0, 0, 0];
  if (report && report.repos) {
    Object.values(report.repos).map((repo) => {
      if (repo.status == null) statuses[2]++;
      else if (repo.status) statuses[0]++;
      else statuses[1]++;
    });
  }
  return statuses;
}

export async function load_logfile(logfilepath: string) {
  return await fs.readFile(logfilepath, "utf8");
}
