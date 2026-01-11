// Single Page Application HTML with client-side routing
// BLE connection persists across navigation
export const SPA_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Arduino Nicla Sense ME - Sensor Suite</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- External Libraries -->
  <link href='https://fonts.googleapis.com/css?family=Roboto Mono' rel='stylesheet'>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@jaames/iro/dist/iro.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/109/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.109.0/examples/js/loaders/GLTFLoader.js"></script>
  
  <style>
    * {
      font-family: 'Roboto Mono', sans-serif;
      box-sizing: border-box;
    }

    body {
      color: white;
      background: #000000;
      font-size: 14px;
      margin: 0;
      padding: 0;
    }

    /* Navigation Bar */
    #navbar {
      background: #111111;
      border-bottom: 2px solid #d8f41d;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #navbar .logo {
      font-size: 18px;
      font-weight: bold;
      color: #d8f41d;
    }

    #navbar nav {
      display: flex;
      gap: 20px;
    }

    #navbar nav a {
      color: #888;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 4px;
      transition: all 0.3s;
    }

    #navbar nav a:hover {
      color: #d8f41d;
      background: rgba(216, 244, 29, 0.1);
    }

    #navbar nav a.active {
      color: #d8f41d;
      background: rgba(216, 244, 29, 0.2);
    }

    #connectionStatus {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
    }

    #connectionDot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #888;
    }

    #connectionDot.connected {
      background: #d8f41d;
      box-shadow: 0 0 10px #d8f41d;
    }

    /* Main Content Area */
    #app {
      min-height: calc(100vh - 60px);
      padding: 20px;
    }

    /* Page Container */
    .page {
      display: none;
    }

    .page.active {
      display: block;
    }

    /* Dashboard Styles */
    #pairButton {
      background-color: #d8f41d;
      border: none;
      color: black;
      padding: 1px;
      text-align: center;
      text-decoration: none;
      margin: 8px 18px;
      height: 25px;
      width: 100px;
      border-radius: 20px;
      outline: none;
      cursor: pointer;
      grid-column: 1;
    }

    #pairButton:hover {
      background-color: #c5db1a;
    }

    .container {
      width: 960px;
      margin: 0 auto;
    }

    .widget {
      background-color: #111111;
      border: 1px solid #000000;
      border-radius: 0px;
      padding: 12px;
      margin: 6px;
      float: left;
      color: #DAE3E3;
      padding-bottom: 16px;
    }

    .status {
      margin-top: 1%;
      width: 885px;
      height: 42px;
      color: white;
      display: grid;
      grid-template-columns: 15% 70% 15%;
    }

    #bluetooth {
      font-size: 16px;
      height: 50%;
      margin: auto;
    }

    .square {
      width: 192px;
      height: 226px;
      position: relative;
    }

    .label {
      height: 15px;
      display: inline;
      font-size: 12px;
    }

    .statusBar {
      height: 100%;
      grid-column: 2;
      vertical-align: middle;
      text-align: center;
    }

    .digit {
      font-size: 20px;
      color: #888888;
      float: right;
    }

    .short {
      width: 192px;
      height: 92px;
    }

    .double {
      width: 423px;
      height: 226px;
    }

    .graph {
      width: 192px;
      height: 177px;
    }

    .doublegraph {
      width: 423px;
      height: 177px;
    }

    .shortgraph {
      width: 192px;
      height: 81px;
    }

    .quaternion {
      font-size: 10px;
    }

    #color-picker-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      margin: auto;
    }

    #snackbar {
      height: 23px;
      display: block;
      visibility: visible;
      text-align: center;
      background-color: #374146;
      border-radius: 3px;
      padding: 4px 13px 4px 13px;
      margin: 16px 7px 7px;
      display: inline-block;
    }

    #canvasDigits {
      width: 75%;
      margin: auto;
    }

    #canvasDigits span {
      width: 29%;
      display: inline-block;
    }

    /* Recording Button */
    #recordButton {
      background-color: #888;
      border: none;
      color: white;
      padding: 10px 20px;
      text-align: center;
      text-decoration: none;
      margin: 10px auto;
      border-radius: 20px;
      cursor: pointer;
      display: block;
      font-size: 14px;
      transition: all 0.3s;
    }

    #recordButton:hover {
      background-color: #999;
    }

    #recordButton.recording {
      background-color: #ff4444;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    /* History & Analytics Styles */
    .page-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .page-header h1 {
      color: #d8f41d;
      margin-bottom: 10px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      color: #d8f41d;
      font-weight: bold;
      margin: 10px 0;
    }

    .stat-label {
      color: #888;
      font-size: 14px;
    }

    .chart-container {
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .sessions-list {
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
    }

    .session-item {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .session-item:hover {
      border-color: #d8f41d;
      background: #222;
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .session-id {
      color: #d8f41d;
      font-weight: bold;
    }

    .session-time {
      color: #888;
      font-size: 12px;
    }

    .session-stats {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #888;
    }

    .btn {
      background: #d8f41d;
      color: #000;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.3s;
    }

    .btn:hover {
      background: #c5db1a;
    }

    .btn-secondary {
      background: #333;
      color: #fff;
    }

    .btn-secondary:hover {
      background: #444;
    }
  </style>
</head>

<body>
  <!-- Navigation Bar -->
  <div id="navbar">
    <div class="logo">🔬 Nicla Sensor Suite</div>
    <nav>
      <a href="#dashboard" class="nav-link active">Dashboard</a>
      <a href="#history" class="nav-link">History</a>
      <a href="#analytics" class="nav-link">Analytics</a>
    </nav>
    <div id="connectionStatus">
      <div id="connectionDot"></div>
      <span id="connectionText">Not Connected</span>
    </div>
  </div>

  <!-- Main App Container -->
  <div id="app">
    <!-- Dashboard Page -->
    <div id="dashboardPage" class="page active">
      <div class="container">
        <div id="snackbar"></div>
        <div class="status widget">
          <button id="pairButton">CONNECT</button>
          <div class="label statusBar" id="bluetooth">Click the connect button to connect your device</div>
        </div>

        <div class="square widget" id="3d">
          <div class="label">&#128230; Quaternion Rotation</div>
          <div class="quaternion" id="canvasDigits">
            <span id="xQuaternion">x: -</span>
            <span id="yQuaternion">y: -</span>
            <span id="zQuaternion">z: -</span>
          </div>
        </div>

        <div class="double widget">
          <div class="label">&#128640; Accelerometer</div>
          <div id="accelerometer" class="doublegraph"></div>
        </div>

        <div class="square widget">
          <div class="label">&#128171; Gyroscope</div>
          <div class="label" id="gyroscope-value"></div>
          <div id="gyroscope" class="graph"></div>
        </div>

        <div class="square widget">
          <div class="label">&#128161; RGB LED control</div>
          <div id="color-picker-container" class="graph"></div>
        </div>

        <div class="short widget">
          <div class="label">&#127777; Temperature - </div>
          <div class="label" id="temperature-value"></div>
          <div class="label">&deg;C</div>
          <div class="shortgraph" id="temperature"></div>
        </div>

        <div class="short widget">
          <div class="label">&#128167; Humidity - </div>
          <div class="label" id="humidity-value"></div>
          <div class="label">%</div>
          <div class="shortgraph" id="humidity"></div>
        </div>

        <div class="short widget">
          <div class="label">&#9925; Pressure - </div>
          <div class="label" id="pressure-value"></div>
          <div class="label">kPa</div>
          <div class="shortgraph" id="pressure"></div>
        </div>

        <div class="short widget">
          <div class="label">&#127968; Indoor Air Quality - </div>
          <div class="label" id="bsec-value"></div>
          <div class="label"></div>
          <div class="shortgraph" id="bsec"></div>
        </div>

        <div class="short widget">
          <div class="label">&#127793; Co2 Value -</div>
          <div class="label" id="co2-value"></div>
          <div class="label"></div>
          <div class="shortgraph" id="co2"></div>
        </div>

        <div class="short widget">
          <div class="label">&#x1F4A8; Gas Value -</div>
          <div class="label" id="gas-value"></div>
          <div class="label"></div>
          <div class="shortgraph" id="gas"></div>
        </div>

        <button id="recordButton">START RECORDING</button>
      </div>
    </div>

    <!-- History Page -->
    <div id="historyPage" class="page">
      <div class="page-header">
        <h1>📊 Session History</h1>
        <p>View and analyze your recorded sensor data</p>
      </div>
      <div id="historyContent">
        <div class="sessions-list" id="sessionsList">
          <p style="text-align: center; color: #888;">Loading sessions...</p>
        </div>
      </div>
    </div>

    <!-- Analytics Page -->
    <div id="analyticsPage" class="page">
      <div class="page-header">
        <h1>📈 Analytics Dashboard</h1>
        <p>Comprehensive sensor data analytics</p>
      </div>
      <div id="analyticsContent">
        <div class="stats-grid" id="statsGrid">
          <div class="stat-card">
            <div class="stat-label">Total Sessions</div>
            <div class="stat-value" id="totalSessions">-</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Readings</div>
            <div class="stat-value" id="totalReadings">-</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg Session Duration</div>
            <div class="stat-value" id="avgDuration">-</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active Sessions</div>
            <div class="stat-value" id="activeSessions">-</div>
          </div>
        </div>
        <div id="analyticsCharts"></div>
      </div>
    </div>
  </div>

  <script>
    // ==========================================
    // GLOBAL STATE & BLE CONNECTION
    // ==========================================
    
    const AppState = {
      device: null,
      server: null,
      service: null,
      characteristics: {},
      isConnected: false,
      isRecording: false,
      currentSessionId: null,
      dataBuffer: [],
      BUFFER_SIZE: 10
    };

    // ==========================================
    // ROUTER
    // ==========================================
    
    function initRouter() {
      // Handle hash changes
      window.addEventListener('hashchange', handleRoute);
      
      // Handle initial route
      handleRoute();
      
      // Handle nav link clicks
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const href = link.getAttribute('href');
          window.location.hash = href;
        });
      });
    }

    function handleRoute() {
      const hash = window.location.hash.slice(1) || 'dashboard';
      
      // Hide all pages
      document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
      });
      
      // Update nav links
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + hash) {
          link.classList.add('active');
        }
      });
      
      // Show active page
      const pageMap = {
        'dashboard': 'dashboardPage',
        'history': 'historyPage',
        'analytics': 'analyticsPage'
      };
      
      const pageId = pageMap[hash] || 'dashboardPage';
      document.getElementById(pageId).classList.add('active');
      
      // Load page data
      if (hash === 'history') {
        loadHistoryPage();
      } else if (hash === 'analytics') {
        loadAnalyticsPage();
      }
    }

    // ==========================================
    // BLE CONNECTION (Preserved across navigation)
    // ==========================================
    
    const BLE_SENSE_UUID = (val) => \`19b10000-\${val}-537e-4f6c-d104768a1214\`;
    
    const CHARACTERISTICS = {
      VERSION: BLE_SENSE_UUID("1001"),
      TEMPERATURE: BLE_SENSE_UUID("2001"),
      HUMIDITY: BLE_SENSE_UUID("3001"),
      PRESSURE: BLE_SENSE_UUID("4001"),
      ACCELEROMETER: BLE_SENSE_UUID("5001"),
      GYROSCOPE: BLE_SENSE_UUID("6001"),
      QUATERNION: BLE_SENSE_UUID("7001"),
      RGB_LED: BLE_SENSE_UUID("8001"),
      BSEC: BLE_SENSE_UUID("9001"),
      CO2: BLE_SENSE_UUID("9002"),
      GAS: BLE_SENSE_UUID("9003")
    };

    async function connectDevice() {
      try {
        console.log('🔍 Requesting Bluetooth Device...');
        AppState.device = await navigator.bluetooth.requestDevice({
          filters: [{services: [BLE_SENSE_UUID("0000")]}]
        });
        
        AppState.device.addEventListener('gattserverdisconnected', onDisconnected);
        
        console.log('🔗 Connecting to GATT Server...');
        AppState.server = await AppState.device.gatt.connect();
        
        console.log('🔧 Getting Service...');
        AppState.service = await AppState.server.getPrimaryService(BLE_SENSE_UUID("0000"));
        
        // Get all characteristics
        for (const [name, uuid] of Object.entries(CHARACTERISTICS)) {
          try {
            AppState.characteristics[name] = await AppState.service.getCharacteristic(uuid);
            console.log(\`✅ Got characteristic: \${name}\`);
          } catch (e) {
            console.warn(\`⚠️  Could not get characteristic: \${name}\`, e);
          }
        }
        
        // Start notifications
        await setupNotifications();
        
        AppState.isConnected = true;
        updateConnectionStatus(true);
        showMessage('Connected to Nicla Sense ME!');
        
        // Initialize visualizations
        initializeVisualizations();
        
      } catch (error) {
        console.error('❌ Connection failed:', error);
        showMessage('Connection failed: ' + error.message);
      }
    }

    function onDisconnected() {
      console.log('📡 Device disconnected');
      AppState.isConnected = false;
      updateConnectionStatus(false);
      showMessage('Device disconnected');
    }

    function updateConnectionStatus(connected) {
      const dot = document.getElementById('connectionDot');
      const text = document.getElementById('connectionText');
      const bluetooth = document.getElementById('bluetooth');
      const pairButton = document.getElementById('pairButton');
      
      if (connected) {
        dot.classList.add('connected');
        text.textContent = 'Connected';
        bluetooth.textContent = 'Connected to Nicla Sense ME';
        pairButton.textContent = 'DISCONNECT';
      } else {
        dot.classList.remove('connected');
        text.textContent = 'Not Connected';
        bluetooth.textContent = 'Click the connect button to connect your device';
        pairButton.textContent = 'CONNECT';
      }
    }

    async function setupNotifications() {
      // Temperature - Use polling (BLERead)
      if (AppState.characteristics.TEMPERATURE) {
        setInterval(async () => {
          try {
            const data = await AppState.characteristics.TEMPERATURE.readValue();
            const value = data.getFloat32(0, true);
            updateSensorDisplay('temperature', value);
            if (AppState.isRecording) recordSensorData('temperature', value);
          } catch (e) {
            console.warn('Failed to read temperature:', e);
          }
        }, 500);
      }
      
      // Humidity - Use polling (BLERead)
      if (AppState.characteristics.HUMIDITY) {
        setInterval(async () => {
          try {
            const data = await AppState.characteristics.HUMIDITY.readValue();
            const value = data.getUint8(0);
            updateSensorDisplay('humidity', value);
            if (AppState.isRecording) recordSensorData('humidity', value);
          } catch (e) {
            console.warn('Failed to read humidity:', e);
          }
        }, 500);
      }
      
      // Pressure - Use polling (BLERead)
      if (AppState.characteristics.PRESSURE) {
        setInterval(async () => {
          try {
            const data = await AppState.characteristics.PRESSURE.readValue();
            const value = data.getFloat32(0, true);
            updateSensorDisplay('pressure', value);
            if (AppState.isRecording) recordSensorData('pressure', value);
          } catch (e) {
            console.warn('Failed to read pressure:', e);
          }
        }, 500);
      }
      
      // Accelerometer
      if (AppState.characteristics.ACCELEROMETER) {
        await AppState.characteristics.ACCELEROMETER.startNotifications();
        AppState.characteristics.ACCELEROMETER.addEventListener('characteristicvaluechanged', (event) => {
          const x = event.target.value.getFloat32(0, true);
          const y = event.target.value.getFloat32(4, true);
          const z = event.target.value.getFloat32(8, true);
          updateSensorDisplay('accelerometer', {x, y, z});
          if (AppState.isRecording) recordSensorData('accelerometer', {x, y, z});
        });
      }
      
      // Gyroscope
      if (AppState.characteristics.GYROSCOPE) {
        await AppState.characteristics.GYROSCOPE.startNotifications();
        AppState.characteristics.GYROSCOPE.addEventListener('characteristicvaluechanged', (event) => {
          const x = event.target.value.getFloat32(0, true);
          const y = event.target.value.getFloat32(4, true);
          const z = event.target.value.getFloat32(8, true);
          updateSensorDisplay('gyroscope', {x, y, z});
          if (AppState.isRecording) recordSensorData('gyroscope', {x, y, z});
        });
      }
      
      // Quaternion
      if (AppState.characteristics.QUATERNION) {
        await AppState.characteristics.QUATERNION.startNotifications();
        AppState.characteristics.QUATERNION.addEventListener('characteristicvaluechanged', (event) => {
          const x = event.target.value.getFloat32(0, true);
          const y = event.target.value.getFloat32(4, true);
          const z = event.target.value.getFloat32(8, true);
          const w = event.target.value.getFloat32(12, true);
          updateSensorDisplay('quaternion', {x, y, z, w});
        });
      }
      
      // BSEC (Air Quality) - Use polling (BLERead)
      if (AppState.characteristics.BSEC) {
        setInterval(async () => {
          try {
            const data = await AppState.characteristics.BSEC.readValue();
            const value = data.getFloat32(0, true);
            updateSensorDisplay('bsec', value);
            if (AppState.isRecording) recordSensorData('air_quality', value);
          } catch (e) {
            console.warn('Failed to read BSEC:', e);
          }
        }, 500);
      }
      
      // CO2 - Use polling (BLERead)
      if (AppState.characteristics.CO2) {
        setInterval(async () => {
          try {
            const data = await AppState.characteristics.CO2.readValue();
            const value = data.getInt32(0, true);
            updateSensorDisplay('co2', value);
            if (AppState.isRecording) recordSensorData('co2', value);
          } catch (e) {
            console.warn('Failed to read CO2:', e);
          }
        }, 500);
      }
      
      // Gas - Use polling (BLERead)
      if (AppState.characteristics.GAS) {
        setInterval(async () => {
          try {
            const data = await AppState.characteristics.GAS.readValue();
            const value = data.getUint32(0, true);
            updateSensorDisplay('gas', value);
            if (AppState.isRecording) recordSensorData('gas', value);
          } catch (e) {
            console.warn('Failed to read gas:', e);
          }
        }, 500);
      }
      
      console.log('✅ All notifications and polling set up');
    }

    // ==========================================
    // RECORDING FUNCTIONALITY
    // ==========================================
    
    async function toggleRecording() {
      if (!AppState.isConnected) {
        showMessage('Please connect device first!');
        return;
      }
      
      if (AppState.isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    }

    async function startRecording() {
      const duration = prompt('Enter recording duration in minutes:', '5');
      if (!duration) return;
      
      try {
        const response = await fetch('/api/sessions/start', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            duration: parseInt(duration),
            device_name: AppState.device?.name || 'Unknown',
            device_id: AppState.device?.id || null
          })
        });
        
        const data = await response.json();
        AppState.currentSessionId = data.sessionId;
        AppState.isRecording = true;
        
        const btn = document.getElementById('recordButton');
        btn.textContent = 'STOP RECORDING';
        btn.classList.add('recording');
        
        showMessage(\`Recording started! Session ID: \${data.sessionId}\`);
      } catch (error) {
        console.error('Failed to start recording:', error);
        showMessage('Failed to start recording: ' + error.message);
      }
    }

    async function stopRecording() {
      try {
        await flushDataBuffer();
        
        await fetch(\`/api/sessions/\${AppState.currentSessionId}/stop\`, {
          method: 'POST'
        });
        
        AppState.isRecording = false;
        AppState.currentSessionId = null;
        
        const btn = document.getElementById('recordButton');
        btn.textContent = 'START RECORDING';
        btn.classList.remove('recording');
        
        showMessage('Recording stopped!');
      } catch (error) {
        console.error('Failed to stop recording:', error);
        showMessage('Failed to stop recording: ' + error.message);
      }
    }

    function recordSensorData(sensorType, value) {
      if (!AppState.currentSessionId) return;
      
      const reading = {
        session_id: AppState.currentSessionId,
        timestamp: new Date().toISOString(),
        sensor_type: sensorType
      };
      
      // Handle different value types
      if (typeof value === 'object' && value !== null) {
        Object.assign(reading, value);
      } else {
        reading.value = value;
      }
      
      AppState.dataBuffer.push(reading);
      
      if (AppState.dataBuffer.length >= AppState.BUFFER_SIZE) {
        flushDataBuffer();
      }
    }

    async function flushDataBuffer() {
      if (AppState.dataBuffer.length === 0) return;
      
      const batch = [...AppState.dataBuffer];
      AppState.dataBuffer = [];
      
      try {
        await fetch('/api/sensor-data/batch', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({readings: batch})
        });
      } catch (error) {
        console.error('Failed to send batch:', error);
        // Re-add to buffer on failure
        AppState.dataBuffer.unshift(...batch);
      }
    }

    // ==========================================
    // VISUALIZATION & DISPLAY
    // ==========================================
    
    let sensorData = {
      temperature: [],
      humidity: [],
      pressure: [],
      bsec: [],
      co2: [],
      gas: [],
      timestamps: []
    };

    let scene, camera, renderer, mesh;

    function initializeVisualizations() {
      // Initialize Plotly charts
      const config = {responsive: true, displayModeBar: false};
      
      // Temperature
      Plotly.newPlot('temperature', [{
        y: [],
        type: 'scatter',
        mode: 'lines',
        line: {color: '#d8f41d'}
      }], {
        margin: {t: 0, r: 0, b: 20, l: 30},
        paper_bgcolor: '#111',
        plot_bgcolor: '#111',
        font: {color: '#888'},
        xaxis: {showticklabels: false}
      }, config);
      
      // Similar for other sensors...
      ['humidity', 'pressure', 'bsec', 'co2', 'gas'].forEach(sensor => {
        Plotly.newPlot(sensor, [{
          y: [],
          type: 'scatter',
          mode: 'lines',
          line: {color: '#d8f41d'}
        }], {
          margin: {t: 0, r: 0, b: 20, l: 30},
          paper_bgcolor: '#111',
          plot_bgcolor: '#111',
          font: {color: '#888'},
          xaxis: {showticklabels: false}
        }, config);
      });
      
      // Accelerometer
      Plotly.newPlot('accelerometer', [
        {y: [], name: 'X', type: 'scatter', mode: 'lines', line: {color: '#ff4444'}},
        {y: [], name: 'Y', type: 'scatter', mode: 'lines', line: {color: '#44ff44'}},
        {y: [], name: 'Z', type: 'scatter', mode: 'lines', line: {color: '#4444ff'}}
      ], {
        margin: {t: 0, r: 0, b: 20, l: 30},
        paper_bgcolor: '#111',
        plot_bgcolor: '#111',
        font: {color: '#888'},
        showlegend: true,
        legend: {x: 0.7, y: 1}
      }, config);
      
      // Gyroscope
      Plotly.newPlot('gyroscope', [
        {y: [], name: 'X', type: 'scatter', mode: 'lines', line: {color: '#ff4444'}},
        {y: [], name: 'Y', type: 'scatter', mode: 'lines', line: {color: '#44ff44'}},
        {y: [], name: 'Z', type: 'scatter', mode: 'lines', line: {color: '#4444ff'}}
      ], {
        margin: {t: 0, r: 0, b: 20, l: 30},
        paper_bgcolor: '#111',
        plot_bgcolor: '#111',
        font: {color: '#888'}
      }, config);
      
      // RGB Color Picker
      const colorPicker = new iro.ColorPicker("#color-picker-container", {
        width: 150,
        color: "#ffffff"
      });
      
      colorPicker.on('color:change', async function(color) {
        if (!AppState.characteristics.RGB_LED) return;
        
        const rgb = color.rgb;
        const data = new Uint8Array([rgb.r, rgb.g, rgb.b]);
        try {
          await AppState.characteristics.RGB_LED.writeValue(data);
        } catch (e) {
          console.error('Failed to write RGB:', e);
        }
      });
      
      // 3D Model
      init3DModel();
    }

    function init3DModel() {
      const container = document.getElementById('3d');
      const width = 192;
      const height = 180;
      
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      
      const light = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(light);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 1, 1);
      scene.add(directionalLight);
      
      const loader = new THREE.GLTFLoader();
      loader.load(
        'https://raw.githubusercontent.com/arduino/ArduinoAI/main/NiclaSenseME-dashboard/models/niclaSenseME.glb',
        (gltf) => {
          mesh = gltf.scene;
          mesh.scale.set(100, 100, 100);
          scene.add(mesh);
          camera.position.z = 2;
          animate3D();
        },
        undefined,
        (error) => console.error('Error loading 3D model:', error)
      );
    }

    function animate3D() {
      requestAnimationFrame(animate3D);
      renderer.render(scene, camera);
    }

    function updateSensorDisplay(sensor, value) {
      const maxPoints = 50;
      
      switch(sensor) {
        case 'temperature':
          document.getElementById('temperature-value').textContent = value.toFixed(2);
          sensorData.temperature.push(value);
          if (sensorData.temperature.length > maxPoints) sensorData.temperature.shift();
          Plotly.update('temperature', {y: [sensorData.temperature]}, {}, [0]);
          break;
          
        case 'humidity':
          document.getElementById('humidity-value').textContent = value;
          sensorData.humidity.push(value);
          if (sensorData.humidity.length > maxPoints) sensorData.humidity.shift();
          Plotly.update('humidity', {y: [sensorData.humidity]}, {}, [0]);
          break;
          
        case 'pressure':
          document.getElementById('pressure-value').textContent = value.toFixed(2);
          sensorData.pressure.push(value);
          if (sensorData.pressure.length > maxPoints) sensorData.pressure.shift();
          Plotly.update('pressure', {y: [sensorData.pressure]}, {}, [0]);
          break;
          
        case 'accelerometer':
          if (!sensorData.accel) sensorData.accel = {x: [], y: [], z: []};
          sensorData.accel.x.push(value.x);
          sensorData.accel.y.push(value.y);
          sensorData.accel.z.push(value.z);
          if (sensorData.accel.x.length > maxPoints) {
            sensorData.accel.x.shift();
            sensorData.accel.y.shift();
            sensorData.accel.z.shift();
          }
          Plotly.update('accelerometer', {
            y: [sensorData.accel.x, sensorData.accel.y, sensorData.accel.z]
          }, {}, [0, 1, 2]);
          break;
          
        case 'gyroscope':
          document.getElementById('gyroscope-value').textContent = 
            \`x:\${value.x.toFixed(1)} y:\${value.y.toFixed(1)} z:\${value.z.toFixed(1)}\`;
          if (!sensorData.gyro) sensorData.gyro = {x: [], y: [], z: []};
          sensorData.gyro.x.push(value.x);
          sensorData.gyro.y.push(value.y);
          sensorData.gyro.z.push(value.z);
          if (sensorData.gyro.x.length > maxPoints) {
            sensorData.gyro.x.shift();
            sensorData.gyro.y.shift();
            sensorData.gyro.z.shift();
          }
          Plotly.update('gyroscope', {
            y: [sensorData.gyro.x, sensorData.gyro.y, sensorData.gyro.z]
          }, {}, [0, 1, 2]);
          break;
          
        case 'quaternion':
          document.getElementById('xQuaternion').textContent = \`x: \${value.x.toFixed(2)}\`;
          document.getElementById('yQuaternion').textContent = \`y: \${value.y.toFixed(2)}\`;
          document.getElementById('zQuaternion').textContent = \`z: \${value.z.toFixed(2)}\`;
          if (mesh) {
            mesh.quaternion.set(value.x, value.y, value.z, value.w);
          }
          break;
          
        case 'bsec':
          document.getElementById('bsec-value').textContent = value.toFixed(0);
          sensorData.bsec.push(value);
          if (sensorData.bsec.length > maxPoints) sensorData.bsec.shift();
          Plotly.update('bsec', {y: [sensorData.bsec]}, {}, [0]);
          break;
          
        case 'co2':
          document.getElementById('co2-value').textContent = value;
          sensorData.co2.push(value);
          if (sensorData.co2.length > maxPoints) sensorData.co2.shift();
          Plotly.update('co2', {y: [sensorData.co2]}, {}, [0]);
          break;
          
        case 'gas':
          document.getElementById('gas-value').textContent = value;
          sensorData.gas.push(value);
          if (sensorData.gas.length > maxPoints) sensorData.gas.shift();
          Plotly.update('gas', {y: [sensorData.gas]}, {}, [0]);
          break;
      }
    }

    function showMessage(message) {
      const snackbar = document.getElementById('snackbar');
      snackbar.textContent = message;
      snackbar.style.visibility = 'visible';
      setTimeout(() => {
        snackbar.style.visibility = 'hidden';
      }, 3000);
    }

    // ==========================================
    // HISTORY PAGE
    // ==========================================
    
    async function loadHistoryPage() {
      try {
        const response = await fetch('/api/sessions');
        const sessions = await response.json();
        
        const container = document.getElementById('sessionsList');
        
        if (sessions.length === 0) {
          container.innerHTML = '<p style="text-align: center; color: #888;">No sessions recorded yet</p>';
          return;
        }
        
        container.innerHTML = sessions.map(session => \`
          <div class="session-item">
            <div class="session-header">
              <span class="session-id">Session #\${session.id}</span>
              <span class="session-time">\${new Date(session.started_at).toLocaleString()}</span>
            </div>
            <div class="session-stats">
              <span>Duration: \${session.duration || 'N/A'} min</span>
              <span>Status: \${session.ended_at ? 'Completed' : 'Active'}</span>
            </div>
          </div>
        \`).join('');
        
      } catch (error) {
        console.error('Failed to load history:', error);
        document.getElementById('sessionsList').innerHTML = 
          '<p style="text-align: center; color: #f44;">Failed to load sessions</p>';
      }
    }

    // ==========================================
    // ANALYTICS PAGE
    // ==========================================
    
    async function loadAnalyticsPage() {
      try {
        const response = await fetch('/api/analytics/summary');
        const summary = await response.json();
        
        document.getElementById('totalSessions').textContent = summary.total_sessions || 0;
        document.getElementById('totalReadings').textContent = summary.total_readings || 0;
        document.getElementById('avgDuration').textContent = 
          (summary.avg_duration_minutes?.toFixed(1) || '0') + ' min';
        document.getElementById('activeSessions').textContent = summary.active_sessions || 0;
        
        // Load sensor averages
        const chartsContainer = document.getElementById('analyticsCharts');
        
        if (summary.sensor_averages && summary.sensor_averages.length > 0) {
          const chartsHTML = summary.sensor_averages.map(sensor => \`
            <div class="chart-container">
              <h3 style="color: #d8f41d; margin-bottom: 15px;">\${sensor.sensor_type}</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div class="stat-card">
                  <div class="stat-label">Average</div>
                  <div class="stat-value" style="font-size: 24px;">\${sensor.avg_value?.toFixed(2) || '-'}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Min</div>
                  <div class="stat-value" style="font-size: 24px;">\${sensor.min_value?.toFixed(2) || '-'}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Max</div>
                  <div class="stat-value" style="font-size: 24px;">\${sensor.max_value?.toFixed(2) || '-'}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Readings</div>
                  <div class="stat-value" style="font-size: 24px;">\${sensor.reading_count || 0}</div>
                </div>
              </div>
            </div>
          \`).join('');
          
          chartsContainer.innerHTML = chartsHTML;
        } else {
          chartsContainer.innerHTML = '<p style="text-align: center; color: #888;">No sensor data available yet</p>';
        }
        
      } catch (error) {
        console.error('Failed to load analytics:', error);
        document.getElementById('analyticsCharts').innerHTML = 
          '<p style="text-align: center; color: #f44;">Failed to load analytics</p>';
      }
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🚀 Nicla Sensor Suite initializing...');
      
      // Initialize router
      initRouter();
      
      // Pair button
      document.getElementById('pairButton').addEventListener('click', async () => {
        if (AppState.isConnected) {
          if (AppState.device && AppState.device.gatt.connected) {
            AppState.device.gatt.disconnect();
          }
        } else {
          await connectDevice();
        }
      });
      
      // Record button
      document.getElementById('recordButton').addEventListener('click', toggleRecording);
      
      console.log('✅ Initialization complete');
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (AppState.isRecording) {
        flushDataBuffer();
      }
    });
  </script>
</body>
</html>
`;
