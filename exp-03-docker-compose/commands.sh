#!/usr/bin/env bash
# Experiment 3 - Orchestrating Multi-Container Applications Using Docker Compose
# Commands in the order they were run (see screenshots/01.png - 20.png).

# Project directory - its name becomes the Compose project prefix
cd ~
mkdir compose-demo
cd compose-demo
# (docker-compose.yml from this folder is saved here)
ls
cat docker-compose.yml

# Validate, then start the four services in the background
docker compose config
docker compose up -d

# Inspect the stack
docker compose ps
docker compose logs
docker logs mysqlserver --tail 10
docker compose images

# Database: create a table, insert a row, read it back (see students.sql)
docker exec -it mysqlserver mysql -u student -p

# Test the other services
curl http://localhost:8080                    # Nginx welcome page
curl http://localhost:8081                    # Apache "It works!"
docker exec -it redisserver redis-cli ping    # PONG

# Lifecycle
docker compose stop
docker compose start
docker compose restart
docker compose down        # removes containers + network, keeps the volume
docker compose down -v     # also removes compose-demo_mysql-data
