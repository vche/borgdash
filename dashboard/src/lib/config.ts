import { env } from 'node:process';
import YAML from 'yaml'
import { existsSync, promises as fs } from "fs";
import { merge } from "ts-deepmerge";

export type tDashboardConfig = {
  reporter_path: string,
  rescan_timeout_ms: number,
  sshfs_mount_uptime_ms: number,
};

export type tReporterConfig = {
  report_path: string,
  borg_path: string,
  crontab_path: string,
  dedupe_path: string,
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

// Cache config of the "resolved" config: default extended with custom
let config_cache: tConfig | null = null;
// Text version of the editable config custom, does not include the default
let textconfig_cache: string | null = null;

// Export config paths and content
export const CONFIG_PATH = env.BORGDASH_CONFIG ? env.BORGDASH_CONFIG : "/etc/config.yaml";
const DEFAULT_CONFIG_PATH_BUILD = "../etc/config_default.yaml";
const DEFAULT_CONFIG_PATH = env.BORGDASH_DEFAULT_CONFIG ? env.BORGDASH_DEFAULT_CONFIG : "/etc/config_default.yaml";

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
    dedupe_path: "/tmp/dedupe",
    crontab_path: "/tmp/crontab",
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


function get_default_config_file(): string {
  // Default config file path at run time
  if (existsSync(DEFAULT_CONFIG_PATH)) {
    return DEFAULT_CONFIG_PATH;
  }
  // Config file path at build time
  if (existsSync(DEFAULT_CONFIG_PATH_BUILD)) {
    return DEFAULT_CONFIG_PATH_BUILD;
  }
  throw new Error("Unable to find default config file");
}

async function load_config_file(file_path: string, default_content?: tConfig): Promise<[tConfig, string]> {
  // Load a yaml file, parse it and return content as dict and text. If error, use default content or raise error
  let textconfig;
  let objconfig;
  try {
    textconfig = await fs.readFile(file_path, "utf8");
    objconfig = YAML.parse(textconfig);
    if (!objconfig) throw new Error("Unable to parse yaml");
    console.log(`Loaded config file ${file_path}`);
  } catch (error) {
    // console.debug(`Couldn't load file ${file_path}: ${error}.`);
    if (default_content) {
      // If a default content is specified, return it, otherwise throw an error
      console.log(`Loading hardcoded config, failed to load ${file_path}`);
      objconfig = default_content;
      textconfig = YAML.stringify(objconfig);
    }
    else {
      throw new Error(`Unable to load config from ${file_path}: ${error}`);
    }
  }
  return [objconfig, textconfig];
}

async function load_config(force: boolean = false): Promise<[tConfig, string]> {
  // Reload if there's no cache or a force reload is required
  if (!config_cache || !textconfig_cache || force) {
    try {
      [config_cache,] = await load_config_file(get_default_config_file(), DEFAULT_CONFIG);
      // + merge
      const [custom_config, custom_textconfig] = await load_config_file(CONFIG_PATH);
      config_cache = merge(config_cache, custom_config) as tConfig;
      // config_cache = resolved_config as tConfig;
      textconfig_cache = custom_textconfig;
      console.log(config_cache);
    } catch (error) {
      console.log(`Couldn't load config: ${error}`)
      throw new Error(`Couldn't load config: ${error}`);
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
    console.log(`Error saving file ${CONFIG_PATH}: ${error}`);
  }
}
