from paho.mqtt import client as mqtt_client
import time

# Callback when the client connects to the MQTT broker
def on_connectPub(client, userdata, flags, rc):
    # if rc == 0:
    #     print('CONNACK received with code %d.' % (rc))
    #     # Subscribe to the topic when connected
    # else:
    #     print(f"Connection failed with code {rc}")
    pass

def on_connectSub(client, userdata, flags, rc):
    if rc == 0:
    #    print('CONNACK received with code %d.' % (rc))
    #    # Subscribe to the topic when connected
        client.subscribe(subscribe_topic)
    #else:
    #    print(f"Connection failed with code {rc}")     


# Callback when a message is received from the subscribed topic
def on_message(client, userdata, msg):
    print(f"Message received on {msg.topic}: {msg.payload.decode('utf-8')}")

# Function to publish messages
def publish_messages(client, publish_topic):
    n = 0
    while True:
        value = input('Enter the message: ')
        # value = "Hello" + str(n)
        client.publish(publish_topic, value, qos=qos)
        print(f"Published message '{value}' to topic '{publish_topic}'")
        time.sleep(2)
        n += 1

# Create an MQTT client instance
clientPub = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION1, "PythonClientPub")
clientSub = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION1, "PythonClientSub")

# Set the callback functions
clientPub.on_connect = on_connectPub

clientSub.on_connect = on_connectSub
clientSub.on_message = on_message



# Broker configuration
#broker_address = "mqtt.eclipseprojects.io"
broker_address = "broker.hivemq.com"
broker_port = 1883
keepalive = 5
qos = 2

# User input for topics
subscribe_topic = input('Enter the topic to subscribe to: ')
publish_topic = input('Enter the topic to publish to: ')

# Connect to the MQTT broker
clientPub.connect(broker_address, broker_port, keepalive)
clientSub.connect(broker_address, broker_port, keepalive)

# Start the MQTT loop to handle network traffic
clientPub.loop_start()
clientSub.loop_start()

try:
    # Start publishing messages
    publish_messages(clientPub, publish_topic)
    time.sleep(2)


except KeyboardInterrupt:
    print("Interrupted by user, shutting down...")
finally:
    # Stop the loop and disconnect from the broker
    clientPub.loop_stop()
    clientPub.disconnect()
    
    clientSub.loop_stop()
    clientSub.disconnect()  
    print("Disconnected from the MQTT broker")