const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mqtt = require('mqtt'); // MQTT library for Node.js
const twilio = require('twilio');

const app = express();
const PORT = 3000;

// Twilio configuration
const accountSid = 'Replace with your Twilio Account SID'; // Replace with your Twilio Account SID
const authToken = 'Replace with your Twilio Auth Token'; // Replace with your Twilio Auth Token
const client = new twilio(accountSid, authToken);

// MQTT configuration
const brokerAddress = 'mqtt.eclipseprojects.io';
const topic = 'Replace with your MQTT topic'; // Replace with your MQTT topic
let sensorData = {};

// Express middlewares
app.use(cors());
app.use(bodyParser.json());

// API route to get the latest sensor data
app.get('/api/data', (req, res) => {
  res.json(sensorData);
});

// API route to send WhatsApp message
app.post('/api/send-whatsapp', (req, res) => {
  const { to } = req.body;

  client.messages
    .create({
      body: '🚨🔥 Fire Alert: A fire has been reported! Please evacuate immediately and stay safe! 🔥🚨',
      from: 'whatsapp:Enter_Twilio_WhatsApp_Number', // This is Twilio's sandbox number for WhatsApp
      to: `whatsapp:${to}`,
    })
    .then((message) => {
      console.log(`Message sent: ${message.sid}`);
      res.status(200).send({ success: true });
    })
    .catch((error) => {
      console.error('Error sending WhatsApp message:', error);
      res.status(500).send({ success: false, error: error.message });
    });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Connect to the MQTT broker
const clientMQTT = mqtt.connect(`mqtt://${brokerAddress}`);

// MQTT event: On connection
clientMQTT.on('connect', () => {
  console.log('Connected to MQTT broker');
  clientMQTT.subscribe(topic, (err) => {
    if (err) {
      console.error('Failed to subscribe to topic:', topic, err);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });
});

// MQTT event: On receiving a message
clientMQTT.on('message', (receivedTopic, message) => {
  if (receivedTopic === topic) {
    try {
      sensorData = JSON.parse(message.toString());
      console.log('Received data:', sensorData);
    } catch (err) {
      console.error('Error parsing MQTT message:', err);
    }
  }
});