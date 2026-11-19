const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '..', 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.find((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  res.status(201).json({
    message: 'Account created successfully.',
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  });
});

// Log in an existing user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readUsers();
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({
    message: 'Login successful.',
    user: { id: user.id, name: user.name, email: user.email }
  });
});

module.exports = router;
