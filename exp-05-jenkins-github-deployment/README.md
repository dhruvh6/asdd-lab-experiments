# Experiment 5 — Automated Deployment Using GitHub + Jenkins

**Aim:** To automate application deployment using GitHub/Jenkins.
**LO3:** Build and manage automated CI/CD pipelines for application development, testing, packaging and deployment.

| File | Contents |
|---|---|
| `source/Jenkinsfile` | Declarative pipeline: Build → Test → Deploy (copies `index.html` to `~/Deployments/DemoApp`) |
| `source/index.html` | The demo app (v1.0, then updated to v2.0 to show redeployment) |
| `screenshots/` | Jenkins setup, pipeline runs, GitHub repo, deployed app v1 and v2 (01–16) |
| `Exp5_Report.pdf` | Report |

`source/` is the original repository [dhruvh6/jenkins-cicd](https://github.com/dhruvh6/jenkins-cicd),
imported with its commit history (29 Aug 2026):

```
git log --format='%h %ad  %s' --date=iso -- exp-05-jenkins-github-deployment/source
```

## Run

Jenkins → New Item → Pipeline → *Pipeline script from SCM* → Git →
`https://github.com/dhruvh6/jenkins-cicd.git`, branch `main` → Build Now.
The deployed page is at `~/Deployments/DemoApp/index.html`.
