/**
 * Slider Controller
 * HTTP request handlers for hero slider operations
 */

const sliderService = require('../services/sliderService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Create new slide (admin only)
 * POST /api/slider
 */
const createSlide = asyncHandler(async (req, res) => {
    const slideData = req.body;
    
    const newSlide = await sliderService.createSlide(slideData);
    
    res.status(201).json({
        success: true,
        message: 'Slide created successfully',
        data: newSlide
    });
});

/**
 * Get all active slides (public)
 * GET /api/slider
 */
const getActiveSlides = asyncHandler(async (req, res) => {
    const slides = await sliderService.getActiveSlides();
    
    res.json({
        success: true,
        count: slides.length,
        data: slides
    });
});

/**
 * Get all slides (admin only)
 * GET /api/slider/all
 */
const getAllSlides = asyncHandler(async (req, res) => {
    const slides = await sliderService.getAllSlides();
    
    res.json({
        success: true,
        count: slides.length,
        data: slides
    });
});

/**
 * Get slide by ID
 * GET /api/slider/:id
 */
const getSlideById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const slide = await sliderService.getSlideById(id);
    
    if (!slide) {
        throw new ApiError(404, 'Slide not found');
    }
    
    res.json({
        success: true,
        data: slide
    });
});

/**
 * Update slide (admin only)
 * PUT /api/slider/:id
 */
const updateSlide = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedSlide = await sliderService.updateSlide(id, updateData);
    
    res.json({
        success: true,
        message: 'Slide updated successfully',
        data: updatedSlide
    });
});

/**
 * Delete slide (admin only)
 * DELETE /api/slider/:id
 */
const deleteSlide = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await sliderService.deleteSlide(id);
    
    res.json({
        success: true,
        message: 'Slide deleted successfully'
    });
});

/**
 * Reorder slides (admin only)
 * POST /api/slider/reorder
 */
const reorderSlides = asyncHandler(async (req, res) => {
    const { slideIds } = req.body;
    
    if (!Array.isArray(slideIds) || slideIds.length === 0) {
        throw new ApiError(400, 'slideIds must be a non-empty array');
    }
    
    const result = await sliderService.reorderSlides(slideIds);
    
    res.json({
        success: true,
        message: 'Slides reordered successfully',
        data: result
    });
});

/**
 * Toggle slide active status (admin only)
 * PATCH /api/slider/:id/toggle
 */
const toggleSlideStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await sliderService.toggleSlideStatus(id);
    
    res.json({
        success: true,
        message: `Slide ${result.isActive ? 'activated' : 'deactivated'} successfully`,
        data: result
    });
});

module.exports = {
    createSlide,
    getActiveSlides,
    getAllSlides,
    getSlideById,
    updateSlide,
    deleteSlide,
    reorderSlides,
    toggleSlideStatus
};
