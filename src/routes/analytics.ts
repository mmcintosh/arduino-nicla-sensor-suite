import { Hono } from 'hono';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

// GET /api/analytics/sessions/:id - Get analytics for a specific session
app.get('/sessions/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Get session info
    const session = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE id = ?'
    ).bind(id).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Calculate statistics
    const stats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_readings,
        -- Temperature
        MIN(temperature) as temp_min,
        MAX(temperature) as temp_max,
        AVG(temperature) as temp_avg,
        -- Humidity
        MIN(humidity) as humidity_min,
        MAX(humidity) as humidity_max,
        AVG(humidity) as humidity_avg,
        -- Pressure
        MIN(pressure) as pressure_min,
        MAX(pressure) as pressure_max,
        AVG(pressure) as pressure_avg,
        -- Air Quality
        MIN(bsec) as bsec_min,
        MAX(bsec) as bsec_max,
        AVG(bsec) as bsec_avg,
        MIN(co2) as co2_min,
        MAX(co2) as co2_max,
        AVG(co2) as co2_avg,
        MIN(gas) as gas_min,
        MAX(gas) as gas_max,
        AVG(gas) as gas_avg
      FROM sensor_readings
      WHERE session_id = ?
    `).bind(id).first();

    // Calculate motion statistics (magnitude)
    const motionStats = await c.env.DB.prepare(`
      SELECT
        MAX(SQRT(accel_x*accel_x + accel_y*accel_y + accel_z*accel_z)) as accel_magnitude_max,
        AVG(SQRT(accel_x*accel_x + accel_y*accel_y + accel_z*accel_z)) as accel_magnitude_avg,
        MAX(SQRT(gyro_x*gyro_x + gyro_y*gyro_y + gyro_z*gyro_z)) as gyro_magnitude_max,
        AVG(SQRT(gyro_x*gyro_x + gyro_y*gyro_y + gyro_z*gyro_z)) as gyro_magnitude_avg
      FROM sensor_readings
      WHERE session_id = ?
    `).bind(id).first();

    return c.json({
      session_id: id,
      session_name: (session as any).name,
      duration_ms: (session as any).ended_at 
        ? (session as any).ended_at - (session as any).started_at 
        : Date.now() - (session as any).started_at,
      statistics: {
        ...stats,
        ...motionStats
      }
    });

  } catch (error: any) {
    console.error('Error calculating analytics:', error);
    return c.json({
      error: 'Failed to calculate analytics',
      message: error.message
    }, 500);
  }
});

// GET /api/analytics/summary - Get summary across all sessions
app.get('/summary', async (c) => {
  try {
    const sessionCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM sessions'
    ).first();

    const readingCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM sensor_readings'
    ).first();
    
    const activeSessions = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM sessions WHERE status = ?'
    ).bind('active').first();
    
    const avgDuration = await c.env.DB.prepare(`
      SELECT AVG(ended_at - started_at) as avg_ms FROM sessions WHERE ended_at IS NOT NULL
    `).first();

    const recentSessions = await c.env.DB.prepare(`
      SELECT id, name, started_at, ended_at, status
      FROM sessions
      ORDER BY started_at DESC
      LIMIT 5
    `).all();
    
    // Get sensor averages - separate query for each sensor type
    const sensorAverages = [];
    
    // Temperature
    const tempStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(temperature) as reading_count,
        AVG(temperature) as avg_value,
        MIN(temperature) as min_value,
        MAX(temperature) as max_value
      FROM sensor_readings WHERE temperature IS NOT NULL
    `).first();
    if ((tempStats as any)?.reading_count > 0) {
      sensorAverages.push({ sensor_type: 'temperature', ...tempStats });
    }
    
    // Humidity
    const humStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(humidity) as reading_count,
        AVG(humidity) as avg_value,
        MIN(humidity) as min_value,
        MAX(humidity) as max_value
      FROM sensor_readings WHERE humidity IS NOT NULL
    `).first();
    if ((humStats as any)?.reading_count > 0) {
      sensorAverages.push({ sensor_type: 'humidity', ...humStats });
    }
    
    // Pressure
    const pressStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(pressure) as reading_count,
        AVG(pressure) as avg_value,
        MIN(pressure) as min_value,
        MAX(pressure) as max_value
      FROM sensor_readings WHERE pressure IS NOT NULL
    `).first();
    if ((pressStats as any)?.reading_count > 0) {
      sensorAverages.push({ sensor_type: 'pressure', ...pressStats });
    }
    
    // Air Quality (BSEC)
    const bsecStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(bsec) as reading_count,
        AVG(bsec) as avg_value,
        MIN(bsec) as min_value,
        MAX(bsec) as max_value
      FROM sensor_readings WHERE bsec IS NOT NULL
    `).first();
    if ((bsecStats as any)?.reading_count > 0) {
      sensorAverages.push({ sensor_type: 'air_quality', ...bsecStats });
    }
    
    // CO2
    const co2Stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(co2) as reading_count,
        AVG(co2) as avg_value,
        MIN(co2) as min_value,
        MAX(co2) as max_value
      FROM sensor_readings WHERE co2 IS NOT NULL
    `).first();
    if ((co2Stats as any)?.reading_count > 0) {
      sensorAverages.push({ sensor_type: 'co2', ...co2Stats });
    }
    
    // Gas
    const gasStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(gas) as reading_count,
        AVG(gas) as avg_value,
        MIN(gas) as min_value,
        MAX(gas) as max_value
      FROM sensor_readings WHERE gas IS NOT NULL
    `).first();
    if ((gasStats as any)?.reading_count > 0) {
      sensorAverages.push({ sensor_type: 'gas', ...gasStats });
    }
    
    // Accelerometer (average magnitude)
    const accelStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as reading_count,
        AVG(accel_x) as avg_x,
        AVG(accel_y) as avg_y,
        AVG(accel_z) as avg_z
      FROM sensor_readings WHERE accel_x IS NOT NULL
    `).first();
    if ((accelStats as any)?.reading_count > 0) {
      sensorAverages.push({ 
        sensor_type: 'accelerometer', 
        reading_count: (accelStats as any).reading_count,
        avg_value: Math.sqrt(
          Math.pow((accelStats as any).avg_x || 0, 2) + 
          Math.pow((accelStats as any).avg_y || 0, 2) + 
          Math.pow((accelStats as any).avg_z || 0, 2)
        ),
        min_value: 0,
        max_value: 0
      });
    }
    
    // Gyroscope (average magnitude)
    const gyroStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as reading_count,
        AVG(gyro_x) as avg_x,
        AVG(gyro_y) as avg_y,
        AVG(gyro_z) as avg_z
      FROM sensor_readings WHERE gyro_x IS NOT NULL
    `).first();
    if ((gyroStats as any)?.reading_count > 0) {
      sensorAverages.push({ 
        sensor_type: 'gyroscope', 
        reading_count: (gyroStats as any).reading_count,
        avg_value: Math.sqrt(
          Math.pow((gyroStats as any).avg_x || 0, 2) + 
          Math.pow((gyroStats as any).avg_y || 0, 2) + 
          Math.pow((gyroStats as any).avg_z || 0, 2)
        ),
        min_value: 0,
        max_value: 0
      });
    }

    return c.json({
      total_sessions: (sessionCount as any)?.total || 0,
      total_readings: (readingCount as any)?.total || 0,
      active_sessions: (activeSessions as any)?.total || 0,
      avg_duration_minutes: (avgDuration as any)?.avg_ms ? ((avgDuration as any).avg_ms / 60000) : 0,
      recent_sessions: recentSessions.results,
      sensor_averages: sensorAverages
    });

  } catch (error: any) {
    console.error('Error calculating summary:', error);
    return c.json({
      error: 'Failed to calculate summary',
      message: error.message
    }, 500);
  }
});

// GET /api/analytics/trends - Get trends data for visualization
app.get('/trends', async (c) => {
  try {
    const sessionId = c.req.query('session_id');
    const metric = c.req.query('metric') || 'temperature';
    const interval = parseInt(c.req.query('interval') || '60000'); // 1 minute default

    if (!sessionId) {
      return c.json({ error: 'session_id is required' }, 400);
    }

    // Map metric to database column
    const metricMap: Record<string, string> = {
      temperature: 'temperature',
      humidity: 'humidity',
      pressure: 'pressure',
      bsec: 'bsec',
      co2: 'co2',
      gas: 'gas'
    };

    const column = metricMap[metric];
    if (!column) {
      return c.json({ error: 'Invalid metric' }, 400);
    }

    // Get time-series data with averaging over intervals
    const trends = await c.env.DB.prepare(`
      SELECT
        (timestamp / ?) * ? as interval_start,
        AVG(${column}) as avg_value,
        MIN(${column}) as min_value,
        MAX(${column}) as max_value,
        COUNT(*) as sample_count
      FROM sensor_readings
      WHERE session_id = ? AND ${column} IS NOT NULL
      GROUP BY interval_start
      ORDER BY interval_start ASC
    `).bind(interval, interval, sessionId).all();

    return c.json({
      metric,
      interval_ms: interval,
      trends: trends.results
    });

  } catch (error: any) {
    console.error('Error calculating trends:', error);
    return c.json({
      error: 'Failed to calculate trends',
      message: error.message
    }, 500);
  }
});

// GET /api/analytics/export/:id - Export session data
app.get('/export/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const format = c.req.query('format') || 'json';

    // Get session
    const session = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE id = ?'
    ).bind(id).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Get all readings
    const readings = await c.env.DB.prepare(`
      SELECT * FROM sensor_readings
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `).bind(id).all();

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'timestamp', 'accel_x', 'accel_y', 'accel_z',
        'gyro_x', 'gyro_y', 'gyro_z',
        'quat_x', 'quat_y', 'quat_z', 'quat_w',
        'temperature', 'humidity', 'pressure',
        'bsec', 'co2', 'gas'
      ];

      let csv = headers.join(',') + '\n';
      
      for (const reading of readings.results) {
        const row = headers.map(h => (reading as any)[h] ?? '').join(',');
        csv += row + '\n';
      }

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="session-${id}.csv"`
        }
      });

    } else {
      // Return JSON
      return c.json({
        session,
        readings: readings.results
      });
    }

  } catch (error: any) {
    console.error('Error exporting data:', error);
    return c.json({
      error: 'Failed to export data',
      message: error.message
    }, 500);
  }
});

export default app;
