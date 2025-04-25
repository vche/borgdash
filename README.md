# Borg dashboard

Borgdash is a web service for managing [Borg backups](https://www.borgbackup.org/). It provides a web interface to schedule periodic checks
of multiple borg repositories, whether local or remotes (requires ssh enabled).
The UI allows to show at a glance the status of the repostories, list archives, show logs, trigger new scans,
edit configuration and set a schedule for automatic scans...

Notifications can be send (discord only for now) when a failed backup is detected.

## Screenshots
![Main dashboard]("")
![Repo details]("")
![Log content]("")
![Config editor]("")
![Scheduler configuration]("")

## Configuration

### Configuration file
Borgdash configuration is essentially in its configuration file.
Refer to the [default settings](https://github.com/vche/borgdash/blob/main/etc/config_default.yaml) for a
description of each field.

A configuration file must be provided to borgdash. It only need to contains the fields that need to be
customised, which in most cases will only be the repository configuration (`repos` section) and possibly
`repos_basedir`  and `logs_basedir` it some repos share a common path, and the notification configuration.

### Remote hosts

Remote hosts can be used if they can be connected to via ssh.
Repository scan and borg commands use ssh, and logs reading [SSHFS](https://github.com/libfuse/sshfs).

In order to work, password less ssh keys must be used, and added to the hosts.

Example creating passwordless SSH keys, and copying to host `192.168.0.10`:
```sh
ssh-keygen -t ed25519 -N '' -f borg_id_ed25519
ssh-copy-id -i borg_id_ed25519.pub -f user@192.168.0.10
```

A first ssh conenction must be made in order to validate adding the keys to known hosts (or done manually):
```sh
ssh user@192.168.0.10
```
Or via docker:
```sh
docker exec -it borgdash ssh user@192.168.0.10
```

### Example
TODO:
Example of a configuration file for docker with repositories in multiple places and discord notifications:
```yaml
reporter:
  logs_basedir: "sshfs://user@192.168.0.10:/home/user/borg/logs/"
  repos_basedir: "ssh://user@192.168.0.10/home/user/borg/repos"

  # Enable alarming on discord channel for failed backups
  discord:
    webhook: "https://discord.com/api/webhooks/zzzzzzzzzz/xxxxxxxxx-yyyyyyy"
    webhook_user: "Borg backup dashboard"
    message: "**{} Backups failed**:\n\n{}"
    message_device: "- {}: Failed with status {} on {} at {}\n"

repos:
  # Repo  name
  "local_repo":
    # Repo absolute path, will be resolved as: "/home/borg/localrepo"
    "repo_path": "/home/borg/localrepo"
    # Repo logs absolute path, will be resolved as: "/home/borg/logs"
    "log_path": "/home/borg/logs"
    # Repo password
    "repo_pwd": "backup"
    # Command/script to run to manually start a backup.
    "script": "script"

  "remote_repo":
    # Repo absolute path, will be resolved as: "ssh://user@192.168.0.10/home/user/borg/repos/remote1"
    "repo_path": "remote1"
    # Repo logs absolute path, will be resolved as: "sshfs://user@192.168.0.10:/home/user/borg/logs/repos/remote1"
    "log_path": "repos/remote1"

  "other_remote_repo":
    # Repo absolute path, will be resolved as: "ssh://user@192.168.0.10/home/user/borg/repos/remote2"
    "repo_path": "remote2"
    # Repo logs absolute path, will be resolved as: "sshfs://user@192.168.0.10:/home/user/borg/logs/repos/remote2"
    "log_path": "repos/remote2"
    "repo_pwd": "backup"
    "script": "script"
```

## Installation

### Local install

See [development](#Development) section to build and run reporter and dashboard.
Reporter can either be started through a cron job, or left to be started on demand from the UI.

### Docker

#### Create config file
See [configuration](#Configuration).

#### Create mounts
The docker container requires at least the configuration file to be mapped to `/etc/config.yaml`.
It is optional but highly recommended to also map `/data/` to keep data like reports and reporter
scheduled runs to be persistent across restart.

If either ssh or sshfs are used (see [configuration](#Configuration)), the folder containing keys must be  mapped to `/root/.ssh`. Note that *the whole ssh folder* must be mapped,
not just the key files as the "known hosts" are also stored there. Without this file, the container would
need manual permission for every run.

#### Pull and start docker container
##### Docker run example
```sh
docker pull vche/borgdash
docker run --name borgdash -p 3000:3000" \
  --mount "type=bind,source=$HOME/borgdash/data,target=/data/" \
  --mount "type=bind,source=$HOME/borgdash/config/config_docker.yaml,target=/etc/config.yaml" \
  --mount "type=bind,source=$HOME/borgdash/config/ssh,target=/root/.ssh" \
  --cap-add SYS_ADMIN --device /dev/fuse
  -d vche/borgdash
```

##### Docker compose example
```yaml
borgdash:
  container_name: borgdash
  hostname: borgdash
  image: vche/borgdash:latest
  ports:
    - "3000:3000/tcp"
  volumes:
    - '$HOME/borgdash/config/config_docker.yaml:/etc/config.yaml'
    - '$HOME/borgdash/data:/data'
    # Required only if ssh or sshfs are used
    - '$HOME/borgdash/config/ssh:/root/.ssh'
  cap_add:
    # Required only if sshfs is used
    - SYS_ADMIN
```

#### Optional: Authorize ssh hosts
This step is only needed if remote hosts are used, either ssh or sshfs.

Make sure the hosts needing ssh or sshfs are known by docker by running for each
one: `docker exec -it borgdash ssh user@host` and validating (`y`) when asked permission.

## Design

Borgdash is made of 2 components, packaged in the docker container:
- reporter: A python tool that scan the configured repository to build a JSON report with all repositories archives and logs statistics and information
- dashboard: A web ui to present and browse through the report data and logs, configure scans and ui, trigger new scans...
takes the config as yaml
- a cron job to schedule automatic runs of the reporter, in order to consistently provide the dashboard with refreshed

Tech stack:
- [Pixi](https://pixi.sh/latest/) as virtual environment manager
- [Python](https://www.python.org/) for the reporter running in backend
- [NPM](https://www.npmjs.com/) as javascript package manager
- [Typescript react](https://react.dev/learn/typescript) app
- [Next.js](https://nextjs.org) framework using app router
- [Material UI](https://mui.com/material-ui) framework, and [Toolpad component](https://mui.com/toolpad)

## Development

Pre requisites:
- Get the repository, e.g. `git clone https://github.com/vche/borgdash.git`
- Install [Pixi](https://pixi.sh/latest/), which will install all other dependencies in virtual environments

### TODO
- [x] readme update
- [x] add loader while loading logs
- [ ] dashboard bar graph with time since last backup per repo
- [ ] per repo graph with lines of size per archive
- [ ] persistent notification dedupe
- [ ] config overrides defaults, so as to allow "light" config
- [ ] remove personal dev/docker config from repo
- [ ] add screenshots
- [ ] publish docker and repo public
- [ ] add extract feature?
  - extract locally
  - then upload
  - results in output ?
- [ ] per repo backup trigger
  - implement api for triggering commands
  - configure ssh remote trigger or stuff....
  - button in reach repo to start a backup
  - with output in window like for rescan
- [ ] Add docker watch and devcontainer support

### Reporter

Build:
```sh
cd reporter
pixi install
pixi run build
```

Run using config in `etc/config_dev.yaml`:
```sh
pixi run withconfig
```

Run using custom config:
```sh
pixi run borgdash-reporter <your config file>
```

Report is generated in `/tmp/bordash.json` by default or in path specified in config (`report_path`)

### Dashboard
Build and run locally the borgdash server.
The dev more auto reload changes without needing to restart.

```sh
cd dashboard
pixi install
pixi run build
```

Run development server:
```sh
pixi run dev
```

Run production server with the development config:
```sh
pixi run build
pixi run start-dev
```

Or run production server, after specifying the config file path in env var BORGDASH_CONFIG:
```sh
pixi run build
pixi run start
```

The server will be accessible on [http://localhost:3000](http://localhost:3000)

### Docker
Build, run and publish docker container.

Commands to run from the git repo root.
Build the docker container for current architecture:
```sh
pixi run docker-build
```

Cross-build the container for linux/amd64 and linux/arm64:
```sh
pixi run docker-multi
```

Run the container with the name `borgdash`.
The persistent data will be in `./etc/docker_example/data`,
the config file in `./etc/docker_example/config/config_docker.yaml`,
and the ssh keys in `./etc/docker_example/config/ssh`

```sh
pixi run docker-run
```

The server will be accessible on [http://localhost:3000](http://localhost:3000)

To stop and remove the container (required after rebuilding):
```sh
pixi run docker-clean
```
