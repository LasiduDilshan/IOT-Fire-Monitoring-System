import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemText, CssBaseline, AppBar, Toolbar, Typography, Container, Grid, Card, CardContent, LinearProgress, Alert, AlertTitle, Button, Paper, Box, Switch } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import GaugeChart from 'react-gauge-chart';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const App = () => {
  const [data, setData] = useState({});
  const [currentTime, setCurrentTime] = useState('');
  const [gaugeValues, setGaugeValues] = useState({
    temperature: 0,
    humidity: 0,
    co: 0,
    light: 0,
  });
  const [recentValues, setRecentValues] = useState({
    temperature: [],
    humidity: [],
    co: [],
    light: [],
  });
  const [detectionReason, setDetectionReason] = useState('No fire');
  const [forceStopped, setForceStopped] = useState(false);
  const [stopPressed, setStopPressed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const alarmRef = useRef(null);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/data');
        setData(response.data);
        setGaugeValues((prevValues) => ({
          temperature: response.data.temperature / 60,
          humidity: response.data.humidity / 100,
          co: response.data.co / 2000,
          light: response.data.light / 8000,
        }));
        setRecentValues((prevValues) => ({
          temperature: [...prevValues.temperature.slice(-9), response.data.temperature],
          humidity: [...prevValues.humidity.slice(-9), response.data.humidity],
          co: [...prevValues.co.slice(-9), response.data.co],
          light: [...prevValues.light.slice(-9), response.data.light],
        }));

        if (!forceStopped && !stopPressed) {
          let newDetectionReason = 'No fire';
          if (response.data.temperature > 40 && response.data.co > 1000) {
            newDetectionReason = 'CO and Heat detection';
          } else if (response.data.temperature > 40) {
            newDetectionReason = 'Heat detection';
          } else if (response.data.co > 1000) {
            newDetectionReason = 'CO detection';
          }

          if (newDetectionReason !== 'No fire' && newDetectionReason !== detectionReason) {
            if (alarmRef.current) {
              alarmRef.current.play();
              alarmRef.current.loop = true;
            }
          }

          setDetectionReason(newDetectionReason);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, [detectionReason, forceStopped, stopPressed]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
      setCurrentTime(now);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const handleStopDetection = () => {
    setStopPressed(true);
    if (data.temperature <= 40 && data.co <= 1000) {
      setDetectionReason('No fire');
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current.currentTime = 0;
      }
    }
  };

  const handleForceStop = () => {
    setForceStopped(true);
    setDetectionReason('Force Stopped');
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  };

  const handleNormalMode = () => {
    setForceStopped(false);
    setStopPressed(false);
  };

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const handleSendWhatsApp = () => {
    const phoneNumber = '+94750461152'; // Replace with the phone number to send the WhatsApp message to

    axios.post('http://localhost:3000/api/send-whatsapp', { to: phoneNumber })
      .then((response) => {
        console.log('WhatsApp message sent successfully:', response.data);
      })
      .catch((error) => {
        console.error('Error sending WhatsApp message:', error);
      });
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
      },
    },
  };

  const generateChartData = (label, data) => ({
    labels: Array.from({ length: data.length }, (_, i) => i + 1),
    datasets: [
      {
        label: label,
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <audio id="alarm-audio" src="/alarm.wav" preload="auto" ref={alarmRef} />
      <Router>
        <AppBar position="fixed">
          <Toolbar>
            <Typography variant="h6" noWrap style={{ flexGrow: 1 }}>
              Fire Monitoring System
            </Typography>
            <Switch checked={darkMode} onChange={toggleDarkMode} />
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <List>
            <ListItem button component={Link} to="/">
              <ListItemText primary="Control" />
            </ListItem>
            <ListItem button component={Link} to="/measurement">
              <ListItemText primary="Measurement" />
            </ListItem>
            <ListItem button component={Link} to="/gauges">
              <ListItemText primary="Gauges" />
            </ListItem>
            <ListItem button component={Link} to="/charts">
              <ListItemText primary="Charts" />
            </ListItem>
          </List>
        </Drawer>
        <main style={{ marginLeft: 240, padding: '20px', flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                style={{ marginTop: '80px' }}
              >
                <Container maxWidth="md">
                  <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
                    <Typography variant="h4" align="center">
                      Fire Monitoring System
                    </Typography>
                  </Paper>
                  <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={12}>
                      <Alert severity={detectionReason === 'No fire' ? 'success' : detectionReason === 'Force Stopped' ? 'warning' : 'error'}>
                        <AlertTitle>{detectionReason}</AlertTitle>
                      </Alert>
                    </Grid>
                  </Grid>
                  <Grid container spacing={3} justifyContent="center" style={{ marginTop: '20px' }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button variant="contained" color="secondary" onClick={handleStopDetection} fullWidth>
                        Stop Warning
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button variant="contained" color="secondary" onClick={handleForceStop} fullWidth>
                        Forced Stop
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button variant="contained" color="secondary" onClick={handleNormalMode} fullWidth>
                        Normal Mode
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button variant="contained" color="secondary" onClick={handleSendWhatsApp} fullWidth>
                        Send Message
                      </Button>
                    </Grid>
                  </Grid>
                </Container>
              </Box>
            } />
            <Route path="/measurement" element={
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                style={{ marginTop: '80px' }}
              >
                <Container maxWidth="md">
                  <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
                    <Typography variant="h4" align="center">
                      Fire Monitoring System
                    </Typography>
                  </Paper>
                  <Grid container spacing={3} justifyContent="center" style={{ marginTop: '20px' }}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="left">Temperature (°C)</Typography>
                          <LinearProgress variant="determinate" value={data.temperature ? (data.temperature / 60) * 100 : 0} />
                          <Typography variant="h6" align="right">{data.temperature} °C</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="left">Humidity (%)</Typography>
                          <LinearProgress variant="determinate" value={data.humidity ? (data.humidity / 100) * 100 : 0} />
                          <Typography variant="h6" align="right">{data.humidity} %</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="left">CO (ppm)</Typography>
                          <LinearProgress variant="determinate" value={data.co ? (data.co / 2000) * 100 : 0} />
                          <Typography variant="h6" align="right">{data.co} ppm</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="left">Light (lux)</Typography>
                          <LinearProgress variant="determinate" value={data.light ? (data.light / 8000) * 100 : 0} />
                          <Typography variant="h6" align="right">{data.light} lux</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  <Grid container spacing={3} justifyContent="center" style={{ marginTop: '20px' }}>
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">Current Time (Sri Lanka)</Typography>
                          <Typography variant="h5" align="center">{currentTime}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Container>
              </Box>
            } />
            <Route path="/gauges" element={
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                style={{ marginTop: '80px' }}
              >
                <Container maxWidth="md">
                  <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
                    <Typography variant="h4" align="center">
                      Fire Monitoring System
                    </Typography>
                  </Paper>
                  <Grid container spacing={3} justifyContent="center" style={{ marginTop: '20px' }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">Temperature (°C)</Typography>
                          <GaugeChart 
                            id="gauge-chart1" 
                            percent={gaugeValues.temperature} 
                            nrOfLevels={30} // Number of segments in the gauge
                            arcsLength={[0.33, 0.34, 0.33]} // Segment lengths
                            colors={['#00FF00', '#FFBF00', '#FF0000']} // Colors for each segment
                            arcPadding={0.02} // Padding between segments
                            formatTextValue={() => `${data.temperature}°C`} // Format the text value displayed in the center
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">Humidity (%)</Typography>
                          <GaugeChart 
                            id="gauge-chart2" 
                            percent={gaugeValues.humidity} 
                            nrOfLevels={30} 
                            arcsLength={[0.33, 0.34, 0.33]} 
                            colors={['#00FF00', '#FFBF00', '#FF0000']} 
                            arcPadding={0.02} 
                            formatTextValue={() => `${data.humidity}%`} 
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">CO (ppm)</Typography>
                          <GaugeChart 
                            id="gauge-chart3" 
                            percent={gaugeValues.co} 
                            nrOfLevels={30} 
                            arcsLength={[0.33, 0.34, 0.33]} 
                            colors={['#00FF00', '#FFBF00', '#FF0000']} 
                            arcPadding={0.02} 
                            formatTextValue={() => `${data.co} ppm`} 
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">Light (lux)</Typography>
                          <GaugeChart 
                            id="gauge-chart4" 
                            percent={gaugeValues.light} 
                            nrOfLevels={30} 
                            arcsLength={[0.33, 0.34, 0.33]} 
                            colors={['#00FF00', '#FFBF00', '#FF0000']} 
                            arcPadding={0.02} 
                            formatTextValue={() => `${data.light} lux`} 
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Container>
              </Box>
            } />
            <Route path="/charts" element={
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                style={{ marginTop: '80px' }}
              >
                <Container maxWidth="md">
                  <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
                    <Typography variant="h4" align="center">
                      Fire Monitoring System
                    </Typography>
                  </Paper>
                  <Grid container spacing={3} justifyContent="center" style={{ marginTop: '20px' }}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">Recent Temperature (°C)</Typography>
                          <Line options={chartOptions} data={generateChartData('Temperature (°C)', recentValues.temperature)} />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">Recent Humidity (%)</Typography>
                          <Line options={chartOptions} data={generateChartData('Humidity (%)', recentValues.humidity)} />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">Recent CO (ppm)</Typography>
                          <Line options={chartOptions} data={generateChartData('CO (ppm)', recentValues.co)} />
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" align="center">Recent Light (lux)</Typography>
                          <Line options={chartOptions} data={generateChartData('Light (lux)', recentValues.light)} />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Container>
              </Box>
            } />
          </Routes>
        </main>
      </Router>
    </ThemeProvider>
  );
};

export default App;