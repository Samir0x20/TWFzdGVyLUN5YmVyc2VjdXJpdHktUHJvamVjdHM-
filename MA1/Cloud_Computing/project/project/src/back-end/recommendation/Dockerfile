# this image relies on the nodejs image
FROM node:20-alpine
# set working directory
WORKDIR /recommendation/src/recommendation-service
# we need CURL to verify that the key-value storage is running (see boot-in-order.sh)
RUN apk update && apk add curl

# let NPM packages be called anywhere within the container
ENV PATH /recommendation/src/recommendation-service/node_modules/.bin:${PATH}
ADD package.json .
RUN npm install
# source files of the recommendation service
ADD gulpfile.js .
ADD src src
ADD boot-in-order.sh .
# header for loggining messages
ENV DEBUG recommendation-d
# non empty string use perisitence (with CouchDB)
ENV WITH_PERSISTENT_DATA Y

ENV RECOMMENDATION_D_PORT 80

# name of container running CouchDB
ENV DB_HOST recommendation-db
# database name
ENV DB_RECOMMENDATION purchase-based
# authentication information to CRUD (create/remove/update/delete) objects in our DB
ENV ADMIN_NAME admin
ENV ADMIN_PASSW admin
ENV DB_RECOMMENDATION_URL http://${ADMIN_NAME}:${ADMIN_PASSW}@${DB_HOST}:5984/${DB_RECOMMENDATION}
# we now use an script to deploy the authentication service

COPY func_to_string.js ./
COPY views ./views
COPY wait-for-couchdb.sh ./

CMD source boot-in-order.sh