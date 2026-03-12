const express = require('express');
const router = express.Router();

// Landing page route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Pink Maternal Health Portal',
    description: 'Dedicated support for your motherhood journey'
  });
});

// Get landing page info
router.get('/info', (req, res) => {
  res.json({
    appName: 'Pink Maternal',
    tagline: 'Dedicated support for your motherhood journey',
    features: [
      'Professional medical advice',
      'Community support',
      'Personalized tracking',
      'Health monitoring'
    ]
  });
});

module.exports = router;
