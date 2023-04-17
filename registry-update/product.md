::: mermaid
flowchart TD
    subgraph kernel-hosted-namespace
        puller<--Informer API--->hsc(hosted-services-controller)
        kubernetes<--Informer API--->hsc
    end
    subgraph ecr-cloud
        image-service-a<-->puller
        image-service-b
        image-service-c
    end

subgraph tooling
    REST-API-- CRUD: .yaml -->kubernetes
    REST-API-- Query: kubernetes/client-node -->kubernetes
end

:::