import yaml
import sys
from typing import Any, Dict, Optional, Tuple
from .exceptions import ConfigError
from pathlib import Path

def dict_deep_update(d, u):
    for k, v in u.items():
        if isinstance(v, dict):
            d[k] = dict_deep_update(d.get(k, {}), v)
        else:
            d[k] = v
    return d


class Config(object):
  DEFAULT_CONFIG="/etc/config_default.yaml"
  DEFAULT_REPORT_PATH = "/tmp/bordash.json"
  DEFAULT_BORG_PATH = "/usr/bin/borg"
  DEFAULT_DEDUPE_PATH = "/tmp/borgdash_dedupe.json"
  DEFAULT_LOGS_BASEDIR = "/logs"
  DEFAULT_REPOS_BASEDIR = "/repos"
  DEFAULT_ALARM_MESSAGE = "**{} Backups failed**:\n\n{}"
  DEFAULT_ALARM_MESSAGE_DEV = "- {}: Failed with status {} on {}\n"

  CONFIG_KEY_REPORTER = "reporter"
  CONFIG_KEY_REPORT_PATH = "report_path"
  CONFIG_KEY_BORG_PATH = "borg_path"
  CONFIG_KEY_DEDUPE_PATH = "dedupe_path"
  CONFIG_KEY_LOGS_BASEDIR = "logs_basedir"
  CONFIG_KEY_REPOS_BASEDIR = "repos_basedir"
  CONFIG_KEY_DISCORD = "discord"
  CONFIG_KEY_WEBHOOK = "webhook"
  CONFIG_KEY_WEBHOOK_USER = "webhook_user"
  CONFIG_KEY_MESSAGE = "message"
  CONFIG_KEY_MESSAGE_DEVICE = "message_device"

  CONFIG_KEY_REPOS = "repos"
  CONFIG_KEY_REPO_PATH = "repo_path"
  CONFIG_KEY_LOG_PATH = "log_path"
  CONFIG_KEY_REPO_PWD = "repo_pwd"
  CONFIG_KEY_SCRIPT = "script"

  def __init__(self, config_file: Optional[str], defaultcfgfile: Optional[str] = None) -> None:
    self._config_file = config_file

    # Look for default config: Use env var, or default path or custom config folder
    defaultcfg = Path(defaultcfgfile or self.DEFAULT_CONFIG)
    if not Path(defaultcfg).exists() and config_file:
      defaultcfg = Path(config_file).parent / "config_default.yaml"
    if not defaultcfg.exists():
      raise ConfigError("Couldn't find default config file and not specified in env BORGDASH_DEFAULT_CONFIG`")

    # Load the default config
    self._config = self.load(str(defaultcfg))
    # Set default config for missing values
    self._config.setdefault(self.CONFIG_KEY_REPORTER, {})
    self._config.setdefault(self.CONFIG_KEY_REPOS, {})

    # Load the custom config and merge with it with the default values
    if self._config_file:
      custom_config = self.load(self._config_file)
      dict_deep_update(self._config, custom_config)

  def load(self, filepath: str) -> Dict[str, Any]:
    """Load the yaml configuration"""
    try:
      with open(filepath, "r") as f:
        return yaml.safe_load(f)

    except Exception as e:
          raise ConfigError(e) from e

  @property
  def report_path(self) -> str:
    return self._config[self.CONFIG_KEY_REPORTER].get(self.CONFIG_KEY_REPORT_PATH, self.DEFAULT_REPORT_PATH)

  @property
  def borg_path(self) -> str:
    return self._config[self.CONFIG_KEY_REPORTER].get(self.CONFIG_KEY_BORG_PATH, self.DEFAULT_BORG_PATH)

  @property
  def logs_basedir(self) -> str:
    return self._config[self.CONFIG_KEY_REPORTER].get(self.CONFIG_KEY_LOGS_BASEDIR, self.DEFAULT_LOGS_BASEDIR)

  @property
  def repos_basedir(self) -> str:
    return self._config[self.CONFIG_KEY_REPORTER].get(self.CONFIG_KEY_REPOS_BASEDIR, self.DEFAULT_REPOS_BASEDIR)

  @property
  def dedupe_path(self) -> str:
    return self._config[self.CONFIG_KEY_REPORTER].get(self.CONFIG_KEY_DEDUPE_PATH, self.DEFAULT_DEDUPE_PATH)

  @property
  def discord_config(self) -> Optional[Tuple[str, Optional[str], str, str]]:
    """Discord configuration if enabled (webhook, user, message, device message), or None"""
    discord_cfg = self._config[self.CONFIG_KEY_REPORTER].get(self.CONFIG_KEY_DISCORD)
    return (
      discord_cfg[self.CONFIG_KEY_WEBHOOK],
      discord_cfg.get(self.CONFIG_KEY_WEBHOOK_USER),
      discord_cfg.get(self.CONFIG_KEY_MESSAGE, self.DEFAULT_ALARM_MESSAGE),
      discord_cfg.get(self.CONFIG_KEY_MESSAGE_DEVICE, self.DEFAULT_ALARM_MESSAGE_DEV),
    ) if discord_cfg and discord_cfg.get(self.CONFIG_KEY_WEBHOOK) else None

  @property
  def repos_config(self) -> Dict[str, Any]:
    return self._config.get(self.CONFIG_KEY_REPOS, {})

  def dump(self):
    print("Reporter config:", file=sys.stderr)
    print(f"  report={self.report_path}\n  borg={self.borg_path}\n  logs={self.logs_basedir}", file=sys.stderr)
    print(f"  repos={self.repos_basedir}\n  discord={self.discord_config}", file=sys.stderr)
    print(f"Repos config: {self.repos_config}", file=sys.stderr)
