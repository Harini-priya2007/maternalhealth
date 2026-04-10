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

// Helper to get food and health habit recommendations from Groq
async function getGroqRecommendations(hemoglobin, status) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `A pregnant woman just had an anemia scan. 
  Hemoglobin Level: ${hemoglobin} g/dL.
  Status: ${status}.
  
  Please provide:
  1. 3 specific food recommendations to improve iron levels.
  2. 3 health habits or lifestyle tips to boost absorption or energy.
  
  Return ONLY a JSON object with:
  {
    "food": [{"name": "Food Name", "benefit": "Short benefit", "frequency": "e.g. Daily"}],
    "habits": [{"title": "Tip Title", "description": "Short description"}]
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
    console.error('Groq Error in Anemia:', error.message);
  }
  return null;
}

// Process PPG data and extract hemoglobin/pulse
router.post('/analyze-ppg', async (req, res) => {
  const { userId, ppgSignal, samplingRate = 100 } = req.body;

  if (!ppgSignal || !Array.isArray(ppgSignal)) {
    return res.status(400).json({ error: 'ppgSignal array is required' });
  }

  try {
    let analysis;

    // Attempt to call the ML model backend (FastAPI)
    try {
      const mlResponse = await fetch('http://127.0.0.1:8008/predict_external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal: ppgSignal, sampling_rate: samplingRate })
      });

      if (mlResponse.ok) {
        const mlData = await mlResponse.json();

        if (mlData && !mlData.error && mlData.hemoglobin !== undefined) {
          console.log('ML Model Prediction:', mlData);

          // Use heuristic for pulse if ML doesn't provide it
          const heuristicAnalysis = ppgAnalyzer.analyzePPGSignal(ppgSignal, samplingRate);

          analysis = {
            pulse: heuristicAnalysis.pulse,
            hemoglobin: mlData.hemoglobin,
            signalQuality: heuristicAnalysis.signalQuality,
            status: mlData.status,
            isML: true
          };
        } else if (mlData.error) {
          console.error('ML Backend Logic Error:', mlData.error);
        }
      }
    } catch (mlError) {
      console.error('ML Backend Connection Error:', mlError.message);
      // Fallback to heuristic below
    }

    // If this is just a request for recommendations from history
    if (req.body.isHistoryRec) {
      // Get the latest reading from DB for this user to get actual hemoglobin
      const latestReading = await new Promise((resolve) => {
        db.get('SELECT hemoglobinLevel, healthStatus FROM anemia_data WHERE userId = ? ORDER BY recordDate DESC LIMIT 1', [req.body.userId], (err, row) => {
          resolve(row);
        });
      });

      if (latestReading) {
        analysis = {
          hemoglobin: latestReading.hemoglobinLevel,
          status: latestReading.healthStatus,
          isML: true
        };
      }
    }

    if (!analysis) {
      analysis = ppgAnalyzer.analyzePPGSignal(ppgSignal, samplingRate);
      analysis.isML = false;
    }

    // Add Groq Recommendations
    const recommendations = await getGroqRecommendations(analysis.hemoglobin, analysis.status);
    if (recommendations) {
      analysis.recommendations = recommendations;
    }

    res.json({
      message: 'PPG analysis completed',
      analysis: analysis
    });
  } catch (error) {
    console.error('Anemia analysis route error:', error);
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
    'SELECT hemoglobinLevel as hemoglobin, pulseRate, recordTimestamp, healthStatus FROM anemia_data WHERE userId = ? ORDER BY recordDate DESC LIMIT ?',
    [userId, limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Return the array directly as the frontend expects it
      res.json(rows || []);
    }
  );
});

module.exports = router;
