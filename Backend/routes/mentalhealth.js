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
    riskLevel TEXT,
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

// Helper to get mental health analysis from Groq
async function getGroqMentalAnalysis(assessment) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `A pregnant woman/new mother just submitted a mental health check-in. Use the following rubric to determine the Stress Risk Level:
  
  - LOW RISK: Mood is Calm/Happy/Good, Sleep is Well/Good, Stress Level < 4, Bonding is Normal/Strong, and she has Social Support (Yes).
  - HIGH RISK: Mood is Anxious/Sad/Worst, Sleep is Insomnia/Disturbed, Stress Level > 7, Bonding is Distant, or Social Support is No.
  - MODERATE RISK: Mixed results, e.g., feeling Tired but has good support, or moderate stress (4-7) with decent sleep.
  
  Current Profile:
  Current Mood: ${assessment.mood}
  Sleep Quality: ${assessment.sleep}
  Stress Level (0-10): ${assessment.overwhelmed}
  Bonding with Baby: ${assessment.bonding}
  Social Support: ${assessment.support}
  
  Please provide:
  1. A supportive, empathetic 2-sentence analysis of her current state.
  2. A "Stress Risk Level" (Low, Moderate, or High).
  3. 2 personalized self-care recommendations.
  
  Return ONLY a JSON object with:
  {
    "analysis": "Supportive analysis text...",
    "riskLevel": "Low/Moderate/High",
    "recommendations": [{"name": "Self-care action", "benefit": "Short benefit", "type": "Meditation/Rest/Social/etc"}]
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
    console.error('Groq Error in Mental Health:', error.message);
  }
  return null;
}

// Save mental health data
router.post('/data', (req, res) => {
  const { userId, mood, stressLevel, riskLevel, notes } = req.body;

  if (!userId || !mood || stressLevel === undefined) {
    return res.status(400).json({ error: 'userId, mood, and stressLevel are required' });
  }

  db.run(
    'INSERT INTO mentalhealth_data (userId, mood, stressLevel, riskLevel, notes) VALUES (?, ?, ?, ?, ?)',
    [userId, mood, stressLevel, riskLevel || 'Low', notes || ''],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error saving data' });
      }
      res.json({ message: 'Mental health data saved successfully' });
    }
  );
});

// AI Analysis endpoint
router.post('/analyze', async (req, res) => {
  const { assessment } = req.body;

  if (!assessment) {
    return res.status(400).json({ error: 'Assessment data is required' });
  }

  const analysis = await getGroqMentalAnalysis(assessment);

  if (!analysis) {
    // Fallback if AI fails
    const risk = assessment.overwhelmed > 7 ? 'High' : (assessment.overwhelmed > 4 ? 'Moderate' : 'Low');
    return res.json({
      analysis: "Based on your responses, we've noted your current state. Remember that feeling overwhelmed is common, and we are here for you.",
      riskLevel: risk,
      recommendations: [
        { name: "Deep Breathing", benefit: "Calms the nervous system", type: "Breathing" },
        { name: "Short Rest", benefit: "Restores energy levels", type: "Rest" }
      ]
    });
  }

  res.json(analysis);
});

module.exports = router;
