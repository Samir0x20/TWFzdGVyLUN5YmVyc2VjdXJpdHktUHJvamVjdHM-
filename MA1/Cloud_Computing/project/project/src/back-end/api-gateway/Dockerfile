# Use the official Node.js image as the base image
FROM node:20-alpine

# Set the working directory
WORKDIR /gateway/src/api-gateway

RUN apk update && apk add curl

# let NPM packages be called anywhere within the container
ADD package.json .
RUN npm install
ENV PATH /gateway/src/api-gateway/node_modules/.bin:${PATH}
# source files of the api-gateway service
ADD gulpfile.js .
ADD src src
# header for logging messages
ENV DEBUG api-gateway-d

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
ENV API_GATEWAY_D_PORT 80

# Correctly set the environment variable for the api gateway service
ENV AUTH_SERVICE_URL="http://users-service:80" 
ENV CART_SERVICE_URL="http://cart-service:80" 
ENV CHECKOUT_SERVICE_URL="http://checkout-service:80"
ENV PRODUCTS_SERVICE_URL="http://products-service:80"
ENV RECOMMENDATION_SERVICE_URL="http://recommendation-service:80"

# Command to run the application
CMD ["node", "src/daemon.js"]