/**
 *
 * @param {*} name
 * @param {*} configmaps
 */
const createDeploymentSpec = (hostedServiceObject) => {
  const { metadata, spec } = hostedServiceObject;

  const { name, imageRepository, tag = 'default' } = spec;
  const { namespace } = metadata;

  const deployment = {
    apiVersion: "serving.knative.dev/v1",
    kind: "Service",
    metadata: {
      name,
      namespace,
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
              image: `${imageRepository}:${tag}`,
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
  return deployment;
};

/**
 *
 * @param {*} machine
 */
export const deployHostedService = async (hostedServiceObject, machine) => {
  try {
    // Create deployment.
    const deployment = createDeploymentSpec(hostedServiceObject);
    const result = await machine.save("Deployment", deployment);

    return;
    // await machine.event({
    //   reason: "Deployed",
    //   message: `Deployment and service correctly created`,
    // });
  } catch (e) {
    // await machine.event({
    //   reason: "Failed",
    //   type: "Warning",
    //   message: `Failed to start the game cause: ${JSON.stringify(e.message)}`,
    // });
    throw e;
  }
};

export const removeHostedService = async (hostedServiceObject, machine) => {
  try {
    const { metadata, spec } = hostedServiceObject;

    const { name, imageRepository, tag = 'default' } = spec;
    const { namespace } = metadata;
  
    await machine.deleteDeployment(name, namespace);
  } catch (error) {
    throw error;
  }
}