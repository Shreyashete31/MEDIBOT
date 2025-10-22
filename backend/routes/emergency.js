const express = require('express');
const database = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/emergency/contacts - Get user's emergency contacts (protected)
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const contacts = await database.all(
      'SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_favorite DESC, name ASC',
      [userId]
    );

    res.json({
      success: true,
      data: contacts
    });

  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts',
      error: error.message
    });
  }
});

// POST /api/emergency/contacts - Add emergency contact (protected)
router.post('/contacts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, relation, is_favorite = false } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const result = await database.run(
      'INSERT INTO emergency_contacts (user_id, name, phone, relation, is_favorite) VALUES (?, ?, ?, ?, ?)',
      [userId, name, phone, relation || null, is_favorite ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      data: {
        id: result.id,
        name,
        phone,
        relation,
        is_favorite
      }
    });

  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact',
      error: error.message
    });
  }
});

// PUT /api/emergency/contacts/:id - Update emergency contact (protected)
router.put('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const contactId = req.params.id;
    const { name, phone, relation, is_favorite } = req.body;

    const result = await database.run(
      `UPDATE emergency_contacts 
       SET name = COALESCE(?, name), 
           phone = COALESCE(?, phone), 
           relation = COALESCE(?, relation), 
           is_favorite = COALESCE(?, is_favorite),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, phone, relation, is_favorite ? 1 : 0, contactId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Emergency contact updated successfully'
    });

  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency contact',
      error: error.message
    });
  }
});

// DELETE /api/emergency/contacts/:id - Delete emergency contact (protected)
router.delete('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const contactId = req.params.id;

    const result = await database.run(
      'DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?',
      [contactId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emergency contact',
      error: error.message
    });
  }
});

// GET /api/emergency/medical-info - Get user's medical information (protected)
router.get('/medical-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const medicalInfo = await database.get(
      'SELECT * FROM user_medical_info WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: medicalInfo || null
    });

  } catch (error) {
    console.error('Error fetching medical info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical information',
      error: error.message
    });
  }
});

// POST /api/emergency/medical-info - Create/Update medical information (protected)
router.post('/medical-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { blood_type, allergies, medications, medical_conditions, emergency_contact, emergency_phone } = req.body;

    // Check if medical info already exists
    const existing = await database.get(
      'SELECT id FROM user_medical_info WHERE user_id = ?',
      [userId]
    );

    let result;
    if (existing) {
      // Update existing
      result = await database.run(
        `UPDATE user_medical_info 
         SET blood_type = COALESCE(?, blood_type),
             allergies = COALESCE(?, allergies),
             medications = COALESCE(?, medications),
             medical_conditions = COALESCE(?, medical_conditions),
             emergency_contact = COALESCE(?, emergency_contact),
             emergency_phone = COALESCE(?, emergency_phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [blood_type, allergies, medications, medical_conditions, emergency_contact, emergency_phone, userId]
      );
    } else {
      // Create new
      result = await database.run(
        `INSERT INTO user_medical_info 
         (user_id, blood_type, allergies, medications, medical_conditions, emergency_contact, emergency_phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, blood_type, allergies, medications, medical_conditions, emergency_contact, emergency_phone]
      );
    }

    res.json({
      success: true,
      message: existing ? 'Medical information updated successfully' : 'Medical information created successfully'
    });

  } catch (error) {
    console.error('Error saving medical info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save medical information',
      error: error.message
    });
  }
});

// GET /api/emergency/search-history - Get user's search history (protected)
router.get('/search-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const searchHistory = await database.all(
      `SELECT * FROM search_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const { total } = await database.get(
      'SELECT COUNT(*) as total FROM search_history WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: searchHistory,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search history',
      error: error.message
    });
  }
});

// POST /api/emergency/search-history - Add search to history (protected)
router.post('/search-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { search_term, search_type } = req.body;

    if (!search_term || !search_type) {
      return res.status(400).json({
        success: false,
        message: 'Search term and search type are required'
      });
    }

    if (!['remedy', 'first_aid', 'symptom'].includes(search_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search type. Must be remedy, first_aid, or symptom'
      });
    }

    await database.run(
      'INSERT INTO search_history (user_id, search_term, search_type) VALUES (?, ?, ?)',
      [userId, search_term, search_type]
    );

    res.json({
      success: true,
      message: 'Search added to history'
    });

  } catch (error) {
    console.error('Error adding to search history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to search history',
      error: error.message
    });
  }
});

// GET /api/emergency/quick-access - Get quick access data (protected)
router.get('/quick-access', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get emergency contacts (favorites only)
    const emergencyContacts = await database.all(
      'SELECT name, phone, relation FROM emergency_contacts WHERE user_id = ? AND is_favorite = 1 ORDER BY name',
      [userId]
    );

    // Get medical info
    const medicalInfo = await database.get(
      'SELECT blood_type, allergies, medications, emergency_contact, emergency_phone FROM user_medical_info WHERE user_id = ?',
      [userId]
    );

    // Get recent searches
    const recentSearches = await database.all(
      'SELECT search_term, search_type FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    res.json({
      success: true,
      data: {
        emergency_contacts: emergencyContacts,
        medical_info: medicalInfo || null,
        recent_searches: recentSearches
      }
    });

  } catch (error) {
    console.error('Error fetching quick access data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick access data',
      error: error.message
    });
  }
});

module.exports = router;
