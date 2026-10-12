# Experiment 3 — Orchestrating Multi-Container Applications Using Docker Compose

**Aim:** To understand how Docker Compose is used to define, configure and manage a multi-container application from a single declarative file, and to perform the lifecycle operations of such a stack.
**LO4:** Containerize, orchestrate, and deploy applications using Docker, Docker Compose, Kubernetes, and cloud infrastructure tools.

| File | Contents |
|---|---|
| `docker-compose.yml` | Nginx (8080), MySQL 8.0 (3307), Apache httpd (8081), Redis (6379) + `mysql-data` volume |
| `students.sql` | SQL run inside the MySQL container |
| `commands.sh` | Compose lifecycle commands in order |
| `screenshots/` | Terminal output (01–20) |
| `Exp3_Report.pdf` | Report |

## Run

```bash
docker compose config        # validate
docker compose up -d
docker compose ps
curl http://localhost:8080   # nginx
curl http://localhost:8081   # apache
docker exec -it redisserver redis-cli ping
docker exec -it mysqlserver mysql -u student -p   # password: student123
docker compose down -v
```

MySQL is published on host port 3307 because a local MySQL server was already using 3306.
