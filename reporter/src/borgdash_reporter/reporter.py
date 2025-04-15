import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional
from .config import Config
from .notifier import get_notifier
from .exceptions import RepoError
from .repo import BorgRepo
from .logfs import resolve_path

log = logging.getLogger(__name__)

class BorgReporter:
  def __init__(self, config: Config) -> None:
    self._cfg = config
    self._repos = []
    self._notifier = get_notifier(config)

  def to_dict(self) -> Dict[str, Any]:
    return {
      "timestamp": datetime.now().isoformat(),
      "repos": {repo.name: repo.to_dict() for repo in self._repos},
    }

  def from_dict(self, dict_data:Dict[str, Any]) -> None:
    self._repos = []
    for repo_name, repo_data in dict_data.get("repos", []).items():
        repo_config = self._cfg.repos_config.get(repo_name)
        if repo_config:
            repo = BorgRepo(repo_name, **self.repo_config_dict(repo_config))
            repo.from_dict(repo_data)
            self._repos.append(repo)
            if not repo.status:
                self._notifier.addWarning(repo)
        else:
            log.warning(f"No config found for {repo_name}, ignoring.")

  def export(self, export_file: Optional[str] = None):
    """Writes the repo report to a json file"""
    filename = export_file or self._cfg.report_path
    temp_filename = f"{filename}.temp"
    with open(temp_filename, "w") as f:
      json.dump(self.to_dict(), f)
    os.rename(temp_filename, filename)
    log.info(f"Borg backup report exported to {filename}")

  def repo_config_dict(self, repo_config: Dict[str, Any]) -> Dict[str, Any]:
    if repo_config:
      logpath = repo_config.get(self._cfg.CONFIG_KEY_LOG_PATH)
      return {
        "borg_path": self._cfg.borg_path,
        "path": resolve_path(self._cfg.repos_basedir, repo_config[self._cfg.CONFIG_KEY_REPO_PATH]),
        "logs": resolve_path(self._cfg.logs_basedir, logpath) if logpath else None,
        "pwd": repo_config.get(self._cfg.CONFIG_KEY_REPO_PWD),
        "cmd": repo_config.get(self._cfg.CONFIG_KEY_SCRIPT),
      }
    return {}

  def load_repos(self, import_file: Optional[str] = None) -> None:
      filename = import_file or self._cfg.report_path
      log.info(f"Load file from {filename}")
      with open(filename, "r") as f:
        self.from_dict(json.load(f))

      for repo in self._repos:
        if repo.status:
          self._notifier.addWarning(repo)
      self._notifier.notify()


  def scan_repos(self) -> None:
    """Build the borg repo report by scanning all configured repos."""
    """
    for each repo in repo config
      scan repo
    """
    self._repos = []
    log.info("Starting repository report creation")
    for repo, repo_config in self._cfg.repos_config.items():
      try:
        repo = BorgRepo(repo, **self.repo_config_dict(repo_config))
        repo.scan()
        self._repos.append(repo)
        if not repo.status:
            self._notifier.addWarning(repo)
      except RepoError as e:
        log.error(f"Unable to scan repo {repo}: {e}")

    self._notifier.notify()
    self.export()
