# Experiment 10 — Mini Project: CampusEats

A canteen pre-order and token system delivered through the Agile and DevOps
pipeline built up in experiments 1–7: Jira (Scrum) → Git branches + PRs → Docker /
Docker Compose → Jenkins CI/CD → Prometheus, Grafana and Nagios monitoring.

| Path | Contents |
|---|---|
| `source/frontend/` | React 19 + Vite app, served by nginx |
| `source/backend/` | Node.js / Express 5 API + tests |
| `source/db/init.sql` | MySQL schema |
| `source/docker-compose.yml` | 7-service stack: frontend, backend, MySQL, Redis, Prometheus, Grafana, Nagios |
| `source/Jenkinsfile` | Lint → test → build, and on `main`: deploy → smoke test → rollback on failure |
| `source/monitoring/` | Prometheus config + alerts, Grafana dashboard, Nagios checks |
| `source/scripts/` | Jira backlog script, lunch-rush load test |
| `screenshots/` | App, Jira, Grafana, Prometheus and Nagios screenshots + diagrams |
| `Exp10_MiniProject_Report.pdf` | Report |

`source/` is the project repository imported with its commit history. See
`source/README.md` for setup and run instructions.
