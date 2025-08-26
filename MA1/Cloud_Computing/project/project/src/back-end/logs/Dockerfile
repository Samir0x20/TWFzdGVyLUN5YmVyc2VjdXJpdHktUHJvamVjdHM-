# this image relies on the nodejs image
FROM node:20-alpine
# set working directory
WORKDIR /logs/src/logs
# we need CURL to verify that the key-value storage is running (see boot-in-order.sh)
RUN apk update && apk add curl

# let NPM packages be called anywhere within the container
ENV PATH /logs/src/logs/node_modules/.bin:${PATH}
ADD package.json .
RUN npm install
# source files of the logs service
ADD gulpfile.js .
ADD src src
ADD boot-in-order.sh .
# header for logging messages
ENV DEBUG logs-d
# non empty string use perisitence (with CouchDB)
ENV WITH_PERSISTENT_DATA Y

ENV LOGS_D_PORT 80


# name of container running CouchDB
ENV DB_HOST logs-db
# database name
ENV DB_LOGS_USERS logs-users-microservice
ENV DB_LOGS_CHECKOUT logs-checkout-microservice
ENV DB_LOGS_CART logs-cart-microservice
ENV DB_LOGS_PRODUCT logs-product-microservice
ENV DB_LOGS_USER_ACTION logs-user-action
ENV DB_LOGS_RECOMMENDATION logs-recommendation-microservice
# authentication information to CRUD (create/remove/update/delete) objects in our DB
ENV ADMIN_NAME admin
ENV ADMIN_PASSW admin
ENV DB_LOGS_USERS_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_LOGS_USERS}
ENV DB_LOGS_CHECKOUT_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_LOGS_CHECKOUT}
ENV DB_LOGS_CART_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_LOGS_CART}
ENV DB_LOGS_PRODUCT_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_LOGS_PRODUCT}
ENV DB_LOGS_USER_ACTION_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_LOGS_USER_ACTION}
ENV DB_LOGS_RECOMMENDATION_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_LOGS_RECOMMENDATION}

# we now use an script to deploy the logs service
CMD source boot-in-order.sh