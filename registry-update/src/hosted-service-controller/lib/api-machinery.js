import * as util from "./util.js";
import { spawn } from 'child_process';


export const createApiMachinery = (kc, k8s) => {
  /**
   * @type {import('@kubernetes/client-node').CustomObjectsApi}
   */
  const customApi = kc.makeApiClient(k8s.CustomObjectsApi);

  /**
   * @type {import('@kubernetes/client-node').CoreV1Api}
   */
  const coreApi = kc.makeApiClient(k8s.CoreV1Api);

  /**
   * @type {import('@kubernetes/client-node').AppsV1Api}
   */
  const appsApi = kc.makeApiClient(k8s.AppsV1Api);

  const apiMachinery = {
    setOwner: function (owner) {
      if (!owner) {
        throw `Owner cannot be empty`;
      }
      this.owner = owner;
    },

    /**
     *
     */
    createCrdInformer: function () {
      return k8s.makeInformer(
        kc,
        "/apis/kernel.madcloud.io/v1/hosted-services",
        () => {
          return customApi.listClusterCustomObject(
            "kernel.madcloud.io",
            "v1",
            "hosted-services"
          );
        }
      );
    },

    updateStatus: async function (status) {
      const options = {
        headers: { "Content-type": k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH },
      };
      return await customApi.patchNamespacedCustomObjectStatus(
        "kernel.madcloud.io",
        "v1",
        this.owner.metadata.namespace,
        "hosted-services",
        this.owner.metadata.name,
        [
          {
            op: "replace",
            path: "/status",
            value: {
              hostedServicesState: status,
            },
          },
        ],
        undefined,
        undefined,
        undefined,
        options
      );
    },

    /**
     *
     * @param {*} configmap
     */
    saveConfigMap: async function (configmap) {
      return await coreApi.createNamespacedConfigMap(
        this.owner.metadata.namespace,
        configmap
      );
    },

    /**
     *
     * @param {*} service
     */
    saveService: async function (service) {
      const res = await coreApi.createNamespacedService(
        this.owner.metadata.namespace,
        service
      );
    },

    /**
     *
     * @param {*} deployment
     */
    saveDeployment: async function (deployment) {
      return await customApi.createNamespacedCustomObject(
        "serving.knative.dev", // The group name for Knative resources
        "v1",                  // The version of the API
        "talbots-production", // The namespace to create the service in
        "services",           // The plural name of the resource
        deployment
      );
    },


    event: async function (options) {
      const event = {
        metadata: {
          generateName: "hosted-service-event-",
        },
        involvedObject: {
          kind: this.owner.kind,
          name: this.owner.metadata.name,
          uid: this.owner.metadata.uid,
          namespace: this.owner.metadata.namespace,
        },
        reason: options.reason,
        type: options.type || "Normal",
        lastTimestamp: new Date(),
        message: options.message,
      };
      await coreApi.createNamespacedEvent(this.owner.metadata.namespace, event);
    },

    /**
     *
     * @param {*} type
     * @param {*} object
     */
    save: async function (type, object) {
      const funcName = `save${type}`;
      if (!object) {
        throw `Object cannot be empty`;
      }
      if (typeof this[funcName] !== "function") {
        throw `${funcName} is not a valid function, aborting.`;
      }
      const final = util.addDefaultLabels(object, this.owner);
      return await this[funcName](final);
    },

    launch: async function kubectlApply(object) {
      const kctl = (yamlString) => new Promise((resolve, reject) => {
        const kubectl = spawn('kubectl', ['apply', '-f', '-']);

        kubectl.stdin.write(yamlString);
        kubectl.stdin.end();

        let stdout = '';
        let stderr = '';

        kubectl.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        kubectl.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        kubectl.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`kubectl process exited with code ${code}: ${stderr}`));
          } else {
            resolve(stdout);
          }
        });
      });
      const yamlString = `
      apiVersion: serving.knative.dev/v1
      kind: Service
      metadata:
        name: pong
        namespace: talbots-production
        labels:
          app.kubernetes.io/name: pong
          # networking.knative.dev/visibility: cluster-local
      spec:
        template:
          metadata:
            annotations:
              autoscaling.knative.dev/min-scale: "1"
          spec:
            imagePullSecrets:
              - name: ecr-credential-secrets
            containers:
              - image: 701373377822.dkr.ecr.us-east-1.amazonaws.com/talbots/pong
                ports:
                  - containerPort: 8080
      `
      const result = await kctl(yamlString)
      console.log(`kubectl apply output: ${result}`);
  }

  };

  return apiMachinery;
};
