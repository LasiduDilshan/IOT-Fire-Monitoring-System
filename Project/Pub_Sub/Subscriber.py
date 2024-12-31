from paho.mqtt import client as mqtt_client
import json
import time
import requests

sensor_out = {}

# Callback when the client connects to the MQTT broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
        client.subscribe("JACK1234")  # Subscribe to the receive topic
    else:
        print(f"Connection failed with code {rc}")

# Callback when a message is received from the subscribed topic
def on_message(client, userdata, msg):
    print("Message received on JACK1234: " + msg.topic + " " + str(msg.payload))
    global sensor_out
    sensor_out = json.loads(msg.payload.decode("utf-8"))
    print(sensor_out)
    
    # Send data to the Node.js backend
    try:
        response = requests.post("http://localhost:3000/api/data", json=sensor_out)
        print(f"Data sent to backend, response status code: {response.status_code}")
    except Exception as e:
        print(f"Failed to send data to backend: {e}")

# Create an MQTT client instance
client = mqtt_client.Client(client_id="PythonSub")

# Set the callback functions
client.on_connect = on_connect
client.on_message = on_message

# Connect to the MQTT broker
broker_address = "mqtt.eclipseprojects.io"  # broker's address
broker_port = 1883
client.connect(broker_address, broker_port, keepalive=5)

# Start the MQTT loop to handle network traffic
client.loop_start()

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    pass

client.loop_stop()
client.disconnect()

print("Disconnected from the MQTT broker")