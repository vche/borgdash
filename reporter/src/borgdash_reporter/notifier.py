import logging
import json
from abc import ABC,abstractmethod
from typing import Any, Dict, List
from .config import Config
from discord import SyncWebhook
from .repo import BorgRepo

log = logging.getLogger(__name__)

class BorgNotifier(ABC):
  DEFAULT_MESSAGE = "**{} Backups failed**:\n\n{}\nSee [web dashboard](http://127.0.0.1:3000)"
  DEFAULT_MESSAGE_BACKUP = "- **{}**: Failed with status `{}` on {}\n"

  def __init__(self, config: Config) -> None:
    self._cfg = config
    self._enabled = False
    self._alarms: List[BorgRepo] = []
    self._message = self.DEFAULT_MESSAGE
    self._message_bkup = self.DEFAULT_MESSAGE_BACKUP

  def _build_message(self):
    deduped = self._dedupe()
    if not deduped:
      return None

    content = ""
    log.info(f"Notifying {len(deduped)} failed backups")
    for repo in deduped:
      status, datetime = (repo.last_run.status, repo.last_run.date_time) if repo.last_run else ("","")
      content += self._message_bkup.format(repo.name, status, datetime)
    return self._message.format(len(deduped), content)

  @abstractmethod
  def _send_message(self, message: str):
      raise NotImplementedError("_send_message method not implemebnted")

  def _dedupe(self):
    """Dedupe to remove alarms already notified (are in the dedupes)."""
    old_alarms = self._load_dedupes()
    dedupes = []
    for repo in self._alarms:
      if (
        repo.last_run and repo.last_run.date_time and
        old_alarms.get(repo.name) != int(repo.last_run.date_time.timestamp())
      ):
        dedupes.append(repo)
    log.info(f"Loaded {len(old_alarms)} alarm, {len(self._alarms) - len(dedupes)} repo deduped and not alarmed on.")
    return dedupes

  def _load_dedupes(self) -> Dict[str, Any]:
    """Load and return alarms in the dedupe file."""
    try:
      with open(self._cfg.dedupe_path, "r") as f:
        return json.load(f)
    except Exception as e:
      log.warning(f"Cannot load dedupe file: {e}")
    return {}

  def _save_dedupes(self) -> None:
    """Save current alarms in the dedupe file."""
    try:
      with open(self._cfg.dedupe_path, "w") as f:
        alarms = {
          repo.name: int(repo.last_run.date_time.timestamp())
          for repo in self._alarms if repo.last_run and repo.last_run.date_time
        }
        json.dump(alarms, f)
        log.info(f"Saved {len(alarms)} alarms to {self._cfg.dedupe_path}")
    except Exception as e:
      log.warning(f"Cannot save dedupe file: {e}")

  def addWarning(self, repo: BorgRepo):
      self._alarms.append(repo)

  def notify(self):
    content = self._build_message()
    if content and self._enabled:
      self._send_message(content)
    self._save_dedupes()


class LogNotifier(BorgNotifier):
  def __init__(self, config: Config) -> None:
    super().__init__(config)
    self._enabled = True

  def _send_message(self, message: str):
      log.warning(message)


class DiscordNotifier(BorgNotifier):
  def __init__(self, config: Config) -> None:
    super().__init__(config)

    if self._cfg.discord_config:
      self._webhook_url, self._user, message, message_bkup = self._cfg.discord_config
      self._enabled = True
      self._webhook = SyncWebhook.from_url(self._webhook_url)
      if message:
          self._message = message
      if message_bkup:
          self._message_bkup = message_bkup

  def _send_message(self, message: str):
    self._webhook.send(message, username=self._user or "")


NOTIFIERS_CLASSES = [
    DiscordNotifier,
]

def get_notifier(config: Config) -> BorgNotifier:
    for notifier_class in NOTIFIERS_CLASSES:
        notifier = notifier_class(config)
        if notifier._enabled:
            return notifier

    # Defaults to a log notifier
    return LogNotifier(config)
