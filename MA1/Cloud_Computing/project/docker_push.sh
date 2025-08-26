#!/bin/bash

DOCKER_ID="privacy13"

# List of Docker images to tag and push
images=(
    "scapp-frontend"
    "scapp-users"
    "kv-storage-system"
    "scapp-cart"
    "scapp-checkout"
    "api-gateway"
    "scapp-product"
    "logs-service",
    "scapp-recommendation"
)

# Tag and push each Docker image
for image in "${images[@]}"; do
    echo "Tagging image: $image"
    sudo docker tag "$image:latest" "$DOCKER_ID/$image:latest"
    
    echo "Pushing image: $DOCKER_ID/$image:latest"
    sudo docker push "$DOCKER_ID/$image:latest"
    
    echo "Successfully pushed $DOCKER_ID/$image:latest"
done

echo "All images have been tagged and pushed."