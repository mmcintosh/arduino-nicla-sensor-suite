# 🎯 Available Sensors for Nicla Sense ME

## 📚 Libraries Used

1. **`Arduino_BHY2.h`** - Bosch BHY2 sensor hub library
2. **`Nicla_System.h`** - Nicla board system library  
3. **`ArduinoBLE.h`** - Bluetooth Low Energy library

## ✅ Currently Implemented Sensors

```cpp
Sensor temperature(SENSOR_ID_TEMP);      // Temperature
Sensor humidity(SENSOR_ID_HUM);          // Humidity
Sensor pressure(SENSOR_ID_BARO);         // Barometric pressure
Sensor gas(SENSOR_ID_GAS);               // Gas resistance
SensorXYZ gyroscope(SENSOR_ID_GYRO);     // Gyroscope (rotation)
SensorXYZ accelerometer(SENSOR_ID_ACC);  // Accelerometer (motion)
SensorQuaternion quaternion(SENSOR_ID_RV); // Rotation vector
SensorBSEC bsec(SENSOR_ID_BSEC);         // Air quality index
```

## 🚀 Additional Sensors Available with BHY2 Library

### Motion & Orientation
- `SENSOR_ID_LACC` - **Linear Acceleration** (acceleration without gravity)
- `SENSOR_ID_GRAV` - **Gravity Vector**
- `SENSOR_ID_ORI` - **Orientation** (Euler angles: pitch, roll, yaw)
- `SENSOR_ID_DEVICE_ORI` - **Device Orientation**

### Activity Recognition
- `SENSOR_ID_AR` - **Activity Recognition** (walking, running, standing, etc.)
- `SENSOR_ID_STC` - **Step Counter**
- `SENSOR_ID_STD` - **Step Detector**

### Gestures
- `SENSOR_ID_WRIST_TILT` - **Wrist Tilt Gesture**
- `SENSOR_ID_WRIST_WEAR` - **Wrist Wear Detection**
- `SENSOR_ID_SIG` - **Significant Motion**
- `SENSOR_ID_WAKE_GESTURE` - **Wake Gesture**
- `SENSOR_ID_GLANCE_GESTURE` - **Glance Gesture**
- `SENSOR_ID_PICKUP_GESTURE` - **Pickup Gesture**

### Raw Sensor Data
- `SENSOR_ID_ACC_RAW` - **Raw Accelerometer** (uncalibrated)
- `SENSOR_ID_GYRO_RAW` - **Raw Gyroscope** (uncalibrated)
- `SENSOR_ID_MAG_RAW` - **Raw Magnetometer** (uncalibrated)

### Fusion Sensors
- `SENSOR_ID_GRA` - **Game Rotation Vector** (no magnetometer)
- `SENSOR_ID_GBIAS_GYRO` - **Gyroscope Bias**

## 💡 Implementation Example

```cpp
// Example: Add step counter and activity recognition
SensorActivity activity(SENSOR_ID_AR);
Sensor stepCounter(SENSOR_ID_STC);
Sensor linearAccel(SENSOR_ID_LACC);

void setup() {
  Serial.begin(115200);
  nicla::begin();
  
  BHY2.begin(NICLA_STANDALONE);
  
  // Initialize new sensors
  activity.begin();
  stepCounter.begin();
  linearAccel.begin();
  
  // ... BLE setup ...
}

void loop() {
  BHY2.update();
  
  // Read activity
  if (activity.value() == STILL_ACTIVITY) {
    Serial.println("Still");
  } else if (activity.value() == WALKING_ACTIVITY) {
    Serial.println("Walking");
  } else if (activity.value() == RUNNING_ACTIVITY) {
    Serial.println("Running");
  }
  
  // Read steps
  uint32_t steps = stepCounter.value();
  Serial.println(steps);
  
  // Read linear acceleration
  auto accel = linearAccel.value();
  Serial.print("Linear Accel: ");
  Serial.print(accel.x); Serial.print(", ");
  Serial.print(accel.y); Serial.print(", ");
  Serial.println(accel.z);
}
```

## 🎯 Recommended Priority for Future Implementation

### High Priority (Fitness & Activity)
1. **Step Counter** (`SENSOR_ID_STC`) - Track steps for fitness
2. **Activity Recognition** (`SENSOR_ID_AR`) - Classify movement (walking/running/still)
3. **Linear Acceleration** (`SENSOR_ID_LACC`) - Better motion analysis without gravity

### Medium Priority (Enhanced Orientation)
4. **Orientation/Euler** (`SENSOR_ID_ORI`) - Easier to understand than quaternions
5. **Gravity Vector** (`SENSOR_ID_GRAV`) - Detect device tilt/angle

### Lower Priority (Advanced Features)
6. **Gesture Detection** - Wake, pickup, wrist tilt gestures
7. **Raw Sensors** - For custom sensor fusion algorithms
8. **Game Rotation Vector** - Alternative rotation without magnetometer drift

## 📝 BLE Characteristic UUIDs

When adding new sensors, follow the existing pattern:

```cpp
#define BLE_SENSE_UUID(val) ("19b10000-" val "-537e-4f6c-d104768a1214")

// Existing
BLEFloatCharacteristic temperatureCharacteristic(BLE_SENSE_UUID("2001"), BLERead);
BLEUnsignedIntCharacteristic humidityCharacteristic(BLE_SENSE_UUID("3001"), BLERead);

// New examples
BLEUnsignedIntCharacteristic stepCounterCharacteristic(BLE_SENSE_UUID("A001"), BLERead);
BLEUnsignedIntCharacteristic activityCharacteristic(BLE_SENSE_UUID("A002"), BLERead);
BLECharacteristic linearAccelCharacteristic(BLE_SENSE_UUID("A003"), BLERead | BLENotify, 3 * sizeof(float));
```

## 🔗 Resources

- [Arduino BHY2 Library Documentation](https://www.arduino.cc/reference/en/libraries/arduino_bhy2/)
- [Nicla Sense ME Product Page](https://store.arduino.cc/nicla-sense-me)
- [Bosch BHI260AP Datasheet](https://www.bosch-sensortec.com/products/smart-sensor-systems/bhi260ap/)

## 🚧 Implementation Checklist

When adding a new sensor:
- [ ] Add sensor object declaration (e.g., `Sensor stepCounter(SENSOR_ID_STC);`)
- [ ] Initialize in `setup()` (e.g., `stepCounter.begin();`)
- [ ] Create BLE characteristic with unique UUID
- [ ] Add characteristic to BLE service
- [ ] Update sensor value in `loop()` via `BHY2.update()`
- [ ] Update web dashboard to display new sensor data
- [ ] Update database schema if storing historical data
- [ ] Add API endpoint for new sensor type
- [ ] Update analytics dashboard
