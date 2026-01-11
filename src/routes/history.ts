import { Hono } from 'hono';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>Session History - Nicla Sense Platform</title>
  <link href='https://fonts.googleapis.com/css?family=Roboto+Mono' rel='stylesheet'>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    * { font-family: 'Roboto Mono', sans-serif; box-sizing: border-box; }
    body { color: white; background: #000000; font-size: 14px; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .widget { 
      background-color: #111111; 
      border: 1px solid #333; 
      border-radius: 4px; 
      padding: 20px; 
      margin: 10px 0; 
    }
    .header-bar { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    h1 { margin: 0; color: #d8f41d; }
    .btn-primary, .btn-secondary, .btn-danger {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
      display: inline-block;
    }
    .btn-primary { background: #d8f41d; color: #000; }
    .btn-secondary { background: #444; color: #fff; }
    .btn-danger { background: #ff4444; color: #fff; }
    .btn-primary:hover { background: #c5db1a; }
    .btn-secondary:hover { background: #555; }
    .btn-danger:hover { background: #ff5555; }
    .filters { display: flex; gap: 10px; align-items: center; }
    .filters select, .filters input {
      background: #222;
      color: #fff;
      border: 1px solid #444;
      padding: 8px 12px;
      border-radius: 4px;
      flex: 1;
    }
    .session-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 15px;
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }
    .session-card:hover { border-color: #d8f41d; transform: translateX(5px); }
    .session-info h3 { margin: 0 0 10px 0; color: #d8f41d; }
    .session-meta { font-size: 12px; color: #888; }
    .session-meta span { margin-right: 15px; }
    .status-badge {
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
    }
    .status-active { background: #44ff44; color: #000; }
    .status-completed { background: #4488ff; color: #fff; }
    .session-actions { display: flex; gap: 10px; }
    .pagination { display: flex; justify-content: center; gap: 5px; padding: 20px; }
    .page-btn {
      background: #222;
      color: #fff;
      border: 1px solid #444;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 3px;
    }
    .page-btn:hover, .page-btn.active { background: #d8f41d; color: #000; border-color: #d8f41d; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 1000;
      overflow-y: auto;
    }
    .modal-content {
      background: #111;
      border: 1px solid #444;
      border-radius: 8px;
      margin: 50px auto;
      max-width: 900px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #333;
    }
    .modal-header h2 { margin: 0; color: #d8f41d; }
    .close-btn {
      background: #ff4444;
      color: #fff;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    .modal-body { padding: 20px; }
    .chart-container { margin: 20px 0; }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    .empty-state h2 { color: #444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar widget">
      <h1>📊 Session History</h1>
      <div>
        <a href="/" class="btn-secondary">← Back to Dashboard</a>
        <a href="/analytics" class="btn-primary" style="margin-left:10px;">📈 Analytics</a>
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
    <div id="pagination" class="pagination"></div>
  </div>

  <!-- Session Detail Modal -->
  <div id="detailModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle">Session Details</h2>
        <button id="closeModal" class="close-btn">✖</button>
      </div>
      <div id="modalBody" class="modal-body">
        <!-- Dynamically loaded content -->
      </div>
    </div>
  </div>

  <script>
    let currentPage = 1;
    let currentStatus = '';
    let searchQuery = '';

    // Load sessions on page load
    window.addEventListener('DOMContentLoaded', loadSessions);

    document.getElementById('statusFilter').addEventListener('change', (e) => {
      currentStatus = e.target.value;
      currentPage = 1;
      loadSessions();
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      currentPage = 1;
      loadSessions();
    });

    document.getElementById('closeModal').addEventListener('click', () => {
      document.getElementById('detailModal').style.display = 'none';
    });

    async function loadSessions() {
      const sessionsList = document.getElementById('sessionsList');
      sessionsList.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">Loading sessions...</div>';

      try {
        let url = \`/api/sessions?page=\${currentPage}&limit=20\`;
        if (currentStatus) url += \`&status=\${currentStatus}\`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!data.sessions || data.sessions.length === 0) {
          sessionsList.innerHTML = \`
            <div class="empty-state">
              <h2>No sessions found</h2>
              <p>Start recording on the dashboard to create your first session!</p>
              <a href="/" class="btn-primary">Go to Dashboard</a>
            </div>
          \`;
          return;
        }

        // Filter by search query
        let sessions = data.sessions;
        if (searchQuery) {
          sessions = sessions.filter(s => 
            s.name?.toLowerCase().includes(searchQuery) ||
            s.device_name?.toLowerCase().includes(searchQuery)
          );
        }

        sessionsList.innerHTML = sessions.map(session => {
          const duration = session.ended_at 
            ? formatDuration(session.ended_at - session.started_at)
            : 'In progress';
          const statusClass = session.status === 'active' ? 'status-active' : 'status-completed';
          
          return \`
            <div class="session-card">
              <div class="session-info">
                <h3>\${session.name || 'Unnamed Session'}</h3>
                <div class="session-meta">
                  <span>📅 \${new Date(session.started_at).toLocaleString()}</span>
                  <span>⏱ \${duration}</span>
                  <span>📊 \${session.reading_count || 0} readings</span>
                  <span class="status-badge \${statusClass}">\${session.status}</span>
                </div>
              </div>
              <div class="session-actions">
                <button class="btn-primary" onclick="viewSession('\${session.id}')">View Data</button>
                <button class="btn-secondary" onclick="exportSession('\${session.id}')">Export</button>
                <button class="btn-danger" onclick="deleteSession('\${session.id}')">Delete</button>
              </div>
            </div>
          \`;
        }).join('');

        // Pagination
        renderPagination(data.pagination);

      } catch (error) {
        sessionsList.innerHTML = \`
          <div class="empty-state">
            <h2>Error loading sessions</h2>
            <p>\${error.message}</p>
          </div>
        \`;
      }
    }

    function formatDuration(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) return \`\${hours}h \${minutes % 60}m\`;
      if (minutes > 0) return \`\${minutes}m \${seconds % 60}s\`;
      return \`\${seconds}s\`;
    }

    function renderPagination(pagination) {
      const paginationDiv = document.getElementById('pagination');
      const { page, totalPages } = pagination;
      
      if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
      }

      let html = '<button class="page-btn" onclick="goToPage(' + (page - 1) + ')" ' + (page === 1 ? 'disabled' : '') + '>← Prev</button>';
      
      for (let i = 1; i <= totalPages; i++) {
        if (i === page || i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
          html += '<button class="page-btn ' + (i === page ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
        } else if (i === page - 2 || i === page + 2) {
          html += '<span style="padding:8px;color:#666;">...</span>';
        }
      }
      
      html += '<button class="page-btn" onclick="goToPage(' + (page + 1) + ')" ' + (page === totalPages ? 'disabled' : '') + '>Next →</button>';
      
      paginationDiv.innerHTML = html;
    }

    function goToPage(page) {
      currentPage = page;
      loadSessions();
      window.scrollTo(0, 0);
    }

    async function viewSession(sessionId) {
      const modal = document.getElementById('detailModal');
      const modalBody = document.getElementById('modalBody');
      const modalTitle = document.getElementById('modalTitle');
      
      modal.style.display = 'block';
      modalBody.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">Loading session data...</div>';

      try {
        const [sessionRes, dataRes] = await Promise.all([
          fetch(\`/api/sessions/\${sessionId}\`),
          fetch(\`/api/sessions/\${sessionId}/data?limit=1000\`)
        ]);
        
        const sessionData = await sessionRes.json();
        const readings = await dataRes.json();
        
        modalTitle.textContent = sessionData.session.name || 'Session Details';
        
        // Group readings by sensor type
        const groupedData = {};
        readings.readings.forEach(r => {
          if (!groupedData[r.sensor_type]) {
            groupedData[r.sensor_type] = [];
          }
          groupedData[r.sensor_type].push(r);
        });

        modalBody.innerHTML = \`
          <div>
            <p><strong>Session ID:</strong> \${sessionData.session.id}</p>
            <p><strong>Started:</strong> \${new Date(sessionData.session.started_at).toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="status-badge status-\${sessionData.session.status}">\${sessionData.session.status}</span></p>
            <p><strong>Total Readings:</strong> \${readings.readings.length}</p>
            <hr style="border-color:#333;">
            <h3>Sensor Data Preview</h3>
            <div id="charts"></div>
          </div>
        \`;

        // Create charts for each sensor type
        const chartsDiv = document.getElementById('charts');
        Object.keys(groupedData).forEach(sensorType => {
          const chartId = 'chart-' + sensorType;
          chartsDiv.innerHTML += \`<div id="\${chartId}" class="chart-container" style="height:300px;"></div>\`;
          
          setTimeout(() => {
            plotSensorData(chartId, sensorType, groupedData[sensorType]);
          }, 100);
        });

      } catch (error) {
        modalBody.innerHTML = \`<div class="empty-state"><h2>Error loading session</h2><p>\${error.message}</p></div>\`;
      }
    }

    function plotSensorData(chartId, sensorType, readings) {
      const timestamps = readings.map(r => new Date(r.timestamp));
      const traces = [];

      // Extract all value columns (excluding id, session_id, sensor_type, timestamp)
      const valueKeys = Object.keys(readings[0]).filter(k => 
        !['id', 'session_id', 'sensor_type', 'timestamp', 'created_at'].includes(k) && readings[0][k] !== null
      );

      valueKeys.forEach(key => {
        traces.push({
          x: timestamps,
          y: readings.map(r => r[key]),
          name: key,
          mode: 'lines',
          line: { width: 2 }
        });
      });

      const layout = {
        title: sensorType + ' Data',
        plot_bgcolor: '#111',
        paper_bgcolor: '#111',
        font: { color: '#fff' },
        xaxis: { gridcolor: '#333' },
        yaxis: { gridcolor: '#333' },
        margin: { l: 50, r: 50, b: 50, t: 50 }
      };

      Plotly.newPlot(chartId, traces, layout, { responsive: true });
    }

    async function exportSession(sessionId) {
      try {
        const response = await fetch(\`/api/sessions/\${sessionId}/data?limit=100000\`);
        const data = await response.json();
        
        const csv = convertToCSV(data.readings);
        downloadFile(csv, \`session-\${sessionId}.csv\`, 'text/csv');
      } catch (error) {
        alert('Export failed: ' + error.message);
      }
    }

    function convertToCSV(data) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const rows = data.map(row => 
        headers.map(h => {
          const val = row[h];
          return typeof val === 'string' && val.includes(',') ? \`"\${val}"\` : val;
        }).join(',')
      );
      
      return [headers.join(','), ...rows].join('\\n');
    }

    function downloadFile(content, filename, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    async function deleteSession(sessionId) {
      if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) return;
      
      try {
        await fetch(\`/api/sessions/\${sessionId}\`, { method: 'DELETE' });
        loadSessions();
      } catch (error) {
        alert('Delete failed: ' + error.message);
      }
    }
  </script>
</body>
</html>`);
});

export default app;
