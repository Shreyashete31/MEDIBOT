const express = require('express');
const database = require('../database/database');
const { validateChatMessage } = require('../middleware/validation');

const router = express.Router();

// Pre-defined responses for common health queries
const predefinedResponses = {
  // Common symptoms and remedies
  'headache': {
    message: "For headaches, try these natural remedies:\n\n1. **Ginger Tea**: Anti-inflammatory properties can help reduce headache pain\n2. **Peppermint Oil**: Apply diluted peppermint oil to temples\n3. **Hydration**: Dehydration often causes headaches - drink plenty of water\n4. **Rest**: Lie down in a dark, quiet room\n\n⚠️ Seek medical attention if headaches are severe, sudden, or accompanied by other symptoms.",
    remedies: ['ginger-tea', 'peppermint-oil', 'hydration']
  },
  'fever': {
    message: "For managing fever naturally:\n\n1. **Stay Hydrated**: Drink plenty of fluids (water, herbal teas)\n2. **Rest**: Get adequate sleep and rest\n3. **Cool Compress**: Apply cool, damp cloth to forehead\n4. **Elderberry Tea**: Natural immune booster\n5. **Garlic**: Has antimicrobial properties\n\n🌡️ Monitor temperature. Seek medical care if fever is above 103°F (39.4°C) or persists for more than 3 days.",
    remedies: ['elderberry-tea', 'garlic-remedy', 'cool-compress']
  },
  'cough': {
    message: "Natural cough relief options:\n\n1. **Honey**: Take 1-2 teaspoons of raw honey\n2. **Ginger Tea**: Add ginger, lemon, and honey to hot water\n3. **Thyme Tea**: Natural expectorant\n4. **Steam Inhalation**: Inhale steam from hot water with eucalyptus oil\n5. **Stay Hydrated**: Keep throat moist with warm liquids\n\n🤧 If cough persists for more than 2 weeks or is severe, consult a healthcare provider.",
    remedies: ['honey-cough', 'ginger-tea', 'thyme-tea']
  },
  'cold': {
    message: "Cold symptom relief:\n\n1. **Zinc Supplements**: May reduce cold duration\n2. **Vitamin C**: Boost immune system\n3. **Chicken Soup**: Hydration and nutrients\n4. **Nasal Irrigation**: Saline rinse for congestion\n5. **Echinacea Tea**: Immune system support\n6. **Rest**: Allow your body to heal\n\n❄️ Most colds resolve in 7-10 days. See a doctor if symptoms worsen or persist.",
    remedies: ['echinacea-tea', 'chicken-soup', 'zinc-supplements']
  },
  'sore throat': {
    message: "Sore throat relief:\n\n1. **Salt Water Gargle**: Mix 1/4 teaspoon salt in warm water\n2. **Honey and Lemon**: Mix in warm water or tea\n3. **Chamomile Tea**: Anti-inflammatory properties\n4. **Licorice Root**: Natural throat soother\n5. **Stay Hydrated**: Warm liquids help\n\n🗣️ If sore throat lasts more than a week or is severe, see a healthcare provider.",
    remedies: ['salt-gargle', 'honey-lemon', 'chamomile-tea']
  },
  'stomach ache': {
    message: "Stomach ache relief:\n\n1. **Ginger Tea**: Natural digestive aid\n2. **Peppermint Tea**: Soothes stomach muscles\n3. **Chamomile Tea**: Anti-inflammatory and calming\n4. **Bland Diet**: BRAT diet (bananas, rice, applesauce, toast)\n5. **Heat Therapy**: Warm compress on stomach\n\n🤢 If pain is severe, persistent, or accompanied by vomiting/diarrhea, seek medical attention.",
    remedies: ['ginger-tea', 'peppermint-tea', 'chamomile-tea']
  },
  'insomnia': {
    message: "Natural sleep aids:\n\n1. **Chamomile Tea**: Promotes relaxation\n2. **Lavender**: Use essential oil or tea\n3. **Magnesium**: Natural muscle relaxant\n4. **Sleep Routine**: Consistent bedtime and wake time\n5. **Limit Screen Time**: Avoid screens 1 hour before bed\n6. **Meditation**: Relaxation techniques\n\n😴 If insomnia persists for weeks, consider consulting a sleep specialist.",
    remedies: ['chamomile-tea', 'lavender-tea', 'magnesium-supplements']
  }
};

// AI-like response generator (simplified)
function generateAIResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Check for exact matches first
  for (const [keyword, response] of Object.entries(predefinedResponses)) {
    if (message.includes(keyword)) {
      return response;
    }
  }
  
  // Check for partial matches
  const healthKeywords = ['pain', 'hurt', 'ache', 'sick', 'ill', 'symptoms', 'remedy', 'treatment'];
  const hasHealthKeyword = healthKeywords.some(keyword => message.includes(keyword));
  
  if (hasHealthKeyword) {
    return {
      message: "I understand you're experiencing some health concerns. Here are some general wellness tips:\n\n1. **Stay Hydrated**: Drink plenty of water throughout the day\n2. **Rest**: Ensure adequate sleep (7-9 hours)\n3. **Balanced Diet**: Eat fruits, vegetables, and whole grains\n4. **Exercise**: Regular physical activity boosts immunity\n5. **Stress Management**: Practice relaxation techniques\n\n💡 For specific symptoms, try describing them more clearly (e.g., 'headache', 'fever', 'cough').\n\n⚠️ Remember: This is not medical advice. Always consult a healthcare professional for serious or persistent symptoms.",
      remedies: ['general-wellness']
    };
  }
  
  // General health advice
  return {
    message: "Hello! I'm your health assistant. I can help you with:\n\n• Natural remedies for common ailments\n• First aid guidance\n• General wellness tips\n• Symptom management\n\nTry asking about specific symptoms like:\n- Headache remedies\n- Cold and flu relief\n- Stomach ache treatment\n- Sleep problems\n- Sore throat remedies\n\nHow can I help you today?",
    remedies: []
  };
}

// POST /api/chat/send - Send a message to the chat assistant
router.post('/send', validateChatMessage, async (req, res) => {
  try {
    const { message, userId = 'anonymous' } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Generate AI response
    const aiResponse = generateAIResponse(message);
    
    // Save chat history to database
    const chatEntry = {
      id: Date.now().toString(),
      userId: userId,
      userMessage: message.trim(),
      botResponse: aiResponse.message,
      suggestedRemedies: aiResponse.remedies,
      timestamp: new Date().toISOString()
    };

    // Store in database
    await database.run(`
      INSERT INTO chat_history (id, user_id, user_message, bot_response, suggested_remedies, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      chatEntry.id,
      chatEntry.userId,
      chatEntry.userMessage,
      chatEntry.botResponse,
      JSON.stringify(chatEntry.suggestedRemedies),
      chatEntry.timestamp
    ]);

    // Return both camelCase and snake_case for frontend compatibility
    res.json({
      success: true,
      data: {
        ...chatEntry,
        user_message: chatEntry.userMessage,
        bot_response: chatEntry.botResponse,
        suggested_remedies: chatEntry.suggestedRemedies
      }
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error.message
    });
  }
});

// GET /api/chat/history - Get chat history for a user
router.get('/history', async (req, res) => {
  try {
    const { userId = 'anonymous', limit = 50, offset = 0 } = req.query;
    
    const chatHistory = await database.all(`
      SELECT 
        id, user_message, bot_response, suggested_remedies, timestamp
      FROM chat_history 
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    // Parse JSON fields
    const processedHistory = chatHistory.map(entry => ({
      ...entry,
      suggestedRemedies: JSON.parse(entry.suggested_remedies || '[]'),
      timestamp: entry.timestamp
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

// DELETE /api/chat/history - Clear chat history for a user
router.delete('/history', async (req, res) => {
  try {
    const { userId = 'anonymous' } = req.body;
    
    await database.run(`
      DELETE FROM chat_history 
      WHERE user_id = ?
    `, [userId]);

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
      error: error.message
    });
  }
});

// GET /api/chat/suggestions - Get quick suggestions for common queries
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = Object.keys(predefinedResponses).map(keyword => ({
      keyword: keyword,
      description: `Get remedies for ${keyword}`,
      category: 'health'
    }));

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error fetching chat suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions',
      error: error.message
    });
  }
});

module.exports = router;

