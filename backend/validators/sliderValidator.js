/**
 * Slider Validators
 * Validation logic for hero slider operations
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
 * Validate slide creation
 */
const createSlideValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Slide title is required')
        .isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),
    
    body('subtitle')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Subtitle must be at most 200 characters'),
    
    body('imageUrl')
        .notEmpty().withMessage('Image URL is required')
        .isURL().withMessage('Image URL must be a valid URL'),
    
    body('appId')
        .optional()
        .isString().withMessage('App ID must be a string'),
    
    body('buttonText')
        .optional()
        .trim()
        .isLength({ max: 30 }).withMessage('Button text must be at most 30 characters'),
    
    body('order')
        .optional()
        .isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
    
    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),
    
    handleValidationErrors
];

/**
 * Validate slide update
 */
const updateSlideValidation = [
    param('id')
        .notEmpty().withMessage('Slide ID is required'),
    
    body('title')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),
    
    body('subtitle')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Subtitle must be at most 200 characters'),
    
    body('imageUrl')
        .optional()
        .isURL().withMessage('Image URL must be a valid URL'),
    
    body('appId')
        .optional()
        .isString().withMessage('App ID must be a string'),
    
    body('buttonText')
        .optional()
        .trim()
        .isLength({ max: 30 }).withMessage('Button text must be at most 30 characters'),
    
    body('order')
        .optional()
        .isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
    
    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),
    
    handleValidationErrors
];

/**
 * Validate slide ID
 */
const slideIdValidation = [
    param('id')
        .notEmpty().withMessage('Slide ID is required'),
    
    handleValidationErrors
];

/**
 * Validate reorder request
 */
const reorderValidation = [
    body('slideIds')
        .notEmpty().withMessage('Slide IDs array is required')
        .isArray().withMessage('slideIds must be an array')
        .isLength({ min: 1 }).withMessage('At least one slide ID is required'),
    
    handleValidationErrors
];

module.exports = {
    createSlideValidation,
    updateSlideValidation,
    slideIdValidation,
    reorderValidation,
    handleValidationErrors
};
