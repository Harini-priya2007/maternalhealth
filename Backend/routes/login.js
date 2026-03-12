const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Register new user
router.post('/register', (req, res) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Hash password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    db.run(
      'INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)',
      [fullName, email, hashedPassword, role],
      function onInsertUser(err) {
        if (err) {
          return res.status(400).json({ error: 'Email already exists or other error' });
        }

        const newUserId = this.lastID;

        db.run('INSERT INTO loginHistory (userId) VALUES (?)', [newUserId], (historyErr) => {
          if (historyErr) {
            return res.status(500).json({ error: 'User created but failed to record login history' });
          }

          res.json({
            message: 'User registered successfully',
            user: {
              id: newUserId,
              fullName,
              email,
              role
            }
          });
        });
      }
    );
  });
});

// Login user
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        return res.status(500).json({ error: 'Error comparing passwords' });
      }

      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Log login attempt
      db.run('INSERT INTO loginHistory (userId) VALUES (?)', [user.id]);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      });
    });
  });
});

// Get user profile
router.get('/user/:id', (req, res) => {
  const userId = req.params.id;

  db.get('SELECT id, fullName, email, role, createdAt FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  });
});

// Get login history (who logged in and when)
router.get('/login-history', (req, res) => {
  const limitParam = Number.parseInt(req.query.limit, 10);
  const limit = Number.isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 500);

  const query = `
    SELECT
      lh.id,
      lh.userId,
      u.fullName,
      u.email,
      u.role,
      lh.loginTime
    FROM loginHistory lh
    INNER JOIN users u ON u.id = lh.userId
    ORDER BY lh.loginTime DESC
    LIMIT ?
  `;

  db.all(query, [limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      count: rows.length,
      history: rows
    });
  });
});

module.exports = router;
