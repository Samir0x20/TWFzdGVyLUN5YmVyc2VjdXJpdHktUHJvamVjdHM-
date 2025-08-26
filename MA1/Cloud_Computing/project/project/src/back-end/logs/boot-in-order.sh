#!/bin/bash -
#===============================================================================
#
#          FILE: boot-in-order.sh
#
#         USAGE: ./boot-in-order.sh
#
#   DESCRIPTION:
#     Waits until the daemon of CouchDB starts to create a database. The
#     environment variable DB_URL contains more details of such DB
#     (name, authentication information of administrator, etc).
#       OPTIONS: ---
#  REQUIREMENTS: This script makes use of the environment variables DB_NAME and
#     DB_URL, be sure that such variables were defined before running this script.
#          BUGS: ---
#         NOTES: ---
#        AUTHOR: Raziel Carvajal-Gomez (), raziel.carvajal@uclouvain.be
#  ORGANIZATION:
#       CREATED: 10/08/2018 09:20
#      REVISION:  ---
#===============================================================================

# Function to check if the response is {"ok":true}
check_response() {
  local response=$1
  if echo "$response" | grep -q '"ok":true'; then
    return 0
  else
    return 1
  fi
}

if [ "${WITH_PERSISTENT_DATA}" != "" ]; then
  echo "Wait (indefinitely) until the DB creation (name: ${DB_LOGS_USERS})."
  echo "The DB URL is: ${DB_LOGS_USERS_URL}"
  until response=$(curl --silent --request PUT ${DB_LOGS_USERS_URL}) && check_response "$response"; do
    echo -e "\t DB (${DB_LOGS_USERS}) wasn't created - trying again later..."
    sleep 2
  done
  echo "DB (${DB_LOGS_USERS}) was created!"

  echo "Wait (indefinitely) until the DB creation (name: ${DB_LOGS_CHECKOUT})."
  echo "The DB URL is: ${DB_LOGS_CHECKOUT_URL}"
  until response=$(curl --silent --request PUT ${DB_LOGS_CHECKOUT_URL}) && check_response "$response"; do
    echo -e "\t DB (${DB_LOGS_CHECKOUT}) wasn't created - trying again later..."
    sleep 2
  done
  echo "DB (${DB_LOGS_CHECKOUT}) was created!"

  echo "Wait (indefinitely) until the DB creation (name: ${DB_LOGS_CART})."
  echo "The DB URL is: ${DB_LOGS_CART_URL}"
  until response=$(curl --silent --request PUT ${DB_LOGS_CART_URL}) && check_response "$response"; do
    echo -e "\t DB (${DB_LOGS_CART}) wasn't created - trying again later..."
    sleep 2
  done
  echo "DB (${DB_LOGS_CART}) was created!"

  echo "Wait (indefinitely) until the DB creation (name: ${DB_LOGS_PRODUCT})."
  echo "The DB URL is: ${DB_LOGS_PRODUCT_URL}"
  until response=$(curl --silent --request PUT ${DB_LOGS_PRODUCT_URL}) && check_response "$response"; do
    echo -e "\t DB (${DB_LOGS_PRODUCT}) wasn't created - trying again later..."
    sleep 2
  done
  echo "DB (${DB_LOGS_PRODUCT}) was created!"

  echo "Wait (indefinitely) until the DB creation (name: ${DB_LOGS_USER_ACTION})."
  echo "The DB URL is: ${DB_LOGS_USER_ACTION_URL}"
  until response=$(curl --silent --request PUT ${DB_LOGS_USER_ACTION_URL}) && check_response "$response"; do
    echo -e "\t DB (${DB_LOGS_USER_ACTION}) wasn't created - trying again later..."
    sleep 2
  done
  echo "DB (${DB_LOGS_USER_ACTION}) was created!"

  echo "Wait (indefinitely) until the DB creation (name: ${DB_LOGS_RECOMMENDATION})."
  echo "The DB URL is: ${DB_LOGS_RECOMMENDATION_URL}"
  until response=$(curl --silent --request PUT ${DB_LOGS_RECOMMENDATION_URL}) && check_response "$response"; do
    echo -e "\t DB (${DB_LOGS_RECOMMENDATION}) wasn't created - trying again later..."
    sleep 2
  done
  echo "DB (${DB_LOGS_RECOMMENDATION}) was created!"
fi

echo "Start cart users service..."
npm start