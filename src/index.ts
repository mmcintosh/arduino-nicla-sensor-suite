import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Import routes
import sensorDataRoutes from './routes/sensor-data';
import sessionsRoutes from './routes/sessions';
import analyticsRoutes from './routes/analytics';
import spaRoute from './routes/spa';

// Types for Cloudflare Workers
export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware for Web Bluetooth
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    environment: c.env.ENVIRONMENT || 'development'
  });
});

// API Routes
app.route('/api/sensor-data', sensorDataRoutes);
app.route('/api/sessions', sessionsRoutes);
app.route('/api/analytics', analyticsRoutes);

// SPA Routes - Single Page Application with client-side routing
// BLE connection persists across all navigation
app.route('/', spaRoute);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err);
  return c.json({ 
    error: 'Internal Server Error', 
    message: err.message,
    timestamp: Date.now()
  }, 500);
});

export default app;
