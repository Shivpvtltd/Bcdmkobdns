/**
 * App Validators
 * Validation logic for app-related operations
 */

const { body, param, validationResult } = require('express-validator');
const { ApiError } = require('../middlewares/errorHandler');

// Valid categories
const VALID_CATEGORIES = [
    'Games', 'Productivity', 'Social', 'Entertainment', 
    'Education', 'Finance', 'Health & Fitness', 
    'Lifestyle', 'Shopping', 'Tools', 'Other'
];

// Valid statuses
const VALID_STATUSES = ['draft', 'active', 'disabled'];

// Valid templates
const VALID_TEMPLATES = ['modern', 'playful', 'professional', 'minimal', 'dark', 'gradient'];

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
 * Validate app creation
 */
const createAppValidation = [
    body('appName')
        .trim()
        .notEmpty().withMessage('App name is required')
        .isLength({ min: 2, max: 100 }).withMessage('App name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-_'.]+$/).withMessage('App name contains invalid characters'),
    
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ min: 50, max: 1000 }).withMessage('Description must be between 50 and 1000 characters'),
    
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
    
    body('downloadURL')
        .notEmpty().withMessage('Download URL is required')
        .isURL({ protocols: ['http', 'https'] }).withMessage('Download URL must be a valid URL'),
    
    body('templateId')
        .optional()
        .isIn(VALID_TEMPLATES).withMessage(`Template must be one of: ${VALID_TEMPLATES.join(', ')}`),
    
    body('features')
        .optional()
        .isArray({ max: 10 }).withMessage('Maximum 10 features allowed')
        .custom((value) => {
            if (value && value.some(f => typeof f !== 'string' || f.length > 100)) {
                throw new Error('Each feature must be a string with maximum 100 characters');
            }
            return true;
        }),
    
    handleValidationErrors
];

/**
 * Validate app update
 */
const updateAppValidation = [
    param('id')
        .notEmpty().withMessage('App ID is required')
        .isString().withMessage('App ID must be a string'),
    
    body('appName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('App name must be between 2 and 100 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ min: 50, max: 1000 }).withMessage('Description must be between 50 and 1000 characters'),
    
    body('category')
        .optional()
        .isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
    
    body('downloadURL')
        .optional()
        .isURL({ protocols: ['http', 'https'] }).withMessage('Download URL must be a valid URL'),
    
    body('status')
        .optional()
        .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
    
    body('features')
        .optional()
        .isArray({ max: 10 }).withMessage('Maximum 10 features allowed'),
    
    handleValidationErrors
];

/**
 * Validate app ID parameter
 */
const appIdValidation = [
    param('id')
        .notEmpty().withMessage('App ID is required')
        .isString().withMessage('App ID must be a string'),
    
    handleValidationErrors
];

/**
 * Validate status update (admin only)
 */
const statusUpdateValidation = [
    param('id')
        .notEmpty().withMessage('App ID is required'),
    
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['active', 'disabled', 'draft']).withMessage('Invalid status value'),
    
    handleValidationErrors
];

/**
 * Validate slug generation
 */
const slugValidation = [
    body('appName')
        .trim()
        .notEmpty().withMessage('App name is required')
        .isLength({ min: 2, max: 100 }).withMessage('App name must be between 2 and 100 characters'),
    
    handleValidationErrors
];

/**
 * Validate query parameters for app listing
 */
const listAppsValidation = [
    param('category')
        .optional()
        .isIn(VALID_CATEGORIES).withMessage('Invalid category'),
    
    handleValidationErrors
];

module.exports = {
    createAppValidation,
    updateAppValidation,
    appIdValidation,
    statusUpdateValidation,
    slugValidation,
    listAppsValidation,
    VALID_CATEGORIES,
    VALID_STATUSES,
    VALID_TEMPLATES,
    handleValidationErrors
};
