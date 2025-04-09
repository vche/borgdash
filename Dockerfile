FROM ghcr.io/prefix-dev/pixi:latest AS build

# Add project files
ADD pixi.toml /
ADD dashboard /dashboard
ADD reporter /reporter/
ADD etc/config_default.yaml /etc

# Set up environment
ENV BORGDASH_CONFIG=/etc/config.yaml

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  borgbackup \
  && \
  rm -rf /var/cache/apt /var/lib/apt/lists

# Install borgdash
RUN pixi run build

# Run the application:
# CMD ["/reporter/.pixi/envs/default/bin/borgdash-reporter"]
# CMD ["/usr/local/bin/pixi", "run", "dashboard"]
CMD ["pixi", "run", "dashboard"]

VOLUME /etc
VOLUME /repos_logs
EXPOSE 3000
