const express = require('express');
const router = express.Router();
const db = require('../db');
const PPGAnalyzer = require('../ml/ppg_analyzer');

const ppgAnalyzer = new PPGAnalyzer();

// Create anemia table if it doesn't exist with enhanced schema
db.run(`
  CREATE TABLE IF NOT EXISTS anemia_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    hemoglobinLevel REAL,
    pulseRate INTEGER,
    recordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    recordTimestamp TEXT NOT NULL,
    signalQuality INTEGER,
    healthStatus TEXT,
    notes TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

// Get anemia data for user
router.get('/data/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.all('SELECT * FROM anemia_data WHERE userId = ? ORDER BY recordDate DESC', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      message: 'Anemia data retrieved',
      data: rows || []
    });
  });
});

// Get anemia data by specific timestamp range
router.get('/data/:userId/timeline', (req, res) => {
  const userId = req.params.userId;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let query = 'SELECT * FROM anemia_data WHERE userId = ?';
  const params = [userId];

  if (startDate) {
    query += ' AND recordDate >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND recordDate <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY recordDate ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      message: 'Anemia timeline data retrieved',
      data: rows || []
    });
  });
});

// Process PPG data and extract hemoglobin/pulse
router.post('/analyze-ppg', (req, res) => {
  const { userId, ppgSignal, samplingRate = 100 } = req.body;

  if (!userId || !ppgSignal || !Array.isArray(ppgSignal)) {
    return res.status(400).json({ error: 'userId and ppgSignal array are required' });
  }

  try {
    const analysis = ppgAnalyzer.analyzePPGSignal(ppgSignal, samplingRate);
    
    res.json({
      message: 'PPG analysis completed',
      analysis: analysis
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Save anemia data with hemoglobin and pulse readings
router.post('/data', (req, res) => {
  const { userId, hemoglobinLevel, pulseRate, signalQuality, healthStatus, notes } = req.body;
  
  if (!userId || hemoglobinLevel === undefined || pulseRate === undefined) {
    return res.status(400).json({ error: 'userId, hemoglobinLevel, and pulseRate are required' });
  }
  
  const recordTimestamp = new Date().toISOString();
  
  db.run(
    'INSERT INTO anemia_data (userId, hemoglobinLevel, pulseRate, recordTimestamp, signalQuality, healthStatus, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, hemoglobinLevel, pulseRate, recordTimestamp, signalQuality || null, healthStatus || '', notes || ''],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error saving anemia data' });
      }
      res.json({ 
        message: 'Anemia data saved successfully',
        recordTimestamp: recordTimestamp
      });
    }
  );
});

// Get hemoglobin history for a user
router.get('/hemoglobin-history/:userId', (req, res) => {
  const userId = req.params.userId;
  const limit = req.query.limit || 30;
  
  db.all(
    'SELECT hemoglobinLevel, pulseRate, recordTimestamp, healthStatus FROM anemia_data WHERE userId = ? ORDER BY recordDate DESC LIMIT ?',
    [userId, limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        message: 'Hemoglobin history retrieved',
        history: rows || [],
        total: (rows || []).length
      });
    }
  );
});

module.exports = router;
