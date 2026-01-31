/**
 * App Controller
 * HTTP request handlers for app operations
 */

const appService = require('../services/appService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Create new app
 * POST /api/apps
 */
const createApp = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    const appData = req.body;
    
    const newApp = await appService.createApp(appData, userId);
    
    res.status(201).json({
        success: true,
        message: 'App created successfully',
        data: newApp
    });
});

/**
 * Get all active apps
 * GET /api/apps
 */
const getApps = asyncHandler(async (req, res) => {
    const { category, limit, sortBy, order } = req.query;
    
    const apps = await appService.getActiveApps({
        category,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || 'createdAt',
        order: order || 'desc'
    });
    
    res.json({
        success: true,
        count: apps.length,
        data: apps
    });
});

/**
 * Get app by ID
 * GET /api/apps/:id
 */
const getAppById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.user?.isAdmin || false;
    
    const app = await appService.getAppById(id, isAdmin);
    
    if (!app) {
        throw new ApiError(404, 'App not found');
    }
    
    // Increment view count (async, don't wait)
    appService.incrementViewCount(id).catch(() => {});
    
    res.json({
        success: true,
        data: app
    });
});

/**
 * Get app by slug
 * GET /api/apps/slug/:slug
 */
const getAppBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    
    const app = await appService.getAppBySlug(slug);
    
    if (!app) {
        throw new ApiError(404, 'App not found');
    }
    
    res.json({
        success: true,
        data: app
    });
});

/**
 * Update app
 * PUT /api/apps/:id
 */
const updateApp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.isAdmin || false;
    const updateData = req.body;
    
    const updatedApp = await appService.updateApp(id, updateData, userId, isAdmin);
    
    res.json({
        success: true,
        message: 'App updated successfully',
        data: updatedApp
    });
});

/**
 * Delete app
 * DELETE /api/apps/:id
 */
const deleteApp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.isAdmin || false;
    
    await appService.deleteApp(id, userId, isAdmin);
    
    res.json({
        success: true,
        message: 'App deleted successfully'
    });
});

/**
 * Get user's apps
 * GET /api/apps/my/apps
 */
const getMyApps = asyncHandler(async (req, res) => {
    const userId = req.user.uid;
    
    const apps = await appService.getAppsByOwner(userId);
    
    res.json({
        success: true,
        count: apps.length,
        data: apps
    });
});

/**
 * Update app status (admin only)
 * PATCH /api/apps/:id/status
 */
const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.uid;
    
    const result = await appService.updateAppStatus(id, status, adminId);
    
    res.json({
        success: true,
        message: `App status updated to ${status}`,
        data: result
    });
});

/**
 * Publish app (change status to active)
 * POST /api/apps/:id/publish
 */
const publishApp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.uid;
    
    const result = await appService.updateAppStatus(id, 'active', adminId);
    
    res.json({
        success: true,
        message: 'App published successfully',
        data: result
    });
});

/**
 * Unpublish app (change status to draft)
 * POST /api/apps/:id/unpublish
 */
const unpublishApp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.uid;
    
    const result = await appService.updateAppStatus(id, 'draft', adminId);
    
    res.json({
        success: true,
        message: 'App unpublished successfully',
        data: result
    });
});

/**
 * Search apps
 * GET /api/apps/search?q=query
 */
const searchApps = asyncHandler(async (req, res) => {
    const { q, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
        throw new ApiError(400, 'Search query must be at least 2 characters');
    }
    
    const apps = await appService.searchApps(q.trim(), parseInt(limit) || 20);
    
    res.json({
        success: true,
        query: q,
        count: apps.length,
        data: apps
    });
});

/**
 * Generate slug from app name
 * POST /api/apps/generate-slug
 */
const generateSlug = asyncHandler(async (req, res) => {
    const { appName } = req.body;
    
    if (!appName || appName.trim().length < 2) {
        throw new ApiError(400, 'App name must be at least 2 characters');
    }
    
    const slug = appService.generateSlug(appName);
    
    res.json({
        success: true,
        data: {
            slug,
            original: appName
        }
    });
});

module.exports = {
    createApp,
    getApps,
    getAppById,
    getAppBySlug,
    updateApp,
    deleteApp,
    getMyApps,
    updateStatus,
    publishApp,
    unpublishApp,
    searchApps,
    generateSlug
};
