// This module is server side only and cannot be used client side as it's reading files from filesystem
import { promises as fs } from "fs";
import { get_config } from "@/lib/config";

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
      const repath = await get_config();
      const file = await fs.readFile(repath.reporter.report_path, "utf8");
      report_cache = JSON.parse(file);
    } catch (error) {
      console.log("Error loading file:" + error);
    }
  }
  return report_cache;
}

export async function load_logfile(logfilepath: string) {
  return await fs.readFile(logfilepath, "utf8");
}
