# CampusEats

**Skip the canteen queue.** Students order from class, get a token number, and walk to the counter only when the kitchen marks the order ready. Kitchen staff work a live queue, and the canteen admin manages the menu and watches sales.

Mini project for the **Agile Software Development & DevOps Lab** (Sem V, 2026-27). The application is used to apply all seven lab experiments to one product, from Jira planning to production monitoring.

| Member | Owns |
|---|---|
| Dhruv Hemdev | Login (CE-1), admin menu (CE-10), repo and CI (CE-5, CE-7), Prometheus + Grafana (CE-13) |
| Lakshya | Menu browsing (CE-2), kitchen queue (CE-4), order history (CE-9), CD (CE-12), Nagios (CE-14) |
| Yuvraj | Ordering and tokens (CE-3), live tracking (CE-8), sales dashboard (CE-11), Docker (CE-6) |

---

## Architecture

```
                  ┌────────────── docker compose (project "campuseats") ──────────────┐
 Browser ──:3000──▶ frontend  (React build served by Nginx; /api proxied to backend)    │
                  │    │                                                               │
                  │    ▼                                                               │
 Prometheus ◀─────┼─ backend :4000 (Node.js + Express, JWT auth, /metrics) ──▶ mysql   │
   :9090          │    │                                                    (named vol)│
   │              │    └──────────────────────────────────────────────────▶ redis     │
   ▼              │                                                     (menu cache,   │
 Grafana :3001    │                                                      token counter)│
                  │  nagios :8090 ── checks every container + the Mac via NRPE :5666   │
                  └────────────────────────────────────────────────────────────────────┘
 GitHub ◀── push ── developer          Jenkins :8080 (multibranch) ── polls GitHub every minute
                                         └─ every branch: install → lint → test → build images
                                         └─ main only:   deploy (docker compose up) → smoke test → rollback on failure
```

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, served by Nginx |
| Backend | Node.js 22, Express 5, JWT, bcrypt |
| Data | MySQL 8 (orders, menu, users), Redis 7 (menu cache, daily token counter) |
| Tests | Jest + Supertest (API, 42 tests), Vitest (frontend logic), JUnit reports in Jenkins |
| CI/CD | Jenkins multibranch pipeline (`Jenkinsfile`) |
| Containers | Dockerfiles for both apps, `docker-compose.yml` for the full stack |
| Monitoring | Prometheus (metrics + alert rules), Grafana (dashboard), Nagios (availability checks) |
| Planning | Jira Scrum project **CE**, 2 sprints, story points, owner labels |

## How each lab experiment is used

| Exp | Topic | Where it lives in this project |
|---|---|---|
| 1 | Git version control | Feature branch per Jira issue, pull requests, merge commits, tags, `git revert` for rollback |
| 2 | Docker | `backend/Dockerfile` (Node, non-root user, healthcheck) and `frontend/Dockerfile` (multi-stage build → Nginx) |
| 3 | Docker Compose | `docker-compose.yml`: 7 services, healthchecks, `depends_on: service_healthy`, named volumes, one network |
| 4 | Jenkins CI pipeline | `Jenkinsfile` declarative pipeline: parallel install, lint, parallel tests with JUnit reports, image build |
| 5 | Automated deployment | Same pipeline on `main`: `docker compose up`, smoke test of the new version, automatic rollback |
| 6 | Jira + DevOps integration | Issue keys in branch names and commits, Jenkins prints the issue for each build, PR links on Jira issues, Definition of Done requires a green build |
| 7 | Monitoring | Nagios checks for every container and the host (NRPE), plus Prometheus alerts and a Grafana dashboard |

## Running it

Prerequisites: Docker Desktop. Node 22+ only if you want to run the apps outside Docker.

```bash
docker compose up -d --build        # start everything
docker compose ps                   # all services should be running / healthy
node scripts/lunch-rush.mjs         # optional: simulate 3 minutes of lunch-hour traffic
docker compose down                 # stop (data is kept in the mysql-data volume)
```

| What | URL | Login |
|---|---|---|
| CampusEats app | http://localhost:3000 | see demo accounts below |
| API health | http://localhost:4000/api/health | - |
| Prometheus | http://localhost:9090 (Alerts tab for rules) | - |
| Grafana | http://localhost:3001 | opens the dashboard as a viewer; admin / campuseats to edit |
| Nagios | http://localhost:8090/nagios | nagiosadmin / campuseats |
| Jenkins | http://localhost:8080/job/campuseats | your Jenkins admin account |

Demo accounts (seeded on first start; for local demos only):

| Role | Email | Password |
|---|---|---|
| Student | student@campuseats.local | student123 |
| Kitchen staff | staff@campuseats.local | staff123 |
| Admin | admin@campuseats.local | admin123 |

### Development without Docker

```bash
cd backend && npm install && npm run dev     # API on :4000 with an in-memory store
cd frontend && npm install && npm run dev    # app on :5173, /api proxied to :4000
npm test                                     # in either folder
```

## API

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | anyone | create a student account |
| POST | `/api/auth/login` | anyone | get a JWT |
| GET | `/api/menu` | anyone | available dishes (Redis cached, `X-Cache: HIT/MISS`) |
| GET | `/api/menu/all` | staff, admin | all dishes including sold out |
| POST / PUT / DELETE | `/api/menu[/:id]` | admin | manage dishes |
| PATCH | `/api/menu/:id/availability` | staff, admin | mark sold out / back in stock |
| POST | `/api/orders` | student | place order, returns token |
| GET | `/api/orders/mine` | student | order history |
| GET | `/api/orders/:id` | owner, staff | live status |
| PATCH | `/api/orders/:id/cancel` | owner | cancel while still PLACED |
| GET | `/api/orders/queue` | staff, admin | active orders |
| PATCH | `/api/orders/:id/status` | staff, admin | PLACED → PREPARING → READY → COLLECTED |
| GET | `/api/admin/stats` | admin | sales dashboard data |
| GET | `/api/health` | anyone | database + cache check (used by Docker, Jenkins, Nagios) |
| GET | `/metrics` | Prometheus | request, latency and business metrics |

## Team workflow

1. Pick an issue in Jira and move it to **In Progress**.
2. Branch from `main`: `git checkout -b feature/CE-12-short-name`.
3. Commit with the key first: `git commit -m "CE-12 Deploy main with docker compose"`.
4. Push and open a pull request. Jenkins builds the branch within a minute.
5. A teammate reviews; merge only when the Jenkins build is green.
6. Jenkins builds `main`, deploys it and smoke-tests the new version.
7. Move the issue to **Done** (Definition of Done: reviewed, merged, green build, verified in the running app).

## Repository layout

```
backend/            Express API, Jest tests, Dockerfile
frontend/           React app, Vitest tests, Nginx config, Dockerfile
db/init.sql         MySQL schema (run by the mysql container on first start)
monitoring/         prometheus/ (scrape + alert rules), grafana/ (provisioned dashboard), nagios/ (object config)
scripts/            lunch-rush.mjs (traffic simulator), jira/ (backlog + Jira API automation)
docker-compose.yml  the whole stack
Jenkinsfile         CI/CD pipeline
```
