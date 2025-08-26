#!/bin/bash

# Stop and remove existing Docker containers
sudo docker stop frontend users-db users-service cart-service cart-db \
                 checkout-service checkout-db api-gateway products-db \
                 products-service logs-service logs-db recommendation-db recommendation-service
sudo docker rm frontend users-db users-service cart-service cart-db \
              checkout-service checkout-db api-gateway products-db \
              products-service logs-service logs-db recommendation-db recommendation-service

sleep 2

# Remove Docker images associated with containers
sudo docker image rm -f scapp-frontend scapp-users kv-storage-system scapp-cart \
                        scapp-checkout api-gateway scapp-product logs-service scapp-recommendation
sudo docker network rm -f scapp-network

# Remove dangling images (optional but recommended)
#sudo docker image prune -f
#sudo docker network prune -f

sleep 2

# Create a Docker network only if it doesn't already exist
if ! sudo docker network ls | grep -q scapp-network; then
    sudo docker network create scapp-network
fi

# Build Docker images with specific tags
sudo docker build -t scapp-frontend:latest ./project/src/front-end
sudo docker build -t scapp-users:latest ./project/src/back-end/users
sudo docker build -t kv-storage-system:latest ./project/src/back-end/storage
sudo docker build -t scapp-cart:latest ./project/src/back-end/cart
sudo docker build -t scapp-checkout:latest ./project/src/back-end/checkout
sudo docker build -t api-gateway:latest ./project/src/back-end/api-gateway
sudo docker build -t scapp-product:latest ./project/src/back-end/products
sudo docker build -t logs-service:latest ./project/src/back-end/logs
sudo docker build -t scapp-recommendation:latest ./project/src/back-end/recommendation

# Run Docker containers

sudo docker run -d --name logs-db --network scapp-network -p 3010:5984 kv-storage-system
sudo docker run -d --name logs-service --network scapp-network \
  -e RECOMMENDATION_SERVICE_URL=http://recommendation-service:80 \
  -p 3011:80 logs-service

sudo docker run -d --name users-db --network scapp-network -p 3001:5984 kv-storage-system 
sudo docker run -d --name users-service --network scapp-network \
  -e LOGGING_SERVICE_URL=http://logs-service:80 \
  -p 3002:80 scapp-users

sudo docker run -d --name cart-db --network scapp-network -p 3003:5984 kv-storage-system 
sudo docker run -d --name cart-service --network scapp-network \
  -e LOGGING_SERVICE_URL=http://logs-service:80 \
  -e AUTH_SERVICE_URL=http://users-service:80 \
  -p 3004:80 scapp-cart

sudo docker run -d --name checkout-db --network scapp-network -p 3005:5984 kv-storage-system 
sudo docker run -d --name checkout-service --network scapp-network \
  -e LOGGING_SERVICE_URL=http://logs-service:80 \
  -e AUTH_SERVICE_URL=http://users-service:80 \
  -p 3006:80 scapp-checkout

sudo docker run -d --name products-db --network scapp-network -p 3008:5984 kv-storage-system
sudo docker run -d --name products-service --network scapp-network \
  -e LOGGING_SERVICE_URL=http://logs-service:80 \
  -e AUTH_SERVICE_URL=http://users-service:80 \
  -e ACCOUNT_STRING="$ACCOUNT_STRING" \
  -e CONTAINER_NAME="$CONTAINER_NAME" \
  -p 3009:80 scapp-product

sudo docker run -d --name recommendation-db --network scapp-network -p 3012:5984 kv-storage-system
sudo docker run -d --name recommendation-service --network scapp-network \
  -e LOGGING_SERVICE_URL=http://logs-service:80 \
  -e AUTH_SERVICE_URL=http://users-service:80 \
  -p 3013:80 scapp-recommendation

sudo docker run -d --name api-gateway --network scapp-network -p 3007:80 api-gateway

sudo docker run -d --name frontend --network scapp-network \
  -e PUBLIC_API_GATEWAY_URL=http://0.0.0.0:3007/api/v1 \
  -p 3000:3000 scapp-frontend

echo "Docker containers are running."

echo "Creating admin user..."
sleep 3
register_response=$(sudo curl -X POST http://0.0.0.0:3007/api/v1/register --data "username=admin&password=admin&isAdmin=true")
echo -e "\nResponse: $register_response"

# Check if the response contains "success"
if echo "$register_response" | grep -q '"status":"success"'; then
  echo "Admin user created."
else
  echo "Failed to create admin user."
  exit 1
fi

sleep 2

echo "Logging in admin user..."
login_response=$(sudo curl -X POST http://0.0.0.0:3007/api/v1/login --data "username=admin&password=admin")
echo -e "\nResponse: $login_response"

# Extract the token from the login response
token=$(echo "$login_response" | grep -oP '(?<="token":")[^"]+')

# Check if the token was extracted successfully
if [ -z "$token" ]; then
  echo "Failed to log in admin user."
  exit 1
fi

echo "Admin user logged in. Token: $token"


echo "Creating product..."

# Define the list of products with their details, including the image path
products=(
    "name=Brocolli&price=2.73&category=Vegetables&image=./products/broccoli.jpg"
    "name=Cauliflower&price=6.3&category=Vegetables&image=./products/cauliflower.jpg"
    "name=Cucumber&price=5.6&category=Vegetables&image=./products/cucumber.jpg"
    "name=Beetroot&price=8.7&category=Vegetables&image=./products/beetroot.jpg"
    "name=Apple&price=2.34&category=Fruits&image=./products/apple.jpg"
    "name=Banana&price=1.69&category=Fruits&image=./products/banana.jpg"
    "name=Grapes&price=5.98&category=Fruits&image=./products/grapes.jpg"
    "name=Mango&price=6.8&category=Fruits&image=./products/mango.jpg"
)

# Loop through each product and send a POST request
for product in "${products[@]}"
do
    # Extract the product details using parameter expansion
    name=$(echo $product | cut -d'&' -f1 | cut -d'=' -f2)
    price=$(echo $product | cut -d'&' -f2 | cut -d'=' -f2)
    category=$(echo $product | cut -d'&' -f3 | cut -d'=' -f2)
    image=$(echo $product | cut -d'&' -f4 | cut -d'=' -f2)

    echo -e "\nCreating product: $name"
    echo "Price: $price"
    echo "Category: $category"
    echo "image: $image"

    curl \
    -H "Authorization: Bearer $token" \
    -F "name=$name" \
    -F "price=$price" \
    -F "category=$category" \
    -F "url=" \
    -F "image=@$image" \
     http://0.0.0.0:3007/api/v1/product/save
done

echo -e "\nThe URL for the frontend is http://0.0.0.0:3000"

