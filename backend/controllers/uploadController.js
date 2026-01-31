/**
 * Upload Controller
 * HTTP request handlers for file upload operations
 */

const uploadService = require('../services/uploadService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Upload single file
 * POST /api/uploads/single
 */
const uploadSingle = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'No file provided');
    }
    
    const { folder, prefix } = req.body;
    const userId = req.user?.uid || 'anonymous';
    
    const result = await uploadService.uploadFile(req.file, {
        folder: folder || 'uploads',
        prefix: prefix || '',
        metadata: { userId }
    });
    
    res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: result
    });
});

/**
 * Upload multiple files
 * POST /api/uploads/multiple
 */
const uploadMultiple = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, 'No files provided');
    }
    
    const { folder, prefix } = req.body;
    const userId = req.user?.uid || 'anonymous';
    
    const result = await uploadService.uploadMultipleFiles(req.files, {
        folder: folder || 'uploads',
        prefix: prefix || '',
        metadata: { userId }
    });
    
    res.status(201).json({
        success: true,
        message: 'Files uploaded successfully',
        data: result
    });
});

/**
 * Upload app logo
 * POST /api/uploads/logo
 */
const uploadLogo = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'No logo file provided');
    }
    
    const { appId } = req.body;
    const userId = req.user.uid;
    
    const result = await uploadService.uploadAppLogo(req.file, appId, userId);
    
    res.status(201).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: result
    });
});

/**
 * Upload app screenshots
 * POST /api/uploads/screenshots
 */
const uploadScreenshots = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, 'No screenshot files provided');
    }
    
    const { appId } = req.body;
    const userId = req.user.uid;
    
    const result = await uploadService.uploadAppScreenshots(req.files, appId, userId);
    
    res.status(201).json({
        success: true,
        message: 'Screenshots uploaded successfully',
        data: result
    });
});

/**
 * Upload hero slide image (admin only)
 * POST /api/uploads/slide
 */
const uploadSlideImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'No image file provided');
    }
    
    const { slideId } = req.body;
    const userId = req.user.uid;
    
    const result = await uploadService.uploadSlideImage(req.file, slideId, userId);
    
    res.status(201).json({
        success: true,
        message: 'Slide image uploaded successfully',
        data: result
    });
});

/**
 * Delete file
 * DELETE /api/uploads
 */
const deleteFile = asyncHandler(async (req, res) => {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
        throw new ApiError(400, 'fileUrl is required');
    }
    
    await uploadService.deleteFile(fileUrl);
    
    res.json({
        success: true,
        message: 'File deleted successfully'
    });
});

/**
 * Get upload statistics
 * GET /api/uploads/stats
 */
const getUploadStats = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    
    const stats = await uploadService.getUploadStats(userId);
    
    res.json({
        success: true,
        data: stats
    });
});

module.exports = {
    uploadSingle,
    uploadMultiple,
    uploadLogo,
    uploadScreenshots,
    uploadSlideImage,
    deleteFile,
    getUploadStats
};
