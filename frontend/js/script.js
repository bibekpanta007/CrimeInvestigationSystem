// API base URL
const API_BASE = 'http://localhost:3000/api';

// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      window.location.href = 'dashboard.html';
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed');
  }
});

// Register form handler
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
      alert('Registration successful! Please login.');
      window.location.href = 'login.html';
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Register error:', error);
    alert('Registration failed');
  }
});

// Add Case form handler
document.getElementById('addCaseForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    if (response.ok) {
      alert('Case added successfully!');
      e.target.reset();
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Add case error:', error);
    alert('Failed to add case');
  }
});

// Add Suspect form handler
document.getElementById('addSuspectForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    suspectId: formData.get('suspectId'),
    name: formData.get('fullName'),
    alias: formData.get('alias'),
    age: formData.get('age'),
    gender: formData.get('gender'),
    crimeType: formData.get('crimeType'),
    address: formData.get('lastKnownLocation'),
    riskLevel: formData.get('riskLevel'),
    status: formData.get('status'),
    caseId: formData.get('caseId'),
    notes: formData.get('notes')
  };
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE}/suspects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
      alert('Suspect added successfully!');
      e.target.reset();
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Add suspect error:', error);
    alert('Failed to add suspect');
  }
});

// Add Evidence form handler
document.getElementById('addEvidenceForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    evidenceId: formData.get('evidenceId'),
    caseId: formData.get('caseId'),
    type: formData.get('evidenceType'),
    name: formData.get('evidenceName'),
    location: formData.get('foundLocation'),
    foundDate: formData.get('foundDate'),
    collectedBy: formData.get('collectedBy'),
    status: formData.get('evidenceStatus'),
    notes: formData.get('notes')
  };
  // Add the image file
  if (formData.get('evidenceImage')) {
    data.evidenceImage = formData.get('evidenceImage');
  }
  const token = localStorage.getItem('token');

  const submitFormData = new FormData();
  Object.keys(data).forEach(key => {
    submitFormData.append(key, data[key]);
  });
  if (formData.get('evidenceImage')) {
    submitFormData.append('evidenceImage', formData.get('evidenceImage'));
  }

  try {
    const response = await fetch(`${API_BASE}/evidence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: submitFormData
    });

    const result = await response.json();
    if (response.ok) {
      alert('Evidence added successfully!');
      e.target.reset();
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Add evidence error:', error);
    alert('Failed to add evidence');
  }
});

// Add Officer form handler
document.getElementById('addOfficerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE}/officers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
      alert('Officer added successfully!');
      e.target.reset();
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Add officer error:', error);
    alert('Failed to add officer');
  }
});

// Load dashboard data
async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    // Load stats
    const statsResponse = await fetch(`${API_BASE}/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await statsResponse.json();
    if (statsResponse.ok) {
      document.querySelector('.stat-card:nth-child(1) h3').textContent = stats.openCases;
      document.querySelector('.stat-card:nth-child(2) h3').textContent = stats.suspects;
      document.querySelector('.stat-card:nth-child(3) h3').textContent = stats.evidence;
      document.querySelector('.stat-card:nth-child(4) h3').textContent = stats.agents;
    }

    // Load recent cases
    const casesResponse = await fetch(`${API_BASE}/cases/recent`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cases = await casesResponse.json();
    if (casesResponse.ok) {
      const tbody = document.querySelector('.recent-cases table tbody');
      tbody.innerHTML = cases.map(c => `
        <tr>
          <td>${c.caseId}</td>
          <td>${c.title}</td>
          <td>${c.crimeType}</td>
          <td>${c.status}</td>
          <td>${c.assignedAgent}</td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Dashboard load error:', error);
  }
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.querySelector('a[href="login.html"]');
  if (logoutBtn && logoutBtn.textContent === 'Logout') {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  }

  // Load dashboard if on dashboard page
  if (window.location.pathname.includes('dashboard.html')) {
    loadDashboard();
  }
});