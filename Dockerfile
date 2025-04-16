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

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  borgbackup openssh-client sshfs cron \
  && \
  rm -rf /var/cache/apt /var/lib/apt/lists

# Install borgdash
RUN pixi run build

# Run the application and start cron:
CMD /etc/startup.sh

VOLUME /etc
VOLUME /repos_logs
EXPOSE 3000
