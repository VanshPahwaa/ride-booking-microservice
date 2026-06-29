pipeline {
    agent any

    options{
        skipDefaultCheckout(true)
    }

    stages {

        stage("Clean WS"){
            steps{
                cleanWs()
            }
        }

        stage("checkout"){
            steps{
                checkout scm
            }
        }

        stage('Copy Secret Files') {
            steps {
                withCredentials([
                    file(credentialsId: 'USER_DOCKER_DEVELOPMENT', variable: 'USER_DOCKER_DEVELOPMENT'),
                    file(credentialsId: 'CAPTAIN_DOCKER_DEVELOPMENT', variable: 'CAPTAIN_DOCKER_DEVELOPMENT'),
                    file(credentialsId: 'RIDE_DOCKER_DEVELOPMENT', variable: 'RIDE_DOCKER_DEVELOPMENT'),
                    file(credentialsId: 'GATEWAY_DOCKER_DEVELOPMENT', variable: 'GATEWAY_DOCKER_DEVELOPMENT')
                ]) {
                    sh '''
                        set -e

                        cp "$USER_DOCKER_DEVELOPMENT" user/.env.docker.development
                        cp "$CAPTAIN_DOCKER_DEVELOPMENT" captain/.env.docker.development
                        cp "$RIDE_DOCKER_DEVELOPMENT" ride/.env.docker.development
                        cp "$GATEWAY_DOCKER_DEVELOPMENT" gateway/.env.docker.development
                    '''
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    set -ex

                    docker compose down
                    docker compose up --build -d

                    docker ps
                '''
            }
        }
    }

    post {
        success {
            echo ' Deployment completed successfully.'
        }

        failure {
            echo ' Deployment failed.'
        }

        always {
            echo 'Pipeline finished.'
        }
    }
}