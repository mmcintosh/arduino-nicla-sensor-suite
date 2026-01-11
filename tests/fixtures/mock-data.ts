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

// Helper function to seed mock database with test data
export async function seedMockDatabase(db: any) {
  try {
    // Insert test session
    await db.prepare(`
      INSERT INTO sessions (id, name, device_name, device_id, started_at, ended_at, notes, tags, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      mockSession.id,
      mockSession.name,
      mockSession.device_name,
      mockSession.device_id,
      mockSession.started_at,
      null,
      mockSession.notes,
      JSON.stringify(mockSession.tags),
      mockSession.status,
      Date.now(),
      Date.now()
    ).run();

    // Insert sensor readings for testing
    const baseTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await db.prepare(`
        INSERT INTO sensor_readings (
          id, session_id, timestamp,
          accel_x, accel_y, accel_z,
          gyro_x, gyro_y, gyro_z,
          quat_x, quat_y, quat_z, quat_w,
          temperature, humidity, pressure,
          bsec, co2, gas, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        `reading-${i}`,
        mockSession.id,
        baseTime + i * 1000,
        0.1 + i * 0.01, 0.2 + i * 0.01, 9.8 + i * 0.01,
        0.01, 0.02, 0.03,
        0, 0, 0, 1,
        20 + i * 0.5,  // temperature varies from 20-24.5
        40 + i * 2,    // humidity varies from 40-58
        100 + i * 0.1, // pressure varies from 100-100.9
        50 + i * 2,    // bsec
        400 + i * 10,  // co2
        50000 + i * 100, // gas
        baseTime + i * 1000
      ).run();
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding mock database:', error);
    return false;
  }
}

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
    const self = this;
    
    return {
      bind: (...params: any[]) => {
        return {
          run: async () => {
            // Handle INSERT queries
            if (query.includes('INSERT INTO sessions')) {
              const session = {
                id: params[0],
                name: params[1],
                device_name: params[2],
                device_id: params[3],
                started_at: params[4],
                ended_at: params[5],
                notes: params[6],
                tags: params[7],
                status: params[8],
                created_at: params[9],
                updated_at: params[10]
              };
              self.insertSession(session);
            } else if (query.includes('INSERT INTO sensor_readings')) {
              const reading = {
                id: params[0],
                session_id: params[1],
                timestamp: params[2],
                accel_x: params[3],
                accel_y: params[4],
                accel_z: params[5],
                gyro_x: params[6],
                gyro_y: params[7],
                gyro_z: params[8],
                quat_x: params[9],
                quat_y: params[10],
                quat_z: params[11],
                quat_w: params[12],
                temperature: params[13],
                humidity: params[14],
                pressure: params[15],
                bsec: params[16],
                co2: params[17],
                gas: params[18],
                created_at: params[19]
              };
              self.insertReading(reading);
            } else if (query.includes('UPDATE sessions')) {
              // Handle session updates (stop recording)
              const sessions = self.data.get('sessions') || [];
              const sessionId = params[2]; // WHERE id = ?
              const session = sessions.find(s => s.id === sessionId);
              if (session) {
                session.ended_at = params[0];
                session.status = 'completed';
                session.updated_at = params[1];
              }
            }
            return { success: true };
          },
          all: async () => {
            // Handle SELECT queries with aggregation
            if (query.includes('COUNT(*)') && query.includes('FROM sessions')) {
              const count = self.data.get('sessions')?.length || 0;
              return { results: [{ total: count }] };
            }
            
            if (query.includes('COUNT(*)') && query.includes('FROM sensor_readings')) {
              const count = self.data.get('sensor_readings')?.length || 0;
              return { results: [{ total: count }] };
            }
            
            // Handle session list queries
            if (query.includes('SELECT id, name, started_at')) {
              const sessions = self.data.get('sessions') || [];
              return { results: sessions.map(s => ({
                id: s.id,
                name: s.name,
                started_at: s.started_at,
                ended_at: s.ended_at,
                status: s.status
              })) };
            }
            
            // Default: return all sessions
            return { results: self.data.get('sessions') || [] };
          },
          first: async () => {
            // Handle motion stats (SQRT queries)
            if (query.includes('SQRT')) {
              return {
                accel_magnitude_max: 10.0,
                accel_magnitude_avg: 9.8,
                gyro_magnitude_max: 0.05,
                gyro_magnitude_avg: 0.03
              };
            }
            
            // Handle analytics aggregation queries (MIN/MAX/AVG)
            if (query.includes('MIN(temperature)')) {
              const readings = self.data.get('sensor_readings') || [];
              const sessionReadings = readings.filter(r => r.session_id === params[0]);
              
              if (sessionReadings.length === 0) {
                return {
                  total_readings: 0,
                  temp_min: null,
                  temp_max: null,
                  temp_avg: null,
                  humidity_min: null,
                  humidity_max: null,
                  humidity_avg: null,
                  pressure_min: null,
                  pressure_max: null,
                  pressure_avg: null,
                  bsec_min: null,
                  bsec_max: null,
                  bsec_avg: null,
                  co2_min: null,
                  co2_max: null,
                  co2_avg: null,
                  gas_min: null,
                  gas_max: null,
                  gas_avg: null
                };
              }
              
              const temps = sessionReadings.map(r => r.temperature).filter(t => t !== null);
              const humids = sessionReadings.map(r => r.humidity).filter(h => h !== null);
              const pressures = sessionReadings.map(r => r.pressure).filter(p => p !== null);
              const bsecs = sessionReadings.map(r => r.bsec).filter(b => b !== null);
              const co2s = sessionReadings.map(r => r.co2).filter(c => c !== null);
              const gases = sessionReadings.map(r => r.gas).filter(g => g !== null);
              
              return {
                total_readings: sessionReadings.length,
                temp_min: Math.min(...temps),
                temp_max: Math.max(...temps),
                temp_avg: temps.reduce((a, b) => a + b, 0) / temps.length,
                humidity_min: Math.min(...humids),
                humidity_max: Math.max(...humids),
                humidity_avg: humids.reduce((a, b) => a + b, 0) / humids.length,
                pressure_min: Math.min(...pressures),
                pressure_max: Math.max(...pressures),
                pressure_avg: pressures.reduce((a, b) => a + b, 0) / pressures.length,
                bsec_min: Math.min(...bsecs),
                bsec_max: Math.max(...bsecs),
                bsec_avg: bsecs.reduce((a, b) => a + b, 0) / bsecs.length,
                co2_min: Math.min(...co2s),
                co2_max: Math.max(...co2s),
                co2_avg: co2s.reduce((a, b) => a + b, 0) / co2s.length,
                gas_min: Math.min(...gases),
                gas_max: Math.max(...gases),
                gas_avg: gases.reduce((a, b) => a + b, 0) / gases.length
              };
            }
            
            // Handle SELECT by ID
            if (query.includes('WHERE id = ?')) {
              const sessions = self.data.get('sessions') || [];
              const session = sessions.find(s => s.id === params[0]);
              return session || null;
            }
            
            // Handle COUNT queries
            if (query.includes('COUNT(*)')) {
              const count = self.data.get('sessions')?.length || 0;
              return { total: count };
            }
            
            const results = self.data.get('sessions') || [];
            return results[0] || null;
          }
        };
      },
      run: async () => ({ success: true }),
      all: async () => ({ results: self.data.get('sessions') || [] }),
      first: async () => {
        const results = self.data.get('sessions') || [];
        return results[0] || null;
      }
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

// Create mock environment with seeded data
export const createMockEnvWithData = async () => {
  const env = createMockEnv();
  await seedMockDatabase(env.DB);
  return env;
};
