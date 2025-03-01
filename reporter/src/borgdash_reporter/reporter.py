import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Self, Tuple
from .config import Config
from .exceptions import RepoError
from .borg import BorgClient

log = logging.getLogger(__name__)

class BorgLog():
  SUCCESS = 'success'
  INFO = 'info'
  WARNING = 'warning'
  DANGER = 'danger'

  STATUS_START = "terminating with"
  STATUS_END = "rc "
  ARCHIVE_START = "Archive name:"
  MAX_LINES_SCAN = 100

  def __init__(self, filepath: Path):
    self.filepath = filepath
    self.status, self.date_time, self.archive_name = self._parse_log()

  def __str__(self) -> str:
    return f"{self.filepath.name}[{self.date_time}={self.status}][{self.archive_name}]"

  def _parse_log(self) -> Tuple[str, Optional[datetime], Optional[str]]:
    with open(self.filepath, 'r') as f:
      return self._status_from_last_lines(f)

  def _status_from_last_lines(self, f) -> Tuple[str, Optional[datetime], Optional[str]]:
    """Determine the log status of a log file, reading from the end, limiting ourselves to last few line."""
    end = f.seek(0, os.SEEK_END)
    f.seek(max(0, end - self.MAX_LINES_SCAN), os.SEEK_SET)  # len(last log line) < MAX_LINES_SCAN
    f.seek(0, os.SEEK_SET)
    lines = f.readlines()
    return self._status_from_lines(lines)

  def _status_from_lines(self, lines: List[str]) -> Tuple[str, Optional[datetime], Optional[str]]:
    """Determine the log status based on the status found in the specified log lines."""
    status = self.DANGER
    date_time = None
    archive_name = None
    for line in reversed(lines):
      line = line.rstrip('\n')
      # Parse expected format "date time level msg", to see if this might be log line
      tokens = line.split(" ", 3)
      if len(tokens) >=4:
        # If log line, check if it contains a global status: rc == 2 or other, or no '--show-rc given'
        line_msg = tokens[3]
        if line_msg.startswith(self.STATUS_START):
          try:
            date_time = datetime.fromisoformat(f"{tokens[0]}T{tokens[1]}.000000")
            if line_msg.endswith(self.STATUS_END+'0'):
              status = self.SUCCESS
            elif line_msg.endswith(self.STATUS_END+'1'):
              status = self.WARNING
          except Exception as e:
            log.error(f"Unable to parse log line: {line}: {e}")
      else:
        if line.startswith(self.ARCHIVE_START):
          archive_name = line.split(" ")[2]

      # If we have all info we need, stop here
      if date_time and archive_name:
        break
    return status, date_time, archive_name

  def lines(self) -> List[str]:
    with open(self.filepath, 'r') as f:
      return f.readlines()

  def to_dict(self) -> Dict[str, Any]:
      return {
        "name": self.filepath.name,
        "fullpath": str(self.filepath.absolute()),
        "datetime": self.date_time.isoformat() if self.date_time else None,
        "status": self.status,
        "archive": self.archive_name,
      }


class BorgSize:
  def __init__(self, osize: int = 0, csize: int = 0, dsize:int = 0):
    self.set_sizes(osize, csize, dsize)

  def set_sizes(self, osize: int = 0, csize: int = 0, dsize:int = 0):
    self.original_size = osize
    self.compressed_size = csize
    self.deduplicated_size = dsize

  @classmethod
  def from_dict(cls, sizes: Dict[str, Any]) -> Self:
    return cls(sizes.get("size", 0), sizes.get("csize", 0), sizes.get("dsize", 0))

  def to_dict(self) -> Dict[str, Any]:
    return {
      "osize": self.original_size,
      "csize": self.compressed_size,
      "dsize": self.deduplicated_size,
    }


class BorgArchive:
  def __init__(
    self, name: str,
    datetime: Optional[datetime] = None,
    sizes: Optional[BorgSize] = None,
    log: Optional[BorgLog] = None,
  ) -> None:
    self.name = name
    self.datetime = datetime
    self.sizes = sizes
    self.log = log

  def to_dict(self) -> Dict[str, Any]:
    return {
      "name": self.name,
      "datetime": self.datetime.isoformat() if self.datetime else None,
      "sizes": self.sizes.to_dict() if self.sizes else None,
      "log": self.log.to_dict() if self.log else None,
    }


class BorgRepo:
  def __init__(self, name: str, borg_path: str, path: str, logs: str, pwd: str, cmd: str):
    # repo config
    self.name = name
    self.repopath = path
    self.logspath = Path(logs)
    self.pwd = pwd
    self.cmd = cmd
    self.borg = BorgClient(borg_path, self.repopath, self.pwd)

    # repo data
    self.sizes = BorgSize()
    self.logs = {}
    self.archives = {}
    self.last_run = None

  def _scan_logs(self):
    log.info(f"Scanning logs: {self.logspath}")
    self.logs = {}
    last_log = None
    for logfile in self.get_logs_list():
      borglog = BorgLog(logfile)
      if borglog.archive_name:
        archive = self.archives.get(borglog.archive_name)
        if archive:
          # Found the matching archive, link it to the log file
          archive.log = borglog
          self.logs[borglog.filepath.name] = borglog
        else:
          # Log file has an archive that is not saved, remove it
          borglog.filepath.unlink(missing_ok=True)
      else:
        # No archive name in the log file, most probably a failed backup, keep it for manual cleaning
        self.logs[borglog.filepath.name] = borglog

      # If we have a date time, save the most recent run
      if borglog.date_time and (not last_log or borglog.date_time > last_log.date_time):  # type: ignore
        last_log = borglog
    self.last_run = last_log

  def scan(self):
    log.info(f"Scanning repo {self.name}, path: {self.repopath}")

    # Get repo info from borg
    info = self.borg.info()
    self.sizes = BorgSize.from_dict(info)

    # Get backup list
    borg_list = self.borg.list()
    self.archives = {archive: BorgArchive(archive) for archive in borg_list}

    # Get and scan logs
    self._scan_logs()

    # Get details on each backup
    for backup in self.archives.values():
      log.info(f"Scanning archive: {backup.name}")
      archinfo = self.borg.info(archive=backup.name)
      if archinfo:
          backup.datetime = datetime.fromisoformat(archinfo["date"])
          backup.sizes = BorgSize.from_dict(archinfo)

  def get_logs_list(self) -> Iterator[Path]:
    try:
      return self.logspath.iterdir()
    except OSError as e:
      log.error(f"Unable to read logs: {e}")
      return iter([])


  def to_dict(self) -> Dict[str, Any]:
    return {
        "name": self.name,
        "repopath": self.repopath,
        "logspath": str(self.logspath),
        "sizes": self.sizes.to_dict(),
        "archives": { arch.name: arch.to_dict() for arch in self.archives.values() },
        "logfiles": { log.filepath.name: log.to_dict() for log in self.logs.values() },
        "script": self.cmd,
        "last_run": self.last_run.to_dict() if self.last_run else None,
    }


class BorgReporter:
  def __init__(self, config: Config) -> None:
    self._cfg = config
    self._repos = []

  def resolve_path(self, base_path: str, partial_path: str) -> str:
    """Appends basepath unless partial path is absolute."""
    if partial_path.startswith('/'):
      return partial_path
    if base_path and not base_path.endswith('/'):
      return f"{base_path}/{partial_path}"
    else:
      return f"{base_path}{partial_path}"

  def export(self, export_file: Optional[str] = None):
    """Writes the repo report to a json file"""
    filename = export_file or self._cfg.report_path
    with open(filename, "w") as f:
      json.dump(self._repos, f)
    log.info(f"Borg backup report exported to {filename}")


  def repo_config_dict(self, repo_config: Dict[str, Any]) -> Dict[str, Any]:
    if repo_config:
      return {
        "borg_path": self._cfg.borg_path,
        "path": self.resolve_path(self._cfg.repos_basedir, repo_config[self._cfg.CONFIG_KEY_REPO_PATH]),
        "logs": self.resolve_path(self._cfg.logs_basedir, repo_config[self._cfg.CONFIG_KEY_LOG_PATH]),
        "pwd": repo_config[self._cfg.CONFIG_KEY_REPO_PWD],
        "cmd": repo_config[self._cfg.CONFIG_KEY_SCRIPT],
      }
    return {}

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
        self._repos.append(repo.to_dict())
      except RepoError as e:
        log.error(f"Unable to scan repo {repo}: {e}")

    self.export()

    # # Init the entry for this repo
    # repo_data = {
    #     "backups": [],
    #     "script": repo_config.get("script", ""),
    #     "last_result": "warning",
    #     "last_date": "",
    #     "last_time": "",
    #     "ctime": time.ctime(),
    # }
