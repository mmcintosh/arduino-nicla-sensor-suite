// History.js - View and manage recorded sessions

let currentPage = 1;
const limit = 20;
let currentFilter = '';

// Load sessions on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSessions();
  setupEventListeners();
});

function setupEventListeners() {
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('searchInput');
  const closeModal = document.getElementById('closeModal');

  statusFilter.addEventListener('change', () => {
    currentFilter = statusFilter.value;
    currentPage = 1;
    loadSessions();
  });

  searchInput.addEventListener('input', (e) => {
    // Implement search functionality
    currentPage = 1;
    loadSessions(e.target.value);
  });

  closeModal.addEventListener('click', () => {
    document.getElementById('detailModal').style.display = 'none';
  });
}

async function loadSessions(search = '') {
  const sessionsList = document.getElementById('sessionsList');
  sessionsList.innerHTML = '<div class="loading">Loading sessions...</div>';

  try {
    let url = `/api/sessions?page=${currentPage}&limit=${limit}`;
    if (currentFilter) {
      url += `&status=${currentFilter}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.sessions && data.sessions.length > 0) {
      renderSessions(data.sessions);
      renderPagination(data.pagination);
    } else {
      sessionsList.innerHTML = '<div class="widget"><p style="text-align: center; color: #888;">No sessions found</p></div>';
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
    sessionsList.innerHTML = '<div class="widget"><p style="text-align: center; color: #ff355e;">Error loading sessions</p></div>';
  }
}

function renderSessions(sessions) {
  const sessionsList = document.getElementById('sessionsList');
  sessionsList.innerHTML = '';

  sessions.forEach(session => {
    const card = createSessionCard(session);
    sessionsList.appendChild(card);
  });
}

function createSessionCard(session) {
  const card = document.createElement('div');
  card.className = 'widget session-card';
  
  const startDate = new Date(session.started_at).toLocaleString();
  const endDate = session.ended_at ? new Date(session.ended_at).toLocaleString() : 'In progress';
  const duration = formatDuration(session.duration_ms || (Date.now() - session.started_at));
  const readingCount = session.reading_count || 0;

  card.innerHTML = `
    <div class="session-card-header">
      <h3>${escapeHtml(session.name)}</h3>
      <span class="session-status ${session.status}">${session.status}</span>
    </div>
    <div class="session-card-details">
      <div>
        <strong>Started:</strong><br>
        ${startDate}
      </div>
      <div>
        <strong>Duration:</strong><br>
        ${duration}
      </div>
      <div>
        <strong>Data Points:</strong><br>
        ${readingCount.toLocaleString()}
      </div>
    </div>
    ${session.device_name ? `<div style="margin-top: 10px; font-size: 12px; color: #888;">Device: ${escapeHtml(session.device_name)}</div>` : ''}
    ${session.notes ? `<div style="margin-top: 10px; font-size: 12px; color: #dae3e3;">${escapeHtml(session.notes)}</div>` : ''}
    <div class="session-card-actions">
      <button class="btn-primary" onclick="viewSession('${session.id}')">View Details</button>
      <button class="btn-secondary" onclick="exportSession('${session.id}', 'csv')">Export CSV</button>
      <button class="btn-secondary" onclick="exportSession('${session.id}', 'json')">Export JSON</button>
      <button class="btn-danger" onclick="deleteSession('${session.id}', '${escapeHtml(session.name)}')">Delete</button>
    </div>
  `;

  return card;
}

function renderPagination(pagination) {
  const paginationDiv = document.getElementById('pagination');
  
  if (pagination.totalPages <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }

  let html = '<div style="display: flex; justify-content: center; gap: 10px; align-items: center;">';
  
  // Previous button
  if (pagination.page > 1) {
    html += `<button class="btn-secondary" onclick="changePage(${pagination.page - 1})">← Previous</button>`;
  }

  // Page numbers
  html += `<span style="color: #888;">Page ${pagination.page} of ${pagination.totalPages}</span>`;

  // Next button
  if (pagination.page < pagination.totalPages) {
    html += `<button class="btn-secondary" onclick="changePage(${pagination.page + 1})">Next →</button>`;
  }

  html += '</div>';
  paginationDiv.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  loadSessions();
  window.scrollTo(0, 0);
}

async function viewSession(sessionId) {
  const modal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');
  
  modal.style.display = 'flex';
  modalBody.innerHTML = '<div class="loading">Loading session details...</div>';

  try {
    // Load session details and analytics
    const [sessionResponse, analyticsResponse] = await Promise.all([
      fetch(`/api/sessions/${sessionId}`),
      fetch(`/api/analytics/sessions/${sessionId}`)
    ]);

    const sessionData = await sessionResponse.json();
    const analyticsData = await analyticsResponse.json();

    renderSessionDetails(sessionData.session, analyticsData);
  } catch (error) {
    console.error('Error loading session details:', error);
    modalBody.innerHTML = '<p style="color: #ff355e;">Error loading session details</p>';
  }
}

function renderSessionDetails(session, analytics) {
  const modalBody = document.getElementById('modalBody');
  const modalTitle = document.getElementById('modalTitle');
  
  modalTitle.textContent = session.name;

  const startDate = new Date(session.started_at).toLocaleString();
  const endDate = session.ended_at ? new Date(session.ended_at).toLocaleString() : 'In progress';
  const duration = formatDuration(analytics.duration_ms);

  let html = `
    <div style="margin-bottom: 20px;">
      <p><strong>Status:</strong> <span class="session-status ${session.status}">${session.status}</span></p>
      <p><strong>Started:</strong> ${startDate}</p>
      <p><strong>Ended:</strong> ${endDate}</p>
      <p><strong>Duration:</strong> ${duration}</p>
      <p><strong>Total Readings:</strong> ${(analytics.statistics.total_readings || 0).toLocaleString()}</p>
      ${session.device_name ? `<p><strong>Device:</strong> ${escapeHtml(session.device_name)}</p>` : ''}
      ${session.notes ? `<p><strong>Notes:</strong> ${escapeHtml(session.notes)}</p>` : ''}
    </div>

    <h3 style="color: #d8f41d; margin-top: 30px;">Sensor Statistics</h3>
    <div class="stats-grid">
  `;

  // Temperature stats
  if (analytics.statistics.temp_avg !== null) {
    html += `
      <div class="stat-card">
        <h4>🌡️ Temperature</h4>
        <div class="stat-value">${round(analytics.statistics.temp_avg)}°C</div>
        <div class="stat-label">Min: ${round(analytics.statistics.temp_min)}°C | Max: ${round(analytics.statistics.temp_max)}°C</div>
      </div>
    `;
  }

  // Humidity stats
  if (analytics.statistics.humidity_avg !== null) {
    html += `
      <div class="stat-card">
        <h4>💧 Humidity</h4>
        <div class="stat-value">${round(analytics.statistics.humidity_avg)}%</div>
        <div class="stat-label">Min: ${round(analytics.statistics.humidity_min)}% | Max: ${round(analytics.statistics.humidity_max)}%</div>
      </div>
    `;
  }

  // Pressure stats
  if (analytics.statistics.pressure_avg !== null) {
    html += `
      <div class="stat-card">
        <h4>🌪️ Pressure</h4>
        <div class="stat-value">${round(analytics.statistics.pressure_avg)} kPa</div>
        <div class="stat-label">Min: ${round(analytics.statistics.pressure_min)} | Max: ${round(analytics.statistics.pressure_max)} kPa</div>
      </div>
    `;
  }

  // Air Quality stats
  if (analytics.statistics.bsec_avg !== null) {
    html += `
      <div class="stat-card">
        <h4>🏠 Air Quality (BSEC)</h4>
        <div class="stat-value">${round(analytics.statistics.bsec_avg)}</div>
        <div class="stat-label">Min: ${round(analytics.statistics.bsec_min)} | Max: ${round(analytics.statistics.bsec_max)}</div>
      </div>
    `;
  }

  // CO2 stats
  if (analytics.statistics.co2_avg !== null) {
    html += `
      <div class="stat-card">
        <h4>🌱 CO2 Level</h4>
        <div class="stat-value">${Math.round(analytics.statistics.co2_avg)}</div>
        <div class="stat-label">Min: ${analytics.statistics.co2_min} | Max: ${analytics.statistics.co2_max}</div>
      </div>
    `;
  }

  // Motion stats
  if (analytics.statistics.accel_magnitude_max !== null) {
    html += `
      <div class="stat-card">
        <h4>🚀 Max Acceleration</h4>
        <div class="stat-value">${round(analytics.statistics.accel_magnitude_max)}</div>
        <div class="stat-label">Peak motion detected</div>
      </div>
    `;
  }

  html += `
    </div>
    <div style="margin-top: 30px; text-align: center;">
      <button class="btn-primary" onclick="exportSession('${session.id}', 'csv')">Export as CSV</button>
      <button class="btn-primary" onclick="exportSession('${session.id}', 'json')">Export as JSON</button>
    </div>
  `;

  modalBody.innerHTML = html;
}

async function exportSession(sessionId, format) {
  window.open(`/api/analytics/export/${sessionId}?format=${format}`, '_blank');
}

async function deleteSession(sessionId, sessionName) {
  if (!confirm(`Are you sure you want to delete "${sessionName}"?\n\nThis will permanently delete all sensor data for this session.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    
    if (result.success) {
      alert(`Session "${sessionName}" has been deleted.`);
      loadSessions();
    } else {
      alert('Failed to delete session');
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    alert('Error deleting session');
  }
}

// Utility functions
function formatDuration(milliseconds) {
  if (!milliseconds) return '0s';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function round(value, decimals = 2) {
  if (value === null || value === undefined) return 'N/A';
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
