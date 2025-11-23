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

// Inline favorites sync router to support frontend offline sync
const favoritesSyncRouter = express.Router();
favoritesSyncRouter.post('/sync', async (req, res) => {
  try {
    const database = require('../database/database');
    const { userId, favorites = [] } = req.body || {};
    if (!userId || !Array.isArray(favorites)) {
      return res.status(400).json({ success: false, message: 'userId and favorites array required' });
    }

    // Remove existing favorites for this user and reinsert provided set (idempotent sync)
    await database.run('DELETE FROM user_favorites WHERE user_id = ?', [userId]);

    for (const fav of favorites.slice(0, 500)) {
      const remedyId = fav.remedy_id || fav.remedyId || null;
      const firstAidId = fav.first_aid_id || fav.firstAidId || null;
      await database.run(
        'INSERT INTO user_favorites (user_id, remedy_id, first_aid_id) VALUES (?, ?, ?)',
        [userId, remedyId, firstAidId]
      );
    }

    res.json({ success: true, message: 'Favorites synced' });
  } catch (error) {
    console.error('Error syncing favorites:', error);
    res.status(500).json({ success: false, message: 'Failed to sync favorites' });
  }
});

router.use('/favorites', favoritesSyncRouter);

module.exports = router;
