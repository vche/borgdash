import logging
import subprocess
from pathlib import Path
from typing import Iterator, Optional
from tempfile import TemporaryDirectory

log = logging.getLogger(__name__)


class BaseFs:
  """Manage log filesystem, either local or through sshfs"""

  def __init__(self, logpath: str):
    self.logpath = logpath
    self.mountpath = Path()

  @staticmethod
  def matchesPath(filepath: str) -> bool:
    raise NotImplementedError

  def mount(self) -> None:
    ...

  def umount(self) -> None:
    ...

  def get_logs_list(self) -> Iterator[Path]:
    try:
      return self.mountpath.iterdir()
    except OSError as e:
      log.error(f"Unable to read logs: {e}")
      return iter([])

  def __str__(self) -> str:
    return self.logpath

  def path(self) -> Path:
    return self.mountpath

  def delete(self, filepath: Path) -> None:
    filepath.unlink(missing_ok=True)


class LocalFs(BaseFs):
  """Local file system, no mount/unmount/mapping necessary."""
  def __init__(self, logpath: str):
    self.logpath = logpath
    self.mountpath = Path(logpath)

  @staticmethod
  def matchesPath(filepath: str) -> bool:
    return Path(filepath).exists()


class SshFs(BaseFs):
  """sshfs based filesystem, needs to be mounted and unmounted."""
  SSHFS_PREFIX = 'sshfs://'
  MOUNT_COMMAND = ["sshfs", "-o", "allow_other"]
  UNMOUNT_COMMAND = ["umount"]

  def __init__(self, logpath: str):
    super().__init__(logpath)
    self.tempdir = None
    self.remotepath = self.logpath.replace(self.SSHFS_PREFIX,'')

  @staticmethod
  def matchesPath(filepath: str) -> bool:
    return filepath.startswith(SshFs.SSHFS_PREFIX)

  def mount(self) -> None:
    # Only mount if not already mounted
    if not self.tempdir:
      self.tempdir = TemporaryDirectory(ignore_cleanup_errors=True)
      self.mountpath = Path(self.tempdir.name)
      self._run_cmd(self.MOUNT_COMMAND + [self.remotepath, str(self.mountpath)])
      log.info(f"Mounted {self.logpath} to {self.mountpath}")

  def umount(self) -> None:
    if self.tempdir:
      self._run_cmd(self.UNMOUNT_COMMAND + [self.mountpath])
      self.tempdir.cleanup()
      self.tempdir = None
      self.mountpath = Path()
      log.info(f"Unmounted {self.logpath} from {self.mountpath}")

  def _run_cmd(self, args, pwd=None) -> Optional[bytes]:
    res = None
    try:
      log.debug(f"Executing command: {args}")
      res = subprocess.run(args, stdout=subprocess.PIPE, check=True)
    except subprocess.CalledProcessError as e:
      log.error(f"Failed to run command {args}: {e}")
    return res.stdout if res else None

# List supported file system drivers
SUPPORTED_FS = [ SshFs, LocalFs]


def resolve_path(base_path: str, partial_path: str) -> str:
  """Appends basepath unless partial path is absolute or remote."""
  if partial_path.startswith('/') or partial_path.startswith('ssh://')  or SshFs.matchesPath(partial_path):
    return partial_path
  if base_path and not base_path.endswith('/'):
    return f"{base_path}/{partial_path}"
  else:
    return f"{base_path}{partial_path}"


def logfs_from_path(logpath: Optional[str]) -> Optional[BaseFs]:
  """Final a fs matching the given path."""
  if logpath:
    for fs in SUPPORTED_FS:
      if fs.matchesPath(logpath):
        return fs(logpath)
  return None
