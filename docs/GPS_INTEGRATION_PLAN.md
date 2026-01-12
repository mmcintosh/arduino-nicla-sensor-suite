# GPS Integration Implementation Plan

**Goal:** Integrate Arduino Nicla Sense ME + MKR GPS Shield + MKR Board (WiFi/Cellular/LoRa) into existing web platform for georeferenced sensor data collection.

---

## Phase 1: Hardware Setup & Testing (Days 1-2)

### Hardware Stack Configuration

**Recommended Stack Order (Bottom to Top):**
```
┌─────────────────────────┐
│  MKR GPS Shield         │  ← Top layer (GPS antenna needs clear sky view)
├─────────────────────────┤
│  MKR WiFi 1010          │  ← Host board (WiFi connectivity)
│  (or GSM/NB/WAN)        │
├─────────────────────────┤
│  Nicla Sense ME         │  ← Bottom layer (via ESLOV cable - RECOMMENDED)
└─────────────────────────┘
```

### Connection Method: ESLOV Cable (Recommended)

**Why ESLOV Cable Instead of Direct Stacking:**
- ✅ Avoids pin conflicts between GPS Shield and Nicla
- ✅ More stable I2C communication
- ✅ Easier debugging and testing
- ✅ Flexible physical arrangement
- ✅ No reset conflicts

**Physical Connections:**
1. **Nicla Sense ME → MKR Board:** ESLOV cable (I2C)
2. **MKR GPS Shield → MKR Board:** Direct stack on headers
3. **GPS Shield Communication:** Software Serial (D2/D3 pins, DLINE mode)
4. **Power:** USB to MKR board (provides power to all components)

**Hardware Switch Settings:**
- GPS Shield: Set physical switch to **DLINE** mode (Software Serial)
- This ensures GPS uses D2/D3 pins, leaving I2C (SCL/SDA) free for Nicla

---

## Phase 2: Arduino Firmware Development (Days 3-5)

### Required Arduino Libraries

```cpp
// Install via Arduino Library Manager
- Arduino_BHY2          // Nicla Sense ME sensor library
- Arduino_BHY2Host      // Host communication with Nicla
- TinyGPSPlus           // GPS parsing library
- ArduinoHttpClient     // For API requests
- WiFiNINA              // For MKR WiFi 1010
// OR
- MKRGSM                // For MKR GSM 1400
- MKRNB                 // For MKR NB 1500
- LoRa                  // For MKR WAN 1310
```

### Firmware Architecture

**1. Nicla Sense ME Firmware** (`NiclaSenseME.ino` - NO CHANGES NEEDED)
- Continue using existing BLE-enabled sketch
- Acts as I2C peripheral to MKR host
- Streams sensor data to MKR board via ESLOV/I2C

**2. MKR Host Firmware** (`MKR_GPS_Host.ino` - NEW SKETCH)

```cpp
/*
 * MKR GPS + Nicla Sense ME Host
 * Collects sensor data from Nicla via I2C
 * Collects GPS data from GPS Shield via Software Serial
 * Transmits combined data to cloud platform via WiFi
 */

#include <Arduino_BHY2Host.h>
#include <TinyGPSPlus.h>
#include <SoftwareSerial.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// Configuration
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASS = "your-wifi-password";
const char* API_HOST = "sensorsuites.com"; // or localhost:8787 for testing
const int API_PORT = 443; // 443 for HTTPS, 8787 for local
const char* API_ENDPOINT = "/api/sensor-data/batch";

// GPS Setup (Software Serial on D2/D3)
SoftwareSerial gpsSerial(2, 3); // RX, TX
TinyGPSPlus gps;

// Nicla Sense ME Host Setup
SensorXYZ accel(SENSOR_ID_ACC);
SensorXYZ gyro(SENSOR_ID_GYRO);
SensorQuaternion quaternion(SENSOR_ID_RV);
Sensor temp(SENSOR_ID_TEMP);
Sensor humidity(SENSOR_ID_HUM);
Sensor pressure(SENSOR_ID_BARO);
Sensor gas(SENSOR_ID_GAS);
SensorBSEC bsec(SENSOR_ID_BSEC);

// WiFi & HTTP Client
WiFiSSLClient wifiClient;
HttpClient httpClient = HttpClient(wifiClient, API_HOST, API_PORT);

// Data buffer for batch transmission
const int BATCH_SIZE = 10;
int batchCount = 0;
String sessionId = "";

// GPS data
double latitude = 0.0;
double longitude = 0.0;
double altitude = 0.0;
double speed = 0.0;
double heading = 0.0;
int satellites = 0;
bool gpsValid = false;

void setup() {
  Serial.begin(115200);
  while (!Serial);
  
  Serial.println("MKR GPS + Nicla Host Starting...");
  
  // Initialize GPS
  gpsSerial.begin(9600);
  Serial.println("GPS initialized on D2/D3");
  
  // Initialize Nicla Sense ME via ESLOV
  Serial.println("Initializing Nicla Sense ME via ESLOV...");
  BHY2Host.begin(false, NICLA_VIA_ESLOV);
  
  // Enable sensors
  accel.begin();
  gyro.begin();
  quaternion.begin();
  temp.begin();
  humidity.begin();
  pressure.begin();
  gas.begin();
  bsec.begin();
  
  Serial.println("All sensors initialized");
  
  // Connect to WiFi
  connectWiFi();
  
  // Start a session
  startSession();
  
  Serial.println("Setup complete!");
}

void loop() {
  // Update GPS data
  updateGPS();
  
  // Update Nicla sensor data
  BHY2Host.update();
  
  // Read and transmit sensor data
  if (accel.available() || gyro.available()) {
    collectAndSendData();
  }
  
  // Print GPS status every 5 seconds
  static unsigned long lastGPSStatus = 0;
  if (millis() - lastGPSStatus > 5000) {
    printGPSStatus();
    lastGPSStatus = millis();
  }
}

void updateGPS() {
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    if (gps.encode(c)) {
      // GPS data updated
      if (gps.location.isValid()) {
        latitude = gps.location.lat();
        longitude = gps.location.lng();
        altitude = gps.altitude.meters();
        speed = gps.speed.kmph();
        heading = gps.course.deg();
        satellites = gps.satellites.value();
        gpsValid = true;
      }
    }
  }
}

void collectAndSendData() {
  // Create JSON payload
  StaticJsonDocument<1024> doc;
  
  doc["session_id"] = sessionId;
  doc["timestamp"] = millis();
  doc["device_name"] = "MKR GPS Unit";
  
  // GPS data
  if (gpsValid) {
    JsonObject gpsData = doc.createNestedObject("gps");
    gpsData["latitude"] = latitude;
    gpsData["longitude"] = longitude;
    gpsData["altitude"] = altitude;
    gpsData["speed"] = speed;
    gpsData["heading"] = heading;
    gpsData["satellites"] = satellites;
  }
  
  // Sensor data
  if (accel.available()) {
    doc["accel_x"] = accel.x();
    doc["accel_y"] = accel.y();
    doc["accel_z"] = accel.z();
  }
  
  if (gyro.available()) {
    doc["gyro_x"] = gyro.x();
    doc["gyro_y"] = gyro.y();
    doc["gyro_z"] = gyro.z();
  }
  
  if (quaternion.available()) {
    doc["quat_x"] = quaternion.x();
    doc["quat_y"] = quaternion.y();
    doc["quat_z"] = quaternion.z();
    doc["quat_w"] = quaternion.w();
  }
  
  if (temp.available()) {
    doc["temperature"] = temp.value();
  }
  
  if (humidity.available()) {
    doc["humidity"] = humidity.value();
  }
  
  if (pressure.available()) {
    doc["pressure"] = pressure.value();
  }
  
  if (gas.available()) {
    doc["gas"] = gas.value();
  }
  
  if (bsec.available()) {
    doc["air_quality"] = bsec.iaq;
    doc["co2"] = bsec.co2_eq;
  }
  
  // Send to API
  sendToAPI(doc);
}

void sendToAPI(JsonDocument& doc) {
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  httpClient.beginRequest();
  httpClient.post(API_ENDPOINT);
  httpClient.sendHeader("Content-Type", "application/json");
  httpClient.sendHeader("Content-Length", jsonPayload.length());
  httpClient.beginBody();
  httpClient.print(jsonPayload);
  httpClient.endRequest();
  
  int statusCode = httpClient.responseStatusCode();
  if (statusCode == 201) {
    Serial.println("Data sent successfully");
  } else {
    Serial.print("API Error: ");
    Serial.println(statusCode);
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  while (WiFi.begin(WIFI_SSID, WIFI_PASS) != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void startSession() {
  // Create session via API
  StaticJsonDocument<256> doc;
  doc["name"] = "GPS Session " + String(millis());
  doc["device_name"] = "MKR GPS Unit";
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  httpClient.post("/api/sessions/start");
  httpClient.sendHeader("Content-Type", "application/json");
  httpClient.sendHeader("Content-Length", jsonPayload.length());
  httpClient.beginBody();
  httpClient.print(jsonPayload);
  httpClient.endRequest();
  
  int statusCode = httpClient.responseStatusCode();
  if (statusCode == 201) {
    String response = httpClient.responseBody();
    StaticJsonDocument<256> responseDoc;
    deserializeJson(responseDoc, response);
    sessionId = responseDoc["session_id"].as<String>();
    Serial.print("Session started: ");
    Serial.println(sessionId);
  }
}

void printGPSStatus() {
  Serial.println("=== GPS Status ===");
  Serial.print("Valid: ");
  Serial.println(gpsValid ? "YES" : "NO");
  Serial.print("Satellites: ");
  Serial.println(satellites);
  if (gpsValid) {
    Serial.print("Location: ");
    Serial.print(latitude, 6);
    Serial.print(", ");
    Serial.println(longitude, 6);
    Serial.print("Altitude: ");
    Serial.print(altitude);
    Serial.println(" m");
  }
}
```

---

## Phase 3: Database Schema Updates (Day 6)

### New Migration: Add GPS Fields to sensor_readings

**File:** `migrations/0004_add_gps_fields.sql`

```sql
-- Add GPS fields to sensor_readings table
ALTER TABLE sensor_readings ADD COLUMN latitude REAL;
ALTER TABLE sensor_readings ADD COLUMN longitude REAL;
ALTER TABLE sensor_readings ADD COLUMN altitude REAL;
ALTER TABLE sensor_readings ADD COLUMN gps_speed REAL;
ALTER TABLE sensor_readings ADD COLUMN gps_heading REAL;
ALTER TABLE sensor_readings ADD COLUMN gps_satellites INTEGER;

-- Add index for spatial queries
CREATE INDEX idx_sensor_readings_location ON sensor_readings(latitude, longitude);
CREATE INDEX idx_sensor_readings_session_location ON sensor_readings(session_id, latitude, longitude);
```

---

## Phase 4: Backend API Updates (Days 7-8)

### Update `src/routes/sensor-data.ts`

Add GPS field handling to the sensor data endpoint:

```typescript
// Add GPS fields to the INSERT statement
const result = await c.env.DB.prepare(`
  INSERT INTO sensor_readings (
    session_id, timestamp, device_name,
    temperature, humidity, pressure, air_quality, co2, gas,
    accel_x, accel_y, accel_z,
    gyro_x, gyro_y, gyro_z,
    quat_x, quat_y, quat_z, quat_w,
    latitude, longitude, altitude, gps_speed, gps_heading, gps_satellites
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).bind(
  sessionId, timestamp, device_name,
  temperature ?? null, humidity ?? null, pressure ?? null,
  air_quality ?? null, co2 ?? null, gas ?? null,
  accel_x ?? null, accel_y ?? null, accel_z ?? null,
  gyro_x ?? null, gyro_y ?? null, gyro_z ?? null,
  quat_x ?? null, quat_y ?? null, quat_z ?? null, quat_w ?? null,
  latitude ?? null, longitude ?? null, altitude ?? null,
  gps_speed ?? null, gps_heading ?? null, gps_satellites ?? null
).run();
```

### New Endpoint: GPS Track Retrieval

**File:** `src/routes/gps.ts`

```typescript
import { Hono } from 'hono';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

// Get GPS track for a session
app.get('/sessions/:id/track', async (c) => {
  const sessionId = c.req.param('id');
  
  const track = await c.env.DB.prepare(`
    SELECT 
      timestamp,
      latitude,
      longitude,
      altitude,
      gps_speed,
      gps_heading,
      temperature,
      humidity,
      air_quality
    FROM sensor_readings
    WHERE session_id = ? 
      AND latitude IS NOT NULL 
      AND longitude IS NOT NULL
    ORDER BY timestamp ASC
  `).bind(sessionId).all();
  
  return c.json({
    session_id: sessionId,
    track_points: track.results,
    total_points: track.results.length
  });
});

// Get current location of all active sessions
app.get('/live-locations', async (c) => {
  const locations = await c.env.DB.prepare(`
    SELECT 
      s.id,
      s.name,
      s.device_name,
      sr.latitude,
      sr.longitude,
      sr.timestamp
    FROM sessions s
    INNER JOIN (
      SELECT session_id, latitude, longitude, timestamp,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp DESC) as rn
      FROM sensor_readings
      WHERE latitude IS NOT NULL
    ) sr ON s.id = sr.session_id
    WHERE s.status = 'active' AND sr.rn = 1
  `).all();
  
  return c.json({ locations: locations.results });
});

export default app;
```

Add to `src/index.ts`:
```typescript
import gpsRoute from './routes/gps';
app.route('/api/gps', gpsRoute);
```

---

## Phase 5: Frontend Updates (Days 9-11)

### 1. Add Leaflet.js for Maps

Update `src/routes/spa-working.ts` to include Leaflet CSS and JS:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### 2. Add Map Container to History/Session View

```html
<div id="sessionMap" style="width:100%;height:400px;margin:20px 0;"></div>
```

### 3. JavaScript Function to Display GPS Track

```javascript
async function viewSessionWithMap(sessionId) {
  // ... existing session view code ...
  
  // Fetch GPS track
  const trackRes = await fetch(`/api/gps/sessions/${sessionId}/track`);
  const trackData = await trackRes.json();
  
  if (trackData.track_points.length > 0) {
    // Initialize map
    const map = L.map('sessionMap').setView([
      trackData.track_points[0].latitude,
      trackData.track_points[0].longitude
    ], 13);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Plot GPS track
    const trackLine = trackData.track_points.map(p => [p.latitude, p.longitude]);
    L.polyline(trackLine, { color: '#d8f41d', weight: 3 }).addTo(map);
    
    // Add markers for start/end
    L.marker([trackData.track_points[0].latitude, trackData.track_points[0].longitude])
      .addTo(map)
      .bindPopup('Start');
    
    const lastPoint = trackData.track_points[trackData.track_points.length - 1];
    L.marker([lastPoint.latitude, lastPoint.longitude])
      .addTo(map)
      .bindPopup('End');
    
    // Add heatmap for sensor data (e.g., temperature)
    trackData.track_points.forEach(point => {
      if (point.temperature) {
        const color = point.temperature > 25 ? '#ff6b6b' : '#4ecdc4';
        L.circleMarker([point.latitude, point.longitude], {
          radius: 5,
          fillColor: color,
          color: '#fff',
          weight: 1,
          fillOpacity: 0.7
        }).addTo(map).bindPopup(`Temp: ${point.temperature.toFixed(1)}°C`);
      }
    });
  } else {
    document.getElementById('sessionMap').innerHTML = 
      '<p style="text-align:center;padding:40px;color:#888;">No GPS data for this session</p>';
  }
}
```

### 4. Real-time GPS Dashboard (New Page)

```javascript
// Add to navigation
<a href="/gps-live">📍 Live GPS</a>

// New route in spa-working.ts
async function loadLiveGPS() {
  const res = await fetch('/api/gps/live-locations');
  const data = await res.json();
  
  const map = L.map('liveMap').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  
  data.locations.forEach(loc => {
    L.marker([loc.latitude, loc.longitude])
      .addTo(map)
      .bindPopup(`
        <b>${loc.name}</b><br>
        Device: ${loc.device_name}<br>
        Last update: ${new Date(loc.timestamp).toLocaleString()}
      `);
  });
  
  // Auto-refresh every 10 seconds
  setTimeout(loadLiveGPS, 10000);
}
```

---

## Phase 6: Testing Strategy (Days 12-14)

### Day 12: Hardware Testing
1. ✅ Verify GPS satellite acquisition (outdoors, clear sky)
2. ✅ Verify Nicla sensor data via I2C
3. ✅ Verify WiFi connectivity
4. ✅ Verify combined data transmission

### Day 13: Software Integration Testing
1. ✅ Test API endpoints with GPS data
2. ✅ Verify database GPS field storage
3. ✅ Test map visualization
4. ✅ Test real-time GPS tracking

### Day 14: End-to-End Testing
1. ✅ Full system test: Record session while walking/driving
2. ✅ Verify GPS track displayed on map
3. ✅ Verify sensor data overlay on map
4. ✅ Export functionality with GPS data

---

## Phase 7: Deployment (Day 15)

1. Apply database migrations to staging/production
2. Deploy updated API endpoints
3. Deploy updated frontend
4. Update documentation
5. Stakeholder demo

---

## Bill of Materials (BOM)

| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| Arduino Nicla Sense ME | 1 | $65 | $65 |
| Arduino MKR WiFi 1010 | 1 | $35 | $35 |
| Arduino MKR GPS Shield | 1 | $40 | $40 |
| ESLOV Cable | 1 | $5 | $5 |
| USB Cable | 1 | $3 | $3 |
| **TOTAL** | | | **$148** |

*Additional units: ~$148 per GPS-enabled sensor node*

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| GPS signal weak indoors | Test outdoors first; add external antenna option |
| Pin conflicts | Use ESLOV cable instead of direct stacking |
| Power consumption | Use MKR NB for ultra-low power; add battery optimization |
| WiFi range limits | Offer cellular option (MKR GSM/NB) |
| API rate limits | Implement local buffering; batch transmission |

---

## Success Criteria

✅ GPS location acquired within 60 seconds (hot start)  
✅ All 9 sensors + GPS data streaming to platform  
✅ <5 second latency from device to dashboard  
✅ GPS track displayed on interactive map  
✅ Georeferenced sensor data overlay working  
✅ System runs continuously for 24+ hours  
✅ Export includes GPS coordinates  

---

## Next Steps After GPS Integration

1. **Multi-device Fleet Management** - Track 10+ units simultaneously
2. **Geofencing Alerts** - Notify when device enters/exits area
3. **Route Optimization** - Analyze travel patterns
4. **Environmental Heatmaps** - Visualize air quality/temperature across geography
5. **Mobile App** - iOS/Android app for field use

---

**Estimated Timeline:** 15 days (3 weeks)  
**Estimated Cost:** $148 per unit  
**Technical Difficulty:** Medium (well-documented libraries, clear integration path)
