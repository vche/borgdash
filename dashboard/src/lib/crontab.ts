import { promisify } from "util";
import { exec } from "child_process";
import { promises as fs } from "fs";
import { CONFIG_PATH, get_config } from "@/lib/config";
const exec_async = promisify(exec);

export type tCrontabConfig = {
  enabled: boolean,
  schedule?: string,
};

const DEFAULT_SCHEDULE = "0 6 * * *";
const DEFAULT_CONFIG = { enabled: false, schedule: DEFAULT_SCHEDULE };
const STDLOG_ARGS = ">/proc/1/fd/1 2>/proc/1/fd/2";
// Non-blocking lock so a scheduled scan skips if the previous one is still running.
const REPORTER_LOCK = "flock -n /tmp/borgdash-reporter.lock";

export async function load_crontab(): Promise<tCrontabConfig> {
  const cfg = await get_config();

  try {
    const cron_config_text = await fs.readFile(cfg.reporter.crontab_path, "utf8");

    let enabled = true;
    let tokens = cron_config_text.split(' ');
    // If first token is a comment character, set as disabled and shift tokens by 1
    if (tokens[0].startsWith('#')) {
      enabled = false;
      tokens = tokens.slice(1);
    }
    const schedule = tokens.slice(0, 5).join(' ');
    // const command = tokens.slice(5).join(' ');

    console.log(`Loaded crontab file ${cfg.reporter.crontab_path}`);
    return { enabled: enabled, schedule: schedule };
  } catch {
    console.log(`Unable to parse crontab ${cfg.reporter.crontab_path}. Loading hardcoded config`);
    return DEFAULT_CONFIG;
  }
}

export async function write_crontab(croncfg: tCrontabConfig) {
  const cfg = await get_config();

  try {
    const schedule = croncfg.schedule ? croncfg.schedule : DEFAULT_SCHEDULE;
    // Guard against overlapping scans: on large repos or a busy NFS mount a scan can
    // still be running when the next scheduled tick fires, stacking reporter processes
    // that pile on more I/O and can spiral. flock -n makes a new run skip if one is
    // already in progress. (load_crontab only reads the first 5 tokens as the schedule,
    // so the wrapped command doesn't affect schedule parsing.)
    const commmand = `${REPORTER_LOCK} ${cfg.dashboard.reporter_path} ${CONFIG_PATH}`;
    const cronline = `${croncfg.enabled ? '' : '# '}${schedule} ${commmand} ${STDLOG_ARGS}\n`
    await fs.writeFile(cfg.reporter.crontab_path, cronline);
    console.log(`Crontab file saved to ${cfg.reporter.crontab_path}`);

    await exec_async(`crontab ${cfg.reporter.crontab_path}`);
    console.log(`Crontab file ${cfg.reporter.crontab_path} reloaded`);

  } catch (error) {
    console.log(`Error saving file ${cfg.reporter.crontab_path}: ${error}`);
  }
}
