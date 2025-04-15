import { env } from 'node:process';
import YAML from 'yaml'
import { promises as fs } from "fs";

export type tDashboardConfig = {
  reporter_path: string,
  rescan_timeout_ms: number,
  sshfs_mount_uptime_ms: number,
};

export type tReporterConfig = {
  report_path: string,
  borg_path: string,
  logs_basedir: string,
  repos_basedir: string,
  discord?: {
    webhook: string,
    webhook_user?: string,
    message?: string,
    message_device?: string,
  },
};

export type tRepoConfig = {
  repo_path: string,
  log_path?: string,
  repo_pwd?: string,
  script?: string,
};

export type tConfig = {
  dashboard: tDashboardConfig,
  reporter: tReporterConfig,
  report: { [k: string]: tRepoConfig },
};

// Cache configs
let config_cache: tConfig | null = null;
let textconfig_cache: string | null = null;

// Export config paths and content
export const CONFIG_PATH = env.BORGDASH_CONFIG ? env.BORGDASH_CONFIG : "../etc/config.yaml";
const DEFAULT_CONFIG_PATH = "../etc/config_default.yaml";

// Default config it none existing
const DEFAULT_CONFIG: tConfig = {
  dashboard: {
    reporter_path: "/Users/viv/dev/borgdash/reporter/.pixi/envs/default/bin/borgdash-reporter",
    rescan_timeout_ms: 300000,
    sshfs_mount_uptime_ms: 600000,
  },
  reporter: {
    report_path: "/tmp/bordash.json",
    borg_path: "/usr/bin/borg",
    logs_basedir: "/logs",
    repos_basedir: "/repos",
  },
  report: {}
}

export async function get_config(force: boolean = false): Promise<tConfig> {
  const [config_data,] = await load_config(force);
  return config_data;
}

export async function get_text_config(force: boolean = false): Promise<string> {
  const [, config_text] = await load_config(force);
  return config_text;
}

async function load_config_file(file_path: string, default_content?: tConfig): Promise<[tConfig, string]> {
  // Load a yaml file, parse it and return content as dict and text. If error, use default content or raise error
  try {
    textconfig_cache = await fs.readFile(file_path, "utf8");
    config_cache = YAML.parse(textconfig_cache);
    if (!config_cache) throw new Error("Unable to parse yaml");
    console.log(`Loaded config file ${file_path}`);
  } catch {
    // console.debug(`Couldn't load file ${file_path}: ${error}.`);
    if (default_content) {
      // If a default content is specified, return it, otherwise throw an error
      console.log(`Loading hardcoded config`);
      config_cache = default_content;
      textconfig_cache = YAML.stringify(config_cache);
    }
    else throw new Error("Unable to parse yaml");
  }
  return [config_cache, textconfig_cache];
}

async function load_config(force: boolean = false): Promise<[tConfig, string]> {
  // Reload if there's no cache or a force reload is required
  if (!config_cache || !textconfig_cache || force) {
    try {
      [config_cache, textconfig_cache] = await load_config_file(CONFIG_PATH);
    } catch {
      // Load the default config, or the hardcoded one if everything goes wrong
      [config_cache, textconfig_cache] = await load_config_file(DEFAULT_CONFIG_PATH, DEFAULT_CONFIG);
    }
  }
  return [config_cache, textconfig_cache];
}

export async function save_config(config?: string) {
  // Reload if there's no cache or a force reload is required
  try {
    const config_data = config ? config : YAML.stringify(config_cache);
    await fs.writeFile(CONFIG_PATH, config_data);
    console.log(`Config file saved to ${CONFIG_PATH}`);
  } catch (error) {
    console.log(`Error loading file ${CONFIG_PATH}: ${error}`);
  }
}
