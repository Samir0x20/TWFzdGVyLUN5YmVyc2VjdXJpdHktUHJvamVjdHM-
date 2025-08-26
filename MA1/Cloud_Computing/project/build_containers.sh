#!/bin/bash


# Build Docker images for all services
#frontend
sudo docker build -t scapp-frontend:latest ./project/src/front-end

#users
sudo docker build -t scapp-users:latest ./project/src/back-end/users

#storage
sudo docker build -t kv-storage-system:latest ./project/src/back-end/storage

#cart
sudo docker build -t scapp-cart:latest ./project/src/back-end/cart

#checkout
sudo docker build -t scapp-checkout:latest ./project/src/back-end/checkout

#api-gateway
sudo docker build -t api-gateway:latest ./project/src/back-end/api-gateway

#products
sudo docker build -t scapp-product:latest ./project/src/back-end/products

#logs
sudo docker build -t logs-service:latest ./project/src/back-end/logs
