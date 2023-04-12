const k8s = require('@kubernetes/client-node');

// Load the Kubernetes configuration from the default location
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

// Create a Kubernetes API client using the configuration
const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);

// Delete the Knative service using the Kubernetes API
async function deleteKnativeService() {
    try {
        await k8sApi.deleteNamespacedCustomObject(
            "serving.knative.dev", // The group name for Knative resources
            "v1", // The version of the API
            "talbots-production", // The namespace to create the service in
            "services", // The plural name of the resource
            "mypong" // The name of the service to delete
        );
        console.log("Knative service deleted successfully!");
    } catch (error) {
        console.error(error);
    }
}

deleteKnativeService();
