const express = require('express');
const database = require('../database/database');
const { validateRemedySearch } = require('../middleware/validation');

const router = express.Router();

// GET /api/remedies - Get all remedies with optional filtering
router.get('/', validateRemedySearch, async (req, res) => {
  try {
    const { category, difficulty, search, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        id, title, description, category, difficulty, rating, 
        prep_time, ingredients, instructions, benefits, warnings, image,
        created_at, updated_at
      FROM remedies 
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (difficulty) {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }

    if (search) {
      sql += ` AND (
        title LIKE ? OR 
        description LIKE ? OR 
        benefits LIKE ? OR
        ingredients LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Add ordering and pagination
    sql += ' ORDER BY rating DESC, title ASC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const remedies = await database.all(sql, params);
    
    // Parse JSON fields
    const processedRemedies = remedies.map(remedy => ({
      ...remedy,
      ingredients: JSON.parse(remedy.ingredients),
      instructions: JSON.parse(remedy.instructions),
      rating: parseFloat(remedy.rating)
    }));

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM remedies WHERE 1=1';
    const countParams = [];
    
    if (category) {
      countSql += ' AND category = ?';
      countParams.push(category);
    }
    if (difficulty) {
      countSql += ' AND difficulty = ?';
      countParams.push(difficulty);
    }
    if (search) {
      countSql += ` AND (
        title LIKE ? OR 
        description LIKE ? OR 
        benefits LIKE ? OR
        ingredients LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const { total } = await database.get(countSql, countParams);

    res.json({
      success: true,
      data: processedRemedies,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
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

// GET /api/remedies/:id - Get a specific remedy
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const remedy = await database.get(`
      SELECT 
        id, title, description, category, difficulty, rating, 
        prep_time, ingredients, instructions, benefits, warnings, image,
        created_at, updated_at
      FROM remedies 
      WHERE id = ?
    `, [id]);

    if (!remedy) {
      return res.status(404).json({
        success: false,
        message: 'Remedy not found'
      });
    }

    // Parse JSON fields
    const processedRemedy = {
      ...remedy,
      ingredients: JSON.parse(remedy.ingredients),
      instructions: JSON.parse(remedy.instructions),
      rating: parseFloat(remedy.rating)
    };

    res.json({
      success: true,
      data: processedRemedy
    });

  } catch (error) {
    console.error('Error fetching remedy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch remedy',
      error: error.message
    });
  }
});

// GET /api/remedies/categories/list - Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await database.all(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM remedies 
      GROUP BY category 
      ORDER BY category ASC
    `);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// GET /api/remedies/featured - Get featured/highly rated remedies
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const remedies = await database.all(`
      SELECT 
        id, title, description, category, difficulty, rating, 
        prep_time, ingredients, instructions, benefits, warnings, image
      FROM remedies 
      WHERE rating >= 4.5
      ORDER BY rating DESC, RANDOM()
      LIMIT ?
    `, [parseInt(limit)]);

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
    console.error('Error fetching featured remedies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured remedies',
      error: error.message
    });
  }
});

// GET /api/remedies/search/suggestions - Get search suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await database.all(`
      SELECT DISTINCT title, category, rating
      FROM remedies 
      WHERE title LIKE ? OR category LIKE ?
      ORDER BY rating DESC, title ASC
      LIMIT 10
    `, [`%${q}%`, `%${q}%`]);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search suggestions',
      error: error.message
    });
  }
});

module.exports = router;
