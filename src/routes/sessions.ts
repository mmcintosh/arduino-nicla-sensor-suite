import { Hono } from 'hono';
import { Env } from '../index';
import { generateId } from '../utils/helpers';

const app = new Hono<{ Bindings: Env }>();

// GET /api/sessions - List all sessions
app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, 
        COUNT(sr.id) as reading_count,
        (s.ended_at - s.started_at) as duration_ms
      FROM sessions s
      LEFT JOIN sensor_readings sr ON sr.session_id = s.id
    `;

    if (status) {
      query += ` WHERE s.status = ?`;
    }

    query += `
      GROUP BY s.id
      ORDER BY s.started_at DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = status 
      ? c.env.DB.prepare(query).bind(status, limit, offset)
      : c.env.DB.prepare(query).bind(limit, offset);

    const result = await stmt.all();

    // Get total count
    const countQuery = status
      ? c.env.DB.prepare('SELECT COUNT(*) as total FROM sessions WHERE status = ?').bind(status)
      : c.env.DB.prepare('SELECT COUNT(*) as total FROM sessions');
    
    const countResult = await countQuery.first();
    const total = (countResult as any)?.total || 0;

    return c.json({
      sessions: result.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return c.json({
      error: 'Failed to fetch sessions',
      message: error.message
    }, 500);
  }
});

// POST /api/sessions/start - Start a new recording session
app.post('/start', async (c) => {
  try {
    const body = await c.req.json();
    const { name, device_name, device_id, notes, tags } = body;

    if (!name) {
      return c.json({ error: 'Session name is required' }, 400);
    }

    const id = generateId();
    const now = Date.now();

    await c.env.DB.prepare(`
      INSERT INTO sessions (
        id, name, device_name, device_id, started_at, notes, tags, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(
      id,
      name,
      device_name,
      device_id,
      now,
      notes || null,
      tags ? JSON.stringify(tags) : null,
      now,
      now
    ).run();

    return c.json({
      success: true,
      session: {
        id,
        name,
        device_name,
        device_id,
        started_at: now,
        status: 'active'
      }
    }, 201);

  } catch (error: any) {
    console.error('Error starting session:', error);
    return c.json({
      error: 'Failed to start session',
      message: error.message
    }, 500);
  }
});

// GET /api/sessions/:id - Get session details
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const result = await c.env.DB.prepare(`
      SELECT s.*, 
        COUNT(sr.id) as reading_count,
        (s.ended_at - s.started_at) as duration_ms
      FROM sessions s
      LEFT JOIN sensor_readings sr ON sr.session_id = s.id
      WHERE s.id = ?
      GROUP BY s.id
    `).bind(id).first();

    if (!result) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({ session: result });

  } catch (error: any) {
    console.error('Error fetching session:', error);
    return c.json({
      error: 'Failed to fetch session',
      message: error.message
    }, 500);
  }
});

// POST /api/sessions/:id/stop - Stop a recording session
app.post('/:id/stop', async (c) => {
  try {
    const id = c.req.param('id');
    const now = Date.now();

    // Check if session exists
    const session = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE id = ?'
    ).bind(id).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Update session
    await c.env.DB.prepare(`
      UPDATE sessions 
      SET ended_at = ?, status = 'completed', updated_at = ?
      WHERE id = ?
    `).bind(now, now, id).run();

    return c.json({
      success: true,
      session: {
        id,
        ended_at: now,
        status: 'completed'
      }
    });

  } catch (error: any) {
    console.error('Error stopping session:', error);
    return c.json({
      error: 'Failed to stop session',
      message: error.message
    }, 500);
  }
});

// GET /api/sessions/:id/data - Get sensor readings for a session
app.get('/:id/data', async (c) => {
  try {
    const id = c.req.param('id');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '1000');
    const offset = (page - 1) * limit;

    const result = await c.env.DB.prepare(`
      SELECT * FROM sensor_readings
      WHERE session_id = ?
      ORDER BY timestamp ASC
      LIMIT ? OFFSET ?
    `).bind(id, limit, offset).all();

    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM sensor_readings WHERE session_id = ?'
    ).bind(id).first();

    const total = (countResult as any)?.total || 0;

    return c.json({
      readings: result.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching session data:', error);
    return c.json({
      error: 'Failed to fetch session data',
      message: error.message
    }, 500);
  }
});

// DELETE /api/sessions/:id - Delete a session and all its data
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Check if session exists
    const session = await c.env.DB.prepare(
      'SELECT * FROM sessions WHERE id = ?'
    ).bind(id).first();

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Delete session (cascade will delete readings)
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();

    return c.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting session:', error);
    return c.json({
      error: 'Failed to delete session',
      message: error.message
    }, 500);
  }
});

export default app;
