import { Hono } from 'hono';
import { Env } from '../index';
import { DASHBOARD_HTML } from './dashboard-html';

const app = new Hono<{ Bindings: Env }>();

// For now, use the OLD working dashboard on root
app.get('/', async (c) => {
  // Use the old working dashboard HTML but remove navigation since it doesn't exist yet
  let html = DASHBOARD_HTML.replace(
    '<script src="GLTFLoader.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.109.0/examples/js/loaders/GLTFLoader.js"></script>'
  );
  
  html = html.replace(
    "loader.load('models/niclaSenseME.glb',",
    "loader.load('https://raw.githubusercontent.com/arduino/ArduinoAI/main/NiclaSenseME-dashboard/models/niclaSenseME.glb',"
  );
  
  // Add navigation and recording functionality
  html = html.replace(
    '<body>',
    `<body>
    <div style="background:#111;padding:10px;text-align:center;color:#d8f41d;font-size:12px;">
      🔬 Nicla Sensor Suite | 
      <a href="/history" style="color:#d8f41d;margin:0 10px;">History</a> | 
      <a href="/analytics" style="color:#d8f41d;margin:0 10px;">Analytics</a>
    </div>`
  );
  
  // Add recording script before </body>
  const recordingScript = `
  <button id="recordButton" style="display:block;margin:20px auto;padding:10px 20px;background:#888;color:#fff;border:none;border-radius:20px;cursor:pointer;">START RECORDING</button>
  <script>
    let isRecording = false;
    let currentSessionId = null;
    let dataBuffer = [];
    const BUFFER_SIZE = 10;
    
    const recordButton = document.getElementById('recordButton');
    
    recordButton.addEventListener('click', async () => {
      if (isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    });
    
    async function startRecording() {
      const duration = prompt('Enter recording duration in minutes (e.g., 5 for 5 minutes):', '5');
      if (!duration || isNaN(parseInt(duration))) {
        alert('Please enter a valid number of minutes');
        return;
      }
      
      try {
        const response = await fetch('/api/sessions/start', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            name: 'Recording ' + new Date().toLocaleString(),
            duration: parseInt(duration),
            device_name: 'Nicla Sense ME',
            device_id: null
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Session start failed:', response.status, errorText);
          alert('Failed to start recording: ' + errorText);
          return;
        }
        
        const data = await response.json();
        console.log('✅ Session response:', data);
        
        currentSessionId = data.sessionId || data.session?.id;
        
        if (!currentSessionId) {
          console.error('❌ No session ID in response:', data);
          alert('Failed to get session ID');
          return;
        }
        
        isRecording = true;
        
        recordButton.textContent = 'STOP RECORDING';
        recordButton.style.background = '#ff4444';
        
        console.log('✅ Recording started! Session ID:', currentSessionId);
        
        // Wait for handleIncoming to be defined
        setTimeout(() => {
          // Hook into existing handleIncoming
          if (typeof window.handleIncoming === 'function') {
            if (typeof window.originalHandleIncoming === 'undefined') {
              console.log('🔧 Hooking into handleIncoming...');
              window.originalHandleIncoming = window.handleIncoming;
              window.handleIncoming = function(sensor, dataReceived) {
                window.originalHandleIncoming(sensor, dataReceived);
                if (isRecording && currentSessionId) {
                  console.log('📊 Capturing data from sensor:', sensor.uuid);
                  recordSensorData(sensor, dataReceived);
                }
              };
              console.log('✅ Recording hook installed!');
            }
          } else {
            console.error('❌ handleIncoming function not found! Recording will not capture data.');
          }
        }, 1000);
      } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Failed to start recording: ' + error.message);
      }
    }
    
    async function stopRecording() {
      try {
        await flushDataBuffer();
        
        await fetch('/api/sessions/' + currentSessionId + '/stop', {
          method: 'POST'
        });
        
        isRecording = false;
        currentSessionId = null;
        
        recordButton.textContent = 'START RECORDING';
        recordButton.style.background = '#888';
        
        console.log('Recording stopped!');
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    }
    
    function recordSensorData(sensor, dataReceived) {
      console.log('🎯 Recording sensor data...', sensor.uuid);
      
      const reading = {
        session_id: currentSessionId,
        timestamp: new Date().toISOString(),
        sensor_type: sensor.uuid.includes('2001') ? 'temperature' :
                     sensor.uuid.includes('3001') ? 'humidity' :
                     sensor.uuid.includes('4001') ? 'pressure' :
                     sensor.uuid.includes('5001') ? 'accelerometer' :
                     sensor.uuid.includes('6001') ? 'gyroscope' :
                     sensor.uuid.includes('9001') ? 'air_quality' :
                     sensor.uuid.includes('9002') ? 'co2' :
                     sensor.uuid.includes('9003') ? 'gas' : 'unknown'
      };
      
      console.log('📝 Sensor type:', reading.sensor_type);
      
      // Parse the data based on sensor type
      if (reading.sensor_type === 'temperature' || reading.sensor_type === 'pressure' || reading.sensor_type === 'air_quality') {
        reading.value = dataReceived.getFloat32(0, true);
      } else if (reading.sensor_type === 'humidity' || reading.sensor_type === 'gas') {
        reading.value = dataReceived.getUint32(0, true);
      } else if (reading.sensor_type === 'co2') {
        reading.value = dataReceived.getInt32(0, true);
      } else if (reading.sensor_type === 'accelerometer' || reading.sensor_type === 'gyroscope') {
        reading.x = dataReceived.getFloat32(0, true);
        reading.y = dataReceived.getFloat32(4, true);
        reading.z = dataReceived.getFloat32(8, true);
      }
      
      dataBuffer.push(reading);
      console.log('📦 Buffer size:', dataBuffer.length);
      
      if (dataBuffer.length >= BUFFER_SIZE) {
        console.log('🚀 Buffer full, flushing...');
        flushDataBuffer();
      }
    }
    
    async function flushDataBuffer() {
      if (dataBuffer.length === 0) return;
      
      console.log('📤 Flushing', dataBuffer.length, 'readings to server...');
      const batch = [...dataBuffer];
      dataBuffer = [];
      
      try {
        const response = await fetch('/api/sensor-data/batch', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({readings: batch})
        });
        
        if (response.ok) {
          console.log('✅ Sent batch of', batch.length, 'readings');
        } else {
          console.error('❌ Server rejected batch:', response.status, await response.text());
          dataBuffer.unshift(...batch);
        }
      } catch (error) {
        console.error('❌ Failed to send batch:', error);
        dataBuffer.unshift(...batch);
      }
    }
    
    // Flush data before page unload
    window.addEventListener('beforeunload', () => {
      if (isRecording) {
        navigator.sendBeacon('/api/sensor-data/batch', JSON.stringify({readings: dataBuffer}));
      }
    });
  </script>
  `;
  
  html = html.replace('</body>', recordingScript + '</body>');
  
  return c.html(html);
});

// History page - simple for now
app.get('/history', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html>
<head>
  <title>History - Nicla Sensor Suite</title>
  <link href='https://fonts.googleapis.com/css?family=Roboto Mono' rel='stylesheet'>
  <style>
    body {
      font-family: 'Roboto Mono', sans-serif;
      background: #000;
      color: #fff;
      padding: 20px;
    }
    a { color: #d8f41d; text-decoration: none; }
    .session { background: #111; padding: 15px; margin: 10px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:30px;">
    <a href="/">← Back to Dashboard</a>
  </div>
  
  <h1>📊 Session History</h1>
  <div id="sessions">Loading...</div>
  
  <script>
    async function loadSessions() {
      try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        
        console.log('Sessions response:', data);
        
        // API returns paginated data: { sessions: [...], pagination: {...} }
        const sessions = data.sessions || data;
        
        const container = document.getElementById('sessions');
        
        if (!sessions || sessions.length === 0) {
          container.innerHTML = '<p>No sessions recorded yet</p>';
          return;
        }
        
        container.innerHTML = sessions.map(session => 
          '<div class="session">' +
          '<strong>Session #' + session.id + '</strong><br>' +
          'Started: ' + new Date(session.started_at).toLocaleString() + '<br>' +
          'Duration: ' + (session.duration || 'N/A') + ' min<br>' +
          'Status: ' + (session.ended_at ? 'Completed' : 'Active') +
          '</div>'
        ).join('');
        
      } catch (error) {
        console.error('Failed to load sessions:', error);
        document.getElementById('sessions').innerHTML = '<p style="color:#f44;">Error loading sessions</p>';
      }
    }
    
    loadSessions();
  </script>
</body>
</html>
  `);
});

// Analytics page - simple for now
app.get('/analytics', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html>
<head>
  <title>Analytics - Nicla Sensor Suite</title>
  <link href='https://fonts.googleapis.com/css?family=Roboto Mono' rel='stylesheet'>
  <style>
    body {
      font-family: 'Roboto Mono', sans-serif;
      background: #000;
      color: #fff;
      padding: 20px;
    }
    a { color: #d8f41d; text-decoration: none; }
    .stat { background: #111; padding: 20px; margin: 10px; border-radius: 5px; display: inline-block; min-width: 200px; }
    .stat-value { font-size: 32px; color: #d8f41d; font-weight: bold; }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:30px;">
    <a href="/">← Back to Dashboard</a>
  </div>
  
  <h1>📈 Analytics</h1>
  <div id="stats">Loading...</div>
  <div id="sensors" style="margin-top:30px;"></div>
  
  <script>
    async function loadAnalytics() {
      try {
        const response = await fetch('/api/analytics/summary');
        const summary = await response.json();
        
        console.log('📈 Analytics summary:', summary);
        
        document.getElementById('stats').innerHTML = 
          '<div class="stat"><div class="stat-value">' + (summary.total_sessions || 0) + '</div>Total Sessions</div>' +
          '<div class="stat"><div class="stat-value">' + (summary.total_readings || 0) + '</div>Total Readings</div>' +
          '<div class="stat"><div class="stat-value">' + (summary.avg_duration_minutes?.toFixed(1) || '0') + '</div>Avg Duration (min)</div>' +
          '<div class="stat"><div class="stat-value">' + (summary.active_sessions || 0) + '</div>Active Sessions</div>';
        
        console.log('📊 Sensor averages:', summary.sensor_averages);
        
        if (summary.sensor_averages && summary.sensor_averages.length > 0) {
          document.getElementById('sensors').innerHTML = '<h2>Sensor Averages</h2>' +
            summary.sensor_averages.map(sensor =>
              '<div class="stat">' +
              '<h3>' + sensor.sensor_type + '</h3>' +
              'Avg: ' + (sensor.avg_value?.toFixed(2) || '-') + '<br>' +
              'Min: ' + (sensor.min_value?.toFixed(2) || '-') + '<br>' +
              'Max: ' + (sensor.max_value?.toFixed(2) || '-') + '<br>' +
              'Count: ' + (sensor.reading_count || 0) +
              '</div>'
            ).join('');
        } else {
          console.warn('⚠️ No sensor averages found');
          document.getElementById('sensors').innerHTML = '<p>No sensor data yet. Check console for details.</p>';
        }
        
      } catch (error) {
        console.error('Failed to load analytics:', error);
        document.getElementById('stats').innerHTML = '<p style="color:#f44;">Error loading analytics</p>';
      }
    }
    
    loadAnalytics();
  </script>
</body>
</html>
  `);
});

export default app;
