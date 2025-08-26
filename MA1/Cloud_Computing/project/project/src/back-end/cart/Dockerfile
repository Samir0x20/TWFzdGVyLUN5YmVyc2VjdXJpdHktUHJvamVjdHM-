# this image relies on the nodejs image
FROM node:20-alpine
# set working directory
WORKDIR /cart/src/cart-service
# we need CURL to verify that the key-value storage is running (see boot-in-order.sh)
RUN apk update && apk add curl

# let NPM packages be called anywhere within the container
ENV PATH /cart/src/cart-service/node_modules/.bin:${PATH}
ADD package.json .
RUN npm install
# source files of the cart service
ADD gulpfile.js .
ADD src src
ADD boot-in-order.sh .
# header for logging messages
ENV DEBUG cart-d
# non empty string use perisitence (with CouchDB)
ENV WITH_PERSISTENT_DATA Y

ENV CART_D_PORT 80

# name of container running CouchDB
ENV DB_HOST cart-db
# database name
ENV DB_CURRENT_CART users_current_cart
ENV DB_HISTORY_CART users_cart_history
ENV DB_REMOVED_ITEMS users_removed_items
# authentication information to CRUD (create/remove/update/delete) objects in our DB
ENV ADMIN_NAME admin
ENV ADMIN_PASSW admin
ENV DB_CURRENT_CART_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_CURRENT_CART}
ENV DB_HISTORY_CART_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_HISTORY_CART}
ENV DB_REMOVED_ITEMS_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_REMOVED_ITEMS}

# we now use an script to deploy the cart service
CMD source boot-in-order.sh