const express = require('express');
const router = express.Router();
const db = require('../db');

// Create mentalhealth table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS mentalhealth_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    mood TEXT,
    stressLevel INTEGER,
    recordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

// Get mental health data for user
router.get('/data/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.all('SELECT * FROM mentalhealth_data WHERE userId = ? ORDER BY recordDate DESC', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      message: 'Mental health data retrieved',
      data: rows || []
    });
  });
});

// Save mental health data
router.post('/data', (req, res) => {
  const { userId, mood, stressLevel, notes } = req.body;
  
  if (!userId || !mood || stressLevel === undefined) {
    return res.status(400).json({ error: 'userId, mood, and stressLevel are required' });
  }
  
  db.run(
    'INSERT INTO mentalhealth_data (userId, mood, stressLevel, notes) VALUES (?, ?, ?, ?)',
    [userId, mood, stressLevel, notes || ''],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error saving data' });
      }
      res.json({ message: 'Mental health data saved successfully' });
    }
  );
});

module.exports = router;
