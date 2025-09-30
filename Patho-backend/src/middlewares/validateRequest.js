const { validationResult } = require('express-validator');
const { AppError, handleValidationError } = require('./errorMiddleware');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = handleValidationError(errors.array());
    return next(error);
  }
  next();
};

module.exports = validateRequest;