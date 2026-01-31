/**
 * UPlayG Production Backend API
 * Fully Fixed for Firebase Hosting + Render + CORS
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==============================
// 🔥 FIREBASE ADMIN INIT
// ==============================
const { initializeFirebase } = require('./utils/firebase');
initializeFirebase();

// ==============================
// 🔐 SECURITY & CORE MIDDLEWARES
// ==============================

// Helmet को हटा दिया गया है
// app.use(helmet()); 

// ✅ CORS — THIS WAS THE MAIN PROBLEM (FIXED)
app.use(cors({
    origin: [
        'https://uplayg-1.web.app',
        'https://uplayg-1.firebaseapp.com',
        'https://uplayg.web.app',
        'https://uplayg.firebaseapp.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// IMPORTANT: allow preflight
app.options('*', cors());

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==============================
// 🚦 RATE LIMITING
// ==============================

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
});

const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        error: 'Too many requests. Please try again later.'
    }
});

app.use(generalLimiter);

// ==============================
// 📝 REQUEST LOGGER
// ==============================
const { requestLogger } = require('./middlewares/requestLogger');
app.use(requestLogger);

// ==============================
// ❤️ HEALTH & ROOT (IMPORTANT FOR RENDER)
// ==============================

// Root ping (prevents Render sleep issues)
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'UPlayG API',
        status: 'running'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// ==============================
// 📦 ROUTES
// ==============================

const appRoutes = require('./routes/apps');
const sliderRoutes = require('./routes/slider');
const ratingRoutes = require('./routes/ratings');
const uploadRoutes = require('./routes/uploads');
const categoryRoutes = require('./routes/categories');

app.use('/api/apps', appRoutes);
app.use('/api/slider', sliderRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/uploads', strictLimiter, uploadRoutes);

// ==============================
// ❌ 404 & ERROR HANDLERS
// ==============================

const { errorHandler, notFound } = require('./middlewares/errorHandler');

app.use(notFound);
app.use(errorHandler);

// ==============================
// 🚀 START SERVER
// ==============================

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 UPlayG Backend Server Running            ║
║                                              ║
║   PORT: ${PORT}                               ║
║   ROOT:  /                                   ║
║   API:   /api                                ║
║   HEALTH:/health                             ║
║                                              ║
╚══════════════════════════════════════════════╝
    `);
});

module.exports = app;