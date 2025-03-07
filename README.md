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
- [x] create yaml config
- [x] python utility basic with setup
- [x] basic modules to read config and reuse existing from borgweb
- [x] finish bin
- [x] react app
- [x] add framework and modules
- [ ] implement refresh upon connection // default to backend, re-set when loaded if new datetime
- [ ] add rescan (call reporter) trigger + loader until finished in the right page
  - load report data only once in layout
  - pass it down to other modules
  - have a useState in client / dashboard layout, initialized to the layout report data
  - pass the set useState to the toolbar action
  - re - set it with new loaded data upon refresh
- [ ] per repo backup trigger

- create cron or other configurable system
- readme update

- [x] react app bootstrap
- index layout

## Installation
docker

## Development

### Reporter
cd reporter
Run using config in `etc/config_dev.yaml`
```
pixi run withconfig
```

Run using custom config
```
pixi run borgdash-reporter <your config file>
```

Report is generated in `/tmp/bordash.json` by default or in path specified in config (`report_path`)

### Dashboard
cd dashboard
Run development server:
```
pixi run dev
```

Run production server
```
pixi run build
pixi run start
```

### Build
