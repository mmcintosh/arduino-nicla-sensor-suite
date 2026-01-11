// Dashboard.js - Enhanced version with recording capabilities
// Based on the original demo but with database storage

var maxRecords = 64;
var currentSession = null;
var isRecording = false;
var recordingStartTime = null;
var dataPointsStored = 0;
var batchBuffer = [];
const BATCH_SIZE = 10; // Send data in batches every 10 readings

// Device and connection state
var connectedDevice = null;

var NiclaSenseME = {
  temperature: {
    uuid: '19b10000-2001-537e-4f6c-d104768a1214',
    properties: ['BLERead'],
    structure: ['Float32'],
    data: { temperature: [] }
  },
  humidity: {
    uuid: '19b10000-3001-537e-4f6c-d104768a1214',
    properties: ['BLERead'],
    structure: ['Uint8'],
    data: { humidity: [] }
  },
  pressure: {
    uuid: '19b10000-4001-537e-4f6c-d104768a1214',
    properties: ['BLERead'],
    structure: ['Float32'],
    data: { pressure: [] }
  },
  accelerometer: {
    uuid: '19b10000-5001-537e-4f6c-d104768a1214',
    properties: ['BLENotify'],
    structure: ['Float32', 'Float32', 'Float32'],
    data: { 'Ax': [], 'Ay': [], 'Az': [] }
  },
  gyroscope: {
    uuid: '19b10000-6001-537e-4f6c-d104768a1214',
    properties: ['BLENotify'],
    structure: ['Float32', 'Float32', 'Float32'],
    data: { 'x': [], 'y': [], 'z': [] }
  },
  led: {
    uuid: '19b10000-8001-537e-4f6c-d104768a1214',
    properties: ['BLEWrite'],
    structure: ['Uint8', 'Uint8', 'Uint8'],
    data: { 'R': [], 'G': [], 'B': [] },
    writeBusy: false,
    writeValue: null
  },
  quaternion: {
    uuid: '19b10000-7001-537e-4f6c-d104768a1214',
    properties: ['BLENotify'],
    structure: ['Float32', 'Float32', 'Float32', 'Float32'],
    data: { 'x': [], 'y': [], 'z': [], 'w': [] },
    writeBusy: false,
    writeValue: null
  },
  bsec: {
    uuid: '19b10000-9001-537e-4f6c-d104768a1214',
    properties: ['BLERead'],
    structure: ['Float32'],
    data: { 'bsec': [] }
  },
  co2: {
    uuid: '19b10000-9002-537e-4f6c-d104768a1214',
    properties: ['BLERead'],
    structure: ['Uint32'],
    data: { 'co2': [] }
  },
  gas: {
    uuid: '19b10000-9003-537e-4f6c-d104768a1214',
    properties: ['BLERead'],
    structure: ['Uint32'],
    data: { 'gas': [] }
  }
};

const sensors = Object.keys(NiclaSenseME);
const SERVICE_UUID = '19b10000-0000-537e-4f6c-d104768a1214';

// UI elements
const pairButton = document.getElementById('pairButton');
const BLEstatus = document.getElementById('bluetooth');
const startSessionBtn = document.getElementById('startSessionBtn');
const stopSessionBtn = document.getElementById('stopSessionBtn');
const sessionModal = document.getElementById('sessionModal');
const sessionForm = document.getElementById('sessionForm');
const cancelSessionBtn = document.getElementById('cancelSessionBtn');
const sessionStatus = document.getElementById('sessionStatus');
const recordingDuration = document.getElementById('recordingDuration');
const dataPointsCount = document.getElementById('dataPointsCount');
const exportCurrentBtn = document.getElementById('exportCurrentBtn');

// Check browser support
if ("bluetooth" in navigator) {
  pairButton.addEventListener('click', connect);
  snack('Upload the Arduino sketch first &nbsp;&nbsp; <a href="https://create.arduino.cc/editor/FT-CONTENT/333e2e07-ecc4-414c-bf08-005b611ddd75/preview">OPEN SKETCH</a>', 1);
} else {
  msg("Browser not supported");
  snack("Error: This browser doesn't support Web Bluetooth. Try using Chrome.", 1);
  pairButton.disabled = true;
}

// Session management event listeners
startSessionBtn.addEventListener('click', () => {
  sessionModal.style.display = 'flex';
});

cancelSessionBtn.addEventListener('click', () => {
  sessionModal.style.display = 'none';
  sessionForm.reset();
});

sessionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await startRecordingSession();
});

stopSessionBtn.addEventListener('click', async () => {
  await stopRecordingSession();
});

exportCurrentBtn.addEventListener('click', async () => {
  if (!currentSession) {
    snack('No active session to export', 1);
    return;
  }
  window.open(`/api/analytics/export/${currentSession.id}?format=csv`, '_blank');
});

// Start a new recording session
async function startRecordingSession() {
  const name = document.getElementById('sessionName').value;
  const notes = document.getElementById('sessionNotes').value;
  const tagsInput = document.getElementById('sessionTags').value;
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

  try {
    const response = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        notes,
        tags,
        device_name: connectedDevice?.name || 'Unknown',
        device_id: connectedDevice?.id || null
      })
    });

    const result = await response.json();
    
    if (result.success) {
      currentSession = result.session;
      isRecording = true;
      recordingStartTime = Date.now();
      dataPointsStored = 0;

      sessionModal.style.display = 'none';
      sessionForm.reset();
      startSessionBtn.style.display = 'none';
      stopSessionBtn.style.display = 'block';
      pairButton.disabled = false;
      
      sessionStatus.innerHTML = `🔴 Recording: ${currentSession.name}`;
      updateRecordingDuration();
      
      snack(`Recording session "${name}" started`, 0);
    } else {
      snack('Failed to start session', 1);
    }
  } catch (error) {
    console.error('Error starting session:', error);
    snack('Error starting session', 1);
  }
}

// Stop the recording session
async function stopRecordingSession() {
  if (!currentSession) return;

  // Flush any remaining data in buffer
  if (batchBuffer.length > 0) {
    await sendBatchToServer();
  }

  try {
    const response = await fetch(`/api/sessions/${currentSession.id}/stop`, {
      method: 'POST'
    });

    const result = await response.json();
    
    if (result.success) {
      isRecording = false;
      const sessionName = currentSession.name;
      currentSession = null;
      recordingStartTime = null;

      startSessionBtn.style.display = 'block';
      stopSessionBtn.style.display = 'none';
      pairButton.disabled = true;
      
      sessionStatus.innerHTML = 'No active session';
      recordingDuration.innerHTML = '';
      
      snack(`Recording session "${sessionName}" stopped. ${dataPointsStored} data points saved.`, 0);
    }
  } catch (error) {
    console.error('Error stopping session:', error);
    snack('Error stopping session', 1);
  }
}

// Update recording duration display
function updateRecordingDuration() {
  if (!isRecording || !recordingStartTime) return;
  
  const duration = Date.now() - recordingStartTime;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  let durationStr = '';
  if (hours > 0) {
    durationStr = `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    durationStr = `${minutes}m ${seconds % 60}s`;
  } else {
    durationStr = `${seconds}s`;
  }

  recordingDuration.innerHTML = durationStr;
  
  setTimeout(updateRecordingDuration, 1000);
}

// Top middle information label
function msg(m) {
  BLEstatus.innerHTML = m;
}

// Top left pop up message
function snack(m, warningLevel) {
  const snackBar = document.getElementById("snackbar");
  snackBar.style.visibility = "visible";
  snackBar.className = "show";

  const warnEmoji = warningLevel ? '☝️  ' : '✅  ';

  setTimeout(() => {
    snackBar.className = snackBar.className.replace("show", "");
  }, 501);
  
  snackBar.innerHTML = warnEmoji + m + ' <span onClick="hideSnack()" style="cursor:pointer; margin-left: 15px"> ✖ </span>';
}

function hideSnack() {
  const snackBar = document.getElementById("snackbar");
  snackBar.style.visibility = "hidden";
}

// Connect to device via Web Bluetooth
async function connect() {
  if (!currentSession) {
    snack('Please start a recording session first', 1);
    return;
  }

  pairButton.className = 'btn-connect pairing';
  pairButton.innerHTML = "PAIRING";
  msg('Requesting device...');

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }]
    });

    connectedDevice = device;
    msg('Connecting to device...');
    device.addEventListener('gattserverdisconnected', onDisconnected);
    const server = await device.gatt.connect();

    msg('Getting primary service...');
    const service = await server.getPrimaryService(SERVICE_UUID);

    // Set up the characteristics
    for (const sensor of sensors) {
      msg('Characteristic ' + sensor + "...");
      NiclaSenseME[sensor].characteristic = await service.getCharacteristic(NiclaSenseME[sensor].uuid);
      
      // Set up notification
      if (NiclaSenseME[sensor].properties.includes("BLENotify")) {
        NiclaSenseME[sensor].characteristic.addEventListener('characteristicvaluechanged', 
          function (event) { handleIncoming(NiclaSenseME[sensor], event.target.value); });
        await NiclaSenseME[sensor].characteristic.startNotifications();
      }
      
      // Set up polling for read
      if (NiclaSenseME[sensor].properties.includes("BLERead")) {
        NiclaSenseME[sensor].polling = setInterval(function () {
          NiclaSenseME[sensor].characteristic.readValue().then(function (data) { 
            handleIncoming(NiclaSenseME[sensor], data); 
          });
        }, 500);
      }

      NiclaSenseME[sensor].rendered = false;
    }
    
    pairButton.className = 'btn-connect connected';
    pairButton.innerHTML = "PAIRED";
    msg('Connected - Data recording in progress');
    snack('Connected to device', 0);

    initColorPicker();
  } catch (error) {
    console.error('Connection error:', error);
    pairButton.className = 'btn-connect';
    pairButton.innerHTML = "CONNECT";
    msg('Connection failed');
    snack('Failed to connect: ' + error.message, 1);
  }
}

// Handle incoming sensor data
function handleIncoming(sensor, dataReceived) {
  const columns = Object.keys(sensor.data);
  const typeMap = {
    "Uint8": { fn: DataView.prototype.getUint8, bytes: 1 },
    "Uint16": { fn: DataView.prototype.getUint16, bytes: 2 },
    "Uint32": { fn: DataView.prototype.getUint32, bytes: 4 },
    "Int16": { fn: DataView.prototype.getInt16, bytes: 2 },
    "Float32": { fn: DataView.prototype.getFloat32, bytes: 4 }
  };
  
  var packetPointer = 0, i = 0;
  const sensorValues = {};

  // Read each sensor value in the BLE packet
  sensor.structure.forEach(function (dataType) {
    var dataViewFn = typeMap[dataType].fn.bind(dataReceived);
    var unpackedValue = dataViewFn(packetPointer, true);
    
    // Push sensor reading onto data array
    sensor.data[columns[i]].push(unpackedValue);
    sensorValues[columns[i]] = unpackedValue;
    
    // Keep array at buffer size
    if (sensor.data[columns[i]].length > maxRecords) { 
      sensor.data[columns[i]].shift(); 
    }
    
    packetPointer += typeMap[dataType].bytes;
    i++;
  });
  
  sensor.rendered = false;

  // Store data if recording
  if (isRecording && currentSession) {
    storeSensorData(sensor, sensorValues);
  }
}

// Store sensor data to database
async function storeSensorData(sensor, values) {
  const sensorName = Object.keys(NiclaSenseME).find(key => NiclaSenseME[key] === sensor);
  
  // Build reading object
  const reading = {
    session_id: currentSession.id,
    timestamp: Date.now()
  };

  // Map sensor values to database fields
  if (sensorName === 'accelerometer') {
    reading.accelerometer = { x: values.Ax, y: values.Ay, z: values.Az };
  } else if (sensorName === 'gyroscope') {
    reading.gyroscope = { x: values.x, y: values.y, z: values.z };
  } else if (sensorName === 'quaternion') {
    reading.quaternion = { x: values.x, y: values.y, z: values.z, w: values.w };
  } else if (sensorName === 'temperature') {
    reading.temperature = values.temperature;
  } else if (sensorName === 'humidity') {
    reading.humidity = values.humidity;
  } else if (sensorName === 'pressure') {
    reading.pressure = values.pressure;
  } else if (sensorName === 'bsec') {
    reading.bsec = values.bsec;
  } else if (sensorName === 'co2') {
    reading.co2 = values.co2;
  } else if (sensorName === 'gas') {
    reading.gas = values.gas;
  }

  // Add to batch buffer
  batchBuffer.push(reading);

  // Send batch when buffer is full
  if (batchBuffer.length >= BATCH_SIZE) {
    await sendBatchToServer();
  }
}

// Send batch of readings to server
async function sendBatchToServer() {
  if (batchBuffer.length === 0) return;

  const readings = [...batchBuffer];
  batchBuffer = [];

  try {
    const response = await fetch('/api/sensor-data/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readings })
    });

    if (response.ok) {
      dataPointsStored += readings.length;
      dataPointsCount.innerHTML = `${dataPointsStored} readings stored`;
    } else {
      console.error('Failed to store batch');
      // Put readings back in buffer to retry
      batchBuffer = [...readings, ...batchBuffer];
    }
  } catch (error) {
    console.error('Error storing batch:', error);
    // Put readings back in buffer to retry
    batchBuffer = [...readings, ...batchBuffer];
  }
}

// Handle device disconnection
function onDisconnected(event) {
  const device = event.target;
  pairButton.className = 'btn-connect';
  pairButton.innerHTML = "CONNECT";
  connectedDevice = null;
  
  snack("Device disconnected", 1);
  
  // Clear read polling
  for (const sensor of sensors) {
    if (typeof NiclaSenseME[sensor].polling !== 'undefined') {
      clearInterval(NiclaSenseME[sensor].polling);
    }
  }
  
  // Clear color picker
  const colorPickerElement = document.getElementById("color-picker-container");
  if (colorPickerElement.firstChild) {
    colorPickerElement.removeChild(colorPickerElement.firstChild);
  }

  msg("Disconnected - Click connect to reconnect");

  // Set LED to red on 3D model
  if (typeof ledLight !== 'undefined') {
    ledLight.color.setRGB(255, 0, 0);
    ledMaterial.color.setRGB(255, 0, 0);
  }
}

// BLE write function
function BLEwriteTo(sensor) {
  if (NiclaSenseME[sensor].writeBusy) return;
  NiclaSenseME[sensor].writeBusy = true;
  NiclaSenseME[sensor].characteristic.writeValue(NiclaSenseME[sensor].writeValue)
    .then(_ => {
      NiclaSenseME[sensor].writeBusy = false;
    })
    .catch(error => {
      console.log(error);
      NiclaSenseME[sensor].writeBusy = false;
    });
}

// Color picker initialization
function initColorPicker() {
  var rgb_values = Uint8Array.of(0, 0, 255);
  NiclaSenseME['led'].writeValue = rgb_values;
  BLEwriteTo('led');
  
  if (typeof ledMaterial !== 'undefined' && typeof ledLight !== 'undefined') {
    ledMaterial.color.setRGB(0, 0, 255);
    ledLight.color.setRGB(0, 0, 255);
  }

  NiclaSenseME.led.colorPicker = new iro.ColorPicker("#color-picker-container", {
    width: 150,
    color: "rgb(0, 0, 255)",
    borderWidth: 1,
    borderColor: "#fff",
    sliderHeight: 6,
    sliderMargin: 6
  });
  
  NiclaSenseME.led.colorPicker.on('color:change', updateModelLed);
  
  function updateModelLed(color) {
    if (typeof ledLight !== 'undefined' && typeof ledMaterial !== 'undefined') {
      ledLight.color.setHex("0x" + color.hexString.substring(1, 7));
      ledMaterial.color.set(color.hexString);
    }
    var rgb_values = Uint8Array.of(color.rgb.r, color.rgb.g, color.rgb.b);
    NiclaSenseME['led'].writeValue = rgb_values;
    BLEwriteTo('led');
  }
}

// Graphing functions
const colors = ["#FF355E", "#FD5B20", "#FF6037", "#FF9966", "#FF9933", "#FFCC33", "#FFFF66", "#FFFF66", "#CCFF00", "#66FF66", "#AAF0D1", "#50BFE6", "#FF6EFF", "#EE34D2", "#FF00CC", "#FF00CC"];
var colorIndex = 0;

function initGraph(sensor) {
  var title = sensor;
  var series = Object.keys(NiclaSenseME[sensor].data);
  var format = [];
  
  series.forEach(function (item) {
    colorIndex++;
    if (colorIndex >= colors.length) { colorIndex = 0; }
    format.push({
      y: [],
      name: item,
      mode: 'lines',
      width: 1,
      line: { width: 1, color: colors[colorIndex] }
    });
  });

  Plotly.plot(title, format, {
    plot_bgcolor: '#111111',
    paper_bgcolor: '#111111',
    margin: { l: 8, r: 8, b: 18, t: 18 },
    showlegend: false,
    yaxis: { 'showticklabels': false },
    xaxis: {
      'range': [0, maxRecords],
      'showticklabels': false,
      'autorange': false,
      'showgrid': true,
      'zeroline': true,
      tickfont: { size: 8 }
    }
  });
}

// 3D model setup
var renderer = new THREE.WebGLRenderer();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, 1, 1, 10000);
var arduinoModel, ledObject, ledMaterial, ledLight;

function init3D() {
  var container = document.getElementById('3d');
  var loader = new THREE.GLTFLoader();
  var canvasDigits = document.getElementById('canvasDigits');
  scene.background = new THREE.Color(0x58585A);
  renderer.setSize(177, 177);
  renderer.setPixelRatio(4);

  container.insertBefore(renderer.domElement, canvasDigits);
  renderer.domElement.style.margin = "9px";
  
  loader.load('/models/niclaSenseME.glb',
    function (gltf) {
      arduinoModel = gltf.scene;
      scene.add(arduinoModel);

      // LED
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      ledMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
      ledObject = new THREE.Mesh(geometry, ledMaterial);
      ledObject.position.set(9, -10, -1);
      
      ledLight = new THREE.PointLight(0x111111, 3, 40);
      ledLight.color.setRGB(0, 255, 0);
      ledLight.position.set(9, -10, -1.2);
      ledMaterial.color.setRGB(0, 255, 0);

      arduinoModel.add(ledObject);
      arduinoModel.add(ledLight);
      arduinoModel.rotation.x = 90 * (Math.PI / 180);

      // Lighting
      const light = new THREE.DirectionalLight(0xFFFFFF, 1);
      light.position.set(-20, 100, -10);
      light.target.position.set(0, 0, 0);
      scene.add(light);
      scene.add(light.target);
      
      var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
      scene.add(hemiLight);

      // Camera
      camera.position.set(0, 25, 0);
      camera.rotation.y = Math.PI;
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      renderer.render(scene, camera);
    }
  );
}

Array.prototype.latest = function () { return this[this.length - 1]; };

function graph(sensor) {
  var labels = Object.keys(NiclaSenseME[sensor].data);
  var values = [];
  labels.forEach(function (label) {
    values.push(NiclaSenseME[sensor].data[label]);
  });
  Plotly.restyle(sensor, { y: values });
}

function digit(sensor) {
  const value = NiclaSenseME[sensor].data[sensor].latest();
  const div = document.getElementById(sensor + "-value");
  if (!Number.isNaN(value)) { div.innerHTML = Math.round(value * 10) / 10; }
}

function update3d(sensor) {
  var x = NiclaSenseME['quaternion'].data.x.latest();
  var y = NiclaSenseME['quaternion'].data.y.latest();
  var z = NiclaSenseME['quaternion'].data.z.latest();
  var w = NiclaSenseME['quaternion'].data.w.latest();

  const quaternion = new THREE.Quaternion(x, y, z, w);
  quaternion.normalize();
  arduinoModel.setRotationFromQuaternion(quaternion);
  renderer.render(scene, camera);

  var rotation = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ');
  document.getElementById('xQuaternion').innerHTML = "x: " + Math.round(rotation.x * 180 / Math.PI + 180);
  document.getElementById('yQuaternion').innerHTML = "y: " + Math.round(rotation.y * 180 / Math.PI + 180);
  document.getElementById('zQuaternion').innerHTML = "z: " + Math.round(rotation.z * 180 / Math.PI + 180);
}

var skip_frame = false;
function draw() {
  function updateViz(sensor, fns) {
    if (NiclaSenseME[sensor].rendered == false) {
      fns.forEach(function (fn) {
        fn(sensor);
      });
      NiclaSenseME[sensor].rendered = true;
    }
  }
  
  if (skip_frame == false) {
    updateViz('accelerometer', [graph]);
    updateViz('gyroscope', [graph]);
    updateViz('temperature', [digit, graph]);
    updateViz('humidity', [digit, graph]);
    updateViz('pressure', [digit, graph]);
    updateViz('bsec', [digit, graph]);
    updateViz('co2', [digit, graph]);
    updateViz('gas', [digit, graph]);
    updateViz('quaternion', [update3d]);
    skip_frame = true;
  } else { 
    skip_frame = false; 
  }
  requestAnimationFrame(draw);
}

// Initialize everything
initGraph('gyroscope');
initGraph('accelerometer');
initGraph('temperature');
initGraph('humidity');
initGraph('pressure');
initGraph('bsec');
initGraph('co2');
initGraph('gas');
init3D();
requestAnimationFrame(draw);

// Periodically send remaining buffered data
setInterval(() => {
  if (isRecording && batchBuffer.length > 0) {
    sendBatchToServer();
  }
}, 5000);
