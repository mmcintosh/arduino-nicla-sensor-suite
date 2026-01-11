-- Create analytics cache table for pre-computed statistics
CREATE TABLE IF NOT EXISTS session_analytics (
    session_id TEXT PRIMARY KEY,
    total_readings INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER, -- Session duration in milliseconds
    
    -- Temperature stats
    temp_min REAL,
    temp_max REAL,
    temp_avg REAL,
    temp_stddev REAL,
    
    -- Humidity stats
    humidity_min REAL,
    humidity_max REAL,
    humidity_avg REAL,
    
    -- Pressure stats
    pressure_min REAL,
    pressure_max REAL,
    pressure_avg REAL,
    
    -- Air quality stats
    bsec_min REAL,
    bsec_max REAL,
    bsec_avg REAL,
    
    co2_min INTEGER,
    co2_max INTEGER,
    co2_avg REAL,
    
    -- Motion stats (magnitude)
    accel_magnitude_max REAL,
    gyro_magnitude_max REAL,
    
    computed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_session ON session_analytics(session_id);
