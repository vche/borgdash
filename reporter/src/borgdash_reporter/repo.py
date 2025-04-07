import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Self, Tuple
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

  def __init__(
    self,
    filepath: Path,
    status: Optional[str] = None,
    datetime: Optional[datetime] = None,
    archive: Optional[str] = None
  ):
    self.filepath = filepath
    self.status, self.date_time, self.archive_name = self._parse_log() if not status else status, datetime, archive

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

  @classmethod
  def from_dict(cls, dict_data: Dict[str, Any]) -> Self:
    date_time = datetime.fromisoformat(dict_data["datetime"]) if dict_data.get("datetime") else None
    return cls(Path(dict_data["fullpath"]), dict_data.get("status"), date_time, dict_data.get("archive"))


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
    date_time: Optional[datetime] = None,
    sizes: Optional[BorgSize] = None,
    log: Optional[BorgLog] = None,
  ) -> None:
    self.name = name
    self.date_time = date_time
    self.sizes = sizes
    self.log = log

  def to_dict(self) -> Dict[str, Any]:
    return {
      "name": self.name,
      "datetime": self.date_time.isoformat() if self.date_time else None,
      "sizes": self.sizes.to_dict() if self.sizes else None,
      "log": self.log.to_dict() if self.log else None,
    }

  @classmethod
  def from_dict(cls, dict_data: Dict[str, Any]):
    return cls(
      dict_data["name"],
      datetime.fromisoformat(dict_data["datetime"]) if dict_data.get("datetime") else None,
      BorgSize.from_dict(dict_data["sizes"]) if dict_data.get("sizes") else None,
      BorgLog.from_dict(dict_data["log"]) if dict_data.get("log") else None,
    )


class BorgRepo:
  def __init__(
    self,
    name: str,
    borg_path: str,
    path: str,
    logs: Optional[str] = None,
    pwd: Optional[str] = None,
    cmd: Optional[str] = None
  ):
    # repo config
    self.name = name
    self.repopath = path
    self.logspath = Path(logs) if logs else None
    self.pwd = pwd
    self.cmd = cmd
    self.borg = BorgClient(borg_path, self.repopath, self.pwd)

    # repo data
    self.sizes = BorgSize()
    self.logs = {}
    self.archives = {}
    self.last_run = None
    self.last_backup = None

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
    last_backup = None
    for backup in self.archives.values():
      log.info(f"Scanning archive: {backup.name}")
      archinfo = self.borg.info(archive=backup.name)
      if archinfo:
          backup.date_time = datetime.fromisoformat(archinfo["date"])
          backup.sizes = BorgSize.from_dict(archinfo)
          if backup.date_time and (not last_backup or backup.date_time > last_backup.date_time):  # type: ignore
            last_backup = backup
      self.last_backup = last_backup

  def get_logs_list(self) -> Iterator[Path]:
    try:
      return self.logspath.iterdir() if self.logspath else iter([])
    except OSError as e:
      log.error(f"Unable to read logs: {e}")
      return iter([])


  def status(self) -> Optional[bool]:
    if self.last_run:
      return True if self.last_run.status and self.last_run.status in [BorgLog.SUCCESS, BorgLog.INFO] else False

  def to_dict(self) -> Dict[str, Any]:
    return {
      "name": self.name,
      "repopath": self.repopath,
      "logspath": str(self.logspath) if self.logspath else None,
      "sizes": self.sizes.to_dict(),
      "archives": { arch.name: arch.to_dict() for arch in self.archives.values() },
      "logfiles": { log.filepath.name: log.to_dict() for log in self.logs.values() },
      "script": self.cmd,
      "last_run": self.last_run.to_dict() if self.last_run else None,
      "last_backup": self.last_backup.to_dict() if self.last_backup else None,
      "status": self.status(),
    }

  def from_dict(self, dict_data:Dict[str, Any]) -> None:
    try:
      self.sizes = BorgSize.from_dict(dict_data["sizes"])
      self.archives = { name: BorgArchive.from_dict(arch) for name,arch in dict_data.get("archives", {}).items() }
      self.logs = { name: BorgLog.from_dict(logf) for name,logf in dict_data.get("logfiles", {}).items() }
      self.last_backup = BorgArchive.from_dict(dict_data["last_backup"]) if dict_data.get("last_backup") else None
      self.last_run = BorgLog.from_dict(dict_data["last_run"]) if dict_data.get("last_run") else None
    except KeyError as e:
      log.warning(f"Invalid config for repo {self.name} ({e}), ignoring.")
