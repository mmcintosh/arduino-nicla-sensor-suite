-- Create sensor_readings table for all sensor data
CREATE TABLE IF NOT EXISTS sensor_readings (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL, -- Unix timestamp in milliseconds
    
    -- Accelerometer (Float32 x3)
    accel_x REAL,
    accel_y REAL,
    accel_z REAL,
    
    -- Gyroscope (Float32 x3)
    gyro_x REAL,
    gyro_y REAL,
    gyro_z REAL,
    
    -- Quaternion (Float32 x4)
    quat_x REAL,
    quat_y REAL,
    quat_z REAL,
    quat_w REAL,
    
    -- Environmental sensors
    temperature REAL, -- Float32 in Celsius
    humidity REAL, -- Uint8 in percentage
    pressure REAL, -- Float32 in kPa
    
    -- Air quality
    bsec REAL, -- Float32 Indoor Air Quality index
    co2 INTEGER, -- Uint32 CO2 value
    gas INTEGER, -- Uint32 Gas sensor value
    
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_readings_session_id ON sensor_readings(session_id);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON sensor_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_readings_session_timestamp ON sensor_readings(session_id, timestamp);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_readings_session_created ON sensor_readings(session_id, created_at);
