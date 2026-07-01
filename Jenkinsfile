pipeline {
    agent any

    parameters{
        choice(
            name:"ENV",
            choices:["dev","staging","production"],
            description:"Select Environment"
        )
    }

    environment{
        ENVIRONMENT="${params.ENV}"
    }

    options{
        skipDefaultCheckout(true)
    }

    stages {

        stage("Clean WS"){
            steps{
                echo "cleaning workspace"
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

        stage("Testing"){
            when{
                expression{
                    env.ENVIRONMENT=="production"
                }
            }
            steps{
                echo "Running for envorinment ${ENVIRONMENT}"
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
                echo "runniing for envorinment ${ENVIRONMENT}"
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