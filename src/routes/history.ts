import { Hono } from 'hono';
import { Env } from '../index';
import { html } from 'hono/html';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  const htmlContent = html`<!DOCTYPE html>
<html>
<head>
  <title>Session History - Nicla Sense Platform</title>
  <link href='https://fonts.googleapis.com/css?family=Roboto+Mono' rel='stylesheet'>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div class="container">
    <div class="header-bar widget">
      <h1>📊 Session History</h1>
      <div>
        <a href="/" class="btn-secondary">← Back to Dashboard</a>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters widget">
      <select id="statusFilter">
        <option value="">All Sessions</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>
      <input type="text" id="searchInput" placeholder="Search sessions...">
    </div>

    <!-- Sessions List -->
    <div id="sessionsList"></div>

    <!-- Pagination -->
    <div id="pagination" class="widget" style="text-align: center;"></div>
  </div>

  <!-- Session Detail Modal -->
  <div id="detailModal" class="modal" style="display:none;">
    <div class="modal-content modal-large">
      <div class="modal-header">
        <h2 id="modalTitle">Session Details</h2>
        <button id="closeModal" class="close-btn">✖</button>
      </div>
      <div id="modalBody">
        <!-- Dynamically loaded content -->
      </div>
    </div>
  </div>

  <script src="/js/history.js"></script>
</body>
</html>`;

  return c.html(htmlContent);
});

export default app;
