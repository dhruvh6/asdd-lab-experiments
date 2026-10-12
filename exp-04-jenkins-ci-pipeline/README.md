# Experiment 4 — Continuous Integration Pipeline Using Jenkins

**Aim:** To set up a Continuous Integration Pipeline using Jenkins/GitHub Actions.
**LO3:** Build and manage automated CI/CD pipelines for application development, testing, packaging and deployment.

| File | Contents |
|---|---|
| `start-jenkins.bat` | Launching Jenkins from `jenkins.war` |
| `Jenkinsfile.declarative` | Pipeline script of job **Experiment-4-Declarative** — Preparation → Build → Test → Deploy |
| `Jenkinsfile.scripted` | Pipeline script of job **Experiment-4-Scripted** — Start → Greeting |
| `screenshots/` | Setup wizard, pipeline definitions, console output, stage view, dashboard (01–13) |
| `Exp4_Report.pdf` | Report |

## Run

1. `java -jar jenkins.war` and open http://localhost:8080
2. New Item → Pipeline → Definition: *Pipeline script* → paste one of the Jenkinsfiles
3. Build Now — both jobs finish with `SUCCESS`
