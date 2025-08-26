
#!/bin/bash

# Check if necessary environment variables are provided
if [ -z "$ACCOUNT_STRING" ] || [ -z "$CONTAINER_NAME" ]; then
  echo "Error: connection_string, container_name, and file_to_transfer must be set."
  echo "Open a new shell and check for ACCOUNT_STRING and CONTAINER_NAME environment variable"
  exit 1
fi

# Function to check if a VM exists
vm_exists() {
  multipass list | grep -q "$1"
}


# Create the cloud-init-manager.yaml file with injected environment variables
cat <<EOF > cloud-init-manager.yaml
#cloud-config
write_files:
  # Add environment variables to the system
  - path: /etc/profile.d/setenv.sh
    permissions: "0755"
    content: |
      #!/bin/bash
      export ACCOUNT_STRING="${ACCOUNT_STRING}"
      export CONTAINER_NAME="${CONTAINER_NAME}"

runcmd:
  # Ensure the environment variables script is executable
  - chmod +x /etc/profile.d/setenv.sh

  # Verify if the script exists
  - ls -l /etc/profile.d/setenv.sh

  # Source the environment variables in this session
  - source /etc/profile.d/setenv.sh
EOF


# Create the cloud-init-worker.yaml file with injected environment variables
cat <<EOF > cloud-init-worker.yaml
#cloud-config
write_files:
  # Add environment variables to the system
  - path: /etc/profile.d/setenv.sh
    permissions: "0755"
    content: |
      #!/bin/bash
      export ACCOUNT_STRING="${ACCOUNT_STRING}"
      export CONTAINER_NAME="${CONTAINER_NAME}"

runcmd:
  # Ensure the environment variables script is executable
  - chmod +x /etc/profile.d/setenv.sh

  # Verify if the script exists
  - ls -l /etc/profile.d/setenv.sh

  # Source the environment variables in this session
  - source /etc/profile.d/setenv.sh
EOF

sleep 2

# Check if Manager VM exists, if not create it
if vm_exists "manager"; then
  echo "Manager VM already exists. Skipping creation..."
else
  echo "Creating Manager VM..."
  multipass launch --name manager --memory 2G --disk 15G --cpus 2 --cloud-init cloud-init-manager.yaml
fi

# Check if Worker VM exists, if not create it
if vm_exists "worker"; then
  echo "Worker VM already exists. Skipping creation..."
else
  echo "Creating Worker VM..."
  multipass launch --name worker --memory 2G --disk 10G --cpus 2 --cloud-init cloud-init-worker.yaml
fi


# Check if jq is installed, if not install it
if ! command -v jq &> /dev/null; then
  echo "jq is not installed. Installing jq..."
  sudo apt-get update
  sudo apt-get install -y jq
else
  echo "jq is already installed. Skipping installation..."
fi

# Retrieve the IP address of the Manager VM
manager_ip=$(multipass info manager --format json | jq -r '.info.manager.ipv4[0]')

# Check if manager_ip is successfully retrieved
if [ -z "$manager_ip" ]; then
  echo "Error: Unable to retrieve the IP address of the manager VM."
  exit 1
fi

# Check if the manager IP already exists in the /etc/hosts file
if grep -q "$manager_ip" /etc/hosts; then
  echo "Manager IP $manager_ip already exists in /etc/hosts."
else
  # Add Manager IP to the host's /etc/hosts file for DNS resolving
  echo "Adding Manager IP to /etc/hosts on the host machine... It's required for DNS resolving."
  echo "$manager_ip api-gateway" | sudo tee -a /etc/hosts
fi

# Transfer the script file to the manager VM
multipass transfer ./manager_scripts/scapp.yml manager:/home/ubuntu/scapp.yml

# Transfer the scalability folder to the manager VM
multipass transfer -r ./manager_scripts/scalability manager:/home/ubuntu/scalability

# Make the script executable
multipass exec manager -- bash -c "chmod +x /home/ubuntu/scapp.yml"

# Generate SSH keys on the manager VM
multipass exec manager -- bash -c "ssh-keygen -t rsa -b 2048 -f /home/ubuntu/.ssh/id_rsa -N ''"

# Retrieve the public key from the manager VM
manager_public_key=$(multipass exec manager -- bash -c "cat /home/ubuntu/.ssh/id_rsa.pub")

# Add the manager's public key to the worker VM's authorized keys
multipass exec worker -- bash -c "echo '${manager_public_key}' >> /home/ubuntu/.ssh/authorized_keys"

echo "SSH key for manager VM created and public key added to worker VM."

