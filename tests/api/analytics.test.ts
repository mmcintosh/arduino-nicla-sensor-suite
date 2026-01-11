// API Tests - Analytics Endpoints
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import analyticsRoutes from '../../src/routes/analytics';
import { createMockEnv, mockSession, mockSensorReading, mockAnalytics } from '../fixtures/mock-data';

describe('API - Analytics Endpoints', () => {
  let app: Hono;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
    app = new Hono();
    app.route('/api/analytics', analyticsRoutes);
    
    // Setup test data
    mockEnv.DB.insertSession(mockSession);
    for (let i = 0; i < 10; i++) {
      mockEnv.DB.insertReading({
        ...mockSensorReading,
        id: `reading-${i}`,
        timestamp: Date.now() + i * 1000,
        temperature: 22 + Math.random() * 2
      });
    }
  });

  describe('GET /api/analytics/sessions/:id', () => {
    it('should return analytics for a session', async () => {
      const req = new Request(`http://localhost/api/analytics/sessions/${mockSession.id}`);
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.session_id).toBe(mockSession.id);
      expect(data.statistics).toBeDefined();
      expect(data.duration_ms).toBeDefined();
    });

    it('should calculate temperature statistics', async () => {
      const req = new Request(`http://localhost/api/analytics/sessions/${mockSession.id}`);
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.statistics).toBeDefined();
      expect(data.statistics.temp_min).toBeDefined();
      expect(data.statistics.temp_max).toBeDefined();
      expect(data.statistics.temp_avg).toBeDefined();
      expect(typeof data.statistics.temp_min).toBe('number');
      expect(typeof data.statistics.temp_max).toBe('number');
      expect(typeof data.statistics.temp_avg).toBe('number');
    });

    it('should return 404 for non-existent session', async () => {
      const req = new Request('http://localhost/api/analytics/sessions/non-existent');
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/analytics/summary', () => {
    it('should return overall summary', async () => {
      const req = new Request('http://localhost/api/analytics/summary');
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.total_sessions).toBeDefined();
      expect(data.total_readings).toBeDefined();
      expect(data.recent_sessions).toBeDefined();
    });

    it('should include recent sessions', async () => {
      const req = new Request('http://localhost/api/analytics/summary');
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(Array.isArray(data.recent_sessions)).toBe(true);
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return trend data for temperature', async () => {
      const req = new Request(
        `http://localhost/api/analytics/trends?session_id=${mockSession.id}&metric=temperature&interval=60000`
      );
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.metric).toBe('temperature');
      expect(data.trends).toBeDefined();
      expect(Array.isArray(data.trends)).toBe(true);
    });

    it('should require session_id parameter', async () => {
      const req = new Request('http://localhost/api/analytics/trends?metric=temperature');
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(400);
    });

    it('should support different metrics', async () => {
      const metrics = ['temperature', 'humidity', 'pressure', 'bsec', 'co2', 'gas'];

      for (const metric of metrics) {
        const req = new Request(
          `http://localhost/api/analytics/trends?session_id=${mockSession.id}&metric=${metric}`
        );
        const res = await app.fetch(req, mockEnv);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.metric).toBe(metric);
      }
    });

    it('should reject invalid metrics', async () => {
      const req = new Request(
        `http://localhost/api/analytics/trends?session_id=${mockSession.id}&metric=invalid_metric`
      );
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/analytics/export/:id', () => {
    it('should export session data as JSON', async () => {
      const req = new Request(`http://localhost/api/analytics/export/${mockSession.id}?format=json`);
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.session).toBeDefined();
      expect(data.readings).toBeDefined();
      expect(Array.isArray(data.readings)).toBe(true);
    });

    it('should export session data as CSV', async () => {
      const req = new Request(`http://localhost/api/analytics/export/${mockSession.id}?format=csv`);
      const res = await app.fetch(req, mockEnv);
      const text = await res.text();

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/csv');
      expect(text).toContain('timestamp'); // CSV header
    });

    it('should default to JSON format', async () => {
      const req = new Request(`http://localhost/api/analytics/export/${mockSession.id}`);
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });

    it('should return 404 for non-existent session', async () => {
      const req = new Request('http://localhost/api/analytics/export/non-existent');
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });
  });
});
