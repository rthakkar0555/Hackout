const Joi = require('joi');

/**
 * Middleware to validate request body using Joi schemas
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errorMessages
        }
      });
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate request query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: {
          message: 'Query validation failed',
          details: errorMessages
        }
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Middleware to validate request parameters
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: {
          message: 'Parameter validation failed',
          details: errorMessages
        }
      });
    }

    req.params = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const commonSchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),

  creditId: Joi.number().integer().min(0).required(),

  amount: Joi.number().positive().required(),

  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  search: Joi.object({
    query: Joi.string().min(1).max(100),
    filters: Joi.object({
      status: Joi.string().valid('ISSUED', 'TRANSFERRED', 'RETIRED', 'EXPIRED'),
      renewableSourceType: Joi.string().valid('Solar', 'Wind', 'Hydro', 'Geothermal', 'Biomass', 'Other'),
      producer: Joi.string(),
      certifier: Joi.string()
    })
  })
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  commonSchemas
};
