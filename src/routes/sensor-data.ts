import { Hono } from 'hono';
import { Env } from '../index';
import { generateId } from '../utils/helpers';

const app = new Hono<{ Bindings: Env }>();

// POST /api/sensor-data - Store a single sensor reading
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      session_id,
      timestamp,
      accelerometer,
      gyroscope,
      quaternion,
      temperature,
      humidity,
      pressure,
      bsec,
      co2,
      gas
    } = body;

    // Validate required fields
    if (!session_id) {
      return c.json({ error: 'session_id is required' }, 400);
    }

    const id = generateId();
    const now = Date.now();

    // Insert sensor reading
    await c.env.DB.prepare(`
      INSERT INTO sensor_readings (
        id, session_id, timestamp,
        accel_x, accel_y, accel_z,
        gyro_x, gyro_y, gyro_z,
        quat_x, quat_y, quat_z, quat_w,
        temperature, humidity, pressure,
        bsec, co2, gas,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      session_id,
      timestamp || now,
      accelerometer?.x ?? null, 
      accelerometer?.y ?? null, 
      accelerometer?.z ?? null,
      gyroscope?.x ?? null, 
      gyroscope?.y ?? null, 
      gyroscope?.z ?? null,
      quaternion?.x ?? null, 
      quaternion?.y ?? null, 
      quaternion?.z ?? null, 
      quaternion?.w ?? null,
      temperature ?? null,
      humidity ?? null,
      pressure ?? null,
      bsec ?? null,
      co2 ?? null,
      gas ?? null,
      now
    ).run();

    return c.json({
      success: true,
      id,
      timestamp: now
    }, 201);

  } catch (error: any) {
    console.error('Error storing sensor data:', error);
    return c.json({
      error: 'Failed to store sensor data',
      message: error.message
    }, 500);
  }
});

// POST /api/sensor-data/batch - Store multiple sensor readings at once
app.post('/batch', async (c) => {
  try {
    const body = await c.req.json();
    const { readings } = body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return c.json({ error: 'readings array is required' }, 400);
    }

    const now = Date.now();
    const statements = readings.map(reading => {
      const id = generateId();
      return c.env.DB.prepare(`
        INSERT INTO sensor_readings (
          id, session_id, timestamp,
          accel_x, accel_y, accel_z,
          gyro_x, gyro_y, gyro_z,
          quat_x, quat_y, quat_z, quat_w,
          temperature, humidity, pressure,
          bsec, co2, gas,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        reading.session_id,
        reading.timestamp || now,
        reading.accelerometer?.x ?? null, 
        reading.accelerometer?.y ?? null, 
        reading.accelerometer?.z ?? null,
        reading.gyroscope?.x ?? null, 
        reading.gyroscope?.y ?? null, 
        reading.gyroscope?.z ?? null,
        reading.quaternion?.x ?? null, 
        reading.quaternion?.y ?? null, 
        reading.quaternion?.z ?? null, 
        reading.quaternion?.w ?? null,
        reading.temperature ?? null,
        reading.humidity ?? null,
        reading.pressure ?? null,
        reading.bsec ?? null,
        reading.co2 ?? null,
        reading.gas ?? null,
        now
      );
    });

    // Execute all inserts in a batch
    await c.env.DB.batch(statements);

    return c.json({
      success: true,
      count: readings.length,
      timestamp: now
    }, 201);

  } catch (error: any) {
    console.error('Error storing batch sensor data:', error);
    return c.json({
      error: 'Failed to store batch sensor data',
      message: error.message
    }, 500);
  }
});

export default app;
