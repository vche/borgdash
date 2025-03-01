class ReporterError(Exception):
  pass


class ConfigError(ReporterError):
  pass


class RepoError(ReporterError):
  pass
