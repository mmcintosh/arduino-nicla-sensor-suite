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
      
      // Determine sensor type from UUID
      const uuid = sensor.uuid;
      const reading = {
        session_id: currentSessionId,
        timestamp: Date.now()
      };
      
      // Map UUIDs to proper field names and parse data accordingly
      if (uuid.includes('2001')) {
        // Temperature
        reading.temperature = dataReceived.getFloat32(0, true);
        console.log('📝 Temperature:', reading.temperature);
      } else if (uuid.includes('3001')) {
        // Humidity
        reading.humidity = dataReceived.getUint8(0);
        console.log('📝 Humidity:', reading.humidity);
      } else if (uuid.includes('4001')) {
        // Pressure
        reading.pressure = dataReceived.getFloat32(0, true);
        console.log('📝 Pressure:', reading.pressure);
      } else if (uuid.includes('5001')) {
        // Accelerometer
        reading.accelerometer = {
          x: dataReceived.getFloat32(0, true),
          y: dataReceived.getFloat32(4, true),
          z: dataReceived.getFloat32(8, true)
        };
        console.log('📝 Accelerometer:', reading.accelerometer);
      } else if (uuid.includes('6001')) {
        // Gyroscope
        reading.gyroscope = {
          x: dataReceived.getFloat32(0, true),
          y: dataReceived.getFloat32(4, true),
          z: dataReceived.getFloat32(8, true)
        };
        console.log('📝 Gyroscope:', reading.gyroscope);
      } else if (uuid.includes('7001')) {
        // Quaternion
        reading.quaternion = {
          x: dataReceived.getFloat32(0, true),
          y: dataReceived.getFloat32(4, true),
          z: dataReceived.getFloat32(8, true),
          w: dataReceived.getFloat32(12, true)
        };
        console.log('📝 Quaternion:', reading.quaternion);
      } else if (uuid.includes('9001')) {
        // BSEC (Air Quality)
        reading.bsec = dataReceived.getFloat32(0, true);
        console.log('📝 Air Quality:', reading.bsec);
      } else if (uuid.includes('9002')) {
        // CO2
        reading.co2 = dataReceived.getInt32(0, true);
        console.log('📝 CO2:', reading.co2);
      } else if (uuid.includes('9003')) {
        // Gas
        reading.gas = dataReceived.getUint32(0, true);
        console.log('📝 Gas:', reading.gas);
      } else {
        console.warn('⚠️ Unknown sensor UUID:', uuid);
        return; // Don't save unknown sensors
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

// History page - with view and export
app.get('/history', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html>
<head>
  <title>History - Nicla Sensor Suite</title>
  <link href='https://fonts.googleapis.com/css?family=Roboto Mono' rel='stylesheet'>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    body {
      font-family: 'Roboto Mono', sans-serif;
      background: #000;
      color: #fff;
      padding: 20px;
    }
    a { color: #d8f41d; text-decoration: none; }
    .session { 
      background: #111; 
      padding: 15px; 
      margin: 10px 0; 
      border-radius: 5px;
      border: 1px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .session:hover { border-color: #d8f41d; }
    .session-info h3 { margin: 0 0 10px 0; color: #d8f41d; }
    .session-meta { font-size: 12px; color: #888; }
    .session-actions { display: flex; gap: 10px; }
    .btn {
      background: #d8f41d;
      color: #000;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      text-decoration: none;
      display: inline-block;
    }
    .btn:hover { background: #c5db1a; }
    .btn-secondary {
      background: #444;
      color: #fff;
    }
    .btn-secondary:hover { background: #555; }
    .btn-danger {
      background: #ff4444;
      color: #fff;
    }
    .btn-danger:hover { background: #ff5555; }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 1000;
      overflow-y: auto;
    }
    .modal-content {
      background: #111;
      border: 1px solid #444;
      border-radius: 8px;
      margin: 50px auto;
      max-width: 900px;
      padding: 20px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .modal-header h2 { margin: 0; color: #d8f41d; }
    .close-btn {
      background: #ff4444;
      color: #fff;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .chart-container { margin: 20px 0; height: 300px; }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:30px;">
    <a href="/">← Back to Dashboard</a>
  </div>
  
  <h1>📊 Session History</h1>
  <div id="sessions">Loading...</div>
  
  <!-- Session Detail Modal -->
  <div id="detailModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle">Session Details</h2>
        <button id="closeModal" class="close-btn">✖</button>
      </div>
      <div id="modalBody">
        <!-- Dynamically loaded content -->
      </div>
    </div>
  </div>
  
  <script>
    async function loadSessions() {
      try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        
        console.log('Sessions response:', data);
        
        const sessions = data.sessions || data;
        const container = document.getElementById('sessions');
        
        if (!sessions || sessions.length === 0) {
          container.innerHTML = '<p>No sessions recorded yet</p>';
          return;
        }
        
        container.innerHTML = sessions.map(session => 
          '<div class="session">' +
          '<div class="session-info">' +
          '<h3>' + (session.name || 'Session #' + session.id) + '</h3>' +
          '<div class="session-meta">' +
          'Started: ' + new Date(session.started_at).toLocaleString() + ' | ' +
          'Duration: ' + (session.duration || 'N/A') + ' min | ' +
          'Status: ' + (session.ended_at ? 'Completed' : 'Active') +
          '</div>' +
          '</div>' +
          '<div class="session-actions">' +
          '<button class="btn" onclick="viewSession(\\'' + session.id + '\\')">👁 View</button>' +
          '<button class="btn btn-secondary" onclick="exportSession(\\'' + session.id + '\\')">📥 Export</button>' +
          '</div>' +
          '</div>'
        ).join('');
        
      } catch (error) {
        console.error('Failed to load sessions:', error);
        document.getElementById('sessions').innerHTML = '<p style="color:#f44;">Error loading sessions</p>';
      }
    }
    
    async function viewSession(sessionId) {
      const modal = document.getElementById('detailModal');
      const modalBody = document.getElementById('modalBody');
      const modalTitle = document.getElementById('modalTitle');
      
      modal.style.display = 'block';
      modalBody.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">Loading session data...</div>';

      try {
        const response = await fetch('/api/analytics/sessions/' + sessionId);
        const data = await response.json();
        
        console.log('📊 Session data:', data);
        
        modalTitle.textContent = data.session_name || 'Session #' + sessionId;
        
        const stats = data.statistics || {};
        
        let html = 
          '<div>' +
          '<p><strong>Session ID:</strong> ' + sessionId + '</p>' +
          '<p><strong>Duration:</strong> ' + ((data.duration_ms || 0) / 60000).toFixed(1) + ' minutes</p>' +
          '<hr style="border-color:#333;margin:20px 0;">' +
          '<h3 style="color:#d8f41d;">Sensor Statistics</h3>';
        
        // Show all available stats
        const sensors = [
          { key: 'temperature', label: 'Temperature (°C)', color: '#ff6b6b' },
          { key: 'humidity', label: 'Humidity (%)', color: '#4ecdc4' },
          { key: 'pressure', label: 'Pressure (kPa)', color: '#45b7d1' },
          { key: 'bsec', label: 'Air Quality', color: '#96ceb4' },
          { key: 'co2', label: 'CO2 (ppm)', color: '#ffeaa7' },
          { key: 'gas', label: 'Gas', color: '#dfe6e9' }
        ];
        
        let chartCount = 0;
        sensors.forEach(sensor => {
          if (stats[sensor.key] && stats[sensor.key].count > 0) {
            const s = stats[sensor.key];
            html += 
              '<div style="background:#1a1a1a;padding:15px;margin:10px 0;border-radius:5px;">' +
              '<h4 style="margin:0 0 10px 0;color:#d8f41d;">' + sensor.label + '</h4>' +
              '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;font-size:14px;">' +
              '<div><strong>Count:</strong> ' + s.count + '</div>' +
              '<div><strong>Min:</strong> ' + s.min.toFixed(2) + '</div>' +
              '<div><strong>Avg:</strong> ' + s.avg.toFixed(2) + '</div>' +
              '<div><strong>Max:</strong> ' + s.max.toFixed(2) + '</div>' +
              '</div>' +
              '<div class="chart-container" id="chart' + chartCount + '"></div>' +
              '</div>';
            chartCount++;
          }
        });
        
        // Motion sensors
        if (stats.motion) {
          html += 
            '<div style="background:#1a1a1a;padding:15px;margin:10px 0;border-radius:5px;">' +
            '<h4 style="margin:0 0 10px 0;color:#d8f41d;">Motion Sensors</h4>' +
            '<p><strong>Accelerometer readings:</strong> ' + (stats.motion.accel_count || 0) + '</p>' +
            '<p><strong>Gyroscope readings:</strong> ' + (stats.motion.gyro_count || 0) + '</p>' +
            '</div>';
        }
        
        if (chartCount === 0) {
          html += '<p style="color:#888;">No sensor data available for this session.</p>';
        }
        
        html += '</div>';
        modalBody.innerHTML = html;
        
        // Create charts
        chartCount = 0;
        sensors.forEach(sensor => {
          if (stats[sensor.key] && stats[sensor.key].count > 0) {
            const s = stats[sensor.key];
            Plotly.newPlot('chart' + chartCount, [{
              y: [s.min, s.avg, s.max],
              x: ['Min', 'Average', 'Max'],
              type: 'bar',
              marker: { color: sensor.color }
            }], {
              paper_bgcolor: '#1a1a1a',
              plot_bgcolor: '#1a1a1a',
              font: { color: '#fff' },
              margin: { t: 20, b: 30, l: 40, r: 20 },
              height: 250
            }, { responsive: true });
            chartCount++;
          }
        });
        
      } catch (error) {
        console.error('Failed to load session details:', error);
        modalBody.innerHTML = '<p style="color:#f44;">Error loading session details: ' + error.message + '</p>';
      }
    }
    
    async function exportSession(sessionId) {
      try {
        const response = await fetch('/api/analytics/export/' + sessionId + '?format=csv');
        const text = await response.text();
        
        // Download CSV
        const blob = new Blob([text], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'session-' + sessionId + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('✅ Session exported');
      } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed: ' + error.message);
      }
    }
    
    document.getElementById('closeModal').addEventListener('click', () => {
      document.getElementById('detailModal').style.display = 'none';
    });
    
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
