# Experiment 7 — Monitoring Using Nagios

**Aim:** To implement monitoring using Prometheus / Grafana / Nagios.
**LO5:** Implement ML lifecycle management and automated workflows using MLflow, Airflow, and monitoring tools like Prometheus/Grafana/Nagios.

Nagios Core runs in a Docker container (`jasonrivers/nagios`) and monitors the Mac
hosting it through the NRPE agent.

| File | Contents |
|---|---|
| `commands.sh` | All commands, steps 1–9 |
| `nrpe/nrpe.cfg` | Agent config: `allowed_hosts` + check commands corrected for macOS |
| `nagios/servers/mac_host_001.cfg` | `check_nrpe` command, host `Mac_Host_001`, 5 services (PING, Root Partition, Current Users, CPU Load, Total Processes) |
| `nagios/nagios.cfg.patch` | Enabling `cfg_dir=/opt/nagios/etc/servers` |
| `screenshots/` | Tactical Overview and service status pages |
| `Exp7_Report.pdf` | Report |

## Run

```bash
docker run --name nagios4 --platform linux/amd64 -d -p 8080:80 jasonrivers/nagios:latest
brew install nrpe monitoring-plugins && brew services start nrpe
docker exec nagios4 /opt/nagios/libexec/check_nrpe -H host.docker.internal   # -> NRPE v4.1.3
# open http://localhost:8080/nagios/
```
