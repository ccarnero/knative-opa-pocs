echo ">> delete from K8s"
kubectl delete -f ../k8s/service.yaml

echo ">> rebuilds policy"

opa build ../src/policy.rego
mv -f ./bundle.tar.gz ../public/

echo ">> build and deploy docker image"
docker build -t ccarnero/opa-bundle-server:latest ../
docker push ccarnero/opa-bundle-server:latest

echo ">> deploy to K8s"
kubectl apply -f ../k8s/service.yaml


