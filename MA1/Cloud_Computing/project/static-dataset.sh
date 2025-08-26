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
  echo "Creating user $user..."
  register_response=$(curl --silent -X POST http://$manager_ip:3007/api/v1/register --data "username=$user&password=password")
  #echo -e "\nResponse: $register_response"

  # Check if the response contains "success"
  if echo "$register_response" | grep -q '"status":"success"'; then
    echo "User $user created."
  else
    echo "Failed to create user $user."
    continue
  fi

  echo "Logging in $user..."
  login_response=$(curl --silent -X POST http://$manager_ip:3007/api/v1/login --data "username=$user&password=password")
  #echo -e "\nResponse: $login_response"

  # Extract the token from the login response
  token=$(echo "$login_response" | grep -oP '(?<="token":")[^"]+')

  # Check if the token was extracted successfully
  if [ -z "$token" ]; then
    echo "Failed to log in $user."
  else
    echo "$user logged in. Token: $token"
    user_tokens["$user"]="$token"
  fi
done

# Print the user tokens
echo "User tokens:"
for user in "${!user_tokens[@]}"; do
  echo "$user: ${user_tokens[$user]}"
done

#get the products
echo "Getting products..."
products_response=$(curl --silent -X GET http://$manager_ip:3007/api/v1/product -H "Authorization: Bearer ${user_tokens["Alice"]}")
#echo -e "\nResponse: $products_response"

# Parse the JSON and extract product information
products_json=$(echo $products_response | jq -r '.products')

# Combine all products into a single list
combined_products=$(echo $products_json | jq -r '[.Fruits[], .Vegetables[]]')

# Store products in a JSON format
echo "Combined Products JSON:"
echo "$combined_products"

for i in {1..20}; do
  for user in "${users[@]}"; do

  data="{
    \"checkout\": {
      \"items\": [
        {
          \"id\": \"19a5736e-64b6-4e64-a5d2-6ffe4ee0ee1d\",
          \"name\": \"Cucumber\",
          \"price\": \"5.6\",
          \"url\": \"https://scappte.blob.core.windows.net/products/Vegetables/1734206361348-Cucumber.Cucumber\",
          \"category\": \"Vegetables\",
          \"quantity\": 5
        },
        {
          \"id\": \"8481d89d-7e97-422d-b4b3-b17ae68902f7\",
          \"name\": \"Grapes\",
          \"price\": \"5.98\",
          \"url\": \"https://scappte.blob.core.windows.net/products/Fruits/1734206361780-Grapes.Grapes\",
          \"category\": \"Fruits\",
          \"quantity\": 9
        },
        {
          \"id\": \"f9aaa9b5-b0d1-4065-8efa-5904f16f2fea\",
          \"name\": \"Brocolli\",
          \"price\": \"2.73\",
          \"url\": \"https://scappte.blob.core.windows.net/products/Vegetables/1734206361079-Brocolli.Brocolli\",
          \"category\": \"Vegetables\",
          \"quantity\": 7
        },
        {
          \"id\": \"0a76ec17-f17a-47f8-8cff-60c6d031b0e7\",
          \"name\": \"Mango\",
          \"price\": \"6.8\",
          \"url\": \"https://scappte.blob.core.windows.net/products/Fruits/1734206361893-Mango.Mango\",
          \"category\": \"Fruits\",
          \"quantity\": 6
        }
      ],
      \"extras\": {
        \"totalQuantity\": \"31\",
        \"totalPrice\": \"164.13\",
        \"date\": \"14/12/2024\"
      }
    }
  }"

  # Perform a checkout
  checkout_response=$(curl --silent -X POST http://$manager_ip:3007/api/v1/checkout/save \
      -H "Authorization: Bearer ${user_tokens["$user"]}" \
      -H "Content-Type: application/json" \
      -d "$data")

  done
done