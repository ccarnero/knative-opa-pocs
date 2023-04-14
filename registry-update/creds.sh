aws ecr get-login-password | docker login --username AWS --password-stdin 701373377822.dkr.ecr.us-east-1.amazonaws.com   

kubectl create secret docker-registry ecr-credential-secrets --docker-server=701373377822.dkr.ecr.us-east-1.amazonaws.com --docker-username=AWS --docker-password=$(aws ecr get-login-password) --namespace=talbots-production

kubectl create secret docker-registry ecr-credential-secrets --docker-server=701373377822.dkr.ecr.us-east-1.amazonaws.com --docker-username=AWS --docker-password=$(aws ecr get-login-password) --namespace=talbots-production

kubectl create secret docker-registry ecr-credential-secrets --docker-server=701373377822.dkr.ecr.us-east-1.amazonaws.com --docker-username=AWS --docker-password=$(aws ecr get-login-password) --namespace=rl-production

kubectl create secret docker-registry ecr-credential-secrets --docker-server=701373377822.dkr.ecr.us-east-1.amazonaws.com --docker-username=AWS --docker-password=$(aws ecr get-login-password) --namespace=rl-development

kubectl create secret docker-registry ecr-credential-secrets --docker-server=701373377822.dkr.ecr.us-east-1.amazonaws.com --docker-username=AWS --docker-password=$(aws ecr get-login-password) --namespace=hosted-services


kubectl create secret docker-registry ecr-credential-secrets --docker-server=701373377822.dkr.ecr.us-east-1.amazonaws.com --docker-username=AWS --docker-password=$(aws ecr get-login-password) --namespace=knative-serving


