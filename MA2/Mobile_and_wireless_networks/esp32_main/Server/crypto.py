from Crypto.Cipher import AES
import paho.mqtt.client as mqtt
import binascii
import os
import sqlite3
import base64
import json


DATABASE_NAME = "data.db"
TABLE_QUERY = """
CREATE TABLE data (
    id TEXT PRIMARY KEY,
    mac_address TEXT NOT NULL,
    aes_key TEXT NOT NULL
);
"""

counter_dict = {}

def init_db(db_name):
    """ Database initialization
        id TEXT PRIMARY KEY,
        mac_address TEXT NOT NULL,
        aes_key TEXT NOT NULL
        """
    if os.path.exists(db_name):
        return None

    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    try:
        cursor.execute(TABLE_QUERY)
    except sqlite3.Error as e:
        print(f"Error occurred when creating table {e}.")

    conn.commit()
    conn.close()

def query_key(db_name, device_id):
    """Queries key from device_id. """
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    cursor.execute("SELECT aes_key FROM data WHERE id = ?", (device_id,))
    result = cursor.fetchone()

    if result is not None:
        aes_key = result[0]
        conn.close()
        return aes_key
    else:
        print(f"No key for id {device_id}.")

    conn.close()
    return None

def add_key(db_name, device_id, mac_address, aes_key):
    """ Adds an AES key to the database."""
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO data (id, mac_address, aes_key) VALUES (?, ?, ?)", (device_id, mac_address, aes_key))
        conn.commit()
        print(f"Key added for id {device_id}.")
    except sqlite3.IntegrityError:
        print(f"Key already exists for id {device_id}.")
    except sqlite3.Error as e:
        print(f"Error occurred while adding key {e}.")

    conn.close()

def decode_message(message : str) -> tuple[bytes, bytes, bytes, bytes]:
    """ Decodes a base64 message into bytes.
    8bytes  : device_id
    16bytes : iv
    16bytes : tag
    rest    : ciphertext
    """

    cipher = base64.b64decode(message)
    device_id = cipher[0:8]
    iv = cipher[8:24]
    tag = cipher[24:40]
    ciphertext = cipher[40:]

    return device_id, ciphertext, iv, tag

def encrypt_AES_GCM(secretKey : bytes, iv : bytes, message : bytes) -> tuple[bytes, bytes]:
    aesCipher = AES.new(secretKey, AES.MODE_GCM, iv)
    ciphertext, tag = aesCipher.encrypt_and_digest(message)
    return ciphertext, tag

def decrypt_AES_GCM(secretKey : bytes, ciphertext : bytes, iv : bytes, tag : bytes) -> bytes:
    aesCipher = AES.new(secretKey, AES.MODE_GCM, iv)
    plaintext = aesCipher.decrypt(ciphertext)
    return plaintext

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code: {reason_code}")
    client.subscribe("sensor/data")

def handle_incoming_data(database_name, payload, key_storage) -> bytes:
    """ Given a database containig keys and a payload,
    decodes the payload and uses the right key for decryption. """

    device_id, ciphertext, iv, tag = decode_message(payload)

    key = query_key(database_name, device_id.decode("utf-8"))

    # Don't query the key if it has already been used once.
    if device_id not in key_storage.keys():
        key = query_key(database_name, device_id.decode("utf-8"))
        if key:
            key_storage[device_id] = key

    secretKey = binascii.unhexlify(key_storage[device_id].encode("utf-8"))

    plaintext = decrypt_AES_GCM(secretKey, ciphertext, iv, tag)

    data = json.loads(plaintext)

    counter = int(data.get("counter"))

    if device_id not in counter_dict.keys():
        counter_dict[device_id] = counter

    current_counter = counter_dict[device_id]
    if counter == current_counter+1:
        counter_dict[device_id] = counter
        return plaintext
    else:
        print(f"Counter mismatch for device {device_id}.")
        return None

def encrypt_decrypt_example():
    """ Encryption decryption example using a predfined key and iv. """
    secretKey = binascii.unhexlify("2b7e151628aed2a6abf7977546434e10")
    iv = binascii.unhexlify("000102030405060708090a0b0c0d0e0f")

    message, tag = encrypt_AES_GCM(secretKey, iv, str.encode("HELLO"))
    plaintext = decrypt_AES_GCM(secretKey, message, iv, tag)

    print(list(message))
    print(list(tag))
    print(plaintext)

def run_mqtt_client_example():
    """ MQTT client example to receive and decrypt data. """
    key_storage = {}

    def on_message(client, userdata, msg):
        payload = msg.payload
        plaintext = handle_incoming_data(DATABASE_NAME, payload, key_storage)
        print(plaintext)

    mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqttc.on_connect = on_connect
    mqttc.on_message = on_message

    mqttc.connect("127.0.0.1", 1883, 60)
    mqttc.loop_forever()

if __name__ == "__main__":

    init_db(DATABASE_NAME)
    add_key(DATABASE_NAME, "iyBY5fH", "34:86:5D:FC:30:60", "2b7e151628aed2a6abf7977546434e10")
    add_key(DATABASE_NAME, "H4RKwSde", "08:D1:F9:CB:DE:F4",	"5c0a553b34973a10b4eedd19b857aefd")

    run_mqtt_client_example()
