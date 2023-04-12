const k8s = require('@kubernetes/client-node');

// Load the Kubernetes configuration from the default location
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

// Create a Kubernetes API client using the configuration
const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);

// Define the Knative service definition
const knativeService = {
  apiVersion: "serving.knative.dev/v1",
  kind: "Service",
  metadata: {
    name: "mypong",
    namespace: "talbots-production",
    // labels:
    //     {'app.kubernetes.io/name': 'mypong'}
  },
  spec: {
    template: {
      metadata: {
        annotations: {
          "autoscaling.knative.dev/class": "kpa.autoscaling.knative.dev",
          'autoscaling.knative.dev/min-scale': "1"
        }
      },
      spec: {
        imagePullSecrets:
          [{ name: 'ecr-credential-secrets' }],

        containers: [
          {
            image: "701373377822.dkr.ecr.us-east-1.amazonaws.com/talbots/pong",
            ports: [
              {
                containerPort: 8080
              }
            ]
          }
        ]
      }
    }
  }
};

// Create the Knative service using the Kubernetes API
async function createKnativeService() {
  try {
    const response = await k8sApi.createNamespacedCustomObject(
      "serving.knative.dev", // The group name for Knative resources
      "v1", // The version of the API
      "talbots-production", // The namespace to create the service in
      "services", // The plural name of the resource
      knativeService // The Knative service definition
    );
    console.log("Knative service created successfully!");
  } catch (error) {
    console.error(error);
  }
}

createKnativeService();