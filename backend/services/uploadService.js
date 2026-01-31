/**
 * Upload Service
 * Business logic for file upload operations to Firebase Storage
 */

const { getStorage, getFirestore, serverTimestamp } = require('../utils/firebase');
const { ApiError } = require('../middlewares/errorHandler');
const path = require('path');

const UPLOADS_COLLECTION = 'uploads';

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Always get Firestore at runtime
 */
function getDb() {
    return getFirestore();
}

/**
 * Always get Storage at runtime
 */
function getStorageInstance() {
    return getStorage();
}

/**
 * Validate file
 */
function validateFile(file) {
    if (!file) {
        throw new ApiError(400, 'No file provided');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new ApiError(
            400,
            `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
        );
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new ApiError(
            400,
            `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        );
    }

    return true;
}

/**
 * Generate safe filename
 */
function generateSafeFilename(originalName, prefix = '') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop().toLowerCase();
    const safePrefix = prefix ? `${prefix}_` : '';
    return `${safePrefix}${timestamp}_${random}.${extension}`;
}

/**
 * Upload single file to Firebase Storage
 */
async function uploadFile(file, options = {}) {
    try {
        validateFile(file);

        const db = getDb();
        const storage = getStorageInstance();

        const { folder = 'uploads', prefix = '', metadata = {} } = options;

        const filename = generateSafeFilename(file.originalname, prefix);
        const filepath = `${folder}/${filename}`;

        const bucket = storage.bucket();
        const fileRef = bucket.file(filepath);

        // Upload file
        await fileRef.save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
                metadata: {
                    originalName: file.originalname,
                    uploadedBy: metadata.userId || 'anonymous',
                    uploadedAt: new Date().toISOString(),
                    ...metadata
                }
            }
        });

        // Make file public
        await fileRef.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filepath}`;

        // Save upload record
        const uploadRecord = {
            filename,
            originalName: file.originalname,
            filepath,
            url: publicUrl,
            mimetype: file.mimetype,
            size: file.size,
            folder,
            uploadedBy: metadata.userId || 'anonymous',
            createdAt: serverTimestamp()
        };

        const docRef = await db
            .collection(UPLOADS_COLLECTION)
            .add(uploadRecord);

        return {
            success: true,
            id: docRef.id,
            url: publicUrl,
            filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Upload file error:', error);
        throw new ApiError(500, 'Failed to upload file');
    }
}

/**
 * Upload multiple files
 */
async function uploadMultipleFiles(files, options = {}) {
    try {
        if (!Array.isArray(files) || files.length === 0) {
            throw new ApiError(400, 'No files provided');
        }

        if (files.length > 5) {
            throw new ApiError(400, 'Maximum 5 files allowed per upload');
        }

        const uploadPromises = files.map((file, index) =>
            uploadFile(file, {
                ...options,
                prefix: `${options.prefix || 'file'}_${index + 1}`
            })
        );

        const results = await Promise.all(uploadPromises);

        return {
            success: true,
            uploads: results,
            count: results.length
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Upload multiple files error:', error);
        throw new ApiError(500, 'Failed to upload files');
    }
}

/**
 * Upload app logo
 */
async function uploadAppLogo(file, appId, userId) {
    return uploadFile(file, {
        folder: 'apps/logos',
        prefix: `logo_${appId || 'new'}`,
        metadata: { userId, type: 'app_logo', appId }
    });
}

/**
 * Upload app screenshots
 */
async function uploadAppScreenshots(files, appId, userId) {
    return uploadMultipleFiles(files, {
        folder: 'apps/screenshots',
        prefix: `screenshot_${appId || 'new'}`,
        metadata: { userId, type: 'app_screenshot', appId }
    });
}

/**
 * Upload hero slide image
 */
async function uploadSlideImage(file, slideId, userId) {
    return uploadFile(file, {
        folder: 'slides',
        prefix: `slide_${slideId || 'new'}`,
        metadata: { userId, type: 'slide_image', slideId }
    });
}

/**
 * Delete file from storage
 */
async function deleteFile(fileUrl) {
    try {
        const db = getDb();
        const storage = getStorageInstance();

        const bucket = storage.bucket();
        const urlParts = fileUrl.split('/');
        const filepath = urlParts
            .slice(urlParts.indexOf(bucket.name) + 1)
            .join('/');

        if (!filepath) {
            throw new ApiError(400, 'Invalid file URL');
        }

        const fileRef = bucket.file(filepath);
        const [exists] = await fileRef.exists();

        if (!exists) {
            throw new ApiError(404, 'File not found');
        }

        await fileRef.delete();

        const uploadsSnapshot = await db
            .collection(UPLOADS_COLLECTION)
            .where('url', '==', fileUrl)
            .get();

        const batch = db.batch();
        uploadsSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return { success: true };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Delete file error:', error);
        throw new ApiError(500, 'Failed to delete file');
    }
}

/**
 * Get upload statistics
 */
async function getUploadStats(userId) {
    try {
        const db = getDb();

        const snapshot = await db
            .collection(UPLOADS_COLLECTION)
            .where('uploadedBy', '==', userId)
            .get();

        let totalSize = 0;
        const byType = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            totalSize += data.size || 0;

            const type = data.mimetype || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
        });

        return {
            totalFiles: snapshot.size,
            totalSize,
            byType
        };
    } catch (error) {
        console.error('Get upload stats error:', error);
        return { totalFiles: 0, totalSize: 0, byType: {} };
    }
}

module.exports = {
    uploadFile,
    uploadMultipleFiles,
    uploadAppLogo,
    uploadAppScreenshots,
    uploadSlideImage,
    deleteFile,
    getUploadStats,
    validateFile,
    generateSafeFilename,
    ALLOWED_IMAGE_TYPES,
    MAX_FILE_SIZE
};