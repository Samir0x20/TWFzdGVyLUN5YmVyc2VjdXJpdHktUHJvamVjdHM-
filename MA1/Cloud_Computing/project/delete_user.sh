#!/bin/bash


# Get the IP address of the manager VM in Multipass
manager_vm_name="manager" # Replace with the actual name of your manager VM
manager_ip=$(multipass list | grep "$manager_vm_name" | awk '{print $3}')


# Check if the IP address was retrieved successfully
if [[ -z "$manager_ip" ]]; then
  echo "Failed to retrieve the IP address of the manager VM."
  exit 1
fi

echo "Manager VM IP address: $manager_ip"

# Validate the IP address format
if [[ ! $manager_ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid IP address format. Please enter a valid IP address."
  exit 1
fi


users=("Alice" "Bob" "Charlie" "David" "Eve" "Frank" "Grace" "Heidi" "Ivan" "Judy")

echo "Deleting users..."
for user in "${users[@]}"; do
  echo "Deleting user $user..."
  delete_response=$(curl -X DELETE http://$manager_ip:3007/api/v1/delete/$user)
  echo -e "\nResponse: $delete_response"

  # Check if the response contains "success"
  if echo "$delete_response" | grep -q '"status":"success"'; then
    echo "User $user deleted."
  else
    echo "Failed to delete user $user."
  fi
done