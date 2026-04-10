const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Create jaundice table with enhanced schema
db.run(`
  CREATE TABLE IF NOT EXISTS jaundice_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    bilirubinLevel TEXT,
    yellowIndex REAL,
    riskLevel TEXT,
    diagnosis TEXT,
    kramerZone TEXT,
    confidence REAL,
    recommendation TEXT,
    heatmapUrl TEXT,
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

// Analyze Jaundice Image
router.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Eye image is required' });
  }

  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const pythonResponse = await axios.post('http://localhost:5003/analyze', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    res.json(pythonResponse.data);
  } catch (error) {
    console.error('Jaundice Analysis Error:', error.message);
    res.status(500).json({ error: 'Failed to analyze image. Ensure ML service is running.' });
  }
});

// Save jaundice data
router.post('/data', (req, res) => {
  const {
    userId, bilirubinLevel, yellowIndex, riskLevel,
    diagnosis, kramerZone, confidence, recommendation, heatmapUrl, notes
  } = req.body;

  if (!userId || yellowIndex === undefined) {
    return res.status(400).json({ error: 'userId and yellowIndex are required' });
  }

  db.run(
    `INSERT INTO jaundice_data (
      userId, bilirubinLevel, yellowIndex, riskLevel, 
      diagnosis, kramerZone, confidence, recommendation, heatmapUrl, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId, bilirubinLevel, yellowIndex, riskLevel,
      diagnosis, kramerZone, confidence, recommendation, heatmapUrl, notes || ''
    ],
    (err) => {
      if (err) {
        console.error('Save Data Error:', err);
        return res.status(500).json({ error: 'Error saving data' });
      }
      res.json({ message: 'Jaundice assessment saved successfully' });
    }
  );
});

module.exports = router;
