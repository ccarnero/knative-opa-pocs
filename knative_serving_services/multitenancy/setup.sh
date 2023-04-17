
#!/usr/bin/env bash
minikube start --driver=docker --network-plugin=cni --extra-config=kubeadm.pod-network-cidr=192.168.0.0/16 --kubernetes-version=v1.24.3 -p mknative  

# CALICO
echo ">> Installing CALICO"
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.25.0/manifests/tigera-operator.yaml 
while ! kubectl wait pod --all -n tigera-operator --for=condition=Ready --timeout=120s --all
do
  echo "... ... waiting"
  sleep 10
done
echo ">> ... installing CALICO CRDs"
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.25.0/manifests/custom-resources.yaml
kubectl wait --for=condition=Established --all crd
echo ">> ... waiting for calico-system up"
while ! kubectl wait pod --all -n calico-system --for=condition=Ready --timeout=240s --all
do
  echo "... ... waiting"
  sleep 10
done
echo ">> ... setting FELIX_IGNORELOOSERPF"
kubectl -n calico-system set env daemonset/calico-node FELIX_IGNORELOOSERPF=true

echo ">> Installing Knative Serving"
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.9.2/serving-crds.yaml
kubectl wait --for=condition=Established --all crd
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.9.2/serving-core.yaml
while ! kubectl wait pod --all -n knative-serving --for=condition=Ready
do
  sleep 10
done

# ## aplicar la policy de dns ?
# ## buscar la ip del servicio de autoscaler, pegarla en la policy del autoescaler

# Multiple Kourier instances will be installed...
echo ">> Installing Kourier"
kubectl apply -f https://github.com/knative/net-kourier/releases/download/knative-v1.9.2/kourier.yaml
kubectl wait pod --timeout=10m --for=condition=Ready -l !job-name -n kourier-system
kubectl wait pod --timeout=10m --for=condition=Ready -l !job-name -n knative-serving

# Tell Knative Serving to annotate services with the Kourier ingress class
kubectl patch configmap/config-network \
  --namespace knative-serving \
  --type merge \
  --patch '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'

# Enable port-level network isolation:
kubectl patch configmap/config-kourier \
  --namespace knative-serving \
  --type merge \
  --patch '{"data":{"traffic-isolation":"port"}}'


kubectl patch configmap/config-domain  \
  --namespace knative-serving  \
  --type merge  \
  --patch '{"data":{"127.0.0.1.sslip.io":""}}'

# kubectl apply -Rf config/admin/knative-serving 
# kubectl apply -Rf config/admin/kourier-system 

# kubectl apply -Rf config/admin/tenant1-ns1
# kubectl apply -Rf config/tenant1/tenant1-ns1/pong.yaml 
# kubectl apply -Rf config/tenant1/tenant1-ns1/ping.yaml 


kubectl create secret docker-registry ecr-credential-secrets --docker-server=701373377822.dkr.ecr.us-east-1.amazonaws.com --docker-username=AWS --docker-password=$(aws ecr get-login-password) --namespace=talbots-production