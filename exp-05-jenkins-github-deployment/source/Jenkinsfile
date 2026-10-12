pipeline {
    agent any

    stages {

        stage('Build') {
            steps {
                echo 'Building the application...'
            }
        }

        stage('Test') {
            steps {
                echo 'Testing the application...'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    mkdir -p "$HOME/Deployments/DemoApp"
                    cp index.html "$HOME/Deployments/DemoApp/index.html"
                '''
                echo 'Application deployed successfully.'
            }
        }
    }
}
