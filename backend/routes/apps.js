/**
 * App Routes
 * Routes for app operations
 */

const express = require('express');
const router = express.Router();

// Controllers
const appController = require('../controllers/appController');

// Middlewares
const { authenticate, optionalAuth, requireAdmin } = require('../middlewares/auth');
const { createAppValidation, updateAppValidation, appIdValidation, statusUpdateValidation, slugValidation } = require('../validators/appValidator');

// Public routes
router.get('/', appController.getApps);
router.get('/search', appController.searchApps);
router.get('/slug/:slug', appController.getAppBySlug);
router.get('/:id', optionalAuth, appIdValidation, appController.getAppById);

// Protected routes (require authentication)
router.post('/', authenticate, createAppValidation, appController.createApp);
router.get('/my/apps', authenticate, appController.getMyApps);
router.put('/:id', authenticate, updateAppValidation, appController.updateApp);
router.delete('/:id', authenticate, appIdValidation, appController.deleteApp);

// Admin only routes
router.patch('/:id/status', authenticate, requireAdmin, statusUpdateValidation, appController.updateStatus);
router.post('/:id/publish', authenticate, requireAdmin, appIdValidation, appController.publishApp);
router.post('/:id/unpublish', authenticate, requireAdmin, appIdValidation, appController.unpublishApp);

// Utility routes
router.post('/generate-slug', slugValidation, appController.generateSlug);

module.exports = router;
