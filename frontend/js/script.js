const API_BASE = 'https://crimeinvestigationsystem.onrender.com/api';

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

function requireLogin(redirect = true) {
  // Phase 1: no authentication required, return dummy user
  return { agentId: 'PHASE1', codeName: 'TestOfficer', fullName: 'Test Officer', role: 'Investigator' };
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const agentId = document.getElementById('agentId').value.trim();
    const codeName = document.getElementById('codeName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!agentId || !codeName || !email || !password) {
      return alert('Please fill in all fields');
    }

    const result = await apiCall('/login', 'POST', { agentId, codeName, email, password });
    if (result.ok) {
      localStorage.setItem('user', JSON.stringify(result.data.user));
      window.location.href = 'dashboard.html';
    } else {
      alert('Login failed: ' + (result.data.error || 'Unknown error'));
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const agentId = document.getElementById('agentId').value.trim();
    const codeName = document.getElementById('codeName').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!agentId || !codeName || !fullName || !email || !password || !confirmPassword) {
      return alert('Please fill in all fields');
    }
    if (password !== confirmPassword) {
      return alert('Passwords do not match');
    }

    const defaultRole = 'Investigator';
    const result = await apiCall('/register', 'POST', { agentId, codeName, fullName, email, password, role: defaultRole });
    if (result.ok) {
      alert('Registration successful! Please login.');
      window.location.href = 'login.html';
    } else {
      alert('Registration failed: ' + (result.data.error || 'Unknown error'));
    }
  });
}

const addCaseForm = document.getElementById('addCaseForm');
if (addCaseForm) {
  addCaseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireLogin()) return;

    const body = {
      caseId: document.getElementById('caseId').value.trim(),
      caseTitle: document.getElementById('caseTitle').value.trim(),
      crimeType: document.getElementById('crimeType').value,
      caseStatus: document.getElementById('caseStatus').value,
      priorityLevel: document.getElementById('priorityLevel').value,
      assignedAgent: document.getElementById('assignedAgent').value.trim(),
      caseLocation: document.getElementById('caseLocation').value.trim(),
      reportedDate: document.getElementById('reportedDate').value,
      caseDescription: document.getElementById('caseDescription').value.trim()
    };

    if (!body.caseId || !body.caseTitle || !body.crimeType) {
      return alert('Please fill in required fields');
    }

    const result = await apiCall('/cases', 'POST', body);
    if (result.ok) {
      alert('Case added successfully!');
      addCaseForm.reset();
    } else {
      alert('Error: ' + (result.data.error || 'Failed to add case'));
    }
  });
}

const addSuspectForm = document.getElementById('addSuspectForm');
if (addSuspectForm) {
  addSuspectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireLogin()) return;

    const body = {
      suspectId: document.getElementById('suspectId')?.value.trim() || `SUS-${Date.now()}`,
      name: document.getElementById('fullName')?.value.trim() || '',
      alias: document.getElementById('alias')?.value.trim() || '',
      age: document.getElementById('age')?.value || '',
      gender: document.getElementById('gender')?.value || 'Other',
      crimeType: document.getElementById('crimeType')?.value || '',
      address: document.getElementById('lastKnownLocation')?.value || '',
      riskLevel: document.getElementById('riskLevel')?.value || 'Low',
      status: document.getElementById('status')?.value || 'Active',
      caseId: document.getElementById('caseIdSuspect')?.value || '',
      notes: document.getElementById('description')?.value || ''
    };

    if (!body.suspectId || !body.name || !body.crimeType) {
      return alert('Please fill in required fields');
    }

    const result = await apiCall('/suspects', 'POST', body);
    if (result.ok) {
      alert('Suspect added successfully!');
      addSuspectForm.reset();
      loadSuspects();
    } else {
      alert('Error: ' + (result.data.error || 'Failed to add suspect'));
    }
  });
}

const addEvidenceForm = document.getElementById('addEvidenceForm');
if (addEvidenceForm) {
  addEvidenceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireLogin()) return;

    const body = {
      evidenceId: document.getElementById('evidenceId')?.value.trim() || `EVID-${Date.now()}`,
      caseId: document.getElementById('caseId')?.value.trim() || '',
      type: document.getElementById('evidenceType')?.value || '',
      name: document.getElementById('evidenceName')?.value.trim() || '',
      location: document.getElementById('foundLocation')?.value.trim() || '',
      foundDate: document.getElementById('foundDate')?.value || '',
      collectedBy: document.getElementById('collectedBy')?.value.trim() || '',
      status: document.getElementById('evidenceStatus')?.value || 'Stored',
      notes: document.getElementById('description')?.value || ''
    };

    if (!body.evidenceId || !body.caseId || !body.type || !body.name || !body.location) {
      return alert('Please fill in required fields');
    }

    const result = await apiCall('/evidence', 'POST', body);
    if (result.ok) {
      alert('Evidence added successfully!');
      addEvidenceForm.reset();
      loadEvidence();
    } else {
      alert('Error: ' + (result.data.error || 'Failed to add evidence'));
    }
  });
}

const addOfficerForm = document.getElementById('addOfficerForm');
if (addOfficerForm) {
  addOfficerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireLogin()) return;

    const body = {
      officerId: document.getElementById('officerId')?.value.trim() || `OFF-${Date.now()}`,
      name: document.getElementById('officerName')?.value.trim() || '',
      rank: document.getElementById('officerRank')?.value || '',
      department: document.getElementById('officerDepartment')?.value || '',
      contact: document.getElementById('officerContact')?.value || '',
      status: document.getElementById('officerStatus')?.value || 'Active'
    };

    if (!body.name) {
      return alert('Please fill in required fields');
    }

    const result = await apiCall('/officers', 'POST', body);
    if (result.ok) {
      alert('Officer added successfully!');
      addOfficerForm.reset();
      loadOfficers();
    } else {
      alert('Error: ' + (result.data.error || 'Failed to add officer'));
    }
  });
}

const addReportForm = document.getElementById('addReportForm');
if (addReportForm) {
  addReportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireLogin()) return;

    const body = {
      reportId: document.getElementById('reportId')?.value.trim() || `RP-${Date.now()}`,
      caseId: document.getElementById('caseIdReport')?.value.trim() || '',
      officer: document.getElementById('reportOfficer')?.value.trim() || '',
      type: document.getElementById('reportType')?.value.trim() || '',
      reportDate: document.getElementById('reportDate')?.value || '',
      status: document.getElementById('reportStatus')?.value || 'Pending',
      summary: document.getElementById('reportSummary')?.value.trim() || ''
    };

    if (!body.reportId || !body.caseId || !body.officer || !body.type || !body.reportDate || !body.status) {
      return alert('Please fill in all report fields');
    }

    const result = await apiCall('/reports', 'POST', body);
    if (result.ok) {
      alert('Report added successfully!');
      addReportForm.reset();
      loadReports();
    } else {
      alert('Error: ' + (result.data.error || 'Failed to add report'));
    }
  });
}

async function loadSuspects() {
  const user = requireLogin();
  if (!user) return;

  const result = await apiCall('/suspects');
  const tbody = document.querySelector('#allSuspectsTable tbody');
  if (!tbody) return;

  if (!result.ok) {
    tbody.innerHTML = '<tr><td colspan="6">Unable to load suspects</td></tr>';
    return;
  }

  const rowData = result.data || [];
  if (!rowData.length) {
    tbody.innerHTML = '<tr><td colspan="6">No suspects found yet.</td></tr>';
    return;
  }

  tbody.innerHTML = rowData.map(s => `
    <tr>
      <td>${s.suspectId || ''}</td>
      <td>${s.name || ''}</td>
      <td>${s.alias || ''}</td>
      <td>${s.crimeType || ''}</td>
      <td>${s.status || ''}</td>
      <td>${s.riskLevel || ''}</td>
    </tr>
  `).join('');
}

async function loadEvidence() {
  const user = requireLogin();
  if (!user) return;

  const result = await apiCall('/evidence');
  const tbody = document.querySelector('#allEvidenceTable tbody');
  if (!tbody) return;

  if (!result.ok) {
    tbody.innerHTML = '<tr><td colspan="8">Unable to load evidence</td></tr>';
    return;
  }

  const rowData = result.data || [];
  if (!rowData.length) {
    tbody.innerHTML = '<tr><td colspan="8">No evidence found yet.</td></tr>';
    return;
  }

  tbody.innerHTML = rowData.map(e => `
    <tr>
      <td>${e.evidenceId || ''}</td>
      <td>${e.caseId || ''}</td>
      <td>${e.type || ''}</td>
      <td>${e.name || ''}</td>
      <td>${e.location || ''}</td>
      <td>${e.foundDate || ''}</td>
      <td>${e.collectedBy || ''}</td>
      <td>${e.status || ''}</td>
    </tr>
  `).join('');
}


async function loadReports() {
  const user = requireLogin();
  if (!user) return;

  const result = await apiCall('/reports');
  const tbody = document.querySelector('#allReportsTable tbody');
  if (!tbody) return;

  if (!result.ok) {
    tbody.innerHTML = '<tr><td colspan="6">Unable to load reports</td></tr>';
    return;
  }

  const reportData = result.data || [];
  const total = reportData.length;
  const pending = reportData.filter(r => r.status === 'Pending').length;
  const reviewed = reportData.filter(r => r.status === 'Reviewed').length;
  const closed = reportData.filter(r => r.status === 'Closed').length;

  const totalReports = document.getElementById('totalReports');
  const pendingReports = document.getElementById('pendingReports');
  const reviewedReports = document.getElementById('reviewedReports');
  const closedReports = document.getElementById('closedReports');

  if (totalReports) totalReports.textContent = total;
  if (pendingReports) pendingReports.textContent = pending;
  if (reviewedReports) reviewedReports.textContent = reviewed;
  if (closedReports) closedReports.textContent = closed;

  if (!reportData.length) {
    tbody.innerHTML = '<tr><td colspan="6">No reports found yet.</td></tr>';
    return;
  }

  tbody.innerHTML = reportData.map(r => `
    <tr>
      <td>${r.reportId || ''}</td>
      <td>${r.caseId || ''}</td>
      <td>${r.officer || ''}</td>
      <td>${r.type || ''}</td>
      <td>${r.reportDate || ''}</td>
      <td>${r.status || ''}</td>
    </tr>
  `).join('');
}

async function loadDashboard() {
  const user = requireLogin();
  if (!user) return;

  const statsResult = await apiCall('/dashboard');
  if (statsResult.ok) {
    const stats = statsResult.data;
    const cards = document.querySelectorAll('.stat-card h3');
    if (cards[0]) cards[0].textContent = stats.openCases || 0;
    if (cards[1]) cards[1].textContent = stats.suspects || 0;
    if (cards[2]) cards[2].textContent = stats.evidence || 0;
    if (cards[3]) cards[3].textContent = stats.agents || 0;
  }

  const casesResult = await apiCall('/cases/recent');
  if (casesResult.ok) {
    const tbody = document.querySelector('.recent-cases table tbody');
    if (tbody) {
      tbody.innerHTML = casesResult.data.map(c => `
        <tr>
          <td>${c.caseId || 'N/A'}</td>
          <td>${c.title || 'N/A'}</td>
          <td>${c.crimeType || 'N/A'}</td>
          <td>${c.status || 'N/A'}</td>
          <td>${c.assignedAgent || 'N/A'}</td>
        </tr>
      `).join('');
    }
  }
}

async function loadOfficers() {
  const user = requireLogin();
  if (!user) return;

  const result = await apiCall('/officers');
  if (!result.ok) return;

  const officers = result.data || [];
  const total = officers.length;
  const active = officers.filter(o => o.status?.toLowerCase() === 'active').length;
  const onDuty = officers.filter(o => o.status?.toLowerCase() === 'on duty').length;

  const cardTotal = document.getElementById('totalOfficers');
  const cardActive = document.getElementById('activeOfficers');
  const cardOnDuty = document.getElementById('onDutyOfficers');

  if (cardTotal) cardTotal.textContent = total;
  if (cardActive) cardActive.textContent = active;
  if (cardOnDuty) cardOnDuty.textContent = onDuty;

  const activeTbody = document.querySelector('#active-officers-table tbody');
  const allTbody = document.querySelector('#all-officers-table tbody');

  if (activeTbody) {
    activeTbody.innerHTML = officers
      .filter(o => o.status?.toLowerCase() === 'active' || o.status?.toLowerCase() === 'on duty')
      .slice(0, 5)
      .map(o => `<tr><td>${o.name}</td><td>${o.officerId}</td><td>${o.rank}</td><td>${o.status}</td></tr>`)
      .join('');
  }

  if (allTbody) {
    allTbody.innerHTML = officers
      .map(o => `<tr><td>${o.name}</td><td>${o.officerId}</td><td>${o.rank}</td><td>${o.department}</td><td>${o.status}</td></tr>`)
      .join('');
  }
}

async function loadCases() {
  const user = requireLogin();
  if (!user) return;

  const result = await apiCall('/cases');
  const tbody = document.querySelector('#allCasesTable tbody');
  if (!tbody) return;

  if (!result.ok) {
    tbody.innerHTML = '<tr><td colspan="8">Unable to load cases</td></tr>';
    return;
  }

  const cases = result.data || [];
  if (cases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No cases found yet.</td></tr>';
    return;
  }

  tbody.innerHTML = cases.map(c => `
    <tr>
      <td>${c.caseId || ''}</td>
      <td>${c.title || ''}</td>
      <td>${c.crimeType || ''}</td>
      <td>${c.status || ''}</td>
      <td>${c.priority || ''}</td>
      <td>${c.assignedAgent || ''}</td>
      <td>${c.location || ''}</td>
      <td>${c.reportedDate || ''}</td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('dashboard.html')) {
    loadDashboard();
  }
  if (window.location.pathname.includes('officers.html')) {
    loadOfficers();
  }
  if (window.location.pathname.includes('cases.html')) {
    loadCases();
  }
  if (window.location.pathname.includes('add-suspect.html')) {
    loadSuspects();
  }
  if (window.location.pathname.includes('add-evidence.html')) {
    loadEvidence();
  }
  if (window.location.pathname.includes('report.html')) {
    loadReports();
  }

  const logoutLink = document.querySelector('a[href="login.html"]');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      if (logoutLink.textContent.toLowerCase().includes('logout')) {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = 'login.html';
      }
    });
  }
});
