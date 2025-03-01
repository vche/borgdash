# Borg dashboard

to show backup status, start manual backups...

## Design
takes the config as yaml

1 utility ran periodically from cron, python first, rust after
takes the config as input
analyzes backups and logfiles
write to a json output. if a lock file is there and recent, bail out. if not recent, reset its time and start

1 next.js react app
front end and backend
read the json report and display it
can open logs: api/get_logs
can trigger report compute: api/build_report
can run backup: api/run/target
...


## TODO
- create yaml config
- python utility basic with setup
- basic modules to read config and reuse existing from borgweb
- finish bin
- create cron or other configurable system

- react app
