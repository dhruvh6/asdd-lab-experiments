#!/usr/bin/env bash
# Experiment 7 - Monitoring using Nagios (macOS, Apple Silicon)
# Commands in the order they were run.

# Step 1 - Docker
docker --version
docker info --format '{{.ServerVersion}} / {{.OperatingSystem}}'

# Step 2 - Nagios Core container (amd64 image, runs under emulation on arm64)
docker pull --platform linux/amd64 jasonrivers/nagios:latest
docker run --name nagios4 --platform linux/amd64 -d -p 8080:80 jasonrivers/nagios:latest
docker ps --filter name=nagios4

# Step 3 - admin password for the web UI
docker exec nagios4 htpasswd -c -b /opt/nagios/etc/htpasswd.users nagiosadmin 123456

# Step 4 - check auth: 401 without credentials, 200 with
curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/nagios/
curl -s -o /dev/null -w '%{http_code}' -u nagiosadmin:123456 http://localhost:8080/nagios/

# Step 5 - NRPE agent + plugins on the monitored host (replaces NSClient++)
brew install nrpe monitoring-plugins

# Step 6 - configure and start the agent (see nrpe/nrpe.cfg)
cp /opt/homebrew/etc/nrpe.cfg /opt/homebrew/etc/nrpe.cfg.bak
nano /opt/homebrew/etc/nrpe.cfg
brew services start nrpe
lsof -nP -iTCP:5666 -sTCP:LISTEN

# Step 7 - test server -> agent
docker exec nagios4 /opt/nagios/libexec/check_nrpe -H host.docker.internal
docker exec nagios4 /opt/nagios/libexec/check_nrpe -H host.docker.internal -c check_users
docker exec nagios4 /opt/nagios/libexec/check_nrpe -H host.docker.internal -c check_load
docker exec nagios4 /opt/nagios/libexec/check_nrpe -H host.docker.internal -c check_root
docker exec nagios4 /opt/nagios/libexec/check_nrpe -H host.docker.internal -c check_total_procs

# Step 8 - host + services (see nagios/), validate, restart
docker exec nagios4 mkdir -p /opt/nagios/etc/servers
# enable cfg_dir in nagios.cfg (nagios/nagios.cfg.patch) and add
# /opt/nagios/etc/servers/mac_host_001.cfg (nagios/servers/mac_host_001.cfg)
docker exec nagios4 /opt/nagios/bin/nagios -v /opt/nagios/etc/nagios.cfg
docker restart nagios4

# Step 9 - force the first check instead of waiting for the interval
docker exec nagios4 sh -c "printf '[%s] SCHEDULE_FORCED_SVC_CHECK;Mac_Host_001;PING;%s\n' \
      $(date +%s) $(date +%s) > /opt/nagios/var/rw/nagios.cmd"

# Web UI: http://localhost:8080/nagios/  (nagiosadmin / 123456)
