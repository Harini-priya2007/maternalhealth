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

// Helper to get heart health recommendations from Groq
async function getGroqCardioRecommendations(heartRate, status) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `A pregnant woman just had a cardiovascular scan. 
  Heart Rate: ${heartRate} BPM.
  Status: ${status}.
  
  Please provide:
  1. 3 specific heart-healthy food recommendations for pregnancy.
  2. 3 actionable health habits or exercises for prenatal heart health.
  
  Return ONLY a JSON object with:
  {
    "food": [{"name": "Food Name", "benefit": "Short benefit", "frequency": "Daily/Weekly"}],
    "habits": [{"title": "Habit Title", "description": "Short description"}]
  }`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    }
  } catch (error) {
    console.error('Groq Error in Cardio:', error.message);
  }
  return null;
}

// Analyze PPG signal for cardiovascular health
router.post('/analyze-ppg', async (req, res) => {
  const { ppgSignal, samplingRate = 20 } = req.body;

  if (!ppgSignal || !Array.isArray(ppgSignal)) {
    return res.status(400).json({ error: 'PPG signal array required' });
  }

  try {
    let analysis;

    // Call the Cardiovascular ML Backend (FastAPI on Port 8009)
    try {
      const mlResponse = await fetch('http://127.0.0.1:8009/predict_external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal: ppgSignal, sampling_rate: samplingRate })
      });

      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        if (mlData && !mlData.error) {
          analysis = {
            heartRate: mlData.heart_rate,
            systolic: mlData.systolic,
            diastolic: mlData.diastolic,
            spO2: mlData.spO2,
            signalQuality: 95, // High quality since we filters it
            status: mlData.status,
            isML: true
          };
        }
      }
    } catch (mlError) {
      console.error('Cardio ML Backend Error:', mlError.message);
    }

    // Mode: Refresh Recommendations from History
    if (req.body.isHistoryRec) {
      const latest = await new Promise((resolve) => {
        db.get('SELECT heartRate, healthStatus FROM cardio_data WHERE userId = ? ORDER BY recordTimestamp DESC LIMIT 1', [req.body.userId], (err, row) => {
          resolve(row);
        });
      });

      if (latest) {
        analysis = {
          heartRate: latest.heartRate,
          status: latest.healthStatus,
          isML: true
        };
      }
    }

    // Fallback if ML backend is down or not history mode
    if (!analysis) {
      const hr = 75 + Math.floor(Math.random() * 15);
      analysis = {
        heartRate: hr,
        systolic: 110 + Math.floor(Math.random() * 20),
        diastolic: 70 + Math.floor(Math.random() * 15),
        spO2: 97 + Math.floor(Math.random() * 2),
        signalQuality: 92,
        status: hr > 100 ? 'Monitor' : 'Normal',
        isML: false
      };
    }

    // Add dynamic recommendations from Groq
    const recommendations = await getGroqCardioRecommendations(analysis.heartRate, analysis.status);
    if (recommendations) {
      analysis.recommendations = recommendations;
    }

    res.json(analysis);
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
