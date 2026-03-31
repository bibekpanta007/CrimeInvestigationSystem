const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Users table (agents)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agentId TEXT UNIQUE NOT NULL,
      codeName TEXT NOT NULL,
      fullName TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'agent',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Cases table
    db.run(`CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caseId TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      crimeType TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      assignedAgent TEXT NOT NULL,
      location TEXT NOT NULL,
      reportedDate DATE NOT NULL,
      description TEXT,
      imagePath TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Suspects table
    db.run(`CREATE TABLE IF NOT EXISTS suspects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suspectId TEXT UNIQUE,
      name TEXT NOT NULL,
      alias TEXT,
      age INTEGER,
      gender TEXT,
      crimeType TEXT,
      address TEXT,
      riskLevel TEXT,
      status TEXT,
      caseId TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (caseId) REFERENCES cases (caseId)
    )`);

    // Evidence table
    db.run(`CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evidenceId TEXT UNIQUE NOT NULL,
      caseId TEXT,
      type TEXT NOT NULL,
      name TEXT,
      location TEXT NOT NULL,
      foundDate DATE,
      collectedBy TEXT,
      status TEXT,
      notes TEXT,
      imagePath TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (caseId) REFERENCES cases (caseId)
    )`);

    // Officers table
    db.run(`CREATE TABLE IF NOT EXISTS officers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      officerId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      rank TEXT,
      department TEXT,
      contact TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
  const { agentId, codeName, fullName, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.run(`INSERT INTO users (agentId, codeName, fullName, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
    [agentId, codeName, fullName, email, hashedPassword, role], function(err) {
      if (err) {
        return res.status(400).json({ error: 'User already exists' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
});

// Login
app.post('/api/login', (req, res) => {
  const { agentId, codeName, email, password } = req.body;
  
  db.get(`SELECT * FROM users WHERE agentId = ? AND codeName = ? AND email = ?`,
    [agentId, codeName, email], async (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, agentId: user.agentId }, process.env.JWT_SECRET || 'secretkey');
      res.json({ token, user: { agentId: user.agentId, codeName: user.codeName } });
    });
});

// Get dashboard stats
app.get('/api/dashboard', verifyToken, (req, res) => {
  const queries = {
    openCases: 'SELECT COUNT(*) as count FROM cases WHERE status = "open"',
    suspects: 'SELECT COUNT(*) as count FROM suspects',
    evidence: 'SELECT COUNT(*) as count FROM evidence',
    agents: 'SELECT COUNT(*) as count FROM users'
  };
  
  const results = {};
  let completed = 0;
  
  Object.keys(queries).forEach(key => {
    db.get(queries[key], (err, row) => {
      if (err) {
        console.error(err);
        results[key] = 0;
      } else {
        results[key] = row.count;
      }
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// Get recent cases
app.get('/api/cases/recent', verifyToken, (req, res) => {
  db.all(`SELECT caseId, title, crimeType, status, assignedAgent FROM cases ORDER BY createdAt DESC LIMIT 10`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Add case
app.post('/api/cases', verifyToken, upload.single('caseImage'), (req, res) => {
  const { caseId, title, crimeType, status, priority, assignedAgent, location, reportedDate, description } = req.body;
  const imagePath = req.file ? req.file.path : null;
  
  db.run(`INSERT INTO cases (caseId, title, crimeType, status, priority, assignedAgent, location, reportedDate, description, imagePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [caseId, title, crimeType, status, priority, assignedAgent, location, reportedDate, description, imagePath], function(err) {
      if (err) {
        return res.status(400).json({ error: 'Case ID already exists' });
      }
      res.status(201).json({ message: 'Case added successfully', id: this.lastID });
    });
});

// Get all cases
app.get('/api/cases', verifyToken, (req, res) => {
  db.all(`SELECT * FROM cases ORDER BY createdAt DESC`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Add suspect
app.post('/api/suspects', verifyToken, (req, res) => {
  const { suspectId, name, alias, age, gender, crimeType, address, riskLevel, status, caseId, notes } = req.body;
  
  db.run(`INSERT INTO suspects (suspectId, name, alias, age, gender, crimeType, address, riskLevel, status, caseId, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [suspectId, name, alias, age, gender, crimeType, address, riskLevel, status, caseId, notes], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Suspect added successfully', id: this.lastID });
    });
});

// Get all suspects
app.get('/api/suspects', verifyToken, (req, res) => {
  db.all(`SELECT * FROM suspects ORDER BY createdAt DESC`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Add evidence
app.post('/api/evidence', verifyToken, upload.single('evidenceImage'), (req, res) => {
  const { evidenceId, caseId, type, name, location, foundDate, collectedBy, status, notes } = req.body;
  const imagePath = req.file ? req.file.path : null;
  
  db.run(`INSERT INTO evidence (evidenceId, caseId, type, name, location, foundDate, collectedBy, status, notes, imagePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [evidenceId, caseId, type, name, location, foundDate, collectedBy, status, notes, imagePath], function(err) {
      if (err) {
        return res.status(400).json({ error: 'Evidence ID already exists' });
      }
      res.status(201).json({ message: 'Evidence added successfully', id: this.lastID });
    });
});

// Get all evidence
app.get('/api/evidence', verifyToken, (req, res) => {
  db.all(`SELECT * FROM evidence ORDER BY createdAt DESC`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Add officer
app.post('/api/officers', verifyToken, (req, res) => {
  const { officerId, name, rank, department, contact } = req.body;
  
  db.run(`INSERT INTO officers (officerId, name, rank, department, contact) VALUES (?, ?, ?, ?, ?)`,
    [officerId, name, rank, department, contact], function(err) {
      if (err) {
        return res.status(400).json({ error: 'Officer ID already exists' });
      }
      res.status(201).json({ message: 'Officer added successfully', id: this.lastID });
    });
});

// Get all officers
app.get('/api/officers', verifyToken, (req, res) => {
  db.all(`SELECT * FROM officers ORDER BY createdAt DESC`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});