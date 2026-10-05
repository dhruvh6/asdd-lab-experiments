# CampusEats

Canteen pre-order and token system. Students order from class, get a token number, and walk to the counter only when the kitchen marks the order ready.

Mini project for the **Agile Software Development & DevOps Lab** (Sem V, 2026-27).

| Member | Role |
|---|---|
| Dhruv Hemdev | Scrum master, backend, CI |
| Lakshya | Frontend, kitchen workflow |
| Yuvraj | Ordering, containers |

## Workflow

- Work is planned in Jira (project key **CE**).
- One branch per issue: `feature/CE-<number>-<short-name>`.
- Every commit message starts with the issue key, e.g. `CE-3 Issue a daily token number`.
- Changes reach `main` only through a reviewed pull request.

## Run locally

```bash
docker compose up -d --build
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:4000/api/health |
