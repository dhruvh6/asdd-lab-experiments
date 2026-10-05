// CampusEats CI pipeline (Jenkins multibranch).
//
// Every branch and pull request:  Checkout -> Install -> Lint -> Test -> Build images

pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '30'))
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }

    environment {
        // Jenkins runs as a launchd service, which starts with a minimal PATH.
        PATH = "/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        APP_VERSION = "1.0.${env.BUILD_NUMBER}"
        COMPOSE_PROJECT_NAME = 'campuseats'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Branch names and commit messages carry the Jira key, e.g. feature/CE-10-admin-menu
                    def key = sh(
                        script: '{ echo "$BRANCH_NAME"; git log -1 --pretty=%B; } | grep -oE "CE-[0-9]+" | head -1 || true',
                        returnStdout: true
                    ).trim()
                    env.JIRA_ISSUE = key ?: 'none'
                    currentBuild.description = "v${env.APP_VERSION} · Jira ${env.JIRA_ISSUE}"
                }
                sh 'git log -1 --pretty="Commit %h by %an: %s"'
                echo "Jira issue for this build: ${env.JIRA_ISSUE}"
            }
        }

        stage('Install') {
            parallel {
                stage('Backend') {
                    steps { dir('backend') { sh 'npm ci --no-audit --no-fund' } }
                }
                stage('Frontend') {
                    steps { dir('frontend') { sh 'npm ci --no-audit --no-fund' } }
                }
            }
        }

        stage('Lint') {
            steps { dir('frontend') { sh 'npm run lint' } }
        }

        stage('Test') {
            parallel {
                stage('Backend tests') {
                    steps { dir('backend') { sh 'npm test' } }
                }
                stage('Frontend tests') {
                    steps { dir('frontend') { sh 'npm run test:ci' } }
                }
            }
        }

        stage('Build images') {
            steps {
                sh 'docker compose build backend frontend'
                sh 'docker images --format "{{.Repository}}:{{.Tag}}  {{.Size}}" | grep "campuseats-.*:${APP_VERSION}"'
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: '**/reports/junit.xml'
        }
        success {
            echo "SUCCESS - v${env.APP_VERSION} (${env.JIRA_ISSUE}) passed on ${env.BRANCH_NAME}"
        }
        failure {
            echo "FAILURE - ${env.JIRA_ISSUE} must not move to Done until this build is green"
        }
    }
}
