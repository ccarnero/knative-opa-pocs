import { inspect } from 'node:util';

/**
 *
 * @param {*} name
 * @param {*} configmaps
 */
const createDeploymentSpec = (hostedServiceObject) => {
  const { metadata, spec } = hostedServiceObject;

  const { name, imageRepository, tag = 'default', minScale } = spec;
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
            'autoscaling.knative.dev/min-scale':  `${minScale}`
            // TODO: solo un admin podria tocar esto de aca arriba
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

  const { name, envs = [] } = spec;
  const { namespace } = metadata;
  const [tenant, environment] = namespace.split('-');

  const configMapRefName = `${name}-configmap`;

  const envsArray = envs.reduce((envDict, env) => {
    const name = env.name;
    const value = env.value ?? '';
    envDict[name] = value;
    return envDict;
  }, {});

  const data = {
    ...{
      'HOST_SERVICENAME': name,
      'HOST_TENANT': tenant,
      'HOST_ENVIRONMENT': environment,
    },
    ...envsArray
  }
  // create configmap 4 deployment
  return {
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata: {
      name: configMapRefName
    },
    data
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
    const _error = inspect(e)
    console.log("INSPECT ==>", _error)
    await machine.event({
      reason: "Failed",
      type: "Warning",
      message: `Failed to start the service cause: ${ JSON.stringify(e.message) } `,
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