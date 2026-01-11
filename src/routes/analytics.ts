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

    const recentSessions = await c.env.DB.prepare(`
      SELECT id, name, started_at, ended_at, status
      FROM sessions
      ORDER BY started_at DESC
      LIMIT 5
    `).all();

    return c.json({
      total_sessions: (sessionCount as any)?.total || 0,
      total_readings: (readingCount as any)?.total || 0,
      recent_sessions: recentSessions.results
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
