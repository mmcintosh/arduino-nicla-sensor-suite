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
    '<div style="font-size:10px;color:#888;text-align:right;padding:10px;">Nicla Sense ME</div>'
  );
  
  // Add data recording functionality
  const dataRecordingScript = `
  <script>
    // Data recording state
    let currentSessionId = null;
    let isRecording = false;
    let recordingStartTime = null;
    let dataBuffer = [];
    const BUFFER_SIZE = 10; // Send data every 10 readings
    
    // Add recording button to status bar - positioned to the right of PAIR button
    window.addEventListener('DOMContentLoaded', function() {
      const pairBtn = document.getElementById('pairButton');
      const recordBtn = document.createElement('button');
      recordBtn.id = 'recordButton';
      recordBtn.innerHTML = '⏺ START RECORDING';
      recordBtn.style.cssText = 'background:#ff4444;color:#fff;border:none;padding:8px 15px;border-radius:20px;cursor:pointer;margin:8px 8px 8px 120px;font-size:12px;height:25px;position:absolute;left:0;';
      recordBtn.disabled = true;
      recordBtn.onclick = toggleRecording;
      pairBtn.parentNode.appendChild(recordBtn);
      
      // Enable recording button only when paired
      const originalConnect = window.connect;
      window.connect = async function() {
        await originalConnect();
        recordBtn.disabled = false;
        recordBtn.style.opacity = '1';
      };
      
      recordBtn.style.opacity = '0.5';
    });
    
    async function toggleRecording() {
      const btn = document.getElementById('recordButton');
      if (!isRecording) {
        // Start recording
        const sessionName = prompt('Enter session name:', 'Session ' + new Date().toLocaleString());
        if (!sessionName) return;
        
        try {
          const response = await fetch('/api/sessions/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: sessionName, notes: 'Live recording from dashboard' })
          });
          const data = await response.json();
          currentSessionId = data.sessionId;
          isRecording = true;
          recordingStartTime = Date.now();
          btn.innerHTML = '⏹ STOP RECORDING';
          btn.style.background = '#44ff44';
          snack('Recording started: ' + sessionName, 0);
        } catch (error) {
          snack('Failed to start recording: ' + error.message, 1);
        }
      } else {
        // Stop recording
        await flushDataBuffer();
        try {
          await fetch('/api/sessions/' + currentSessionId + '/stop', { method: 'POST' });
          btn.innerHTML = '⏺ START RECORDING';
          btn.style.background = '#ff4444';
          snack('Recording stopped. ' + dataBuffer.length + ' readings saved.', 0);
          isRecording = false;
          currentSessionId = null;
          dataBuffer = [];
        } catch (error) {
          snack('Failed to stop recording: ' + error.message, 1);
        }
      }
    }
    
    // Hook into the original handleIncoming function
    const originalHandleIncoming = window.handleIncoming || function(){};
    window.handleIncoming = function(sensor, dataReceived) {
      originalHandleIncoming(sensor, dataReceived);
      
      if (isRecording && currentSessionId) {
        recordSensorData(sensor);
      }
    };
    
    function recordSensorData(sensor) {
      const sensorName = Object.keys(NiclaSenseME).find(key => NiclaSenseME[key] === sensor);
      if (!sensorName) return;
      
      const columns = Object.keys(sensor.data);
      const reading = { sensor: sensorName, timestamp: Date.now() };
      columns.forEach(col => {
        const latestValue = sensor.data[col][sensor.data[col].length - 1];
        if (latestValue !== undefined) reading[col] = latestValue;
      });
      
      dataBuffer.push(reading);
      
      if (dataBuffer.length >= BUFFER_SIZE) {
        flushDataBuffer();
      }
    }
    
    async function flushDataBuffer() {
      if (dataBuffer.length === 0 || !currentSessionId) return;
      
      const toSend = [...dataBuffer];
      dataBuffer = [];
      
      try {
        await fetch('/api/sensor-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
            readings: toSend
          })
        });
      } catch (error) {
        console.error('Failed to send data:', error);
      }
    }
    
    // Flush buffer periodically
    setInterval(() => {
      if (isRecording) flushDataBuffer();
    }, 5000);
  </script>`;
  
  html = html.replace('</body>', dataRecordingScript + '</body>');
  
  return c.html(html);
});

export default app;
