const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const loginRoutes = require('./routes/login');
const homeRoutes = require('./routes/home');
const anemiaRoutes = require('./routes/anemia');
const cardioRoutes = require('./routes/cardio');
const jaundiceRoutes = require('./routes/jaundice');
const mentalhealthRoutes = require('./routes/mentalhealth');
const landingRoutes = require('./routes/landing');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', loginRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/anemia', anemiaRoutes);
app.use('/api/cardio', cardioRoutes);
app.use('/api/jaundice', jaundiceRoutes);
app.use('/api/mentalhealth', mentalhealthRoutes);
app.use('/api/landing', landingRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Maternal Health Backend Server is running on http://localhost:${PORT}`);
  console.log(`📍 Database: maternal_health.db`);
  console.log('\nAvailable endpoints:');
  console.log('  POST   /api/auth/register - Register new user');
  console.log('  POST   /api/auth/login - Login user');
  console.log('  GET    /api/auth/user/:id - Get user profile');
  console.log('  GET    /api/home/dashboard/:userId - Get home dashboard');
  console.log('  GET    /api/anemia/data/:userId - Get anemia data');
  console.log('  POST   /api/anemia/data - Save anemia data');
  console.log('  GET    /api/cardio/data/:userId - Get cardio data');
  console.log('  POST   /api/cardio/data - Save cardio data');
  console.log('  GET    /api/jaundice/data/:userId - Get jaundice data');
  console.log('  POST   /api/jaundice/data - Save jaundice data');
  console.log('  GET    /api/mentalhealth/data/:userId - Get mental health data');
  console.log('  POST   /api/mentalhealth/data - Save mental health data');
  console.log('  GET    /api/landing/info - Get landing page info\n');
});
