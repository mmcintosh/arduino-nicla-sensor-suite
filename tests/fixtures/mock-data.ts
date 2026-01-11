// Test fixtures for sensor data
export const mockSensorReading = {
  session_id: 'test-session-123',
  timestamp: Date.now(),
  accelerometer: { x: 0.1, y: 0.2, z: 9.8 },
  gyroscope: { x: 0.01, y: 0.02, z: 0.03 },
  quaternion: { x: 0, y: 0, z: 0, w: 1 },
  temperature: 22.5,
  humidity: 45,
  pressure: 101.3,
  bsec: 50,
  co2: 400,
  gas: 50000
};

export const mockSession = {
  id: 'test-session-123',
  name: 'Test Session',
  device_name: 'Arduino Nicla Test',
  device_id: 'test-device-001',
  started_at: Date.now(),
  ended_at: null,
  notes: 'Test session notes',
  tags: ['test', 'automated'],
  status: 'active'
};

export const mockCompletedSession = {
  ...mockSession,
  ended_at: Date.now() + 60000, // 1 minute later
  status: 'completed'
};

export const mockBatchReadings = Array.from({ length: 10 }, (_, i) => ({
  ...mockSensorReading,
  timestamp: Date.now() + i * 1000,
  temperature: 22 + Math.random() * 2,
  humidity: 40 + Math.random() * 10
}));

export const mockAnalytics = {
  session_id: 'test-session-123',
  total_readings: 100,
  duration_ms: 60000,
  temp_min: 20.5,
  temp_max: 24.5,
  temp_avg: 22.5,
  humidity_min: 35,
  humidity_max: 55,
  humidity_avg: 45,
  pressure_min: 100.5,
  pressure_max: 102.1,
  pressure_avg: 101.3
};

// Mock D1 Database for testing
export class MockD1Database {
  private data: Map<string, any[]> = new Map([
    ['sessions', []],
    ['sensor_readings', []],
    ['session_analytics', []]
  ]);

  prepare(query: string) {
    return {
      bind: (...params: any[]) => {
        return {
          run: async () => ({ success: true }),
          all: async () => ({ results: this.data.get('sessions') || [] }),
          first: async () => {
            const results = this.data.get('sessions') || [];
            return results[0] || null;
          }
        };
      },
      run: async () => ({ success: true }),
      all: async () => ({ results: [] }),
      first: async () => null
    };
  }

  batch(statements: any[]) {
    return Promise.all(statements.map(() => ({ success: true })));
  }

  // Helper methods for tests
  insertSession(session: any) {
    const sessions = this.data.get('sessions') || [];
    sessions.push(session);
    this.data.set('sessions', sessions);
  }

  insertReading(reading: any) {
    const readings = this.data.get('sensor_readings') || [];
    readings.push(reading);
    this.data.set('sensor_readings', readings);
  }

  clear() {
    this.data.clear();
    this.data.set('sessions', []);
    this.data.set('sensor_readings', []);
    this.data.set('session_analytics', []);
  }

  getSessions() {
    return this.data.get('sessions') || [];
  }

  getReadings() {
    return this.data.get('sensor_readings') || [];
  }
}

// Mock Cloudflare environment
export const createMockEnv = () => {
  return {
    DB: new MockD1Database() as unknown as D1Database,
    ENVIRONMENT: 'test'
  };
};
