/**
 * Authentication Middleware
 * Verifies Firebase ID tokens and sets user context
 */

const { verifyIdToken, isAdmin: checkIsAdmin } = require('../utils/firebase');

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Authenticate request - verify Firebase ID token
 */
async function authenticate(req, res, next) {
    try {
        const token = extractToken(req);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Please provide a valid token.'
            });
        }

        const decodedToken = await verifyIdToken(token);
        
        // Set user context
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email?.split('@')[0],
            picture: decodedToken.picture,
            emailVerified: decodedToken.email_verified
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token. Please sign in again.'
        });
    }
}

/**
 * Optional authentication - doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
    try {
        const token = extractToken(req);
        
        if (token) {
            const decodedToken = await verifyIdToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,
                picture: decodedToken.picture
            };
        }
        
        next();
    } catch (error) {
        // Silently continue without user context
        next();
    }
}

/**
 * Require admin role
 */
async function requireAdmin(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const isUserAdmin = await checkIsAdmin(req.user.uid);
        
        if (!isUserAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        req.user.isAdmin = true;
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to verify admin status'
        });
    }
}

/**
 * Check if user owns resource or is admin
 */
function requireOwnerOrAdmin(getOwnerId) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const ownerId = await getOwnerId(req);
            const isUserAdmin = await checkIsAdmin(req.user.uid);

            if (req.user.uid !== ownerId && !isUserAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to access this resource'
                });
            }

            next();
        } catch (error) {
            console.error('Owner check error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to verify ownership'
            });
        }
    };
}

module.exports = {
    authenticate,
    optionalAuth,
    requireAdmin,
    requireOwnerOrAdmin,
    extractToken
};
