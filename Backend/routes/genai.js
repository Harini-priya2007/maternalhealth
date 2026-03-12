const express = require('express');

const router = express.Router();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

function buildSystemPrompt(page) {
  return [
    'You are a maternal health assistant inside a web app.',
    '⚠️ ALWAYS reference the USER\'S MOST RECENT submissions and data when answering questions.',
    '⚠️ When user mentions something they just submitted, recall those EXACT details from context.',
    'Use the provided user context and history for personalized answers.',
    'Arrays in history are ordered newest-first - prioritize the FIRST items in mentalHistory, taskHistory, etc.',
    'Reference user profile, submitted assessments, and health logs when relevant.',
    'When discussing mental health, explicitly mention their most recent mood, stress level, and sleep.',
    'When discussing tasks/checklist, reference their most recent task submissions.',
    'If data is missing, clearly say what is missing instead of guessing.',
    'Give concise, supportive, non-judgmental answers.',
    'Do not provide diagnosis. Suggest clinical follow-up for severe symptoms.',
    'If emergency symptoms are mentioned, advise immediate emergency care.',
    `Current page: ${page || 'general'}`
  ].join(' ');
}

function serializeUserContext(userContext) {
  if (!userContext) return null;
  if (typeof userContext === 'string') return userContext;
  
  try {
    // Enhance context with "most recent" metadata
    const enhanced = { ...userContext };
    
    if (enhanced.localHistory) {
      if (Array.isArray(enhanced.localHistory.mentalHistory) && enhanced.localHistory.mentalHistory.length > 0) {
        enhanced.localHistory.mentalHistory_mostRecent = enhanced.localHistory.mentalHistory[enhanced.localHistory.mentalHistory.length - 1];
        enhanced.localHistory.mentalHistory_allCount = enhanced.localHistory.mentalHistory.length;
      }
      if (Array.isArray(enhanced.localHistory.taskHistory) && enhanced.localHistory.taskHistory.length > 0) {
        enhanced.localHistory.taskHistory_mostRecent = enhanced.localHistory.taskHistory[enhanced.localHistory.taskHistory.length - 1];
        enhanced.localHistory.taskHistory_allCount = enhanced.localHistory.taskHistory.length;
      }
    }
    
    return JSON.stringify(enhanced);
  } catch (error) {
    return String(userContext);
  }
}

router.post('/chat', async (req, res) => {
  try {
    const { message, page, userContext } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GROQ_API_KEY is not configured on server'
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const serializedContext = serializeUserContext(userContext);

    const messages = [
      { role: 'system', content: buildSystemPrompt(page) },
      ...(serializedContext
        ? [{ role: 'system', content: `User context and activity history: ${serializedContext}` }]
        : []),
      { role: 'user', content: message.trim() }
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.4,
        max_tokens: 500,
        messages
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({
        error: 'Groq request failed',
        details: errorText
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 'No response generated.';

    return res.json({
      reply,
      model: data?.model || DEFAULT_MODEL,
      page: page || 'general',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const isAbort = error && error.name === 'AbortError';
    return res.status(500).json({
      error: isAbort ? 'Request timed out' : 'Server error',
      details: isAbort ? 'Groq request exceeded timeout' : String(error.message || error)
    });
  }
});

module.exports = router;
