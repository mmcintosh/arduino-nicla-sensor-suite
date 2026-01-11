// Integration Tests - Complete Workflows
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import app from '../../src/index';
import { createMockEnv, mockSensorReading } from '../fixtures/mock-data';

describe('Integration Tests - Complete Workflows', () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
  });

  describe('Complete Recording Session Workflow', () => {
    it('should handle full session lifecycle', async () => {
      // 1. Start a session
      const startReq = new Request('http://localhost/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Integration Test Session',
          device_name: 'Test Arduino',
          notes: 'Full workflow test'
        })
      });

      const startRes = await app.fetch(startReq, mockEnv);
      const startData = await startRes.json();

      expect(startRes.status).toBe(201);
      expect(startData.success).toBe(true);

      const sessionId = startData.session.id;

      // 2. Record some sensor data
      for (let i = 0; i < 5; i++) {
        const dataReq = new Request('http://localhost/api/sensor-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...mockSensorReading,
            session_id: sessionId,
            timestamp: Date.now() + i * 1000,
            temperature: 22 + i * 0.5
          })
        });

        const dataRes = await app.fetch(dataReq, mockEnv);
        expect(dataRes.status).toBe(201);
      }

      // 3. Get session data
      const dataReq = new Request(`http://localhost/api/sessions/${sessionId}/data`);
      const dataRes = await app.fetch(dataReq, mockEnv);
      const dataData = await dataRes.json();

      expect(dataRes.status).toBe(200);
      expect(dataData.readings).toBeDefined();

      // 4. Get analytics
      const analyticsReq = new Request(`http://localhost/api/analytics/sessions/${sessionId}`);
      const analyticsRes = await app.fetch(analyticsReq, mockEnv);
      const analyticsData = await analyticsRes.json();

      expect(analyticsRes.status).toBe(200);
      expect(analyticsData.statistics).toBeDefined();

      // 5. Export data
      const exportReq = new Request(`http://localhost/api/analytics/export/${sessionId}?format=json`);
      const exportRes = await app.fetch(exportReq, mockEnv);
      const exportData = await exportRes.json();

      expect(exportRes.status).toBe(200);
      expect(exportData.session).toBeDefined();
      expect(exportData.readings).toBeDefined();

      // 6. Stop the session
      const stopReq = new Request(`http://localhost/api/sessions/${sessionId}/stop`, {
        method: 'POST'
      });

      const stopRes = await app.fetch(stopReq, mockEnv);
      const stopData = await stopRes.json();

      expect(stopRes.status).toBe(200);
      expect(stopData.success).toBe(true);
      expect(stopData.session.status).toBe('completed');
    });
  });

  describe('Batch Data Recording', () => {
    it('should handle large batch uploads', async () => {
      // Start session
      const startReq = new Request('http://localhost/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Batch Test Session' })
      });

      const startRes = await app.fetch(startReq, mockEnv);
      const { session } = await startRes.json();

      // Create batch of 50 readings
      const readings = Array.from({ length: 50 }, (_, i) => ({
        ...mockSensorReading,
        session_id: session.id,
        timestamp: Date.now() + i * 1000,
        temperature: 20 + Math.random() * 5
      }));

      const batchReq = new Request('http://localhost/api/sensor-data/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings })
      });

      const batchRes = await app.fetch(batchReq, mockEnv);
      const batchData = await batchRes.json();

      expect(batchRes.status).toBe(201);
      expect(batchData.count).toBe(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      const req = new Request('http://localhost/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing endpoints', async () => {
      const req = new Request('http://localhost/api/nonexistent');
      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(404);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const req = new Request('http://localhost/health');
      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });
});
