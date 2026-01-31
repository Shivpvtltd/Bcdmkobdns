/**
 * Rating Routes
 * Routes for rating operations
 */

const express = require('express');
const router = express.Router();

// Controllers
const ratingController = require('../controllers/ratingController');

// Middlewares
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { createRatingValidation, getRatingsValidation } = require('../validators/ratingValidator');

// Public routes
router.get('/:appId', getRatingsValidation, ratingController.getAppRatings);
router.get('/:appId/summary', getRatingsValidation, ratingController.getRatingSummary);

// Protected routes (require authentication)
router.post('/:appId', authenticate, createRatingValidation, ratingController.createOrUpdateRating);
router.get('/:appId/my-rating', authenticate, getRatingsValidation, ratingController.getMyRating);
router.get('/:appId/has-rated', authenticate, getRatingsValidation, ratingController.hasRated);
router.delete('/:appId', authenticate, getRatingsValidation, ratingController.deleteRating);

module.exports = router;
