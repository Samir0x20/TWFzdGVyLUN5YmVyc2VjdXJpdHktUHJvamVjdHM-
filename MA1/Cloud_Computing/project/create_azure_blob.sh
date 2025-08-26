
#!/bin/bash

# Prompt the user for input values
echo "Enter the Azure Resource Group name:"
read resource_group_name

echo "Enter the name for the Storage Account (must be globally unique):"
read storage_account_name

echo "Enter the region (e.g., eastus, westeurope):"
read region

echo "Enter the name for the Blob Container:"
read container_name

# Confirm the inputs with the user
echo "You are about to create the following Azure resources:"
echo "Resource Group: $resource_group_name"
echo "Storage Account: $storage_account_name"
echo "Region: $region"
echo "Blob Container: $container_name"
echo "Is this correct? (y/n)"
read confirmation

# If the user confirms, proceed with creation
if [ "$confirmation" == "y" ]; then
  # Create the Storage Account
  echo "Creating Storage Account..."
  az storage account create \
    --name $storage_account_name \
    --resource-group $resource_group_name \
    --location $region \
    --sku Standard_LRS \
    --kind StorageV2 \
    --allow-blob-public-access true 
  
  sleep 2

  # Create the Blob Container
  echo "Creating Blob Container..."
  az storage container create \
    --name $container_name \
    --account-name $storage_account_name \
    --public-access blob

  # Output success message
  echo "Storage Account and Blob Container have been created successfully!"

  # Optionally, get the connection string for further use
  connection_string=$(az storage account show-connection-string --name $storage_account_name --resource-group $resource_group_name --query connectionString --output tsv)
  echo "Here is the connection string for your Storage Account:"
  echo $connection_string

  unset ACCOUNT_STRING
  unset CONTAINER_NAME

  # Export the values as environment variables
  export ACCOUNT_STRING=$connection_string
  export CONTAINER_NAME=$container_name

  # File to modify
  BASHRC_FILE="$HOME/.bashrc"

  # Function to add or update an environment variable in the .bashrc file
  add_or_update_env_var() {
      local var_name="$1"
      local var_value="$2"
      local bashrc_file="$3"

      # Check if the variable already exists in the file
      if grep -q "^export $var_name=" "$bashrc_file"; then
          echo "Updating existing variable $var_name in $bashrc_file"
          # Update the existing line with the new value
          sed -i "s|^export $var_name=.*|export $var_name=\"$var_value\"|" "$bashrc_file"
      else
          echo "Adding new variable $var_name to $bashrc_file"
          # Append the new export statement to the end of the file
          echo "export $var_name=\"$var_value\"" >> "$bashrc_file"
      fi
  }

  # Add or update the ACCOUNT_STRING and CONTAINER_NAME variables
  add_or_update_env_var "ACCOUNT_STRING" "$connection_string" "$BASHRC_FILE"
  add_or_update_env_var "CONTAINER_NAME" "$container_name" "$BASHRC_FILE"

  # Source the .bashrc file to apply changes immediately
  echo "Sourcing $BASHRC_FILE to apply changes"
  source "$BASHRC_FILE"

  # Confirm the result
  echo "Done! The environment variables are now set."
  echo "ACCOUNT_STRING: $ACCOUNT_STRING"
  echo "CONTAINER_NAME: $CONTAINER_NAME"


else
  echo "Operation canceled."
fi
