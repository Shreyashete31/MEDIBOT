const express = require('express');
const database = require('../database/database');

const router = express.Router();

// GET /api/first-aid - Get all first aid instructions with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, emergency, search, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        id, title, category, emergency, description, steps, warnings, severity,
        created_at, updated_at
      FROM first_aid 
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (emergency !== undefined) {
      sql += ' AND emergency = ?';
      params.push(emergency === 'true' ? 1 : 0);
    }

    if (search) {
      sql += ` AND (
        title LIKE ? OR 
        description LIKE ? OR 
        steps LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add ordering and pagination
    sql += ' ORDER BY emergency DESC, severity DESC, title ASC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const firstAidInstructions = await database.all(sql, params);
    
    // Parse JSON fields and convert boolean
    const processedInstructions = firstAidInstructions.map(instruction => ({
      ...instruction,
      steps: JSON.parse(instruction.steps),
      emergency: Boolean(instruction.emergency)
    }));

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM first_aid WHERE 1=1';
    const countParams = [];
    
    if (category) {
      countSql += ' AND category = ?';
      countParams.push(category);
    }
    if (emergency !== undefined) {
      countSql += ' AND emergency = ?';
      countParams.push(emergency === 'true' ? 1 : 0);
    }
    if (search) {
      countSql += ` AND (
        title LIKE ? OR 
        description LIKE ? OR 
        steps LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const { total } = await database.get(countSql, countParams);

    res.json({
      success: true,
      data: processedInstructions,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Error fetching first aid instructions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch first aid instructions',
      error: error.message
    });
  }
});

// GET /api/first-aid/:id - Get a specific first aid instruction
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const instruction = await database.get(`
      SELECT 
        id, title, category, emergency, description, steps, warnings, severity,
        created_at, updated_at
      FROM first_aid 
      WHERE id = ?
    `, [id]);

    if (!instruction) {
      return res.status(404).json({
        success: false,
        message: 'First aid instruction not found'
      });
    }

    // Parse JSON fields and convert boolean
    const processedInstruction = {
      ...instruction,
      steps: JSON.parse(instruction.steps),
      emergency: Boolean(instruction.emergency)
    };

    res.json({
      success: true,
      data: processedInstruction
    });

  } catch (error) {
    console.error('Error fetching first aid instruction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch first aid instruction',
      error: error.message
    });
  }
});

// GET /api/first-aid/categories/list - Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await database.all(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM first_aid 
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

// GET /api/first-aid/emergency - Get emergency procedures only
router.get('/emergency', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const emergencyInstructions = await database.all(`
      SELECT 
        id, title, category, emergency, description, steps, warnings, severity
      FROM first_aid 
      WHERE emergency = 1
      ORDER BY severity DESC, title ASC
      LIMIT ?
    `, [parseInt(limit)]);

    // Parse JSON fields and convert boolean
    const processedInstructions = emergencyInstructions.map(instruction => ({
      ...instruction,
      steps: JSON.parse(instruction.steps),
      emergency: Boolean(instruction.emergency)
    }));

    res.json({
      success: true,
      data: processedInstructions
    });

  } catch (error) {
    console.error('Error fetching emergency instructions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency instructions',
      error: error.message
    });
  }
});

// GET /api/first-aid/search/suggestions - Get search suggestions
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
      SELECT DISTINCT title, category, severity, emergency
      FROM first_aid 
      WHERE title LIKE ? OR category LIKE ?
      ORDER BY emergency DESC, severity DESC, title ASC
      LIMIT 10
    `, [`%${q}%`, `%${q}%`]);

    // Convert boolean
    const processedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      emergency: Boolean(suggestion.emergency)
    }));

    res.json({
      success: true,
      data: processedSuggestions
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
