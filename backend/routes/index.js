const express = require('express');
const remediesRoutes = require('./remedies');
const firstAidRoutes = require('./firstAid');
const symptomsRoutes = require('./symptoms');
const usersRoutes = require('./users');
const emergencyRoutes = require('./emergency');
const chatRoutes = require('./chat');
const quizRoutes = require('./quiz');
const adminRoutes = require('./admin');

const router = express.Router();

// API Info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HealthHub API',
    version: '1.0.0',
    endpoints: {
      remedies: '/api/remedies',
      firstAid: '/api/first-aid',
      symptoms: '/api/symptoms',
      users: '/api/users',
      emergency: '/api/emergency',
      chat: '/api/chat',
      quiz: '/api/quiz',
      admin: '/api/admin',
      health: '/health'
    },
    documentation: 'https://github.com/your-repo/healthhub-api'
  });
});

// Route handlers
router.use('/remedies', remediesRoutes);
router.use('/first-aid', firstAidRoutes);
router.use('/symptoms', symptomsRoutes);
router.use('/users', usersRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/chat', chatRoutes);
router.use('/quiz', quizRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
