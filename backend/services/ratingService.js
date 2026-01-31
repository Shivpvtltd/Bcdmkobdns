/**
 * Rating Service
 * Business logic for rating operations
 */

const { getFirestore, serverTimestamp, increment } = require('../utils/firebase');
const { ApiError } = require('../middlewares/errorHandler');

const RATINGS_COLLECTION = 'ratings';
const APPS_COLLECTION = 'apps';

/**
 * Always get Firestore at runtime
 */
function getDb() {
    return getFirestore();
}

/**
 * Create or update a rating
 */
async function createOrUpdateRating(appId, userId, rating, review = '') {
    try {
        const db = getDb();

        const existingRatingQuery = await db
            .collection(RATINGS_COLLECTION)
            .where('appId', '==', appId)
            .where('userId', '==', userId)
            .limit(1)
            .get();

        const isUpdate = !existingRatingQuery.empty;

        if (isUpdate) {
            const existingDoc = existingRatingQuery.docs[0];
            const existingData = existingDoc.data();
            const oldRating = existingData.rating;

            await existingDoc.ref.update({
                rating,
                review: review || existingData.review,
                updatedAt: serverTimestamp()
            });

            const appRef = db.collection(APPS_COLLECTION).doc(appId);

            await appRef.update({
                ratingSum: increment(rating - oldRating),
                updatedAt: serverTimestamp()
            });

            const appDoc = await appRef.get();
            const appData = appDoc.data();
            const newAverage = appData.ratingSum / appData.ratingCount;

            await appRef.update({
                rating: Math.round(newAverage * 10) / 10
            });

            return {
                id: existingDoc.id,
                appId,
                userId,
                rating,
                review: review || existingData.review,
                updatedAt: new Date().toISOString(),
                isUpdate: true
            };
        } else {
            const ratingData = {
                appId,
                userId,
                rating,
                review: review || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await db
                .collection(RATINGS_COLLECTION)
                .add(ratingData);

            const appRef = db.collection(APPS_COLLECTION).doc(appId);
            const appDoc = await appRef.get();

            if (!appDoc.exists) {
                throw new ApiError(404, 'App not found');
            }

            const appData = appDoc.data();
            const newCount = (appData.ratingCount || 0) + 1;
            const newSum = (appData.ratingSum || 0) + rating;
            const newAverage = newSum / newCount;

            await appRef.update({
                rating: Math.round(newAverage * 10) / 10,
                ratingCount: newCount,
                ratingSum: newSum,
                updatedAt: serverTimestamp()
            });

            return {
                id: docRef.id,
                ...ratingData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isUpdate: false
            };
        }
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Create/update rating error:', error);
        throw new ApiError(500, 'Failed to submit rating');
    }
}

/**
 * Get user's rating for an app
 */
async function getUserRating(appId, userId) {
    try {
        const db = getDb();

        const querySnapshot = await db
            .collection(RATINGS_COLLECTION)
            .where('appId', '==', appId)
            .where('userId', '==', userId)
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
        console.error('Get user rating error:', error);
        return null;
    }
}

/**
 * Get all ratings for an app
 */
async function getAppRatings(appId, options = {}) {
    try {
        const db = getDb();
        const { limit = 50, includeUserInfo = false } = options;

        let query = db
            .collection(RATINGS_COLLECTION)
            .where('appId', '==', appId)
            .orderBy('createdAt', 'desc');

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const snapshot = await query.get();
        const ratings = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();

            const rating = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
            };

            if (includeUserInfo) {
                try {
                    const userDoc = await db
                        .collection('users')
                        .doc(data.userId)
                        .get();

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        rating.user = {
                            name: userData.name || 'Anonymous',
                            photoURL: userData.photoURL || null
                        };
                    }
                } catch (_) {}
            }

            ratings.push(rating);
        }

        return ratings;
    } catch (error) {
        console.error('Get app ratings error:', error);
        throw new ApiError(500, 'Failed to get ratings');
    }
}

/**
 * Get rating summary for an app
 */
async function getRatingSummary(appId) {
    try {
        const db = getDb();

        const snapshot = await db
            .collection(RATINGS_COLLECTION)
            .where('appId', '==', appId)
            .get();

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let total = 0;
        let sum = 0;

        snapshot.forEach(doc => {
            const rating = doc.data().rating;
            if (rating >= 1 && rating <= 5) {
                distribution[rating]++;
                total++;
                sum += rating;
            }
        });

        return {
            average: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
            total,
            distribution
        };
    } catch (error) {
        console.error('Get rating summary error:', error);
        return {
            average: 0,
            total: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }
}

/**
 * Delete a rating
 */
async function deleteRating(appId, userId) {
    try {
        const db = getDb();

        const querySnapshot = await db
            .collection(RATINGS_COLLECTION)
            .where('appId', '==', appId)
            .where('userId', '==', userId)
            .limit(1)
            .get();

        if (querySnapshot.empty) {
            throw new ApiError(404, 'Rating not found');
        }

        const doc = querySnapshot.docs[0];
        const ratingValue = doc.data().rating;

        await doc.ref.delete();

        const appRef = db.collection(APPS_COLLECTION).doc(appId);
        const appDoc = await appRef.get();

        if (appDoc.exists) {
            const appData = appDoc.data();
            const newCount = Math.max(0, (appData.ratingCount || 1) - 1);
            const newSum = Math.max(0, (appData.ratingSum || ratingValue) - ratingValue);
            const newAverage = newCount > 0 ? newSum / newCount : 0;

            await appRef.update({
                rating: Math.round(newAverage * 10) / 10,
                ratingCount: newCount,
                ratingSum: newSum,
                updatedAt: serverTimestamp()
            });
        }

        return { success: true };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Delete rating error:', error);
        throw new ApiError(500, 'Failed to delete rating');
    }
}

/**
 * Check if user has rated an app
 */
async function hasUserRated(appId, userId) {
    try {
        const db = getDb();

        const querySnapshot = await db
            .collection(RATINGS_COLLECTION)
            .where('appId', '==', appId)
            .where('userId', '==', userId)
            .limit(1)
            .get();

        return !querySnapshot.empty;
    } catch (error) {
        console.error('Check user rated error:', error);
        return false;
    }
}

module.exports = {
    createOrUpdateRating,
    getUserRating,
    getAppRatings,
    getRatingSummary,
    deleteRating,
    hasUserRated
};