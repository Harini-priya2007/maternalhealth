const express = require('express');
const router = express.Router();
const db = require('../db');

// Placeholder for custom ML model - will be replaced when friend's model is ready
const CardioAnalyzer = require('../ml/cardio_analyzer') || null;

// Create enhanced cardio_data table
db.run(`
  CREATE TABLE IF NOT EXISTS cardio_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    heartRate INTEGER,
    systolic INTEGER,
    diastolic INTEGER,
    spO2 REAL,
    signalQuality INTEGER,
    healthStatus TEXT,
    recordTimestamp TEXT,
    notes TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

// Get all cardio data for user
router.get('/data/:userId', (req, res) => {
  const userId = req.params.userId;
  const limit = req.query.limit || 10;
  
  db.all(
    'SELECT * FROM cardio_data WHERE userId = ? ORDER BY recordTimestamp DESC LIMIT ?',
    [userId, limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get cardiovascular history within date range
router.get('/data/:userId/timeline', (req, res) => {
  const userId = req.params.userId;
  const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = req.query.endDate || new Date().toISOString();
  
  db.all(
    'SELECT * FROM cardio_data WHERE userId = ? AND recordTimestamp BETWEEN ? AND ? ORDER BY recordTimestamp DESC',
    [userId, startDate, endDate],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Get latest heart rate readings
router.get('/heart-rate-history/:userId', (req, res) => {
  const userId = req.params.userId;
  const limit = req.query.limit || 10;
  
  db.all(
    'SELECT heartRate, systolic, diastolic, spO2, signalQuality, healthStatus, recordTimestamp FROM cardio_data WHERE userId = ? ORDER BY recordTimestamp DESC LIMIT ?',
    [userId, limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    }
  );
});

// Analyze PPG signal (placeholder - will use friend's model)
router.post('/analyze-ppg', (req, res) => {
  const { ppgSignal, samplingRate } = req.body;
  
  if (!ppgSignal || !Array.isArray(ppgSignal)) {
    return res.status(400).json({ error: 'PPG signal array required' });
  }

  try {
    // Check if custom ML model is available
    if (CardioAnalyzer && CardioAnalyzer.analyzePPG) {
      const result = CardioAnalyzer.analyzePPG(ppgSignal, samplingRate || 50);
      return res.json(result);
    }

    // Fallback: Simulated cardiovascular analysis
    const heartRate = Math.floor(Math.random() * 40) + 60;
    const systolic = Math.floor(Math.random() * 20) + 110;
    const diastolic = Math.floor(Math.random() * 15) + 70;

    res.json({
      heartRate,
      systolic,
      diastolic,
      spO2: Math.floor(Math.random() * 3) + 96,
      signalQuality: Math.floor(Math.random() * 20) + 80,
      status: heartRate > 100 ? 'Elevated' : 'Normal',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'PPG analysis failed', details: error.message });
  }
});

// Save cardiovascular reading
router.post('/data', (req, res) => {
  const { userId, heartRate, systolic, diastolic, spO2, signalQuality, healthStatus } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const recordTimestamp = new Date().toISOString();

  db.run(
    'INSERT INTO cardio_data (userId, heartRate, systolic, diastolic, spO2, signalQuality, healthStatus, recordTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, heartRate, systolic, diastolic, spO2 || null, signalQuality || null, healthStatus || 'Unknown', recordTimestamp],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error saving data', details: err.message });
      }
      res.json({ 
        message: 'Cardiovascular data saved successfully',
        recordTimestamp 
      });
    }
  );
});

module.exports = router;
  );
});

module.exports = router;
