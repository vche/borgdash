#!/usr/bin/env bash

# Start cron
service cron start

# If exists, loads the cron file
if [ -f "/etc/borgdash.cron" ]; then
  crontab /etc/borgdash.cron
fi

# Starts frontend
echo "pipo $BORGDASH_CONFIG"
pixi run dashboard
