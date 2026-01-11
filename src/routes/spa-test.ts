import { Hono } from 'hono';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

// Simple test route
app.get('/', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html>
<head>
  <title>SPA Test</title>
</head>
<body>
  <h1>SPA Test Page</h1>
  <button id="testBtn">Click Me</button>
  <div id="output"></div>
  
  <script>
    console.log('✅ Script is running!');
    
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ DOM loaded!');
      
      const btn = document.getElementById('testBtn');
      const output = document.getElementById('output');
      
      if (!btn) {
        console.error('❌ Button not found!');
      } else {
        console.log('✅ Button found!');
        btn.addEventListener('click', () => {
          console.log('🔘 Button clicked!');
          output.textContent = 'Button works! Server time: ' + Date.now();
        });
      }
    });
  </script>
</body>
</html>
  `);
});

app.get('/history', async (c) => {
  return c.html('<h1>History - Coming Soon</h1>');
});

app.get('/analytics', async (c) => {
  return c.html('<h1>Analytics - Coming Soon</h1>');
});

export default app;
