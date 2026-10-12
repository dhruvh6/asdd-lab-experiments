# Experiment 2 — Containerizing Applications Using Docker

**Aim:** To understand the fundamentals of containerization and to perform basic container operations using Docker.
**LO3:** Apply containerization tools such as Docker to package, distribute and run applications in isolated, reproducible environments.

| File | Contents |
|---|---|
| `commands.sh` | Host commands (`docker search`, `pull`, `images`, `run -it`) and the commands run inside the Ubuntu container |
| `screenshots/` | Terminal output (01–22) |
| `Exp2_Report.pdf` | Report |

## Run

```bash
docker run -it ubuntu
# then, inside the container:
cat /etc/os-release && uname -a && ps -ef
apt update && apt install -y psmisc && pstree
```
