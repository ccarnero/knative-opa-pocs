import { createApiMachinery } from "./api-machinery.js";
import { removeHostedService, deployHostedService } from "./hosted-services-engine.js";
import { inspect } from 'util';

/**
 * @param {import('@kubernetes/client-node').KubeConfig} kc - Kubeconfig
 * @param {import('@kubernetes/client-node')} k8s - K8s
 */
export const start = (kc, k8s) => {
  const machine = createApiMachinery(kc, k8s);
  const crdInformer = machine.createCrdInformer();

  crdInformer.on("add", async (hostedServiceObject) => {
    try {
      if (process.env.DEBUG) {
        console.log(JSON.stringify(hostedServiceObject, null, 2));
      }
      // TODO:
      // Check if already exists.
      // Get/merge default variables.
      machine.setOwner(hostedServiceObject)
      await deployHostedService(hostedServiceObject, machine);

      console.log(`service deployed`);

      // Mark as ready.
      await machine.updateStatus("Ready");
    } catch (e) {
      try {
        await machine.updateStatus("Error");
      } catch (e) {
        console.error("Cannot update the status.");
      } finally {
        e.response?.body?.message
          ? console.error(e.response.body.message)
          : console.error(e);
      }
    }
  });

  // TODO: Handle CRD updates.
  crdInformer.on("update", async (obj) => {
    if (process.env.DEBUG) {
      console.log(JSON.stringify(hostedServiceObject, null, 2));
    }
  });

  // TODO: Handle CRD deletes.
  crdInformer.on("delete", async (hostedServiceObject) => {
    if (process.env.DEBUG) {
      console.log(JSON.stringify(hostedServiceObject, null, 2));
    }
    await removeHostedService(hostedServiceObject, machine)
  });

  crdInformer.start();
};
