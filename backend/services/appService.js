/**
 * App Service
 * Business logic for app operations
 */

const { getFirestore, serverTimestamp, increment } = require('../utils/firebase');
const { ApiError } = require('../middlewares/errorHandler');

const APPS_COLLECTION = 'apps';

/**
 * Always get Firestore at runtime (IMPORTANT)
 */
function getDb() {
    return getFirestore();
}

/**
 * Generate URL-friendly slug
 */
function generateSlug(name) {
    const timestamp = Date.now().toString(36);
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `${baseSlug}-${timestamp}`;
}

/**
 * Create a new app
 */
async function createApp(appData, userId) {
    try {
        const db = getDb();

        const slug = generateSlug(appData.appName);

        const newApp = {
            ...appData,
            slug,
            ownerUid: userId,
            status: 'draft',
            rating: 0,
            ratingCount: 0,
            ratingSum: 0,
            downloadCount: 0,
            viewCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await db.collection(APPS_COLLECTION).add(newApp);

        return {
            id: docRef.id,
            ...newApp,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Create app error:', error);
        throw new ApiError(500, 'Failed to create app');
    }
}

/**
 * Get app by ID
 */
async function getAppById(appId, includeInactive = false) {
    try {
        const db = getDb();

        const docRef = db.collection(APPS_COLLECTION).doc(appId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) return null;

        const data = docSnap.data();

        if (!includeInactive && data.status !== 'active') {
            return null;
        }

        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        };
    } catch (error) {
        console.error('Get app error:', error);
        throw new ApiError(500, 'Failed to get app');
    }
}

/**
 * Get app by slug
 */
async function getAppBySlug(slug) {
    try {
        const db = getDb();

        const querySnapshot = await db
            .collection(APPS_COLLECTION)
            .where('slug', '==', slug)
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        };
    } catch (error) {
        console.error('Get app by slug error:', error);
        throw new ApiError(500, 'Failed to get app');
    }
}

/**
 * Update app
 */
async function updateApp(appId, updateData, userId, isAdmin = false) {
    try {
        const db = getDb();

        const docRef = db.collection(APPS_COLLECTION).doc(appId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new ApiError(404, 'App not found');
        }

        const currentData = docSnap.data();

        if (currentData.ownerUid !== userId && !isAdmin) {
            throw new ApiError(403, 'You do not have permission to update this app');
        }

        delete updateData.ownerUid;

        if (updateData.status && !isAdmin) {
            delete updateData.status;
        }

        if (updateData.appName && updateData.appName !== currentData.appName) {
            updateData.slug = generateSlug(updateData.appName);
        }

        const updatedData = {
            ...updateData,
            updatedAt: serverTimestamp()
        };

        await docRef.update(updatedData);

        return {
            id: appId,
            ...currentData,
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Update app error:', error);
        throw new ApiError(500, 'Failed to update app');
    }
}

/**
 * Delete app
 */
async function deleteApp(appId, userId, isAdmin = false) {
    try {
        const db = getDb();

        const docRef = db.collection(APPS_COLLECTION).doc(appId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new ApiError(404, 'App not found');
        }

        const data = docSnap.data();

        if (data.ownerUid !== userId && !isAdmin) {
            throw new ApiError(403, 'You do not have permission to delete this app');
        }

        await docRef.delete();
        return { success: true };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Delete app error:', error);
        throw new ApiError(500, 'Failed to delete app');
    }
}

/**
 * Update app status (admin only)
 */
async function updateAppStatus(appId, status, adminId) {
    try {
        const db = getDb();

        const docRef = db.collection(APPS_COLLECTION).doc(appId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new ApiError(404, 'App not found');
        }

        await docRef.update({
            status,
            updatedAt: serverTimestamp(),
            statusUpdatedBy: adminId,
            statusUpdatedAt: serverTimestamp()
        });

        return {
            id: appId,
            status,
            updatedAt: new Date().toISOString()
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Update status error:', error);
        throw new ApiError(500, 'Failed to update app status');
    }
}

/**
 * Get all active apps
 */
async function getActiveApps(options = {}) {
    try {
        const db = getDb();

        const { category, limit = 20, sortBy = 'createdAt', order = 'desc' } = options;

        let query = db
            .collection(APPS_COLLECTION)
            .where('status', '==', 'active');

        if (category) {
            query = query.where('category', '==', category);
        }

        query = query.orderBy(sortBy, order).limit(parseInt(limit));

        const snapshot = await query.get();

        const apps = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            apps.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
            });
        });

        return apps;
    } catch (error) {
        console.error('Get active apps error:', error);
        throw new ApiError(500, 'Failed to get apps');
    }
}

/**
 * Get apps by owner
 */
async function getAppsByOwner(userId) {
    try {
        const db = getDb();

        const snapshot = await db
            .collection(APPS_COLLECTION)
            .where('ownerUid', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const apps = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            apps.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
            });
        });

        return apps;
    } catch (error) {
        console.error('Get owner apps error:', error);
        throw new ApiError(500, 'Failed to get your apps');
    }
}

/**
 * Search apps
 */
async function searchApps(searchQuery, limit = 20) {
    try {
        const db = getDb();

        const snapshot = await db
            .collection(APPS_COLLECTION)
            .where('status', '==', 'active')
            .limit(100)
            .get();

        const apps = [];
        const query = searchQuery.toLowerCase();

        snapshot.forEach(doc => {
            const data = doc.data();
            const matchScore = calculateMatchScore(data, query);

            if (matchScore > 0) {
                apps.push({
                    id: doc.id,
                    ...data,
                    matchScore,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
                });
            }
        });

        apps.sort((a, b) => b.matchScore - a.matchScore);
        return apps.slice(0, limit);
    } catch (error) {
        console.error('Search apps error:', error);
        throw new ApiError(500, 'Failed to search apps');
    }
}

/**
 * Calculate match score
 */
function calculateMatchScore(app, query) {
    let score = 0;

    const name = app.appName?.toLowerCase() || '';
    const description = app.description?.toLowerCase() || '';
    const category = app.category?.toLowerCase() || '';

    if (name === query) score += 100;
    else if (name.startsWith(query)) score += 50;
    else if (name.includes(query)) score += 30;

    if (category === query) score += 20;
    else if (category.includes(query)) score += 10;

    if (description.includes(query)) score += 5;

    return score;
}

/**
 * Increment app view count
 */
async function incrementViewCount(appId) {
    try {
        const db = getDb();

        await db.collection(APPS_COLLECTION).doc(appId).update({
            viewCount: increment(1)
        });
    } catch (error) {
        console.error('Increment view count error:', error);
    }
}

module.exports = {
    createApp,
    getAppById,
    getAppBySlug,
    updateApp,
    deleteApp,
    updateAppStatus,
    getActiveApps,
    getAppsByOwner,
    searchApps,
    incrementViewCount,
    generateSlug
};