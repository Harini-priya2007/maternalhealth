const express = require('express');
const router = express.Router();
const db = require('../db');

// Create jaundice table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS jaundice_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    bilirubinLevel REAL,
    recordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

// Get jaundice data for user
router.get('/data/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.all('SELECT * FROM jaundice_data WHERE userId = ? ORDER BY recordDate DESC', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      message: 'Jaundice data retrieved',
      data: rows || []
    });
  });
});

// Save jaundice data
router.post('/data', (req, res) => {
  const { userId, bilirubinLevel, notes } = req.body;
  
  if (!userId || bilirubinLevel === undefined) {
    return res.status(400).json({ error: 'userId and bilirubinLevel are required' });
  }
  
  db.run(
    'INSERT INTO jaundice_data (userId, bilirubinLevel, notes) VALUES (?, ?, ?)',
    [userId, bilirubinLevel, notes || ''],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error saving data' });
      }
      res.json({ message: 'Jaundice data saved successfully' });
    }
  );
});

module.exports = router;
