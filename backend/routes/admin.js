const express = require('express');
const database = require('../database/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'healthhub_secret');
    
    // Verify admin user exists
    const admin = await database.get(
      'SELECT * FROM admin_users WHERE id = ?',
      [decoded.id]
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin user
    const admin = await database.get(
      'SELECT * FROM admin_users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'healthhub_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Get statistics
    const stats = await Promise.all([
      database.get('SELECT COUNT(*) as count FROM remedies'),
      database.get('SELECT COUNT(*) as count FROM first_aid'),
      database.get('SELECT COUNT(*) as count FROM chat_history'),
      database.get('SELECT COUNT(*) as count FROM quiz_results'),
      database.get('SELECT COUNT(*) as count FROM users')
    ]);

    const [remediesCount, firstAidCount, chatCount, quizCount, usersCount] = stats;

    // Get recent activity
    const recentChats = await database.all(`
      SELECT user_message, bot_response, timestamp 
      FROM chat_history 
      ORDER BY timestamp DESC 
      LIMIT 5
    `);

    const recentQuizResults = await database.all(`
      SELECT user_id, score, total_questions, completed_at 
      FROM quiz_results 
      ORDER BY completed_at DESC 
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        statistics: {
          remedies: remediesCount.count,
          firstAid: firstAidCount.count,
          chatMessages: chatCount.count,
          quizResults: quizCount.count,
          users: usersCount.count
        },
        recentActivity: {
          chats: recentChats,
          quizResults: recentQuizResults
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Remedies Management
// GET /api/admin/remedies - Get all remedies for admin
router.get('/remedies', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let sql = 'SELECT * FROM remedies WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const remedies = await database.all(sql, params);
    
    // Parse JSON fields
    const processedRemedies = remedies.map(remedy => ({
      ...remedy,
      ingredients: JSON.parse(remedy.ingredients),
      instructions: JSON.parse(remedy.instructions),
      rating: parseFloat(remedy.rating)
    }));

    res.json({
      success: true,
      data: processedRemedies
    });

  } catch (error) {
    console.error('Error fetching remedies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch remedies',
      error: error.message
    });
  }
});

// POST /api/admin/remedies - Create new remedy
router.post('/remedies', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      prep_time,
      ingredients,
      instructions,
      benefits,
      warnings,
      image
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !difficulty || !prep_time || !ingredients || !instructions) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const id = `remedy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await database.run(`
      INSERT INTO remedies (
        id, title, description, category, difficulty, rating, prep_time,
        ingredients, instructions, benefits, warnings, image, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, title, description, category, difficulty, 4.0, prep_time,
      JSON.stringify(ingredients), JSON.stringify(instructions), 
      benefits || '', warnings || '', image || '🌿'
    ]);

    res.json({
      success: true,
      message: 'Remedy created successfully',
      data: { id }
    });

  } catch (error) {
    console.error('Error creating remedy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create remedy',
      error: error.message
    });
  }
});

// PUT /api/admin/remedies/:id - Update remedy
router.put('/remedies/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key === 'ingredients' || key === 'instructions') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(updateData[key]));
      } else if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    fields.push('updated_at = datetime(\'now\')');
    values.push(id);

    const sql = `UPDATE remedies SET ${fields.join(', ')} WHERE id = ?`;
    
    const result = await database.run(sql, values);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Remedy not found'
      });
    }

    res.json({
      success: true,
      message: 'Remedy updated successfully'
    });

  } catch (error) {
    console.error('Error updating remedy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update remedy',
      error: error.message
    });
  }
});

// DELETE /api/admin/remedies/:id - Delete remedy
router.delete('/remedies/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await database.run('DELETE FROM remedies WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Remedy not found'
      });
    }

    res.json({
      success: true,
      message: 'Remedy deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting remedy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete remedy',
      error: error.message
    });
  }
});

// First Aid Management
// GET /api/admin/first-aid - Get all first aid items
router.get('/first-aid', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let sql = 'SELECT * FROM first_aid WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const firstAidItems = await database.all(sql, params);
    
    // Parse JSON fields
    const processedItems = firstAidItems.map(item => ({
      ...item,
      steps: JSON.parse(item.steps)
    }));

    res.json({
      success: true,
      data: processedItems
    });

  } catch (error) {
    console.error('Error fetching first aid items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch first aid items',
      error: error.message
    });
  }
});

// POST /api/admin/first-aid - Create new first aid item
router.post('/first-aid', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      category,
      emergency,
      description,
      steps,
      warnings,
      severity
    } = req.body;

    // Validate required fields
    if (!title || !category || !description || !steps || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const id = `firstaid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await database.run(`
      INSERT INTO first_aid (
        id, title, category, emergency, description, steps, warnings, severity, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, title, category, emergency ? 1 : 0, description,
      JSON.stringify(steps), warnings || '', severity
    ]);

    res.json({
      success: true,
      message: 'First aid item created successfully',
      data: { id }
    });

  } catch (error) {
    console.error('Error creating first aid item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create first aid item',
      error: error.message
    });
  }
});

// PUT /api/admin/first-aid/:id - Update first aid item
router.put('/first-aid/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (key === 'steps') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(updateData[key]));
      } else if (key === 'emergency') {
        fields.push(`${key} = ?`);
        values.push(updateData[key] ? 1 : 0);
      } else if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    fields.push('updated_at = datetime(\'now\')');
    values.push(id);

    const sql = `UPDATE first_aid SET ${fields.join(', ')} WHERE id = ?`;
    
    const result = await database.run(sql, values);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'First aid item not found'
      });
    }

    res.json({
      success: true,
      message: 'First aid item updated successfully'
    });

  } catch (error) {
    console.error('Error updating first aid item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update first aid item',
      error: error.message
    });
  }
});

// DELETE /api/admin/first-aid/:id - Delete first aid item
router.delete('/first-aid/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await database.run('DELETE FROM first_aid WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'First aid item not found'
      });
    }

    res.json({
      success: true,
      message: 'First aid item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting first aid item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete first aid item',
      error: error.message
    });
  }
});

// Chat History Management
// GET /api/admin/chat-history - Get chat history
router.get('/chat-history', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, userId } = req.query;
    
    let sql = 'SELECT * FROM chat_history WHERE 1=1';
    const params = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const chatHistory = await database.all(sql, params);
    
    // Parse JSON fields
    const processedHistory = chatHistory.map(entry => ({
      ...entry,
      suggestedRemedies: JSON.parse(entry.suggested_remedies || '[]')
    }));

    res.json({
      success: true,
      data: processedHistory
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
});

// Quiz Results Management
// GET /api/admin/quiz-results - Get quiz results
router.get('/quiz-results', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, userId, quizType } = req.query;
    
    let sql = 'SELECT * FROM quiz_results WHERE 1=1';
    const params = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    if (quizType) {
      sql += ' AND quiz_type = ?';
      params.push(quizType);
    }

    sql += ' ORDER BY completed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const quizResults = await database.all(sql, params);
    
    // Parse JSON fields
    const processedResults = quizResults.map(result => ({
      ...result,
      answers: JSON.parse(result.answers),
      percentage: Math.round((result.score / result.total_questions) * 100)
    }));

    res.json({
      success: true,
      data: processedResults
    });

  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results',
      error: error.message
    });
  }
});

module.exports = router;

