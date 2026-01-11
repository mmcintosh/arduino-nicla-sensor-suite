// Utility Functions Tests
import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatTimestamp,
  formatDuration,
  roundTo,
  calculateStdDev,
  validateSessionData,
  validateSensorReading
} from '../../src/utils/helpers';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should generate IDs with timestamp component', () => {
      const id = generateId();
      const [timestamp] = id.split('-');

      expect(timestamp).toBeDefined();
      expect(timestamp.length).toBeGreaterThan(0);
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp to ISO string', () => {
      const timestamp = 1704067200000; // 2024-01-01 00:00:00 UTC
      const formatted = formatTimestamp(timestamp);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(59000)).toBe('59s');
    });

    it('should format minutes correctly', () => {
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should format hours correctly', () => {
      expect(formatDuration(3600000)).toBe('1h 0m');
      expect(formatDuration(3665000)).toBe('1h 1m');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('roundTo', () => {
    it('should round to 2 decimal places by default', () => {
      expect(roundTo(3.14159)).toBe(3.14);
      expect(roundTo(2.5)).toBe(2.5);
    });

    it('should round to specified decimal places', () => {
      expect(roundTo(3.14159, 3)).toBe(3.142);
      expect(roundTo(3.14159, 0)).toBe(3);
      expect(roundTo(3.14159, 4)).toBe(3.1416);
    });

    it('should handle negative numbers', () => {
      expect(roundTo(-3.14159, 2)).toBe(-3.14);
    });
  });

  describe('calculateStdDev', () => {
    it('should calculate standard deviation correctly', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      const stdDev = calculateStdDev(values);

      expect(stdDev).toBeCloseTo(2, 0);
    });

    it('should return 0 for empty array', () => {
      expect(calculateStdDev([])).toBe(0);
    });

    it('should return 0 for single value', () => {
      expect(calculateStdDev([5])).toBe(0);
    });

    it('should handle identical values', () => {
      const values = [5, 5, 5, 5, 5];
      expect(calculateStdDev(values)).toBe(0);
    });
  });

  describe('validateSessionData', () => {
    it('should validate correct session data', () => {
      const sessionData = {
        name: 'Test Session',
        notes: 'Test notes',
        tags: ['test']
      };

      const result = validateSessionData(sessionData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing name', () => {
      const sessionData = {
        notes: 'Test notes'
      };

      const result = validateSessionData(sessionData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('name');
    });

    it('should reject name that is too long', () => {
      const sessionData = {
        name: 'A'.repeat(201)
      };

      const result = validateSessionData(sessionData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Session name must be less than 200 characters');
    });

    it('should reject invalid tags format', () => {
      const sessionData = {
        name: 'Test Session',
        tags: 'not-an-array'
      };

      const result = validateSessionData(sessionData as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tags must be an array');
    });

    it('should accept optional fields', () => {
      const sessionData = {
        name: 'Minimal Session'
      };

      const result = validateSessionData(sessionData);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateSensorReading', () => {
    it('should validate correct sensor reading', () => {
      const reading = {
        session_id: 'test-session',
        temperature: 22.5,
        humidity: 45
      };

      const result = validateSensorReading(reading);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing session_id', () => {
      const reading = {
        temperature: 22.5
      };

      const result = validateSensorReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('session_id is required');
    });

    it('should reject reading with no sensor data', () => {
      const reading = {
        session_id: 'test-session'
      };

      const result = validateSensorReading(reading);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('At least one sensor value');
    });

    it('should accept any single sensor value', () => {
      const readings = [
        { session_id: 'test', temperature: 22 },
        { session_id: 'test', humidity: 45 },
        { session_id: 'test', pressure: 101 },
        { session_id: 'test', bsec: 50 },
        { session_id: 'test', co2: 400 },
        { session_id: 'test', gas: 50000 },
        { session_id: 'test', accelerometer: { x: 0, y: 0, z: 0 } },
        { session_id: 'test', gyroscope: { x: 0, y: 0, z: 0 } },
        { session_id: 'test', quaternion: { x: 0, y: 0, z: 0, w: 1 } }
      ];

      readings.forEach(reading => {
        const result = validateSensorReading(reading);
        expect(result.valid).toBe(true);
      });
    });
  });
});
