/**
 * Rating Validators
 * Validation logic for rating operations
 */

const { body, param, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
}

/**
 * Validate rating creation
 */
const createRatingValidation = [
    param('appId')
        .notEmpty().withMessage('App ID is required')
        .isString().withMessage('App ID must be a string'),
    
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    
    body('review')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Review must be at most 500 characters'),
    
    handleValidationErrors
];

/**
 * Validate rating update
 */
const updateRatingValidation = [
    param('appId')
        .notEmpty().withMessage('App ID is required'),
    
    body('rating')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    
    body('review')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Review must be at most 500 characters'),
    
    handleValidationErrors
];

/**
 * Validate app ID for getting ratings
 */
const getRatingsValidation = [
    param('appId')
        .notEmpty().withMessage('App ID is required'),
    
    handleValidationErrors
];

module.exports = {
    createRatingValidation,
    updateRatingValidation,
    getRatingsValidation,
    handleValidationErrors
};
