/**
 * Rating Controller
 * HTTP request handlers for rating operations
 */

const ratingService = require('../services/ratingService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Create or update rating
 * POST /api/ratings/:appId
 */
const createOrUpdateRating = asyncHandler(async (req, res) => {
    const { appId } = req.params;
    const userId = req.user.uid;
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, 'Rating must be between 1 and 5');
    }
    
    const result = await ratingService.createOrUpdateRating(appId, userId, rating, review);
    
    res.status(result.isUpdate ? 200 : 201).json({
        success: true,
        message: result.isUpdate ? 'Rating updated successfully' : 'Rating submitted successfully',
        data: result
    });
});

/**
 * Get user's rating for an app
 * GET /api/ratings/:appId/my-rating
 */
const getMyRating = asyncHandler(async (req, res) => {
    const { appId } = req.params;
    const userId = req.user.uid;
    
    const rating = await ratingService.getUserRating(appId, userId);
    
    res.json({
        success: true,
        data: rating || null,
        hasRated: !!rating
    });
});

/**
 * Get all ratings for an app
 * GET /api/ratings/:appId
 */
const getAppRatings = asyncHandler(async (req, res) => {
    const { appId } = req.params;
    const { limit, includeUserInfo } = req.query;
    
    const ratings = await ratingService.getAppRatings(appId, {
        limit: parseInt(limit) || 50,
        includeUserInfo: includeUserInfo === 'true'
    });
    
    res.json({
        success: true,
        count: ratings.length,
        data: ratings
    });
});

/**
 * Get rating summary for an app
 * GET /api/ratings/:appId/summary
 */
const getRatingSummary = asyncHandler(async (req, res) => {
    const { appId } = req.params;
    
    const summary = await ratingService.getRatingSummary(appId);
    
    res.json({
        success: true,
        data: summary
    });
});

/**
 * Delete user's rating
 * DELETE /api/ratings/:appId
 */
const deleteRating = asyncHandler(async (req, res) => {
    const { appId } = req.params;
    const userId = req.user.uid;
    
    await ratingService.deleteRating(appId, userId);
    
    res.json({
        success: true,
        message: 'Rating deleted successfully'
    });
});

/**
 * Check if user has rated an app
 * GET /api/ratings/:appId/has-rated
 */
const hasRated = asyncHandler(async (req, res) => {
    const { appId } = req.params;
    const userId = req.user.uid;
    
    const hasUserRated = await ratingService.hasUserRated(appId, userId);
    
    res.json({
        success: true,
        hasRated: hasUserRated
    });
});

module.exports = {
    createOrUpdateRating,
    getMyRating,
    getAppRatings,
    getRatingSummary,
    deleteRating,
    hasRated
};
