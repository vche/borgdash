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
- [x] implement refresh upon connection // default to backend, re-set when loaded if new datetime
- [x] add rescan (call reporter) trigger + loader until finished in the right page
- [x] add config module loaded from json env var
- [x] add reporter discord notifications
- [x] add report full path/ssh access info
- [x] create docker container
- [x] add ssh and keys/stuff
- [x] reload config file at startup
- [x] add sshfs support
- [ ] create cron or other configurable system for reporter
- [ ] readme update
- [ ] config overrides defaults, so as to allow "light" config
- [ ] add extract feature?
- [ ] per repo backup trigger
  - implement api for triggering commands
  - configure ssh remote trigger or stuff....
  - button in reach repo to start a backup
  - with output in window like for rescan

## Installation
docker

Mount the ssh folder, not just the keys to retain known hosts
No password!
ssh-keygen
ssh-keygen -t ed25519 -N '' -f borg_id_ed25519
ssh-copy-id -i etc/borg_id_ed25519.pub -f viv@192.168.0.198
docker exec -it borgdash  ssh -viv@192.168.0.198

## Development

### Reporter

```sh
cd reporter
pixi install
pixi run build
```

Run using config in `etc/config_dev.yaml`
```sh
pixi run withconfig
```

Run using custom config
```sh
pixi run borgdash-reporter <your config file>
```

Report is generated in `/tmp/bordash.json` by default or in path specified in config (`report_path`)

### Dashboard

```sh
cd dashboard
pixi install
pixi run build
```

Run development server:
```sh
pixi run dev
```

Run production server
```sh
pixi run build
pixi run start
```

### Build
