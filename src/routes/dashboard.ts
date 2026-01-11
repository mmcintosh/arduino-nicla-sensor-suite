import { Hono } from 'hono';
import { Env } from '../index';
import { html } from 'hono/html';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  const htmlContent = html`<!DOCTYPE html>
<html>
<head>
  <title>Arduino Nicla Sense ME - IoT Data Platform</title>
  <link href='https://fonts.googleapis.com/css?family=Roboto+Mono' rel='stylesheet'>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@jaames/iro/dist/iro.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/109/three.min.js"></script>
  <script src="/GLTFLoader.js"></script>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div class="container">
    <!-- Session Control Bar -->
    <div class="session-control widget">
      <div class="session-info">
        <span id="sessionStatus">No active session</span>
        <span id="recordingDuration" style="margin-left: 20px; color: #888;"></span>
      </div>
      <div class="session-actions">
        <button id="startSessionBtn" class="btn-primary">Start Recording</button>
        <button id="stopSessionBtn" class="btn-danger" style="display:none;">Stop Recording</button>
        <button id="pairButton" class="btn-connect" disabled>CONNECT</button>
      </div>
    </div>

    <!-- Top Status Bar -->
    <div id="snackbar"></div>
    <div class="status widget">
      <div class="label statusBar" id="bluetooth">Start a recording session, then connect your device</div>
      <div style="text-align: right; color: #888; font-size: 12px;">
        <span id="dataPointsCount">0 readings</span>
      </div>
    </div>

    <!-- 3D Model Widget -->
    <div class="square widget" id="3d">
      <div class="label">&#128230; Quaternion Rotation</div>
      <div class="quaternion" id="canvasDigits">
        <span id="xQuaternion">x: -</span>
        <span id="yQuaternion">y: -</span>
        <span id="zQuaternion">z: -</span>
      </div>
    </div>

    <!-- Accelerometer Widget -->
    <div class="double widget">
      <div class="label">&#128640; Accelerometer</div>
      <div id="accelerometer" class="doublegraph"></div>
    </div>

    <!-- Gyroscope Widget -->
    <div class="square widget">
      <div class="label">&#128171; Gyroscope</div>
      <div id="gyroscope" class="graph"></div>
    </div>

    <!-- LED Control Widget -->
    <div class="square widget">
      <div class="label">&#128161; RGB LED control</div>
      <div id="color-picker-container" class="graph"></div>
    </div>

    <!-- Temperature Widget -->
    <div class="short widget">
      <div class="label">&#127777; Temperature - </div>
      <div class="label" id="temperature-value"></div>
      <div class="label">&deg;C</div>
      <div class="shortgraph" id="temperature"></div>
    </div>

    <!-- Humidity Widget -->
    <div class="short widget">
      <div class="label">&#128167; Humidity - </div>
      <div class="label" id="humidity-value"></div>
      <div class="label">%</div>
      <div class="shortgraph" id="humidity"></div>
    </div>

    <!-- Pressure Widget -->
    <div class="short widget">
      <div class="label">&#9925; Pressure - </div>
      <div class="label" id="pressure-value"></div>
      <div class="label">kPa</div>
      <div class="shortgraph" id="pressure"></div>
    </div>

    <!-- Indoor Air Quality Widget -->
    <div class="short widget">
      <div class="label">&#127968; Indoor Air Quality - </div>
      <div class="label" id="bsec-value"></div>
      <div class="shortgraph" id="bsec"></div>
    </div>

    <!-- CO2 Widget -->
    <div class="short widget">
      <div class="label">&#127793; Co2 Value - </div>
      <div class="label" id="co2-value"></div>
      <div class="shortgraph" id="co2"></div>
    </div>

    <!-- Gas Widget -->
    <div class="short widget">
      <div class="label">&#x1F4A8; Gas Value - </div>
      <div class="label" id="gas-value"></div>
      <div class="shortgraph" id="gas"></div>
    </div>

    <!-- Navigation -->
    <div class="widget" style="width: 100%; text-align: center; margin-top: 20px;">
      <a href="/history" class="nav-link">View History</a>
      <span style="margin: 0 10px;">|</span>
      <a href="#" id="exportCurrentBtn" class="nav-link">Export Current Session</a>
    </div>
  </div>

  <!-- Session Modal -->
  <div id="sessionModal" class="modal" style="display:none;">
    <div class="modal-content">
      <h2>Start Recording Session</h2>
      <form id="sessionForm">
        <label for="sessionName">Session Name *</label>
        <input type="text" id="sessionName" required placeholder="e.g., Morning Air Quality Test">
        
        <label for="sessionNotes">Notes (optional)</label>
        <textarea id="sessionNotes" rows="3" placeholder="Add any notes about this recording session..."></textarea>
        
        <label for="sessionTags">Tags (comma-separated)</label>
        <input type="text" id="sessionTags" placeholder="e.g., indoor, test, baseline">
        
        <div class="modal-actions">
          <button type="button" id="cancelSessionBtn" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">Start Recording</button>
        </div>
      </form>
    </div>
  </div>

  <script src="/js/dashboard.js"></script>
</body>
</html>`;

  return c.html(htmlContent);
});

export default app;
