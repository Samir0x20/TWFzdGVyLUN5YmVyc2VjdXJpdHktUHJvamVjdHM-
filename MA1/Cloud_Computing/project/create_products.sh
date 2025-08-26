#!/bin/bash

# Prompt the user to input the IP address of the manager VM
read -p "Enter the IP address of the manager VM: " manager_ip

# Validate the IP address format
if [[ ! $manager_ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid IP address format. Please enter a valid IP address."
  exit 1
fi



echo "Logging in admin user..."
login_response=$(curl -X POST http://$manager_ip:3007/api/v1/login --data "username=admin&password=admin")
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
     http://${manager_ip}:3007/api/v1/product/save

    sleep 2
done

echo -e "\nThe URL to the frontend should be:  http://${manager_ip}:3000/"

echo -e "\nPlease, give some time for the miscroservices to start up. Especially when login as well as the pruducts to appear on the frontend."
echo -e "\nIf the products do not appear on the frontend, please refresh the page."