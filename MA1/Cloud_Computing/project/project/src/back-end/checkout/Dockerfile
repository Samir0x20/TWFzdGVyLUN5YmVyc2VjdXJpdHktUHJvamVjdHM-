# this image relies on the nodejs image
FROM node:20-alpine
# set working directory
WORKDIR /checkout/src/checkout-service
# we need CURL to verify that the key-value storage is running (see boot-in-order.sh)
RUN apk update && apk add curl

# let NPM packages be called anywhere within the container
ENV PATH /checkout/src/checkout-service/node_modules/.bin:${PATH}
ADD package.json .
RUN npm install
# source files of the checkout service
ADD gulpfile.js .
ADD src src
ADD boot-in-order.sh .
# header for logging messages
ENV DEBUG checkout-d
# non empty string use perisitence (with CouchDB)
ENV WITH_PERSISTENT_DATA Y

ENV CHECKOUT_D_PORT 80

# name of container running CouchDB
ENV DB_HOST checkout-db
# database name
ENV DB_NAME checkout-users
# authentication information to CRUD (create/remove/update/delete) objects in our DB
ENV ADMIN_NAME admin
ENV ADMIN_PASSW admin
ENV DB_CHECKOUT_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_NAME}

# we now use an script to deploy the checkout service
CMD source boot-in-order.sh