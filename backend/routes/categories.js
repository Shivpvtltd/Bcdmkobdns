/**
 * Category Routes
 * Routes for category operations
 */

const express = require('express');
const router = express.Router();

// Valid categories with metadata
const CATEGORIES = [
    { id: 'games', name: 'Games', icon: '🎮', color: '#ef4444' },
    { id: 'productivity', name: 'Productivity', icon: '📊', color: '#3b82f6' },
    { id: 'social', name: 'Social', icon: '💬', color: '#8b5cf6' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#f59e0b' },
    { id: 'education', name: 'Education', icon: '📚', color: '#10b981' },
    { id: 'finance', name: 'Finance', icon: '💰', color: '#059669' },
    { id: 'health', name: 'Health & Fitness', icon: '💪', color: '#ec4899' },
    { id: 'lifestyle', name: 'Lifestyle', icon: '✨', color: '#6366f1' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#f97316' },
    { id: 'tools', name: 'Tools', icon: '🛠️', color: '#6b7280' },
    { id: 'other', name: 'Other', icon: '📦', color: '#9ca3af' }
];

/**
 * Get all categories
 * GET /api/categories
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        count: CATEGORIES.length,
        data: CATEGORIES
    });
});

/**
 * Get category by ID
 * GET /api/categories/:id
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const category = CATEGORIES.find(c => c.id === id);
    
    if (!category) {
        return res.status(404).json({
            success: false,
            error: 'Category not found'
        });
    }
    
    res.json({
        success: true,
        data: category
    });
});

module.exports = router;
