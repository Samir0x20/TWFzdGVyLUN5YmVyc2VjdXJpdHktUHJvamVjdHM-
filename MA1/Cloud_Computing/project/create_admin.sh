#!/bin/bash

# Prompt the user to input the IP address of the manager VM
read -p "Enter the IP address of the manager VM: " manager_ip

# Validate the IP address format
if [[ ! $manager_ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid IP address format. Please enter a valid IP address."
  exit 1
fi

echo "Creating admin user..."
sleep 3
register_response=$(curl -X POST http://$manager_ip:3007/api/v1/register --data "username=admin&password=admin&isAdmin=true")
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
