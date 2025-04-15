#!/bin/bash


# to install node and npm on windows go to: https://nodejs.org/en and download the latest version

# Check if fnm is installed
if ! command -v fnm &> /dev/null
then
    echo "fnm not found, installing..."
    # installs fnm (Fast Node Manager)
    curl -fsSL https://fnm.vercel.app/install | bash

    # activate fnm
    source ~/.bashrc
else
    echo "fnm is already installed"
fi

# Check if the desired Node.js version is installed
if ! fnm list | grep -q "v23"
then
    echo "Node.js v23 not found, installing..."
    # download and install Node.js
    fnm use --install-if-missing 23
else
    echo "Node.js v23 is already installed"
fi

# verifies the right Node.js version is in the environment
node -v # should print `v23.6.0`

# verifies the right npm version is in the environment
npm -v # should print `10.9.2`

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null
then
    echo "OpenSSL not found, installing..."
    # Install OpenSSL (this command may vary depending on your package manager)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y openssl
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install openssl
    elif [[ "$OSTYPE" == "cygwin" ]]; then
        # Assuming Cygwin environment
        apt-cyg install openssl
    elif [[ "$OSTYPE" == "msys" ]]; then
        # Assuming Git Bash or similar environment
        pacman -S openssl
    else
        echo "Unsupported OS type: $OSTYPE"
        exit 1
    fi
else
    echo "OpenSSL is already installed"
fi

# verifies the right OpenSSL version is in the environment
openssl version

# Check if the key files exist, if not create them
create_key_if_not_exists() {
    local key_file=$1
    if [ ! -f "$key_file" ]; then
        echo "Creating $key_file..."
        openssl genrsa -out "$key_file" 2048
    else
        echo "$key_file already exists."
    fi
}

create_key_if_not_exists "police.key"
create_key_if_not_exists "government.key"
create_key_if_not_exists "insurance.key"
create_key_if_not_exists "malicious.key"

echo "All keys are created and verified."

# Check if the certificate files exist, if not create them
create_cert_if_not_exists() {
    local key_file=$1
    local cert_file=$2
    local subj=$3
    if [ ! -f "$cert_file" ]; then
        echo "Creating $cert_file..."
        openssl req -x509 -new -nodes -key "$key_file" -sha256 -days 1024 -out "$cert_file" -subj "$subj"
    else
        echo "$cert_file already exists."
    fi
}

create_cert_if_not_exists "insurance.key" "insurance_root_ca.cert" "/C=BE/O=Insurance Company A/CN=Insurance Root CA"
create_cert_if_not_exists "police.key" "police_root_ca.cert" "/C=BE/O=Police Department/CN=Police Department Root CA"
create_cert_if_not_exists "government.key" "government_root_ca.cert" "/C=BE/O=Government Agency/CN=Government Agency Root CA"
create_cert_if_not_exists "malicious.key" "malicious_root_ca.cert" "/C=BE/O=Malicious Organisation/CN=Malicious Root CA"

echo "All keys and certificates are created and verified."