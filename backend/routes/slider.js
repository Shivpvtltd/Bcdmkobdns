/**
 * Slider Routes
 * Routes for hero slider operations
 */

const express = require('express');
const router = express.Router();

// Controllers
const sliderController = require('../controllers/sliderController');

// Middlewares
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { createSlideValidation, updateSlideValidation, slideIdValidation, reorderValidation } = require('../validators/sliderValidator');

// Public routes
router.get('/', sliderController.getActiveSlides);

// Admin only routes
router.get('/all', authenticate, requireAdmin, sliderController.getAllSlides);
router.get('/:id', authenticate, requireAdmin, slideIdValidation, sliderController.getSlideById);
router.post('/', authenticate, requireAdmin, createSlideValidation, sliderController.createSlide);
router.put('/:id', authenticate, requireAdmin, updateSlideValidation, sliderController.updateSlide);
router.delete('/:id', authenticate, requireAdmin, slideIdValidation, sliderController.deleteSlide);
router.post('/reorder', authenticate, requireAdmin, reorderValidation, sliderController.reorderSlides);
router.patch('/:id/toggle', authenticate, requireAdmin, slideIdValidation, sliderController.toggleSlideStatus);

module.exports = router;
