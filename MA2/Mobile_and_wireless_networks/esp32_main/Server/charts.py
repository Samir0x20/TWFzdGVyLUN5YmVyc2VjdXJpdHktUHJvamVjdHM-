import paho.mqtt.client as mqtt
import matplotlib.pyplot as plt
import json
import datetime, time
from matplotlib.animation import FuncAnimation
from collections import deque, defaultdict

from crypto import handle_incoming_data, init_db, add_key


BROKER_ADDRESS = "127.0.0.1"
BROKER_PORT = 1883
MQTT_TOPIC = "sensor/data"
MAX_DATA_POINTS = 100
DATABASE_NAME = "data.db"

key_storage = {}

data_storage = defaultdict(lambda: {
    "temperature": deque(maxlen=MAX_DATA_POINTS),
    "humidity": deque(maxlen=MAX_DATA_POINTS),
    "timestamps": deque(maxlen=MAX_DATA_POINTS)
})

def log_data(log_file_handle, ip_address, temperature, humidity, timestamp):
    """
    Logs the incoming sensor data to a file.

    Parameters:
    - ip_address (str): IP address of the ESP32.
    - temperature (float): Temperature value.
    - humidity (float): Humidity value.
    - timestamp (str): Timestamp of the data reception.
    """
    log_file_handle.write(f"{timestamp}, {ip_address}, {temperature}, {humidity}\n")

def on_connect(client, userdata, flags, rc):
    """
    Callback when the client connects to the MQTT broker.

    Parameters:
    - client: The MQTT client instance.
    - userdata: The private user data.
    - flags: Response flags sent by the broker.
    - rc: The connection result.
    """
    if rc == 0:
        print("Connected to MQTT Broker successfully.")
        client.subscribe(MQTT_TOPIC)
        print(f"Subscribed to topic: {MQTT_TOPIC}")
    else:
        print(f"Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    """
    Callback when a PUBLISH message is received from the MQTT broker.

    Parameters:
    - client: The MQTT client instance.
    - userdata: The private user data.
    - msg: An instance of MQTTMessage.
    """
    try:
        payload = msg.payload

        plaintext = handle_incoming_data(DATABASE_NAME, payload, key_storage)

        if plaintext is None:
            print("Invalid data received.")
            return
        
        print(plaintext)
        data = json.loads(plaintext)

        # Extract data based on provided structure
        ip_address = data.get("ip_address")
        temperature = data.get("temperature")
        humidity = data.get("humidity")

        # Use current time as timestamp since it's not provided in the data
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if temperature is not None and humidity is not None:
            data_storage[ip_address]["temperature"].append(temperature)
            data_storage[ip_address]["humidity"].append(humidity)
            data_storage[ip_address]["timestamps"].append(timestamp)

            log_data(log_file_handle, ip_address, temperature, humidity, timestamp)

            print(f"Received data - IP: {ip_address}, Temp: {temperature}°C, Humidity: {humidity}% at {timestamp}")
        else:
            print("Incomplete data received.")

    except json.JSONDecodeError:
        print("Received invalid JSON data.")
    except Exception as e:
        print(f"Error processing message: {e}")

def init_plot():
    """
    Initializes the plot lines.
    """
    for ipAddress in data_storage.keys():
        lines_temp[ipAddress], = ax_temp.plot([], [], label=f'{ipAddress} Temperature (°C)')
        lines_hum[ipAddress], = ax_hum.plot([], [], label=f'{ipAddress} Humidity (%)')
    return list(lines_temp.values()) + list(lines_hum.values())

def update_plot(frame):
    """
    Updates the plot with new data.

    Parameters:
    - frame: The current frame number (unused).
    """

    for ip, data in data_storage.items():
        if ip not in lines_temp:
            lines_temp[ip], = ax_temp.plot([], [], label=f'{ip} Temperature (°C)')
            lines_hum[ip], = ax_hum.plot([], [], label=f'{ip} Humidity (%)')
            
        x = [i for i in range(len(data["temperature"]))]
        lines_temp[ip].set_data(x, list(data["temperature"]))
        lines_hum[ip].set_data(x, list(data["humidity"]))

    # Update x-axis limits if necessary
    if len(x) < MAX_DATA_POINTS:
        ax_temp.set_xlim(0, MAX_DATA_POINTS)
        ax_hum.set_xlim(0, MAX_DATA_POINTS)
    else:
        ax_temp.set_xlim(len(x) - MAX_DATA_POINTS, len(x))
        ax_hum.set_xlim(len(x) - MAX_DATA_POINTS, len(x))

    

    ax_temp.legend(loc='upper left')
    ax_hum.legend(loc='upper left')

    return list(lines_temp.values()) + list(lines_hum.values())


if __name__ == "__main__":

    global log_file_handle

    log_file_handle = open("sensor_data.log", "a")
    # Database initialization
    init_db(DATABASE_NAME)
    add_key(DATABASE_NAME, "iyBY5fHf", "34:86:5D:FC:30:60", "2b7e151628aed2a6abf7977546434e10")
    add_key(DATABASE_NAME, "H4RKwSde",	"08:D1:F9:CB:DE:F4", "5c0a553b34973a10b4eedd19b857aefd")

    # MQTT initialization
    client = mqtt.Client()

    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(BROKER_ADDRESS, BROKER_PORT, keepalive=60)
    except Exception as e:
        print(f"Unable to connect to MQTT Broker: {e}")
        exit(1)

    client.loop_start()

    # Synchronisation
    time.sleep(3)

    # Initialize the plot
    fig, (ax_temp, ax_hum) = plt.subplots(2, 1, figsize=(12, 8))

    # Temperature plot
    ax_temp.set_title("Real-Time Temperature")
    ax_temp.set_xlabel("Data Points")
    ax_temp.set_ylabel("Temperature (°C)")
    ax_temp.set_xlim(0, MAX_DATA_POINTS)
    ax_temp.set_ylim(0, 30)  # Adjust based on expected temperature range
    ax_temp.legend(loc='upper left')
    ax_temp.grid(True)

    # Humidity plot
    ax_hum.set_title("Real-Time Humidity")
    ax_hum.set_xlabel("Data Points")
    ax_hum.set_ylabel("Humidity (%)")
    ax_hum.set_xlim(0, MAX_DATA_POINTS)
    ax_hum.set_ylim(0, 100)  # Humidity ranges from 0 to 100%
    ax_hum.legend(loc='upper left')
    ax_hum.grid(True)

    plt.tight_layout()

    lines_temp = {}
    lines_hum = {}

    # Create the animation
    ani = FuncAnimation(fig, update_plot, init_func=init_plot, interval=500, blit=False)

    # Display the plot
    try:
        plt.show()
    except KeyboardInterrupt:
        print("Plotting stopped by user.")
        log_file_handle.close()
    finally:
        client.loop_stop()
        client.disconnect()
        print("Disconnected from MQTT Broker.")
