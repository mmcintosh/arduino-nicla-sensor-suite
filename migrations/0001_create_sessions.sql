-- Create sessions table for recording sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    device_name TEXT,
    device_id TEXT,
    started_at INTEGER NOT NULL, -- Unix timestamp in milliseconds
    ended_at INTEGER, -- Unix timestamp in milliseconds
    notes TEXT,
    tags TEXT, -- JSON array of tags
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'stopped')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Create index for faster session queries
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON sessions(device_id);
