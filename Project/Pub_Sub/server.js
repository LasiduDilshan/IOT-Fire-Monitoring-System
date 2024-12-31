const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // Serve static files from the 'public' directory

// Store the last 10 values for each measurement
const dataStore = {
  temperature: [],
  humidity: [],
  co: [],
  light: []
};

// Endpoint to receive data from the Python subscriber
app.post('/api/data', (req, res) => {
  const { temperature, humidity, co, light } = req.body;

  // Update the data store
  if (temperature !== undefined) {
    dataStore.temperature.push(temperature);
    if (dataStore.temperature.length > 10) dataStore.temperature.shift();
  }
  if (humidity !== undefined) {
    dataStore.humidity.push(humidity);
    if (dataStore.humidity.length > 10) dataStore.humidity.shift();
  }
  if (co !== undefined) {
    dataStore.co.push(co);
    if (dataStore.co.length > 10) dataStore.co.shift();
  }
  if (light !== undefined) {
    dataStore.light.push(light);
    if (dataStore.light.length > 10) dataStore.light.shift();
  }

  res.status(200).send({ message: 'Data received and stored' });
});

// Endpoint to get the stored data
app.get('/api/data', (req, res) => {
  res.status(200).send(dataStore);
});

// Endpoint to get the current time
app.get('/api/time', (req, res) => {
  const now = new Date();
  const offset = 5 * 60 + 30; // 5 hours 30 minutes
  const localTime = new Date(now.getTime() + offset * 60 * 1000);
  res.status(200).send({ currentTime: localTime.toISOString() });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});

const frontendHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sensor Dashboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .bar {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }
    .bar div {
      background-color: #ddd;
      padding: 10px;
      margin: 0 5px;
      flex: 1;
      text-align: center;
    }
    .speedometer {
      width: 300px;
      height: 150px;
      margin: 20px auto;
      position: relative;
      border: 2px solid #000;
      border-radius: 150px 150px 0 0;
      overflow: hidden;
    }
    .speedometer .gauge-label {
      position: absolute;
      width: 100%;
      text-align: center;
      top: 120px;
      font-weight: bold;
    }
    .speedometer .needle {
      width: 6px;
      height: 100%;
      background: red;
      position: absolute;
      bottom: 0;
      left: 50%;
      transform-origin: bottom;
      transform: rotate(0deg);
      transition: transform 0.5s;
    }
    .charts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .speedometers {
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
    }
    canvas {
      width: 100%;
      max-width: 600px;
    }
    .buttons {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <h1>Sensor Dashboard</h1>
  <div id="currentMeasurements" class="bar">
    <div id="currentTemperature">Temperature: N/A °C</div>
    <div id="currentHumidity">Humidity: N/A %</div>
    <div id="currentCO">CO Levels: N/A ppm</div>
    <div id="currentLight">Light Intensity: N/A lx</div>
  </div>
  <div id="currentTime" class="bar">
    <div>Current Time: <span id="timeDisplay">N/A</span></div>
  </div>
  <div class="speedometers">
    <div class="speedometer">
      <div class="needle" id="coNeedle"></div>
      <div class="gauge-label">CO Level Gauge</div>
    </div>
    <div class="speedometer">
      <div class="needle" id="temperatureNeedle"></div>
      <div class="gauge-label">Temperature Gauge</div>
    </div>
  </div>
  <div class="charts">
    <div class="chart">
      <h2>Temperature (°C)</h2>
      <canvas id="temperatureChart"></canvas>
    </div>
    <div class="chart">
      <h2>Humidity (%)</h2>
      <canvas id="humidityChart"></canvas>
    </div>
    <div class="chart">
      <h2>CO Levels (ppm)</h2>
      <canvas id="coChart"></canvas>
    </div>
    <div class="chart">
      <h2>Light Intensity (lx)</h2>
      <canvas id="lightChart"></canvas>
    </div>
  </div>
  <div class="buttons">
    <button onclick="stopAlarm()">Stop Alarm</button>
    <button onclick="forceStopAlarm()">Force Stop Alarm</button>
    <button>Dummy Button 1</button>
    <button>Dummy Button 2</button>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    let alarmPlaying = false;
    let alarmAudio;

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/data');
        return await response.json();
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
    };

    const fetchTime = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/time');
        const data = await response.json();
        return data.currentTime;
      } catch (error) {
        console.error('Error fetching time:', error);
        return null;
      }
    };

    const updateCharts = async (charts) => {
      const data = await fetchData();
      if (!data) return;

      const latestTemperature = data.temperature[data.temperature.length - 1];
      const latestHumidity = data.humidity[data.humidity.length - 1];
      const latestCO = data.co[data.co.length - 1];
      const latestLight = data.light[data.light.length - 1];

      document.getElementById('currentTemperature').innerText = 'Temperature: ' + (latestTemperature ?? 'N/A') + ' °C';
      document.getElementById('currentHumidity').innerText = 'Humidity: ' + (latestHumidity ?? 'N/A') + ' %';
      document.getElementById('currentCO').innerText = 'CO Levels: ' + (latestCO ?? 'N/A') + ' ppm';
      document.getElementById('currentLight').innerText = 'Light Intensity: ' + (latestLight ?? 'N/A') + ' lx';

      charts.temperature.data.labels = data.temperature.map((_, index) => index + 1);
      charts.temperature.data.datasets[0].data = data.temperature;

      charts.humidity.data.labels = data.humidity.map((_, index) => index + 1);
      charts.humidity.data.datasets[0].data = data.humidity;

      charts.co.data.labels = data.co.map((_, index) => index + 1);
      charts.co.data.datasets[0].data = data.co;

      charts.light.data.labels = data.light.map((_, index) => index + 1);
      charts.light.data.datasets[0].data = data.light;

      charts.temperature.update();
      charts.humidity.update();
      charts.co.update();
      charts.light.update();

      if (latestCO !== undefined) {
        updateSpeedometer('co', latestCO);
      }
      if (latestTemperature !== undefined) {
        updateSpeedometer('temperature', latestTemperature);
      }
    };

    const updateSpeedometer = (type, value) => {
      let needle;
      let degree = 0;
      if (type === 'co') {
        needle = document.getElementById('coNeedle');
        if (value < 600) {
          degree = (value / 600) * 60;
          needle.style.background = 'green';
        } else if (value < 1300) {
          degree = 60 + ((value - 600) / 600) * 60;
          needle.style.background = 'yellow';
        } else {
          degree = 120 + ((value - 1300) / 1800) * 60;
          needle.style.background = 'red';
          playAlert();
        }
      } else if (type === 'temperature') {
        needle = document.getElementById('temperatureNeedle');
        if (value < 20) {
          degree = (value / 20) * 60;
          needle.style.background = 'blue';
        } else if (value < 40) {
          degree = 60 + ((value - 20) / 20) * 60;
          needle.style.background = 'green';
        } else {
          degree = 120 + ((value - 40) / 10) * 60;
          needle.style.background = 'red';
          playAlert();
        }
      }
      needle.style.transform = \`rotate(\${degree}deg)\`;
    };

    const playAlert = () => {
      if (!alarmPlaying) {
        alarmAudio = new Audio('/test.mp3'); // Corrected path to the audio file
        alarmAudio.loop = true;
        alarmAudio.play();
        alarmPlaying = true;
      }
    };

    const stopAlarm = () => {
      const currentTemperature = parseFloat(document.getElementById('currentTemperature').innerText.split(' ')[1]);
      const currentCO = parseFloat(document.getElementById('currentCO').innerText.split(' ')[2]);
      if (currentTemperature < 40 && currentCO < 1300) {
        if (alarmPlaying) {
          alarmAudio.pause();
          alarmPlaying = false;
        }
      }
    };

    const forceStopAlarm = () => {
      if (alarmPlaying) {
        alarmAudio.pause();
        alarmPlaying = false;
      }
    };

    const updateTime = async () => {
      const currentTime = await fetchTime();
      if (currentTime) {
        const localTime = new Date(currentTime);
        document.getElementById('timeDisplay').innerText = localTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo' });
      }
    };

    const initializeCharts = () => {
      const temperatureChart = new Chart(document.getElementById('temperatureChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Temperature', data: [], borderColor: 'red', fill: false }] },
        options: { responsive: true }
      });

      const humidityChart = new Chart(document.getElementById('humidityChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Humidity', data: [], borderColor: 'blue', fill: false }] },
        options: { responsive: true }
      });

      const coChart = new Chart(document.getElementById('coChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'CO Levels', data: [], borderColor: 'green', fill: false }] },
        options: { responsive: true }
      });

      const lightChart = new Chart(document.getElementById('lightChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Light Intensity', data: [], borderColor: 'orange', fill: false }] },
        options: { responsive: true }
      });

      return { temperature: temperatureChart, humidity: humidityChart, co: coChart, light: lightChart };
    };

    const charts = initializeCharts();
    setInterval(() => updateCharts(charts), 3000);
    setInterval(updateTime, 1000);
  </script>
</body>
</html>`;

fs.writeFileSync('./frontend.html', frontendHtml);
console.log('Frontend HTML written to ./frontend.html');