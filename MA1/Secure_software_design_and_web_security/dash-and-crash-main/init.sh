#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR=$(dirname "$0")

# install the dependencies in main directory
echo "Installing dependencies in main directory..."
cd "$SCRIPT_DIR/main"
npm install
npx prisma generate
npx prisma migrate dev --name init

cd ..

# install the dependencies in log-server directory
echo "Installing dependencies in log-server directory..."
cd "$SCRIPT_DIR/log-server"
npm install
npx prisma generate
npx prisma migrate dev --name init

cd ..

# install the dependencies in email-server directory
echo "Installing dependencies in email-server directory..."
cd "$SCRIPT_DIR/mail-server"
npm install


cd ..

echo "All dependencies installed successfully."