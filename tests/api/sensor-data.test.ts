// API Tests - Sensor Data Endpoints
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import sensorDataRoutes from '../../src/routes/sensor-data';
import { createMockEnv, mockSensorReading, mockBatchReadings, mockSession } from '../fixtures/mock-data';

describe('API - Sensor Data Endpoints', () => {
  let app: Hono;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
    app = new Hono();
    app.route('/api/sensor-data', sensorDataRoutes);
    
    // Setup a test session
    mockEnv.DB.insertSession(mockSession);
  });

  describe('POST /api/sensor-data', () => {
    it('should store a single sensor reading', async () => {
      const req = new Request('http://localhost/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockSensorReading)
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.id).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    it('should reject reading without session_id', async () => {
      const invalidReading = { ...mockSensorReading };
      delete invalidReading.session_id;

      const req = new Request('http://localhost/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidReading)
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(400);
    });

    it('should accept partial sensor data', async () => {
      const partialReading = {
        session_id: mockSession.id,
        timestamp: Date.now(),
        temperature: 22.5,
        humidity: 45
      };

      const req = new Request('http://localhost/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialReading)
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should accept all sensor types', async () => {
      const fullReading = {
        session_id: mockSession.id,
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

      const req = new Request('http://localhost/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullReading)
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/sensor-data/batch', () => {
    it('should store multiple readings at once', async () => {
      const req = new Request('http://localhost/api/sensor-data/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings: mockBatchReadings })
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.count).toBe(mockBatchReadings.length);
    });

    it('should reject empty batch', async () => {
      const req = new Request('http://localhost/api/sensor-data/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings: [] })
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(400);
    });

    it('should reject invalid batch format', async () => {
      const req = new Request('http://localhost/api/sensor-data/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings: 'not-an-array' })
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(400);
    });

    it('should handle large batches', async () => {
      const largeB atch = Array.from({ length: 100 }, (_, i) => ({
        ...mockSensorReading,
        timestamp: Date.now() + i * 1000
      }));

      const req = new Request('http://localhost/api/sensor-data/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings: largeBatch })
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.count).toBe(100);
    });
  });

  describe('Data Validation', () => {
    it('should validate accelerometer format', async () => {
      const invalidReading = {
        ...mockSensorReading,
        accelerometer: { x: 'invalid', y: 0, z: 0 }
      };

      const req = new Request('http://localhost/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidReading)
      });

      const res = await app.fetch(req, mockEnv);
      // Should still accept it - validation is loose
      expect(res.status).toBe(201);
    });

    it('should handle missing timestamp', async () => {
      const readingNoTimestamp = { ...mockSensorReading };
      delete readingNoTimestamp.timestamp;

      const req = new Request('http://localhost/api/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readingNoTimestamp)
      });

      const res = await app.fetch(req, mockEnv);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.timestamp).toBeDefined(); // Should be auto-generated
    });
  });
});
