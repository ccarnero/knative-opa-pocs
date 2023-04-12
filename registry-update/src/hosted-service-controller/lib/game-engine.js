import * as path from "path";
import * as fs from "fs";
import * as util from "./util.js";

/**
 *
 * @param {*} files
 * @param {*} gameObject
 */
const createConfigMapsSpec = async (files, gameObject) => {
  let configmaps = [];
  let index = 0;
  for (const file of files) {
    let filename = path.basename(file).toLowerCase();
    let data = await fs.promises.readFile(file, { encoding: "base64" });
    let configmap = {
      metadata: {
        name: `${gameObject.metadata.name}-${index}`,
      },
      binaryData: {
        [filename]: data,
      },
    };
    configmaps.push(configmap);
    index++;
  }
  return configmaps;
};

/**
 *
 * @param {*} gameObject
 */
export async function downloadAndCreateConfigmapsSpec(gameObject) {
  try {
    const path = await util.download(gameObject);
    const files = await util.splitFile(path);
    const configmaps = await createConfigMapsSpec(files, gameObject);
    return configmaps;
  } catch (e) {
    throw e;
  }
}

/**
 *
 * @param {*} gameObject
 */
const createKnServiceSpec = (gameObject) => {
  const name = gameObject.metadata.name;
  const service = {
    apiVersion: 'serving.knative.dev/v1',
    kind: 'Service',
    metadata:
    {
      name: 'pong',
      namespace: 'talbots-production',
      labels:
        { 'app.kubernetes.io/name': 'pong' }
    },
    spec:
    {
      template: {
        metadata: {
          annotations: {
            'autoscaling.knative.dev/min-scale': "1"
          }
        },
        spec: {
          imagePullSecrets: [
            { name: 'ecr-credential-secrets' }
          ],
          containers: [
            {
              image: '701373377822.dkr.ecr.us-east-1.amazonaws.com/talbots/pong',
              ports: [{ containerPort: 8080 }]
            }
          ]
        }
      }
    }
  };
  return service;
};

/**
 *
 * @param {*} gameObject
 */
const createServiceSpec = (gameObject) => {
  const name = gameObject.metadata.name;
  const service = {
    metadata: {
      name: name,
      labels: {
        app: name,
      },
    },
    spec: {
      selector: {
        app: name,
      },
      ports: [
        {
          name: "vnc",
          protocol: "TCP",
          port: 8080,
          containerPort: 8080,
        },
        {
          name: "audio",
          protocol: "TCP",
          port: 8081,
          containerPort: 8081,
        },
      ],
    },
  };
  return service;
};

/**
 *
 * @param {*} name
 * @param {*} configmaps
 */
const createDeploymentSpec = (gameObject) => {
  const { metadata, spec } = gameObject;

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
 * @param {*} deployment
 * @param {*} configmaps
 */
const addDeploymentVolumes = (deployment, configmaps) => {
  const deploymentClone = { ...deployment };
  const volumes = [];
  const volumeMounts = [];
  configmaps.forEach((configmap, key) => {
    volumes.push({
      name: `configmap-volume-${key}`,
      configMap: {
        name: configmap.configmapName,
        items: [
          {
            key: configmap.filename,
            path: configmap.filename,
          },
        ],
      },
    });
    volumeMounts.push({
      name: `configmap-volume-${key}`,
      mountPath: `/split/${key}`,
      subPath: configmap.filename,
    });
  });

  // Add the final game volume.
  const gamesVolume = {
    name: `games-volume`,
    emptyDir: {},
  };
  const gamesVolumeMount = {
    name: "games-volume",
    mountPath: "/games",
  };
  volumes.push(gamesVolume);
  volumeMounts.push(gamesVolumeMount);

  // Add all volumes to the init container.
  deploymentClone["spec"]["template"]["spec"]["volumes"] = volumes;
  deploymentClone["spec"]["template"]["spec"]["initContainers"][0][
    "volumeMounts"
  ] = volumeMounts;

  // Add only the game volume to the game engine.
  deploymentClone["spec"]["template"]["spec"]["containers"][0][
    "volumeMounts"
  ] = [gamesVolumeMount];

  return deploymentClone;
};

/**
 *
 * @param {*} gameUrl
 * @param {*} machine
 */
export const saveGame = async (gameObject, machine) => {
  try {
    await machine.event({
      reason: "Downloading",
      message: `Starting to download game "${gameObject.spec.name}" from: ${gameObject.spec.zipUrl}`,
    });

    const configmaps = await downloadAndCreateConfigmapsSpec(gameObject);
    for (const configmap of configmaps) {
      await machine.save("ConfigMap", configmap);
    }

    await machine.event({
      reason: "Downloaded",
      message: `Downloaded and splitted in ${configmaps.length} configmaps`,
    });
    return configmaps;
  } catch (e) {
    await machine.event({
      reason: "Failed",
      type: "Warning",
      message: `Download of game failed cause: ${JSON.stringify(e.message)}`,
    });
    throw e;
  }
};

/**
 *
 * @param {*} machine
 */
export const deployGame = async (gameObject, machine) => {
  try {
    // Create deployment.
    const deployment = createDeploymentSpec(gameObject);
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
