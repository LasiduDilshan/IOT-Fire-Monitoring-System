# Need to send the jason object throught the mqtt and receive it at the other end

from paho.mqtt import client as mqtt_client
import paho.mqtt.client as mqtt
import time
import json

sensor_out = {}

write_file_name = "C:\\Users\\HP\Desktop\\_Sem 5\\5_Internet of Things\\3_LAB\\LabExercise_2\\code\\sensor_received.json"

# Callback when the client connects to the MQTT broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
        client.subscribe("JACK1234")  # Subscribe to the receive topic
    else:
        print("Connection failed with code {rc}")

# Callback when a message is received from the subscribed topic
def on_message(client, userdata, msg):
    print ("Message received on JACK1234"  + str(msg))
    global sensor_out
    sensor_out = json.loads(msg.payload.decode("utf-8"))

# Create an MQTT client instance
client = mqtt.Client(mqtt_client.CallbackAPIVersion.VERSION1,"PythonSub")

# Set the callback functions
client.on_connect = on_connect
client.on_message = on_message

# Connect to the MQTT broker
broker_address = "mqtt.eclipseprojects.io"  # broker's address
broker_port = 1883
keepalive = 5
qos = 0

# subscribe_topic = input ('Enter the topic to subscribe to: ')
client.connect(broker_address, broker_port, keepalive)

# Start the MQTT loop to handle network traffic
client.loop_start()

# Subscribe loop

try:
    while True:
        time.sleep(1)
        print(sensor_out)
        sensor_in=json.loads(str(sensor_out).replace("'", "\""))
        with open(write_file_name, 'w') as json_file:
            json.dump(sensor_in, json_file, indent=4)  # The 'indent' parameter adds pretty formatting
        print("Data has been written to", write_file_name)

except KeyboardInterrupt:
    # Disconnect from the MQTT broker
    pass
client.loop_stop()
client.disconnect()

print("Disconnected from the MQTT broker")