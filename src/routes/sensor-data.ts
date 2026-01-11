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
      accelerometer?.x, accelerometer?.y, accelerometer?.z,
      gyroscope?.x, gyroscope?.y, gyroscope?.z,
      quaternion?.x, quaternion?.y, quaternion?.z, quaternion?.w,
      temperature,
      humidity,
      pressure,
      bsec,
      co2,
      gas,
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
        reading.accelerometer?.x, reading.accelerometer?.y, reading.accelerometer?.z,
        reading.gyroscope?.x, reading.gyroscope?.y, reading.gyroscope?.z,
        reading.quaternion?.x, reading.quaternion?.y, reading.quaternion?.z, reading.quaternion?.w,
        reading.temperature,
        reading.humidity,
        reading.pressure,
        reading.bsec,
        reading.co2,
        reading.gas,
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
