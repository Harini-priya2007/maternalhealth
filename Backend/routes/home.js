const express = require('express');
const router = express.Router();
const db = require('../db');

// Home page route
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Welcome to home dashboard' });
});

// Get user home data
router.get('/dashboard/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.get('SELECT id, fullName, email, role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'Dashboard data',
      user: user
    });
  });
});

module.exports = router;
