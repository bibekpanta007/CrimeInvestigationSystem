const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const User = require('./models/user');
const Case = require('./models/case');
const Suspect = require('./models/suspect');
const Evidence = require('./models/evidence');
const Officer = require('./models/officer');
const Report = require('./models/report');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error(err));

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(403).json({ error: 'Missing token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Public Routes ---
app.post('/api/register', async (req, res) => {
  try {
    const { agentId, codeName, fullName, email, password, role } = req.body;
    if (!agentId || !codeName || !fullName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ $or: [{ agentId }, { email }] });
    if (existing) return res.status(400).json({ error: 'Agent already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ agentId, codeName, fullName, email, passwordHash, role });
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, agentId, codeName } = req.body;
    const user = await User.findOne({ agentId, codeName, email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, agentId: user.agentId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: 'Login successful', token, user });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- Protected Routes ---
app.get('/api/dashboard', auth, async (req, res) => {
  const openCases = await Case.countDocuments({ status: /open/i });
  const suspects = await Suspect.countDocuments();
  const evidence = await Evidence.countDocuments();
  const agents = await User.countDocuments();
  res.json({ openCases, suspects, evidence, agents });
});

app.get('/api/cases/recent', auth, async (req, res) => {
  const cases = await Case.find().sort({ createdAt: -1 }).limit(10);
  res.json(cases);
});

app.post('/api/cases', auth, async (req, res) => {
  const data = req.body;
  const exists = await Case.findOne({ caseId: data.caseId });
  if (exists) return res.status(400).json({ error: 'Case ID already exists' });
  const newCase = await Case.create(data);
  res.status(201).json({ message: 'Case added', case: newCase });
});

app.get('/api/cases', auth, async (req, res) => {
  const all = await Case.find().sort({ createdAt: -1 });
  res.json(all);
});

app.post('/api/suspects', auth, async (req, res) => {
  const data = req.body;
  const exists = await Suspect.findOne({ suspectId: data.suspectId });
  if (exists) return res.status(400).json({ error: 'Suspect exists' });
  const newItem = await Suspect.create(data);
  res.status(201).json({ message: 'Suspect added', suspect: newItem });
});

app.get('/api/suspects', auth, async (req, res) => res.json(await Suspect.find()));

app.post('/api/evidence', auth, async (req, res) => {
  const data = req.body;
  const exists = await Evidence.findOne({ evidenceId: data.evidenceId });
  if (exists) return res.status(400).json({ error: 'Evidence exists' });
  const newItem = await Evidence.create(data);
  res.status(201).json({ message: 'Evidence added', evidence: newItem });
});

app.get('/api/evidence', auth, async (req, res) => res.json(await Evidence.find()));

app.post('/api/officers', auth, async (req, res) => {
  const data = req.body;
  const exists = await Officer.findOne({ officerId: data.officerId });
  if (exists) return res.status(400).json({ error: 'Officer exists' });
  const newItem = await Officer.create(data);
  res.status(201).json({ message: 'Officer added', officer: newItem });
});

app.get('/api/officers', auth, async (req, res) => res.json(await Officer.find()));

app.post('/api/reports', auth, async (req, res) => {
  const data = req.body;
  const exists = await Report.findOne({ reportId: data.reportId });
  if (exists) return res.status(400).json({ error: 'Report exists' });
  const newItem = await Report.create(data);
  res.status(201).json({ message: 'Report added', report: newItem });
});

app.get('/api/reports', auth, async (req, res) => {
  const all = await Report.find().sort({ createdAt: -1 });
  res.json(all);
});

app.listen(PORT, () => console.log(`🚓 Server running on port ${PORT}`));
