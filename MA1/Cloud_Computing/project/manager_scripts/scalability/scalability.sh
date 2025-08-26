#!/bin/bash

echo "Building Docker image..."
sudo docker build -t scapp-scalability:latest ./scalability/artillery

#user-service
echo "Applying policy for scapp_users-service..."
bash /home/ubuntu/scalability/apply-policy-of-scalability.sh scapp users-service &
PID=$!
sleep 5
echo "Running artillery test for login-user-load-test..."
sudo docker stop scalability
sudo docker rm scalability --force
sudo docker run -d --name scalability --network scapp-net scapp-scalability artillery run /usr/src/artillery/login-user-load-test.yml
wait $PID


#cart-service
echo "Applying policy for scapp_cart-service..."
bash /home/ubuntu/scalability/apply-policy-of-scalability.sh scapp cart-service &
PID=$!
sleep 5
echo "Running artillery test for add-to-cart-load-test..."
sudo docker stop scalability
sudo docker rm scalability --force
sudo docker run -d --name scalability --network scapp-net scapp-scalability artillery run /usr/src/artillery/cart-load-test.yml
wait $PID


#checkout-service
echo "Applying policy for scapp_checkout-service..."
bash /home/ubuntu/scalability/apply-policy-of-scalability.sh scapp checkout-service &
PID=$!
sleep 5
echo "Running artillery test for checkout-load-test..."
sudo docker stop scalability
sudo docker rm scalability --force
sudo docker run -d --name scalability --network scapp-net scapp-scalability artillery run /usr/src/artillery/checkout-load-test.yml
wait $PID


#product-service
echo "Applying policy for scapp_products-service..."
bash /home/ubuntu/scalability/apply-policy-of-scalability.sh scapp products-service &
PID=$!
sleep 5
echo "Running artillery test for products-load-test..."
sudo docker stop scalability 
sudo docker rm scalability --force
sudo docker run -d --name scalability --network scapp-net scapp-scalability artillery run /usr/src/artillery/product-load-test.yml
wait $PID

#logs-service
echo "Applying policy for scapp_logs-service..."
bash /home/ubuntu/scalability/apply-policy-of-scalability.sh scapp logs-service &
PID=$!
sleep 5
echo "Running artillery test for logs-load-test..."
sudo docker stop scalability
sudo docker rm scalability --force
sudo docker run -d --name scalability --network scapp-net scapp-scalability artillery run /usr/src/artillery/logs-load-test.yml
wait $PID


echo "Scalability tests completed."