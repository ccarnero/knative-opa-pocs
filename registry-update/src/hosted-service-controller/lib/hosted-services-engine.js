/**
 *
 * @param {*} name
 * @param {*} configmaps
 */
const createDeploymentSpec = (hostedServiceObject) => {
  const { metadata, spec } = hostedServiceObject;

  const { name, imageRepository, tag = 'default' } = spec;
  const { namespace } = metadata;
  const [tenant, environment] = namespace.split('-');

  const configMapRefName = `${name}-configmap`;

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
              envFrom:
                [{
                  configMapRef: { name: configMapRefName }
                }],
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


const createConfigMapSpec = (hostedServiceObject) => {
  const { metadata, spec } = hostedServiceObject;

  const { name } = spec;
  const { namespace } = metadata;
  const [tenant, environment] = namespace.split('-');

  const configMapRefName = `${name}-configmap`;

  // create configmap 4 deployment
  return {
    "apiVersion": "v1",
    "kind": "ConfigMap",
    "metadata": {
      "name": configMapRefName
    },
    "data": {
      'HOST_SERVICENAME': name,
      'HOST_TENANT': tenant,
      'HOST_ENVIRONMENT': environment,
    }
  }
}

/**
 *
 * @param {*} machine
 */
export const deployHostedService = async (hostedServiceObject, machine) => {
  try {
    // TODO: validate if already exists
    const configmap = createConfigMapSpec(hostedServiceObject);
    const cmap = await machine.save("ConfigMap", configmap);

    // Create deployment.
    const deployment = createDeploymentSpec(hostedServiceObject);
    const result = await machine.save("Deployment", deployment);

    // return;
    await machine.event({
      reason: "Deployed",
      message: `Deployment and service correctly created`,
    });
  } catch (e) {
    await machine.event({
      reason: "Failed",
      type: "Warning",
      message: `Failed to start the game cause: ${ JSON.stringify(e.message) } `,
    });
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