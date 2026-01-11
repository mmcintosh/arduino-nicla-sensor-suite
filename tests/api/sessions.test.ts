// API Tests - Sessions Endpoints
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import sessionsRoutes from '../../src/routes/sessions';
import { createMockEnv, mockSession, mockSensorReading } from '../fixtures/mock-data';

describe('API - Sessions Endpoints', () => {
  let app: Hono;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
    app = new Hono();
    app.route('/api/sessions', sessionsRoutes);
  });

  describe('POST /api/sessions/start', () => {
    it('should create a new session with valid data', async () => {
      const sessionData = {
        name: 'Test Session',
        device_name: 'Arduino Nicla',
        notes: 'Test notes',
        tags: ['test', 'automated']
      };

      const req = new Request('http://localhost/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.session).toBeDefined();
      expect(data.session.name).toBe('Test Session');
      expect(data.session.status).toBe('active');
    });

    it('should reject session without name', async () => {
      const sessionData = {
        device_name: 'Arduino Nicla'
      };

      const req = new Request('http://localhost/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should accept optional fields', async () => {
      const sessionData = {
        name: 'Minimal Session'
      };

      const req = new Request('http://localhost/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/sessions/:id/stop', () => {
    it('should stop an active session', async () => {
      // First create a session
      mockEnv.DB.insertSession(mockSession);

      const req = new Request(`http://localhost/api/sessions/${mockSession.id}/stop`, {
        method: 'POST'
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session.ended_at).toBeDefined();
      expect(data.session.status).toBe('completed');
    });

    it('should return 404 for non-existent session', async () => {
      const req = new Request('http://localhost/api/sessions/non-existent/stop', {
        method: 'POST'
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/sessions', () => {
    it('should return paginated sessions', async () => {
      // Insert test sessions
      for (let i = 0; i < 5; i++) {
        mockEnv.DB.insertSession({
          ...mockSession,
          id: `session-${i}`,
          name: `Test Session ${i}`
        });
      }

      const req = new Request('http://localhost/api/sessions?page=1&limit=10');
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.sessions).toBeDefined();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('should filter by status', async () => {
      mockEnv.DB.insertSession({ ...mockSession, status: 'active' });
      mockEnv.DB.insertSession({ ...mockSession, id: 'session-2', status: 'completed' });

      const req = new Request('http://localhost/api/sessions?status=active');
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.sessions).toBeDefined();
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return session details', async () => {
      mockEnv.DB.insertSession(mockSession);

      const req = new Request(`http://localhost/api/sessions/${mockSession.id}`);
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.session).toBeDefined();
      expect(data.session.id).toBe(mockSession.id);
    });

    it('should return 404 for non-existent session', async () => {
      const req = new Request('http://localhost/api/sessions/non-existent');
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/sessions/:id/data', () => {
    it('should return sensor readings for session', async () => {
      mockEnv.DB.insertSession(mockSession);
      mockEnv.DB.insertReading(mockSensorReading);

      const req = new Request(`http://localhost/api/sessions/${mockSession.id}/data`);
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.readings).toBeDefined();
      expect(data.pagination).toBeDefined();
    });

    it('should paginate readings', async () => {
      mockEnv.DB.insertSession(mockSession);
      
      // Insert multiple readings
      for (let i = 0; i < 20; i++) {
        mockEnv.DB.insertReading({
          ...mockSensorReading,
          id: `reading-${i}`,
          timestamp: Date.now() + i * 1000
        });
      }

      const req = new Request(`http://localhost/api/sessions/${mockSession.id}/data?page=1&limit=10`);
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.pagination.limit).toBe(10);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    it('should delete a session', async () => {
      mockEnv.DB.insertSession(mockSession);

      const req = new Request(`http://localhost/api/sessions/${mockSession.id}`, {
        method: 'DELETE'
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 404 when deleting non-existent session', async () => {
      const req = new Request('http://localhost/api/sessions/non-existent', {
        method: 'DELETE'
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(404);
    });
  });
});
