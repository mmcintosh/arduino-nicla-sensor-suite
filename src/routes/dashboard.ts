import { Hono } from 'hono';
import { Env } from '../index';
import { DASHBOARD_HTML } from './dashboard-html';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  // Serve the embedded dashboard HTML
  // Replace local GLTFLoader.js with CDN version since we can't serve static files easily
  let html = DASHBOARD_HTML.replace(
    '<script src="GLTFLoader.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/three@0.109.0/examples/js/loaders/GLTFLoader.js"></script>'
  );
  
  // Replace local model path with a CDN or embedded version
  // For now, use the GitHub hosted version
  html = html.replace(
    "loader.load('models/niclaSenseME.glb',",
    "loader.load('https://raw.githubusercontent.com/arduino/ArduinoAI/main/NiclaSenseME-dashboard/models/niclaSenseME.glb',"
  );
  
  return c.html(html);
});

export default app;
