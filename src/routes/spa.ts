import { Hono } from 'hono';
import { Env } from '../index';
import { SPA_HTML } from './spa-html';

const app = new Hono<{ Bindings: Env }>();

// Main SPA route - serves everything
app.get('/', async (c) => {
  return c.html(SPA_HTML);
});

// Handle client-side routing - all routes serve the same SPA
app.get('/history', async (c) => {
  return c.html(SPA_HTML);
});

app.get('/analytics', async (c) => {
  return c.html(SPA_HTML);
});

export default app;
