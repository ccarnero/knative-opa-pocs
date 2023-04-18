::: mermaid
flowchart LR
    my-hostedservice.yaml-- contains -->ECR-Image-service-a
    my-hostedservice.yaml-- kubectl apply-->kubernetes
    subgraph kernel-hosted-namespace
        kubernetes<--Informer API--->hsc(hosted-services-controller)
    end
    subgraph tenant-a
        hsc(hosted-services-controller)---->service-a
        hsc(hosted-services-controller)---->service-b
    end
    subgraph mt-services
        hsc(hosted-services-controller)---->service-c
    end

:::