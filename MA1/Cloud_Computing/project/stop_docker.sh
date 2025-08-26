#!/bin/bash

# Stop and remove existing Docker containers
sudo docker stop frontend users-db users-service cart-service cart-db checkout-service checkout-db api-gateway products-db products-service logs-service logs-db recommendation-service recommendation-db
sudo docker rm frontend users-db users-service cart-service cart-db checkout-service checkout-db api-gateway products-db products-service logs-service logs-db recommendation-service recommendation-db

sleep 2
sudo docker image rm -f scapp-frontend scapp-users kv-storage-system scapp-cart scapp-checkout api-gateway scapp-product logs-service scapp-recommendation
sudo docker network rm -f scapp-network


# Remove Docker images associated with containers
sudo docker rmi -f privacy13/scapp-frontend:latest
sudo docker rmi -f privacy13/scapp-frontend
sudo docker rmi -f privacy13/api-gateway:latest
sudo docker rmi -f privacy13/api-gateway
sudo docker rmi -f privacy13/scapp-cart:latest
sudo docker rmi -f privacy13/scapp-checkout:latest
sudo docker rmi -f privacy13/scapp-product:latest
sudo docker rmi -f privacy13/scapp-users:latest
sudo docker rmi -f privacy13/logs-service:latest
sudo docker rmi -f privacy13/kv-storage-system:latest
sudo docker rmi -f privacy13/scapp-recommendation:latest

# Remove the Docker network
sudo docker network rm scapp-network

echo "Docker containers and images are removed."