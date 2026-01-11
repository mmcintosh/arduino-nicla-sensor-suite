import { Hono } from 'hono';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>Analytics - Nicla Sense Platform</title>
  <link href='https://fonts.googleapis.com/css?family=Roboto+Mono' rel='stylesheet'>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    * { font-family: 'Roboto Mono', sans-serif; box-sizing: border-box; }
    body { color: white; background: #000000; font-size: 14px; margin: 0; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
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
    h2 { color: #d8f41d; font-size: 18px; }
    .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
      display: inline-block;
      background: #444;
      color: #fff;
    }
    .btn-secondary:hover { background: #555; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      transition: all 0.2s;
    }
    .stat-card:hover {
      border-color: #d8f41d;
      transform: translateY(-5px);
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #d8f41d;
      margin: 10px 0;
    }
    .stat-label {
      font-size: 14px;
      color: #888;
      text-transform: uppercase;
    }
    .chart-container {
      margin: 20px 0;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 20px;
    }
    .loading {
      text-align: center;
      padding: 60px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar widget">
      <h1>📈 Analytics Dashboard</h1>
      <div>
        <a href="/history" class="btn-secondary">📊 History</a>
        <a href="/" class="btn-secondary" style="margin-left:10px;">← Dashboard</a>
      </div>
    </div>

    <!-- Key Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Sessions</div>
        <div class="stat-value" id="totalSessions">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Readings</div>
        <div class="stat-value" id="totalReadings">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Sessions</div>
        <div class="stat-value" id="activeSessions">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Session Duration</div>
        <div class="stat-value" id="avgDuration">-</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="widget">
      <h2>Average Sensor Values Across All Sessions</h2>
      <div id="sensorAveragesChart" class="chart-container" style="height:400px;"></div>
    </div>

    <div class="widget">
      <h2>Temperature Trends</h2>
      <div id="temperatureChart" class="chart-container" style="height:350px;"></div>
    </div>

    <div class="widget">
      <h2>Humidity Trends</h2>
      <div id="humidityChart" class="chart-container" style="height:350px;"></div>
    </div>

    <div class="widget">
      <h2>Pressure Trends</h2>
      <div id="pressureChart" class="chart-container" style="height:350px;"></div>
    </div>

    <div class="widget">
      <h2>Air Quality (BSEC) Trends</h2>
      <div id="bsecChart" class="chart-container" style="height:350px;"></div>
    </div>

    <div class="widget">
      <h2>Recent Sessions</h2>
      <div id="recentSessions"></div>
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', loadAnalytics);

    async function loadAnalytics() {
      try {
        // Load summary stats
        const summaryRes = await fetch('/api/analytics/summary');
        const summary = await summaryRes.json();

        document.getElementById('totalSessions').textContent = summary.total_sessions || 0;
        document.getElementById('totalReadings').textContent = (summary.total_readings || 0).toLocaleString();

        // Count active sessions
        const activeSessions = summary.recent_sessions?.filter(s => s.status === 'active').length || 0;
        document.getElementById('activeSessions').textContent = activeSessions;

        // Recent sessions list
        const recentSessionsDiv = document.getElementById('recentSessions');
        if (summary.recent_sessions && summary.recent_sessions.length > 0) {
          recentSessionsDiv.innerHTML = summary.recent_sessions.map(session => {
            const statusColor = session.status === 'active' ? '#44ff44' : '#4488ff';
            const duration = session.ended_at 
              ? formatDuration(session.ended_at - session.started_at)
              : 'In progress';
            
            return \`
              <div style="padding:15px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <strong style="color:#d8f41d;">\${session.name || 'Unnamed Session'}</strong><br>
                  <small style="color:#888;">
                    📅 \${new Date(session.started_at).toLocaleString()} · ⏱ \${duration}
                  </small>
                </div>
                <span style="background:\${statusColor};color:#000;padding:4px 8px;border-radius:3px;font-size:11px;font-weight:bold;">
                  \${session.status}
                </span>
              </div>
            \`;
          }).join('');
        } else {
          recentSessionsDiv.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">No sessions yet</div>';
        }

        // Load all sessions for charts
        const sessionsRes = await fetch('/api/sessions?limit=100');
        const sessionsData = await sessionsRes.json();

        if (sessionsData.sessions && sessionsData.sessions.length > 0) {
          // Calculate average duration
          const completedSessions = sessionsData.sessions.filter(s => s.ended_at);
          if (completedSessions.length > 0) {
            const avgMs = completedSessions.reduce((sum, s) => 
              sum + (s.ended_at - s.started_at), 0) / completedSessions.length;
            document.getElementById('avgDuration').textContent = formatDuration(avgMs);
          }

          // Load sensor data from all completed sessions
          await loadAllSensorData(completedSessions);
        }

      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    }

    async function loadAllSensorData(sessions) {
      const allSensorData = {
        temperature: [],
        humidity: [],
        pressure: [],
        bsec: [],
        co2: [],
        gas: []
      };

      // Fetch data from each session
      for (const session of sessions.slice(0, 10)) { // Limit to 10 most recent
        try {
          const dataRes = await fetch(\`/api/sessions/\${session.id}/data?limit=1000\`);
          const data = await dataRes.json();

          if (data.readings && data.readings.length > 0) {
            data.readings.forEach(r => {
              if (r.temperature !== null) allSensorData.temperature.push({ time: r.timestamp, value: r.temperature, session: session.name });
              if (r.humidity !== null) allSensorData.humidity.push({ time: r.timestamp, value: r.humidity, session: session.name });
              if (r.pressure !== null) allSensorData.pressure.push({ time: r.timestamp, value: r.pressure, session: session.name });
              if (r.bsec !== null) allSensorData.bsec.push({ time: r.timestamp, value: r.bsec, session: session.name });
              if (r.co2 !== null) allSensorData.co2.push({ time: r.timestamp, value: r.co2, session: session.name });
              if (r.gas !== null) allSensorData.gas.push({ time: r.timestamp, value: r.gas, session: session.name });
            });
          }
        } catch (error) {
          console.error('Error loading session data:', error);
        }
      }

      // Plot sensor averages
      plotSensorAverages(allSensorData);

      // Plot individual sensor trends
      plotSensorTrend('temperatureChart', 'Temperature (°C)', allSensorData.temperature);
      plotSensorTrend('humidityChart', 'Humidity (%)', allSensorData.humidity);
      plotSensorTrend('pressureChart', 'Pressure (kPa)', allSensorData.pressure);
      plotSensorTrend('bsecChart', 'Air Quality (BSEC)', allSensorData.bsec);
    }

    function plotSensorAverages(sensorData) {
      const sensorNames = [];
      const avgValues = [];
      const colors = ['#d8f41d', '#44ff44', '#4488ff', '#ff44ff', '#ff8844', '#44ffff'];

      Object.keys(sensorData).forEach((sensor, idx) => {
        if (sensorData[sensor].length > 0) {
          const avg = sensorData[sensor].reduce((sum, d) => sum + d.value, 0) / sensorData[sensor].length;
          sensorNames.push(sensor.toUpperCase());
          avgValues.push(avg.toFixed(2));
        }
      });

      if (sensorNames.length === 0) {
        document.getElementById('sensorAveragesChart').innerHTML = 
          '<div style="text-align:center;padding:60px;color:#666;">No sensor data available yet. Start recording!</div>';
        return;
      }

      const trace = {
        x: sensorNames,
        y: avgValues,
        type: 'bar',
        marker: { color: colors.slice(0, sensorNames.length) },
        text: avgValues.map(v => v.toString()),
        textposition: 'outside'
      };

      const layout = {
        plot_bgcolor: '#1a1a1a',
        paper_bgcolor: '#1a1a1a',
        font: { color: '#fff', family: 'Roboto Mono' },
        xaxis: { gridcolor: '#333', title: 'Sensor Type' },
        yaxis: { gridcolor: '#333', title: 'Average Value' },
        margin: { l: 50, r: 20, b: 80, t: 20 }
      };

      Plotly.newPlot('sensorAveragesChart', [trace], layout, { responsive: true });
    }

    function plotSensorTrend(chartId, title, data) {
      if (!data || data.length === 0) {
        document.getElementById(chartId).innerHTML = 
          '<div style="text-align:center;padding:60px;color:#666;">No data available for this sensor</div>';
        return;
      }

      const trace = {
        x: data.map(d => new Date(d.time)),
        y: data.map(d => d.value),
        mode: 'lines+markers',
        line: { width: 2, color: '#d8f41d' },
        marker: { size: 4 },
        name: title
      };

      const layout = {
        title: { text: title, font: { color: '#d8f41d' } },
        plot_bgcolor: '#1a1a1a',
        paper_bgcolor: '#1a1a1a',
        font: { color: '#fff', family: 'Roboto Mono' },
        xaxis: { gridcolor: '#333', title: 'Time' },
        yaxis: { gridcolor: '#333', title: 'Value' },
        margin: { l: 50, r: 20, b: 50, t: 50 }
      };

      Plotly.newPlot(chartId, [trace], layout, { responsive: true });
    }

    function formatDuration(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return \`\${days}d \${hours % 24}h\`;
      if (hours > 0) return \`\${hours}h \${minutes % 60}m\`;
      if (minutes > 0) return \`\${minutes}m\`;
      return \`\${seconds}s\`;
    }
  </script>
</body>
</html>`);
});

export default app;
