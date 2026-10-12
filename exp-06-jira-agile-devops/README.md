# Experiment 6 — Agile Project Lifecycle Using Jira with DevOps Pipeline

**Aim:** To study and implement the Agile software project lifecycle using Jira with DevOps pipeline integration.
**LO1:** Understand and apply Agile software development methodologies and project tracking tools to plan, manage and track the software project lifecycle.

Application: **Student Management System** (Jira project key `SMS`).

| File | Contents |
|---|---|
| `source/index.html`, `app.js`, `style.css` | The web app — login, add / list / search / edit / delete students |
| `source/Jenkinsfile` | Checkout → Verify → Build Docker image (triggered by Poll SCM) |
| `source/Dockerfile` | `nginx` image serving the app |
| `source/tools/jira.js` | Command-line Jira client |
| `screenshots/` | Jira board, backlog, sprint reports, app, Jenkins builds, container (01–13) |
| `Exp6_Report.pdf` | Report |

`source/` is the original repository
[dhruvh6/student-management-system](https://github.com/dhruvh6/student-management-system),
imported with its full commit history (26 Aug – 1 Sep 2026). Each story was built on a
`feature/SMS-N-*` branch, every commit message starts with its Jira key, and each story
was merged through a reviewed pull request:

```
git log --format='%h %ad %an  %s' --date=short exp06-original
```

## Run

```bash
cd source
docker build -t student-management .
docker run -p 8081:80 student-management
# open http://localhost:8081
```
