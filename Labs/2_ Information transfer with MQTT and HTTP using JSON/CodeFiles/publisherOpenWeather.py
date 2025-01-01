from paho.mqtt import client as mqtt_client
import paho.mqtt.client as mqtt
import time
import json

import requests

# Callback when the client connects to the MQTT broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker\n")
    else:
        print("Connection failed with code {rc}")


# Replace 'your_api_key' with the API key you obtained
api_key = '708e2a65bc02731d8b033cb105a5382c'
base_url = 'http://api.openweathermap.org/data/2.5/weather'

# User input
#city = "Gampaha"
#country = "Sri Lanka"

city = input("Enter the city: ")
country = input("Enter the country: ")

# Construct the full URL
url = f"{base_url}?q={city},{country}&appid={api_key}&units=metric"

# Make the HTTP request
response = requests.get(url)
data_out = response.json()
data_out = json.dumps(data_out)
print(data_out)
print(type(data_out))

# Create an MQTT client instance
client = mqtt.Client(mqtt_client.CallbackAPIVersion.VERSION1,"PythonPub")

# Set the callback function
client.on_connect = on_connect

broker_address = "mqtt.eclipseprojects.io"  # broker's address
broker_port = 1883
keepalive = 5
qos = 0
publish_topic = "JACK1234"

# Connect to the MQTT broker
client.connect(broker_address, broker_port, keepalive)

# Start the MQTT loop to handle network traffic
client.loop_start()

# Publish loop
n=0
try:
    while True:
        # Publish a message to the send topic
        
        #value = input('Enter the message: ')
        #value = "Hellow" + str(n)
        value = data_out
        client.publish(publish_topic,value)
        print(f"Published message '{value}' to topic '{publish_topic}'\n")
        
        # Wait for a moment to simulate some client activity
        time.sleep(2)
        n+=1

except KeyboardInterrupt:
    # Disconnect from the MQTT broker
    pass
client.loop_stop()
client.disconnect()

print("Disconnected from the MQTT broker")
