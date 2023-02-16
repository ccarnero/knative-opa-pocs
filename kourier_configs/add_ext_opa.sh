echo ">> Setup ExtAuthz HTTP"
kubectl -n knative-serving wait --timeout=300s --for=condition=Available deployment/ext-auth-svc-opa
kubectl -n knative-serving set env deployment net-kourier-controller \
  KOURIER_EXTAUTHZ_HOST=ext-auth-svc-opa.knative-serving:8181 \
  KOURIER_EXTAUTHZ_PROTOCOL=http
kubectl -n knative-serving rollout status deployment/net-kourier-controller --timeout=300s


# kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"name":"ext-auth-svc-opa","namespace":"knative-serving"},"spec":{"ports":[{"name":"http","port":8181,"protocol":"TCP"}],"selector":{"app":"ext-auth-svc-opa"},"type":"ClusterIP"}}