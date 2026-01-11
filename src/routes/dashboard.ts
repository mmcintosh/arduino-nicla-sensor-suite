import { Hono } from 'hono';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  // Serve the original demo HTML with all embedded CSS/JS
  // For now, redirect to use the index.html file directly
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="refresh" content="0; url=/demo.html">
      <title>Redirecting...</title>
      <style>
        body { 
          font-family: 'Roboto Mono', monospace; 
          background: #000; 
          color: #fff; 
          padding: 50px;
          text-align: center;
        }
        a { color: #d8f41d; }
      </style>
    </head>
    <body>
      <h1>🚀 Arduino Nicla Sense ME Platform</h1>
      <p>Redirecting to dashboard...</p>
      <p>If not redirected, <a href="/demo.html">click here</a></p>
      <p>Or open <code>index.html</code> directly in your browser for the full experience.</p>
    </body>
    </html>
  `);
});

export default app;
