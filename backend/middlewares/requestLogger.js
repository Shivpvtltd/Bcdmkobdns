/**
 * Request Logging Middleware
 * Logs all incoming requests for monitoring and debugging
 */

/**
 * Format timestamp
 */
function formatTimestamp() {
    return new Date().toISOString();
}

/**
 * Get client IP address
 */
function getClientIp(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
}

/**
 * Log request details
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    
    // Log request start
    console.log(`[${formatTimestamp()}] ${req.method} ${req.path} - IP: ${getClientIp(req)}`);

    // Capture response finish
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
        
        console.log(
            `[${formatTimestamp()}] ${statusEmoji} ${req.method} ${req.path} - ${status} - ${duration}ms`
        );
    });

    next();
}

/**
 * Sanitize log data - remove sensitive information
 */
function sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'secret'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }
    
    return sanitized;
}

module.exports = {
    requestLogger,
    sanitizeData,
    getClientIp
};
