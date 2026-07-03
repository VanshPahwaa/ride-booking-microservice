pipeline {
    agent none

    options {
        skipDefaultCheckout(true)
    }



    stages {

        stage("Clean Workspace") {
            agent any
            steps {
                echo "Cleaning workspace..."
                cleanWs()
            }
        }

        stage("Checkout") {
            agent any
            steps {
                echo "Checking out source code..."
                checkout scm
            }
        }

        stage("Copy Secret Files") {
            agent any
            steps {
                withCredentials([
                    file(credentialsId: 'USER_DOCKER_PRODUCTION', variable: 'USER_DOCKER_PRODUCTION'),
                    file(credentialsId: 'CAPTAIN_DOCKER_PRODUCTION', variable: 'CAPTAIN_DOCKER_PRODUCTION'),
                    file(credentialsId: 'RIDE_DOCKER_PRODUCTION', variable: 'RIDE_DOCKER_PRODUCTION'),
                    file(credentialsId: 'GATEWAY_DOCKER_PRODUCTION', variable: 'GATEWAY_DOCKER_PRODUCTION')
                ]) {
                    sh '''
                        set -e

                        cp "$USER_DOCKER_PRODUCTION" user/.env.docker.production
                        cp "$CAPTAIN_DOCKER_PRODUCTION" captain/.env.docker.production
                        cp "$RIDE_DOCKER_PRODUCTION" ride/.env.docker.production
                        cp "$GATEWAY_DOCKER_PRODUCTION" gateway/.env.docker.production
                    '''
                }
            }
        }

        stage("Build & Test") {
            agent {
                docker {
                    image "node:22"
                }
            }

            steps {
                sh "node -v"

                // Example (modify according to your project structure)

                dir("user") {
                    sh "npm install"
                    // sh "npm test"
                }

                dir("captain") {
                    sh "npm install"
                    // sh "npm test"
                }

                dir("ride") {
                    sh "npm install"
                    // sh "npm test"
                }

                dir("gateway") {
                    sh "npm install"
                    // sh "npm test"
                }
            }
        }

        stage("Deploy") {
            agent any

            steps {
                sshagent(["APP_SERVER_KEY"]) {

                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@${RIDE_BOOKING_SERVER_IP} '

                        cd ${APP_FILE_PATH}

                        git pull origin main

                        docker compose \
                            -f docker-compose.yml \
                            -f docker-compose.prod.yml \
                            down

                        docker compose \
                            -f docker-compose.yml \
                            -f docker-compose.prod.yml \
                            up -d --build

                        docker ps

                    '
                    """
                }
            }
        }
    }

    post {

        success {
            echo "Deployment completed successfully."
        }

        failure {
            echo "Deployment failed."
        }

        always {
            echo "Pipeline finished."
        }
    }
}