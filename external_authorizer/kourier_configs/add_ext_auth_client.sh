echo ">> Setup ExtAuthz NODE/OPA"
# ko apply -f test/config/extauthz/http
kubectl -n knative-serving wait --timeout=300s --for=condition=Available deployment/ext-auth-opa-client-svc
kubectl -n knative-serving set env deployment net-kourier-controller \
  KOURIER_EXTAUTHZ_HOST=ext-auth-opa-client-svc.knative-serving:8080 \
  KOURIER_EXTAUTHZ_PROTOCOL=http
kubectl -n knative-serving rollout status deployment/net-kourier-controller --timeout=300s
