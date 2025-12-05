const Joi = require('joi');

// Validation schemas
const userRegistrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  full_name: Joi.string().max(100).optional()
});

const userLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const remedySearchSchema = Joi.object({
  category: Joi.string().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  search: Joi.string().max(200).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional()
});

const chatMessageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  userId: Joi.string().max(100).optional()
});

// Validation middleware functions
const validateUserRegistration = (req, res, next) => {
  const { error, value } = userRegistrationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

const validateUserLogin = (req, res, next) => {
  const { error, value } = userLoginSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

const validateRemedySearch = (req, res, next) => {
  const { error, value } = remedySearchSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  
  req.query = value;
  next();
};

const validateChatMessage = (req, res, next) => {
  const { error, value } = chatMessageSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateRemedySearch,
  validateChatMessage
};
