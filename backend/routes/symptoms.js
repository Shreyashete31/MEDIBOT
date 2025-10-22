const express = require('express');
const database = require('../database/database');

const router = express.Router();

// GET /api/symptoms - Get all symptoms with optional filtering
router.get('/', async (req, res) => {
  try {
    const { severity, search, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        id, name, severity, description, common_causes, recommendations, 
        when_to_see_doctor, related_remedies, created_at, updated_at
      FROM symptoms 
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (severity) {
      sql += ' AND severity = ?';
      params.push(severity);
    }

    if (search) {
      sql += ` AND (
        name LIKE ? OR 
        description LIKE ? OR 
        common_causes LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add ordering and pagination
    sql += ' ORDER BY severity DESC, name ASC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const symptoms = await database.all(sql, params);
    
    // Parse JSON fields
    const processedSymptoms = symptoms.map(symptom => ({
      ...symptom,
      common_causes: JSON.parse(symptom.common_causes),
      recommendations: JSON.parse(symptom.recommendations),
      when_to_see_doctor: JSON.parse(symptom.when_to_see_doctor),
      related_remedies: symptom.related_remedies ? JSON.parse(symptom.related_remedies) : []
    }));

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM symptoms WHERE 1=1';
    const countParams = [];
    
    if (severity) {
      countSql += ' AND severity = ?';
      countParams.push(severity);
    }
    if (search) {
      countSql += ` AND (
        name LIKE ? OR 
        description LIKE ? OR 
        common_causes LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const { total } = await database.get(countSql, countParams);

    res.json({
      success: true,
      data: processedSymptoms,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Error fetching symptoms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch symptoms',
      error: error.message
    });
  }
});

// GET /api/symptoms/:id - Get a specific symptom
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const symptom = await database.get(`
      SELECT 
        id, name, severity, description, common_causes, recommendations, 
        when_to_see_doctor, related_remedies, created_at, updated_at
      FROM symptoms 
      WHERE id = ?
    `, [id]);

    if (!symptom) {
      return res.status(404).json({
        success: false,
        message: 'Symptom not found'
      });
    }

    // Parse JSON fields
    const processedSymptom = {
      ...symptom,
      common_causes: JSON.parse(symptom.common_causes),
      recommendations: JSON.parse(symptom.recommendations),
      when_to_see_doctor: JSON.parse(symptom.when_to_see_doctor),
      related_remedies: symptom.related_remedies ? JSON.parse(symptom.related_remedies) : []
    };

    res.json({
      success: true,
      data: processedSymptom
    });

  } catch (error) {
    console.error('Error fetching symptom:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch symptom',
      error: error.message
    });
  }
});

// POST /api/symptoms/analyze - Analyze symptoms and provide recommendations
router.post('/analyze', async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms array is required'
      });
    }

    // Get symptom data for each provided symptom
    const symptomData = [];
    for (const symptomName of symptoms) {
      const symptom = await database.get(`
        SELECT 
          id, name, severity, description, common_causes, recommendations, 
          when_to_see_doctor, related_remedies
        FROM symptoms 
        WHERE name = ?
      `, [symptomName.toLowerCase()]);

      if (symptom) {
        symptomData.push({
          ...symptom,
          common_causes: JSON.parse(symptom.common_causes),
          recommendations: JSON.parse(symptom.recommendations),
          when_to_see_doctor: JSON.parse(symptom.when_to_see_doctor),
          related_remedies: symptom.related_remedies ? JSON.parse(symptom.related_remedies) : []
        });
      }
    }

    if (symptomData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching symptoms found'
      });
    }

    // Calculate overall severity
    const severities = symptomData.map(s => s.severity);
    const severityCounts = severities.reduce((acc, severity) => {
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    let overallSeverity = 'low';
    if (severityCounts.critical > 0 || severityCounts.high > 0) {
      overallSeverity = 'high';
    } else if (severityCounts.medium > 0) {
      overallSeverity = 'medium';
    }

    // Get related remedies
    const allRelatedRemedies = [...new Set(
      symptomData.flatMap(symptom => symptom.related_remedies)
    )];

    // Get remedy details for related remedies
    const relatedRemediesData = [];
    if (allRelatedRemedies.length > 0) {
      const placeholders = allRelatedRemedies.map(() => '?').join(',');
      const remedies = await database.all(`
        SELECT id, title, description, category, rating, prep_time, image
        FROM remedies 
        WHERE id IN (${placeholders})
        ORDER BY rating DESC
        LIMIT 6
      `, allRelatedRemedies);

      relatedRemediesData.push(...remedies.map(remedy => ({
        ...remedy,
        rating: parseFloat(remedy.rating)
      })));
    }

    res.json({
      success: true,
      data: {
        analyzed_symptoms: symptomData,
        overall_severity: overallSeverity,
        severity_breakdown: severityCounts,
        related_remedies: relatedRemediesData,
        recommendations: {
          immediate_actions: symptomData.filter(s => s.severity === 'high' || s.severity === 'critical'),
          general_care: symptomData.filter(s => s.severity === 'low' || s.severity === 'medium')
        }
      }
    });

  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze symptoms',
      error: error.message
    });
  }
});

// GET /api/symptoms/search/suggestions - Get search suggestions
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
      SELECT DISTINCT name, severity, description
      FROM symptoms 
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY severity DESC, name ASC
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

// GET /api/symptoms/severity/list - Get severity levels
router.get('/severity/list', async (req, res) => {
  try {
    const severities = await database.all(`
      SELECT DISTINCT severity, COUNT(*) as count
      FROM symptoms 
      GROUP BY severity 
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `);

    res.json({
      success: true,
      data: severities
    });

  } catch (error) {
    console.error('Error fetching severity levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch severity levels',
      error: error.message
    });
  }
});

module.exports = router;
