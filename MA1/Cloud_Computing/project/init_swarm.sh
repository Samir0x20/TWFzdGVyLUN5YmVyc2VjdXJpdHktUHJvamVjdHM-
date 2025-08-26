#!/bin/bash

# Define VM names
MANAGER_VM="manager"
WORKER_VMS=("worker")
SWARM_JOIN_TOKEN=""
MANAGER_IP=""

# Function to install Docker on a VM
install_docker() {
  local vm_name=$1
  echo "Installing Docker on $vm_name..."
  multipass exec "$vm_name" -- bash -c "sudo apt-get update && sudo apt-get install -y docker.io"
}

# Function to check if Docker is installed
is_docker_installed() {
  local vm_name=$1
  multipass exec "$vm_name" -- bash -c "docker --version" &>/dev/null
}

# Function to initialize Docker Swarm on the manager
init_swarm_manager() {
  echo "Initializing Docker Swarm on manager..."
  MANAGER_IP=$(multipass exec "$MANAGER_VM" -- bash -c "hostname -I | awk '{print \$1}'")
  multipass exec "$MANAGER_VM" -- bash -c "sudo docker swarm init --advertise-addr $MANAGER_IP"

  # Get the join token for workers
  SWARM_JOIN_TOKEN=$(multipass exec "$MANAGER_VM" -- bash -c "sudo docker swarm join-token worker -q")
  echo "Swarm initialized on manager. Join token: $SWARM_JOIN_TOKEN"
}

# Function to join a worker to the swarm
join_swarm_worker() {
  local worker_vm=$1
  echo "Joining $worker_vm to the swarm..."
  multipass exec "$worker_vm" -- bash -c "sudo docker swarm join --token $SWARM_JOIN_TOKEN $MANAGER_IP:2377"
}

# Main script execution
echo "Starting Docker Swarm setup for existing VMs..."

# Ensure Docker is installed and set up the manager
if is_docker_installed "$MANAGER_VM"; then
  echo "Docker is already installed on manager VM."
else
  install_docker "$MANAGER_VM"
fi

# Initialize the swarm on the manager
init_swarm_manager

# Ensure Docker is installed and set up workers
for worker_vm in "${WORKER_VMS[@]}"; do
  if is_docker_installed "$worker_vm"; then
    echo "Docker is already installed on $worker_vm."
  else
    install_docker "$worker_vm"
  fi

  join_swarm_worker "$worker_vm"
done

# Verify the swarm
echo "Swarm setup complete. Verifying swarm status..."
multipass exec "$MANAGER_VM" -- bash -c "sudo docker node ls"

# Dynamically create an .env file
multipass exec "$MANAGER_VM" -- bash -c "
  echo \"CONTAINER_NAME=$CONTAINER_NAME\" > /home/ubuntu/.env &&
  echo \"ACCOUNT_STRING=$ACCOUNT_STRING\" >> /home/ubuntu/.env
"

multipass exec "$MANAGER_VM" -- bash -c "sudo docker network create --driver overlay --attachable scapp-net"

# Had issue with declaring environment variables in the scapp.yml file so I resolved it using envsubst and sourced the .env file
multipass exec "$MANAGER_VM" -- bash -c "source /etc/profile.d/setenv.sh \
                                        && envsubst < /home/ubuntu/scapp.yml > /home/ubuntu/scapp_resolved.yml \
                                        && sudo docker stack deploy -c /home/ubuntu/scapp_resolved.yml scapp"



echo "Creating admin user..."
sleep 15

# Loop to attempt admin user registration until it succeeds
while true; do
  # Check if the URL is reachable
  if curl --silent --request POST "http://$MANAGER_IP:3007/api/v1/register"; then
    echo "URL is reachable. Proceeding with admin user registration..."
    register_response=$(curl -X POST http://$MANAGER_IP:3007/api/v1/register --data "username=admin&password=admin&isAdmin=true")
    echo -e "\nResponse: $register_response"

    # Check if the response contains "success"
    if echo "$register_response" | grep -q '"status":"success"'; then
      echo "Admin user created."
      break
    else
      echo "Failed to create admin user. Retrying in 10 seconds... Wait a minute for the service to be operationel."
      sleep 10
    fi
  else
    echo "URL is not reachable. Retrying in 10 seconds... Wait a minute for the service to be operationel."
    echo "$MANAGER_IP" 
    sleep 10
  fi
done

sleep 2

echo "Logging in admin user..."
login_response=$(curl -X POST http://$MANAGER_IP:3007/api/v1/login --data "username=admin&password=admin")
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
     http://${MANAGER_IP}:3007/api/v1/product/save

    sleep 2
done

echo -e "\nThe URL to the frontend should be:  http://${MANAGER_IP}:3000/"

echo -e "\nPlease, give some time for the miscroservices to start up. Especially when login as well as the pruducts to appear on the frontend."
echo -e "\nIf the products do not appear on the frontend, please refresh the page."
