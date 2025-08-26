#!/bin/bash

# Get the IP address of the manager VM
MANAGER_IP=$(multipass info manager | grep "IPv4" | awk '{print $2}')

# Echo the URL for Docker visualizer
echo "Open the Docker visualizer in your browser:"
echo "http://${MANAGER_IP}:80"

sleep 5
echo "Executing the scalability.sh script inside the manager VM"
multipass exec manager -- /bin/bash /home/ubuntu/scalability/scalability.sh
