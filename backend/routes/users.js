const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../database/database');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const config = require('../config/environment');

// POST /api/users/register - Register a new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Check if user already exists
    const existingUser = await database.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const saltRounds = config.security.bcryptRounds;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await database.run(
      `INSERT INTO users (username, email, password_hash, full_name) 
       VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, full_name || null]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, username },
      config.security.jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.id,
          username,
          email,
          full_name
        },
        token
      }
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
});

// POST /api/users/login - Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await database.get(
      'SELECT id, username, email, password_hash, full_name FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.security.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name
        },
        token
      }
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
});

// GET /api/users/profile - Get user profile (protected)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await database.get(
      'SELECT id, username, email, full_name, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's favorites
    const favorites = await database.all(`
      SELECT 
        'remedy' as type, 
        r.id, r.title, r.category, r.rating, r.image
      FROM user_favorites uf
      JOIN remedies r ON uf.remedy_id = r.id
      WHERE uf.user_id = ?
      
      UNION ALL
      
      SELECT 
        'first_aid' as type, 
        fa.id, fa.title, fa.category, NULL as rating, NULL as image
      FROM user_favorites uf
      JOIN first_aid fa ON uf.first_aid_id = fa.id
      WHERE uf.user_id = ?
      
      ORDER BY type, title
    `, [userId, userId]);

    // Get user's medical info
    const medicalInfo = await database.get(
      'SELECT * FROM user_medical_info WHERE user_id = ?',
      [userId]
    );

    // Get emergency contacts
    const emergencyContacts = await database.all(
      'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_favorite DESC, name ASC',
      [userId]
    );

    res.json({
      success: true,
      data: {
        user,
        favorites,
        medical_info: medicalInfo || null,
        emergency_contacts: emergencyContacts
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// POST /api/users/favorites - Add to favorites (protected)
router.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { remedy_id, first_aid_id } = req.body;

    if (!remedy_id && !first_aid_id) {
      return res.status(400).json({
        success: false,
        message: 'Either remedy_id or first_aid_id is required'
      });
    }

    if (remedy_id && first_aid_id) {
      return res.status(400).json({
        success: false,
        message: 'Only one of remedy_id or first_aid_id can be specified'
      });
    }

    // Check if already favorited
    const existing = await database.get(
      'SELECT id FROM user_favorites WHERE user_id = ? AND (remedy_id = ? OR first_aid_id = ?)',
      [userId, remedy_id || null, first_aid_id || null]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Already in favorites'
      });
    }

    // Add to favorites
    await database.run(
      'INSERT INTO user_favorites (user_id, remedy_id, first_aid_id) VALUES (?, ?, ?)',
      [userId, remedy_id || null, first_aid_id || null]
    );

    res.json({
      success: true,
      message: 'Added to favorites'
    });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites',
      error: error.message
    });
  }
});

// DELETE /api/users/favorites - Remove from favorites (protected)
router.delete('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { remedy_id, first_aid_id } = req.body;

    if (!remedy_id && !first_aid_id) {
      return res.status(400).json({
        success: false,
        message: 'Either remedy_id or first_aid_id is required'
      });
    }

    const result = await database.run(
      'DELETE FROM user_favorites WHERE user_id = ? AND (remedy_id = ? OR first_aid_id = ?)',
      [userId, remedy_id || null, first_aid_id || null]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Removed from favorites'
    });

  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message
    });
  }
});

module.exports = router;
