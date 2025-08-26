#!/bin/bash

# # Get the IP address of the manager VM in Multipass
# manager_vm_name="manager" # Replace with the actual name of your manager VM
# manager_ip=$(multipass list | grep "$manager_vm_name" | awk '{print $3}')

# # Check if the IP address was retrieved successfully
# if [[ -z "$manager_ip" ]]; then
#   echo "Failed to retrieve the IP address of the manager VM."
#   exit 1
# fi

# echo "Manager VM IP address: $manager_ip"

# # Validate the IP address format
# if [[ ! $manager_ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
#   echo "Invalid IP address format. Please enter a valid IP address."
#   exit 1
# fi

# Prompt the user to input the IP address of the manager VM
read -p "Enter the IP address of the manager VM: " manager_ip

# Validate the IP address format
if [[ ! $manager_ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid IP address format. Please enter a valid IP address."
  exit 1
fi


#create users
users=("Alice" "Bob" "Charlie" "David" "Eve" "Frank" "Grace" "Heidi" "Ivan" "Judy")
declare -A user_tokens
echo "Creating users and logging them in..."
for user in "${users[@]}"; do
  register_response=$(curl --silent -X POST http://$manager_ip:3007/api/v1/register --data "username=$user&password=password")

  # Check if the response contains "success"
  if echo "$register_response" | grep -q '"status":"success"'; then
    echo "User $user created."
  else
    echo "Failed to create user $user."
  fi

  echo "Logging in $user..."
  login_response=$(curl --silent -X POST http://$manager_ip:3007/api/v1/login --data "username=$user&password=password")

  # Extract the token from the login response
  token=$(echo "$login_response" | grep -oP '(?<="token":")[^"]+')

  # Check if the token was extracted successfully
  if [ -z "$token" ]; then
    echo "Failed to log in $user."
  else
    user_tokens["$user"]="$token"
  fi
done

#get the products
echo "Getting products..."
products_response=$(curl --silent -X GET http://$manager_ip:3007/api/v1/product -H "Authorization: Bearer ${user_tokens["Alice"]}")

# Parse the JSON and extract product information
products_json=$(echo $products_response | jq -r '.products')

# Combine all products into a single list
combined_products=$(echo $products_json | jq -r '[.Fruits[], .Vegetables[]]')

# Store products in a JSON format
echo "Combined Products JSON ..."

# Function to generate a random number between 1 and 5
random_quantity() {
  echo $((RANDOM % 5 + 1))
}


echo "Generating data. It takes a minute..."
for i in {1..20}; do
  for user in "${users[@]}"; do
    # Get a random number of products to add to the cart (between 1 and 3)
    num_products=$(shuf -i 1-3 -n 1)

    # Get a random selection of products
    selected_products=$(echo $combined_products | jq -c '.[]' | shuf -n $num_products)

    # Initialize an empty array for products with random quantities
    updated_products="[]"

    # Loop over each selected product and add a random quantity between 1 and 10
    while IFS= read -r product; do
      random_quantity=$((RANDOM % 10 + 1))  # Random number between 1 and 10
      updated_product=$(echo "$product" | jq --argjson quantity "$random_quantity" '. + {quantity: $quantity}')
      updated_products=$(echo "$updated_products" | jq ". += [$updated_product]")
    done <<< "$selected_products"

    #echo "Selected products with quantity: $updated_products"

    # Combine the selected products with quantity
    cart=$(jq -n --argjson products "$updated_products" '{cart: $products}')

    # Add the selected products to the cart
    add_to_cart_response=$(curl --silent -X POST http://$manager_ip:3007/api/v1/cart/save \
            -H "Authorization: Bearer ${user_tokens["$user"]}" \
            -H "Content-Type: application/json" \
            -d "$cart")

    # Calculate total quantity and total price
    total_quantity=$(echo $updated_products | jq -r 'map(.quantity) | add')
    total_price=$(echo $updated_products | jq -r 'map((.price | tonumber) * .quantity) | add')

    # Add extra information
    extras=$(jq -n --arg totalQuantity "$total_quantity" --arg totalPrice "$total_price" --arg date "$(date +'%d/%m/%Y')" \
       '{totalQuantity: $totalQuantity, totalPrice: $totalPrice, date: $date}')

    # Combine selected products with extras
    combined_data=$(jq -n --argjson items "$updated_products" --argjson extras "$extras" \
       '{checkout: {items: $items, extras: $extras}}')

    # Perform a checkout
    checkout_response=$(curl --silent -X POST http://$manager_ip:3007/api/v1/checkout/save \
        -H "Authorization: Bearer ${user_tokens["$user"]}" \
        -H "Content-Type: application/json" \
        -d "$combined_data")
  done
done


echo " You can check the data in the database now."
echo "logs database URL: http://$manager_ip:3010/_utils"
echo "recommendation database URL: http://$manager_ip:3012/_utils"
