#!/usr/bin/env bash
# Experiment 2 - Containerizing Applications Using Docker
# Commands in the order they were run (see screenshots/01.png - 22.png).

# ---------- On the host (macOS terminal) ----------

docker --version
docker images

# docker search needs exactly one TERM - running it bare shows the usage error
docker search
docker search mysql
docker search ubantu          # misspelled on purpose: plain substring match, no spell-correction
docker search nginx
docker search alpine
docker search postgres
docker search ubuntu:latest   # tag is ignored by search

# Images pulled from Docker Hub (they appear in the second `docker images` listing)
docker pull ubuntu
docker pull nginx
docker pull alpine
docker pull hello-world
docker images

# Start an interactive Ubuntu container
docker run -it ubuntu

# ---------- Inside the container (root@f016f67c9267) ----------

cat /etc/os-release           # Ubuntu 26.04 LTS
uname -a                      # 6.12.76-linuxkit kernel -> shared with the Docker VM
pwd
ls
whoami                        # root

cd /etc
pwd

ps -ef                        # only /bin/bash (PID 1) and ps itself
pstree                        # bash: pstree: command not found

apt update && apt install -y psmisc

cat /proc/cpuinfo             # 10 aarch64 cores visible
