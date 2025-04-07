import logging
import os
import sys
import traceback
from argparse import ArgumentParser, Namespace
from typing import Optional  # noqa: F401

from . import version
from .config import Config
from .exceptions import ReporterError
from .reporter import BorgReporter

log = logging.getLogger(__name__)


def _parse_args() -> Namespace:
  parser = ArgumentParser(description="Radarr/Sonarr client")
  parser.add_argument("--debug", "-d", default=False, action="store_true", help="Enable debug logging")
  parser.add_argument("config_path", nargs='?', help="Config file path. If not specified, will try from env var")
  args = parser.parse_args()
  args.log_level = logging.DEBUG if args.debug else logging.INFO

  return args

def setup_logging(level: int = logging.INFO, filename: Optional[str] = None) -> None:
  """Configure standard logging."""
  logging.basicConfig(
      format="[%(asctime)s %(filename)s:%(lineno)s][%(levelname)s]: %(message)s", level=level, filename=filename
  )

def main() -> None:
  """Main entry point."""

  args = _parse_args()
  setup_logging(level=args.log_level)
  log.info(f"Borgdash reporter version {version.__version__}")

  try:
    cfgfile = args.config_path or os.environ.get('BORGDASH_CONFIG')
    cfg = Config(cfgfile)
    # cfg.dump()

    reporter = BorgReporter(cfg)
    # reporter.scan_repos()
    reporter.load_repos()

    sys.exit(0)
  except ReporterError as e:
      print(f"Reporter error: {e}")
      if args.debug:
          traceback.print_exc()
      sys.exit(1)
  except Exception as e:
    print(f"Unexpected error: {e}")
    # if args.debug:
    traceback.print_exc()
    sys.exit(2)
