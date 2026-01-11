/**
 * Generate a unique ID (timestamp-based with random suffix)
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Calculate duration in human-readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Round number to specified decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  return Math.sqrt(variance);
}

/**
 * Validate session data
 */
export function validateSessionData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Session name is required and must be a string');
  }

  if (data.name && data.name.length > 200) {
    errors.push('Session name must be less than 200 characters');
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate sensor reading data
 */
export function validateSensorReading(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.session_id) {
    errors.push('session_id is required');
  }

  // At least one sensor value should be present
  const hasSensorData = 
    data.accelerometer || 
    data.gyroscope || 
    data.quaternion || 
    data.temperature !== undefined ||
    data.humidity !== undefined ||
    data.pressure !== undefined ||
    data.bsec !== undefined ||
    data.co2 !== undefined ||
    data.gas !== undefined;

  if (!hasSensorData) {
    errors.push('At least one sensor value must be provided');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
