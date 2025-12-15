const express = require('express');
const database = require('./database/database');

const router = express.Router();

// Quiz questions data
const quizQuestions = {
  'first-aid': [
    {
      id: 1,
      question: "What is the first step when someone is bleeding heavily?",
      options: [
        "Apply a tourniquet immediately",
        "Apply direct pressure to the wound",
        "Elevate the injured area",
        "Give them water"
      ],
      correct: 1,
      explanation: "Direct pressure is the first and most important step to control bleeding. Apply firm, steady pressure directly on the wound."
    },
    {
      id: 2,
      question: "How should you position someone who is unconscious but breathing?",
      options: [
        "On their back with head elevated",
        "On their side (recovery position)",
        "Sitting upright",
        "On their stomach"
      ],
      correct: 1,
      explanation: "The recovery position (on their side) helps keep the airway clear and prevents choking if they vomit."
    },
    {
      id: 3,
      question: "What should you do if someone is choking?",
      options: [
        "Give them water immediately",
        "Perform the Heimlich maneuver",
        "Pat them on the back gently",
        "Wait for them to cough it out"
      ],
      correct: 1,
      explanation: "The Heimlich maneuver (abdominal thrusts) is the standard first aid technique for conscious choking victims."
    },
    {
      id: 4,
      question: "For a minor burn, what should you do first?",
      options: [
        "Apply ice directly",
        "Pop any blisters",
        "Run cool water over the burn",
        "Apply butter or oil"
      ],
      correct: 2,
      explanation: "Cool running water helps reduce pain and prevents further tissue damage. Avoid ice, butter, or oils on burns."
    },
    {
      id: 5,
      question: "How long should you perform CPR before checking for signs of life?",
      options: [
        "30 seconds",
        "2 minutes",
        "5 minutes",
        "Until help arrives"
      ],
      correct: 1,
      explanation: "Perform CPR in cycles of 30 compressions and 2 breaths, checking for signs of life every 2 minutes."
    },
    {
      id: 6,
      question: "What is the correct hand placement for chest compressions?",
      options: [
        "On the lower part of the breastbone",
        "On the upper part of the chest",
        "On the left side of the chest",
        "Anywhere on the chest"
      ],
      correct: 0,
      explanation: "Place the heel of one hand on the lower half of the breastbone, with the other hand on top."
    },
    {
      id: 7,
      question: "For a nosebleed, what should you do?",
      options: [
        "Tilt head back",
        "Pinch nostrils and lean forward slightly",
        "Blow nose hard",
        "Insert cotton in nostrils"
      ],
      correct: 1,
      explanation: "Pinch the nostrils together and lean forward slightly to prevent blood from going down the throat."
    },
    {
      id: 8,
      question: "What should you do if someone has a seizure?",
      options: [
        "Hold them down",
        "Put something in their mouth",
        "Clear the area and protect their head",
        "Give them water"
      ],
      correct: 2,
      explanation: "Clear the area of dangerous objects and protect their head. Do not restrain them or put anything in their mouth."
    },
    {
      id: 9,
      question: "For a sprained ankle, what does RICE stand for?",
      options: [
        "Rest, Ice, Compression, Elevation",
        "Run, Ice, Care, Exercise",
        "Rest, Injury, Care, Elevation",
        "Relax, Ice, Compression, Exercise"
      ],
      correct: 0,
      explanation: "RICE is the standard treatment: Rest, Ice, Compression, and Elevation to reduce swelling and pain."
    },
    {
      id: 10,
      question: "What should you do if someone is having a heart attack?",
      options: [
        "Give them aspirin immediately",
        "Have them lie down and rest",
        "Call emergency services and keep them comfortable",
        "Give them water and wait"
      ],
      correct: 2,
      explanation: "Call emergency services immediately. Keep the person calm and comfortable while waiting for help."
    }
  ]
};

// GET /api/quiz/:type - Get quiz questions
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;
    
    if (!quizQuestions[type]) {
      return res.status(404).json({
        success: false,
        message: 'Quiz type not found'
      });
    }
    
    // Get random questions based on limit
    const allQuestions = quizQuestions[type];
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Math.min(parseInt(limit), allQuestions.length));
    
    // Remove correct answer from response
    const questionsForClient = selectedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));
    
    res.json({
      success: true,
      data: {
        quizType: type,
        questions: questionsForClient,
        totalQuestions: selectedQuestions.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz questions',
      error: error.message
    });
  }
});

// POST /api/quiz/:type/submit - Submit quiz answers
router.post('/:type/submit', async (req, res) => {
  try {
    const { type } = req.params;
    const { answers, userId = 'anonymous' } = req.body;
    
    if (!quizQuestions[type]) {
      return res.status(404).json({
        success: false,
        message: 'Quiz type not found'
      });
    }
    
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid answers format'
      });
    }
    
    // Calculate score
    const questions = quizQuestions[type];
    let score = 0;
    const results = [];
    
    Object.keys(answers).forEach(questionId => {
      const question = questions.find(q => q.id === parseInt(questionId));
      if (question) {
        const userAnswer = parseInt(answers[questionId]);
        const isCorrect = userAnswer === question.correct;
        
        if (isCorrect) score++;
        
        results.push({
          questionId: question.id,
          question: question.question,
          userAnswer: userAnswer,
          correctAnswer: question.correct,
          isCorrect: isCorrect,
          explanation: question.explanation
        });
      }
    });
    
    const totalQuestions = Object.keys(answers).length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Save quiz result to database
    const quizResult = {
      id: Date.now().toString(),
      userId: userId,
      quizType: type,
      score: score,
      totalQuestions: totalQuestions,
      percentage: percentage,
      answers: answers,
      completedAt: new Date().toISOString()
    };
    
    await database.run(`
      INSERT INTO quiz_results (id, user_id, quiz_type, score, total_questions, answers, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      quizResult.id,
      quizResult.userId,
      quizResult.quizType,
      quizResult.score,
      quizResult.totalQuestions,
      JSON.stringify(quizResult.answers),
      quizResult.completedAt
    ]);
    
    res.json({
      success: true,
      data: {
        ...quizResult,
        results: results,
        grade: getGrade(percentage)
      }
    });
    
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: error.message
    });
  }
});

// GET /api/quiz/:type/results - Get quiz results for a user
router.get('/:type/results', async (req, res) => {
  try {
    const { type } = req.params;
    const { userId = 'anonymous', limit = 10 } = req.query;
    
    const results = await database.all(`
      SELECT 
        id, score, total_questions, answers, completed_at
      FROM quiz_results 
      WHERE user_id = ? AND quiz_type = ?
      ORDER BY completed_at DESC
      LIMIT ?
    `, [userId, type, parseInt(limit)]);
    
    // Parse JSON fields
    const processedResults = results.map(result => ({
      ...result,
      answers: JSON.parse(result.answers),
      percentage: Math.round((result.score / result.total_questions) * 100),
      grade: getGrade(Math.round((result.score / result.total_questions) * 100))
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

// GET /api/quiz/types - Get available quiz types
router.get('/types/list', async (req, res) => {
  try {
    const quizTypes = Object.keys(quizQuestions).map(type => ({
      id: type,
      name: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Test your knowledge of ${type.replace('-', ' ')}`,
      questionCount: quizQuestions[type].length
    }));
    
    res.json({
      success: true,
      data: quizTypes
    });
    
  } catch (error) {
    console.error('Error fetching quiz types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz types',
      error: error.message
    });
  }
});

// POST /api/quiz/sync - Acknowledge offline quiz progress sync
router.post('/sync', async (req, res) => {
  try {
    const { userId = 'anonymous', progress = {} } = req.body || {};
    res.json({
      success: true,
      message: 'Quiz progress sync acknowledged',
      received: {
        userId,
        keys: Object.keys(progress)
      }
    });
  } catch (error) {
    console.error('Error acknowledging quiz sync:', error);
    res.status(500).json({ success: false, message: 'Failed to sync quiz progress' });
  }
});

// Helper function to get grade
function getGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

module.exports = router;

