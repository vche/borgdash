import yaml
import sys
from typing import Any, Dict, Optional, Tuple
from .exceptions import ConfigError

class Config(object):
  DEFAULT_CONFIG="config.yaml"
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

  def __init__(self, config_file: Optional[str]) -> None:
    self._config_file = config_file or self.DEFAULT_CONFIG
    self.load()

  def load(self) -> None:
    """Load the yaml configuration"""
    try:
      with open(self._config_file, "r") as f:
        self._config = yaml.safe_load(f)

      # Set default config for missing values
      self._config.setdefault(self.CONFIG_KEY_REPORTER, {})
      self._config.setdefault(self.CONFIG_KEY_REPOS, {})
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
