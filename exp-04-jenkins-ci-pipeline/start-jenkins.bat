@echo off
REM Experiment 4 - launch a local Jenkins server from the WAR file (Windows)

REM 1. Jenkins needs Java
java -version

REM 2. Keep all Jenkins data in a folder on the Desktop
set JENKINS_HOME=%USERPROFILE%\Desktop\jenkins_data

REM 3. Start Jenkins - the initial admin password is printed in the console
REM    and saved to %JENKINS_HOME%\secrets\initialAdminPassword
java -jar jenkins.war

REM 4. Open http://localhost:8080, unlock Jenkins, install suggested plugins,
REM    create the admin user, then create the two pipeline jobs:
REM      Experiment-4-Declarative  -> Jenkinsfile.declarative
REM      Experiment-4-Scripted     -> Jenkinsfile.scripted
