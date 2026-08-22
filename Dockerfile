FROM ghcr.io/prefix-dev/pixi:latest AS build

# Add project files
ADD pixi.toml /
ADD dashboard /dashboard
ADD reporter /reporter/
ADD etc/config_default.yaml /etc
ADD etc/startup.sh /etc
RUN chmod ugo+rx /etc/startup.sh

# Set up environment
ENV BORGDASH_CONFIG=/etc/config.yaml

# Install dependencies (tzdata provides the IANA zone database for the
# reporter's zoneinfo-based log timezone handling; it is not in the base image)
RUN apt-get update && apt-get install -y --no-install-recommends \
  borgbackup openssh-client sshfs cron tzdata \
  && \
  rm -rf /var/cache/apt /var/lib/apt/lists

# Install borgdash
RUN pixi run build

# Run the application and start cron:
CMD /etc/startup.sh

# NOTE: /etc is intentionally NOT a volume. Declaring `VOLUME /etc` persists
# the image's /etc into an anonymous volume that then shadows the image on
# every update (stale config_default.yaml, startup.sh, and — as seen in the
# wild — a missing CA bundle that crashes `pixi run`). config.yaml and the
# crontab are bind-mounted in, so /etc does not need to persist.
VOLUME /repos_logs
EXPOSE 3000
