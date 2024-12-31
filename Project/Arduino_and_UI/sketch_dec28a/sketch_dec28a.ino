#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <WiFi.h>
#include <PubSubClient.h>

#define DHTPIN 5 // Pin connected to the DHT11 data pin
#define DHTTYPE DHT11 // DHT 11

DHT dht(DHTPIN, DHTTYPE);

const int mq7Pin = 35; // Pin connected to the MQ-7 analog output
const int ldrPin = 34; // Pin connected to the LDR analog output

// WiFi settings
const char* ssid = "DESKTOP-6QV9NTA 2050";
const char* password = "770X|d94";

// MQTT settings
const char* mqtt_server = "mqtt.eclipseprojects.io";
const char* publish_topic = "JACK1234";

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(mq7Pin, INPUT);
  pinMode(ldrPin, INPUT);

  setup_wifi();
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Reading temperature and humidity from DHT11
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Reading CO level from MQ-7
  int coValue = analogRead(mq7Pin);

  // Reading light intensity from LDR
  int lightIntensity = analogRead(ldrPin);

  // Check if any reads failed and exit early (to try again).
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
  } else {
    // Create JSON object with sensor data
    char msg[100];
    snprintf(msg, 100, "{\"temperature\":%.1f,\"humidity\":%.1f,\"co\":%d,\"light\":%d}", temperature, humidity, coValue, lightIntensity);

    // Publish the message
    Serial.print("Publishing message: ");
    Serial.println(msg);
    client.publish(publish_topic, msg);
  }

  // Wait 3 seconds before next read
  delay(3000);
}