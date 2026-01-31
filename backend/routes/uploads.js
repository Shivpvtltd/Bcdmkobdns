/**
 * Upload Routes
 * Routes for file upload operations
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Controllers
const uploadController = require('../controllers/uploadController');

// Middlewares
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } = require('../services/uploadService');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5
    }
});

// Single file upload
const uploadSingle = upload.single('file');

// Multiple files upload (max 5)
const uploadMultiple = upload.array('files', 5);

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum 5 files allowed'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Unexpected field name. Use "file" for single upload or "files" for multiple'
            });
        }
    }
    if (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    next();
};

// Protected routes (require authentication)
router.post('/single', authenticate, uploadSingle, handleMulterError, uploadController.uploadSingle);
router.post('/multiple', authenticate, uploadMultiple, handleMulterError, uploadController.uploadMultiple);
router.post('/logo', authenticate, uploadSingle, handleMulterError, uploadController.uploadLogo);
router.post('/screenshots', authenticate, uploadMultiple, handleMulterError, uploadController.uploadScreenshots);
router.delete('/', authenticate, uploadController.deleteFile);
router.get('/stats', authenticate, uploadController.getUploadStats);

// Admin only routes
router.post('/slide', authenticate, requireAdmin, uploadSingle, handleMulterError, uploadController.uploadSlideImage);

module.exports = router;
