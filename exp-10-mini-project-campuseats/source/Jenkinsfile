// CampusEats CI/CD pipeline (Jenkins multibranch).
//
// Every branch and pull request:  Checkout -> Install -> Lint -> Test -> Build images
// main only, after that:          Deploy with Docker Compose -> Smoke test
// If the smoke test fails on main, the previous good version is redeployed.

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
        // main builds are releases (1.0.<n>); other branches get their own tags so they never overwrite a release.
        APP_VERSION = "${env.BRANCH_NAME == 'main' ? '1.0.' + env.BUILD_NUMBER : '0.0.' + env.BUILD_NUMBER + '-' + env.BRANCH_NAME.toLowerCase().replaceAll('[^a-z0-9]+', '-')}"
        COMPOSE_PROJECT_NAME = 'campuseats'
        LAST_GOOD_FILE = "${env.HOME}/.campuseats-last-good-version"
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

        stage('Deploy') {
            when { branch 'main' }
            steps {
                sh 'docker compose up -d --no-build --remove-orphans'
                sh 'docker compose ps'
            }
        }

        stage('Smoke test') {
            when { branch 'main' }
            steps {
                // Wait until the API reports the version that was just deployed.
                sh '''
                    for i in $(seq 1 30); do
                      if curl -fs http://localhost:4000/api/health | grep -q "\\"version\\":\\"${APP_VERSION}\\""; then
                        echo "API ${APP_VERSION} is healthy"; break
                      fi
                      [ "$i" = 30 ] && { echo "API did not become healthy"; exit 1; }
                      sleep 2
                    done
                    curl -fs http://localhost:3000/ | grep -q "CampusEats"
                    curl -fs http://localhost:3000/api/menu | grep -q "price"
                    echo "Frontend and API through Nginx are serving"
                    echo "${APP_VERSION}" > "${LAST_GOOD_FILE}"
                '''
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
            script {
                if (env.BRANCH_NAME == 'main' && fileExists(env.LAST_GOOD_FILE)) {
                    def previous = readFile(env.LAST_GOOD_FILE).trim()
                    echo "Rolling back to last good version ${previous}"
                    sh "APP_VERSION=${previous} docker compose up -d --no-build"
                }
            }
            echo "FAILURE - ${env.JIRA_ISSUE} must not move to Done until this build is green"
        }
    }
}
