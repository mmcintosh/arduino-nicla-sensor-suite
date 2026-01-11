import { Hono } from 'hono';
import { Env } from '../index';
import { DASHBOARD_HTML } from './dashboard-html';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  // Serve the embedded dashboard HTML
  // Replace local GLTFLoader.js with CDN version since we can't serve static files easily
  let html = DASHBOARD_HTML.replace(
    '<script src="GLTFLoader.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.109.0/examples/js/loaders/GLTFLoader.js"></script>'
  );
  
  // Replace local model path with a CDN or embedded version
  // For now, use the GitHub hosted version
  html = html.replace(
    "loader.load('models/niclaSenseME.glb',",
    "loader.load('https://raw.githubusercontent.com/arduino/ArduinoAI/main/NiclaSenseME-dashboard/models/niclaSenseME.glb',"
  );
  
  // Remove the logo that returns 404 (or hide it)
  html = html.replace(
    /<img src="Logo-Arduino-Pro-inline\.svg"[^>]*>/g,
    '<div style="font-size:10px;color:#888;text-align:right;padding:10px;display:flex;gap:10px;justify-content:flex-end;"><a href="/history" style="color:#d8f41d;text-decoration:none;">📊 History</a><a href="/analytics" style="color:#d8f41d;text-decoration:none;">📈 Analytics</a></div>'
  );
  
  // Add data recording functionality - MUST wait for page to fully load
  const dataRecordingScript = `
  <script>
    // Wait for ALL scripts to load including handleIncoming
    setTimeout(function() {
      console.log('🔧 Initializing recording system...');
      
      // Data recording state
      window.currentSessionId = null;
      window.isRecording = false;
      window.recordingStartTime = null;
      window.dataBuffer = [];
      const BUFFER_SIZE = 10;
      
      // Check if handleIncoming exists
      if (typeof window.handleIncoming !== 'function') {
        console.error('❌ handleIncoming not found! Waiting longer...');
        setTimeout(arguments.callee, 1000);
        return;
      }
      
      console.log('✅ handleIncoming found! Installing recording wrapper...');
      
      // Store original
      const originalHandleIncoming = window.handleIncoming;
      
      // Replace with wrapper
      window.handleIncoming = function(sensor, dataReceived) {
        // Call original
        originalHandleIncoming.call(this, sensor, dataReceived);
        
        // Record if active
        if (window.isRecording && window.currentSessionId) {
          console.log('📊 Recording data from sensor');
          window.recordSensorData(sensor);
        }
      };
      
      console.log('✅ Recording wrapper installed!');
      
      // Add recording button
      const pairBtn = document.getElementById('pairButton');
      const recordBtn = document.createElement('button');
      recordBtn.id = 'recordButton';
      recordBtn.innerHTML = '⏺ START RECORDING';
      recordBtn.style.cssText = 'background:#ff4444;color:#fff;border:none;padding:8px 15px;border-radius:20px;cursor:pointer;margin:8px 8px 8px 120px;font-size:12px;height:25px;position:absolute;left:0;';
      recordBtn.disabled = true;
      recordBtn.onclick = window.toggleRecording;
      pairBtn.parentNode.appendChild(recordBtn);
      
      // Enable after pairing
      const originalConnect = window.connect;
      window.connect = async function() {
        await originalConnect();
        recordBtn.disabled = false;
        recordBtn.style.opacity = '1';
      };
      
      recordBtn.style.opacity = '0.5';
      console.log('✅ Recording button added!');
      
    }, 2000); // Wait 2 seconds for page to fully initialize
    
    window.toggleRecording = async function() {
      const btn = document.getElementById('recordButton');
      if (!window.isRecording) {
        const sessionName = prompt('Enter session name:', 'Session ' + new Date().toLocaleString());
        if (!sessionName) return;
        
        try {
          console.log('🎬 Starting recording:', sessionName);
          const response = await fetch('/api/sessions/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: sessionName, notes: 'Live recording' })
          });
          const data = await response.json();
          console.log('✅ Session created:', data);
          window.currentSessionId = data.sessionId;
          window.isRecording = true;
          window.recordingStartTime = Date.now();
          btn.innerHTML = '⏹ STOP RECORDING';
          btn.style.background = '#44ff44';
          snack('Recording: ' + sessionName, 0);
          console.log('🔴 RECORDING ACTIVE - ID:', window.currentSessionId);
        } catch (error) {
          console.error('❌ Start failed:', error);
          snack('Failed: ' + error.message, 1);
        }
      } else {
        console.log('⏹ Stopping recording...');
        await window.flushDataBuffer();
        try {
          await fetch('/api/sessions/' + window.currentSessionId + '/stop', { method: 'POST' });
          btn.innerHTML = '⏺ START RECORDING';
          btn.style.background = '#ff4444';
          snack('Recording stopped', 0);
          console.log('✅ Stopped');
          window.isRecording = false;
          window.currentSessionId = null;
          window.dataBuffer = [];
        } catch (error) {
          console.error('❌ Stop failed:', error);
        }
      }
    };
    
    window.recordSensorData = function(sensor) {
      const sensorName = Object.keys(NiclaSenseME).find(key => NiclaSenseME[key] === sensor);
      if (!sensorName) return;
      
      const reading = { 
        sessionId: window.currentSessionId,
        timestamp: Date.now()
      };
      
      if (sensorName === 'accelerometer') {
        reading.accelerometer = {
          x: sensor.data.Ax[sensor.data.Ax.length - 1],
          y: sensor.data.Ay[sensor.data.Ay.length - 1],
          z: sensor.data.Az[sensor.data.Az.length - 1]
        };
      } else if (sensorName === 'gyroscope') {
        reading.gyroscope = {
          x: sensor.data.x[sensor.data.x.length - 1],
          y: sensor.data.y[sensor.data.y.length - 1],
          z: sensor.data.z[sensor.data.z.length - 1]
        };
      } else if (sensorName === 'quaternion') {
        reading.quaternion = {
          x: sensor.data.x[sensor.data.x.length - 1],
          y: sensor.data.y[sensor.data.y.length - 1],
          z: sensor.data.z[sensor.data.z.length - 1],
          w: sensor.data.w[sensor.data.w.length - 1]
        };
      } else if (sensorName === 'temperature') {
        reading.temperature = sensor.data.temperature[sensor.data.temperature.length - 1];
      } else if (sensorName === 'humidity') {
        reading.humidity = sensor.data.humidity[sensor.data.humidity.length - 1];
      } else if (sensorName === 'pressure') {
        reading.pressure = sensor.data.pressure[sensor.data.pressure.length - 1];
      } else if (sensorName === 'bsec') {
        reading.bsec = sensor.data.bsec[sensor.data.bsec.length - 1];
      } else if (sensorName === 'co2') {
        reading.co2 = sensor.data.co2[sensor.data.co2.length - 1];
      } else if (sensorName === 'gas') {
        reading.gas = sensor.data.gas[sensor.data.gas.length - 1];
      }
      
      window.dataBuffer.push(reading);
      
      if (window.dataBuffer.length >= 10) {
        window.flushDataBuffer();
      }
    };
    
    window.flushDataBuffer = async function() {
      if (window.dataBuffer.length === 0 || !window.currentSessionId) return;
      
      const toSend = [...window.dataBuffer];
      window.dataBuffer = [];
      
      console.log('💾 Sending', toSend.length, 'readings to API...');
      
      try {
        for (const reading of toSend) {
          await fetch('/api/sensor-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: reading.sessionId,
              timestamp: reading.timestamp,
              accelerometer: reading.accelerometer,
              gyroscope: reading.gyroscope,
              quaternion: reading.quaternion,
              temperature: reading.temperature,
              humidity: reading.humidity,
              pressure: reading.pressure,
              bsec: reading.bsec,
              co2: reading.co2,
              gas: reading.gas
            })
          });
        }
        console.log('✅ Data sent successfully!');
      } catch (error) {
        console.error('❌ Failed to send data:', error);
      }
    };
    
    setInterval(() => {
      if (window.isRecording) {
        console.log('⏰ Auto-flush, buffer:', window.dataBuffer.length);
        window.flushDataBuffer();
      }
    }, 5000);
  </script>`;
  
  html = html.replace('</body>', dataRecordingScript + '</body>');
  
  return c.html(html);
});

export default app;
