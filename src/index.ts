import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Import routes
import sensorDataRoutes from './routes/sensor-data';
import sessionsRoutes from './routes/sessions';
import analyticsRoutes from './routes/analytics';
import dashboardRoute from './routes/dashboard';
import historyRoute from './routes/history';

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

// Page Routes - serve the original index.html with embedded CSS/JS
app.get('/', (c) => {
  // For now, serve a simple message. The full dashboard is in index.html
  // which can be opened directly in a browser for testing
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head><title>Nicla Sense Platform - API</title></head>
    <body style="font-family: sans-serif; max-width: 800px; margin: 50px auto;">
      <h1>🚀 Arduino Nicla Sense ME - IoT Data Platform</h1>
      <p>API server is running successfully!</p>
      <h2>Quick Links:</h2>
      <ul>
        <li><a href="/api/analytics/summary">API Summary</a></li>
        <li><a href="/health">Health Check</a></li>
      </ul>
      <h2>For the full dashboard:</h2>
      <p>Open <code>index.html</code> directly in your browser (Chrome/Edge) from the project directory.</p>
      <p>The dashboard connects to this API server for data storage.</p>
    </body>
    </html>
  `);
});
app.route('/history', historyRoute);

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
