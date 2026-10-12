# ASD&D Lab — Experiments

Agile Software Development & DevOps Lab · Sem V-NEP · 2026-2027
**Dhruv Hemdev** · Roll No. 2401036 · Class T1

Each folder contains the source code / commands / configuration used in the
experiment, the screenshots taken while performing it, and the submitted report (PDF).

| Exp | Title | Source in this folder |
|---|---|---|
| [1](exp-01-git-version-control) | Version Control Operations Using Git | `commands.ps1` |
| [2](exp-02-docker-containers) | Containerizing Applications Using Docker | `commands.sh` |
| [3](exp-03-docker-compose) | Orchestrating Multi-Container Applications Using Docker Compose | `docker-compose.yml`, `students.sql`, `commands.sh` |
| [4](exp-04-jenkins-ci-pipeline) | Continuous Integration Pipeline Using Jenkins | `Jenkinsfile.declarative`, `Jenkinsfile.scripted`, `start-jenkins.bat` |
| [5](exp-05-jenkins-github-deployment) | Automated Deployment Using GitHub + Jenkins | `source/` — imported from [dhruvh6/jenkins-cicd](https://github.com/dhruvh6/jenkins-cicd) with its git history |
| [6](exp-06-jira-agile-devops) | Agile Project Lifecycle Using Jira with DevOps Pipeline | `source/` — imported from [dhruvh6/student-management-system](https://github.com/dhruvh6/student-management-system) with its git history |
| [7](exp-07-nagios-monitoring) | Monitoring Using Nagios | `nrpe/nrpe.cfg`, `nagios/servers/mac_host_001.cfg`, `commands.sh` |
| [10](exp-10-mini-project-campuseats) | Mini Project — CampusEats | `source/` — full application, imported with its git history |

Experiments 8 (CI/CD on AWS CodePipeline) and 9 (Terraform on AWS) were performed
entirely on AWS and are not part of this repository.

## Folder layout

```
exp-NN-<topic>/
├── README.md          what the experiment does and how to run it
├── <source files>     code, configs and commands
├── screenshots/       screenshots in the order they appear in the report
└── ExpN_Report.pdf    submitted report
```

## Git history

For experiments 5, 6 and 10 the original repositories were merged in with
`git subtree`, so their original commits (dates, authors, messages) are part of
this repository's history. Each imported history is tagged:

```bash
git log --format='%h %ad %an  %s' --date=iso exp05-original   # Exp 5, 29 Aug 2026
git log --format='%h %ad %an  %s' --date=iso exp06-original   # Exp 6, 26 Aug - 1 Sep 2026
git log --format='%h %ad %an  %s' --date=iso exp10-original   # Exp 10
```
