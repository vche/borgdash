import logging
from abc import ABC,abstractmethod
from typing import List
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
    if not self._alarms:
      return None

    content = ""
    for repo in self._alarms:
      status, datetime = (repo.last_run.status, repo.last_run.date_time) if repo.last_run else ("","")
      content += self._message_bkup.format(repo.name, status, datetime)
    return self._message.format(len(self._alarms), content)

  @abstractmethod
  def _send_message(self, message: str):
      raise NotImplementedError("_send_message method not implemebnted")

  def addWarning(self, repo: BorgRepo):
      self._alarms.append(repo)

  def notify(self):
    content = self._build_message()
    if content and self._enabled:
      self._send_message(content)


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
