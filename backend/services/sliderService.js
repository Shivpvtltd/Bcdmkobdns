/**
 * Slider Service
 * Business logic for hero slider operations
 */

const { getFirestore, serverTimestamp } = require('../utils/firebase');
const { ApiError } = require('../middlewares/errorHandler');

const SLIDES_COLLECTION = 'heroSlides';
const APPS_COLLECTION = 'apps';

/**
 * Always get Firestore at runtime
 */
function getDb() {
    return getFirestore();
}

/**
 * Create a new slide
 */
async function createSlide(slideData) {
    try {
        const db = getDb();

        const maxOrderSnapshot = await db
            .collection(SLIDES_COLLECTION)
            .orderBy('order', 'desc')
            .limit(1)
            .get();

        const nextOrder = maxOrderSnapshot.empty
            ? 0
            : (maxOrderSnapshot.docs[0].data().order || 0) + 1;

        const newSlide = {
            ...slideData,
            order: slideData.order !== undefined ? slideData.order : nextOrder,
            isActive: slideData.isActive !== undefined ? slideData.isActive : true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await db.collection(SLIDES_COLLECTION).add(newSlide);

        return {
            id: docRef.id,
            ...newSlide,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Create slide error:', error);
        throw new ApiError(500, 'Failed to create slide');
    }
}

/**
 * Get slide by ID
 */
async function getSlideById(slideId) {
    try {
        const db = getDb();

        const docRef = db.collection(SLIDES_COLLECTION).doc(slideId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) return null;

        const data = docSnap.data();

        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        };
    } catch (error) {
        console.error('Get slide error:', error);
        throw new ApiError(500, 'Failed to get slide');
    }
}

/**
 * Update slide
 */
async function updateSlide(slideId, updateData) {
    try {
        const db = getDb();

        const docRef = db.collection(SLIDES_COLLECTION).doc(slideId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new ApiError(404, 'Slide not found');
        }

        const updatedData = {
            ...updateData,
            updatedAt: serverTimestamp()
        };

        await docRef.update(updatedData);

        const currentData = docSnap.data();

        return {
            id: slideId,
            ...currentData,
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Update slide error:', error);
        throw new ApiError(500, 'Failed to update slide');
    }
}

/**
 * Delete slide
 */
async function deleteSlide(slideId) {
    try {
        const db = getDb();

        const docRef = db.collection(SLIDES_COLLECTION).doc(slideId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new ApiError(404, 'Slide not found');
        }

        await docRef.delete();
        await reorderSlidesAfterDelete();

        return { success: true };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Delete slide error:', error);
        throw new ApiError(500, 'Failed to delete slide');
    }
}

/**
 * Get active slides
 */
async function getActiveSlides() {
    try {
        const db = getDb();

        const snapshot = await db
            .collection(SLIDES_COLLECTION)
            .where('isActive', '==', true)
            .orderBy('order', 'asc')
            .get();

        const slides = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();

            const slide = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
            };

            if (data.appId) {
                try {
                    const appDoc = await db
                        .collection(APPS_COLLECTION)
                        .doc(data.appId)
                        .get();

                    if (appDoc.exists && appDoc.data().status === 'active') {
                        const appData = appDoc.data();
                        slide.app = {
                            id: appDoc.id,
                            appName: appData.appName,
                            logoURL: appData.logoURL,
                            category: appData.category
                        };
                    }
                } catch (_) {}
            }

            slides.push(slide);
        }

        return slides;
    } catch (error) {
        console.error('Get active slides error:', error);
        throw new ApiError(500, 'Failed to get slides');
    }
}

/**
 * Get all slides (admin)
 */
async function getAllSlides() {
    try {
        const db = getDb();

        const snapshot = await db
            .collection(SLIDES_COLLECTION)
            .orderBy('order', 'asc')
            .get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
            };
        });
    } catch (error) {
        console.error('Get all slides error:', error);
        throw new ApiError(500, 'Failed to get slides');
    }
}

/**
 * Reorder slides
 */
async function reorderSlides(slideIds) {
    try {
        const db = getDb();
        const batch = db.batch();

        slideIds.forEach((slideId, index) => {
            const docRef = db.collection(SLIDES_COLLECTION).doc(slideId);
            batch.update(docRef, {
                order: index,
                updatedAt: serverTimestamp()
            });
        });

        await batch.commit();
        return { success: true, count: slideIds.length };
    } catch (error) {
        console.error('Reorder slides error:', error);
        throw new ApiError(500, 'Failed to reorder slides');
    }
}

/**
 * Reorder slides after delete
 */
async function reorderSlidesAfterDelete() {
    try {
        const db = getDb();

        const snapshot = await db
            .collection(SLIDES_COLLECTION)
            .orderBy('order', 'asc')
            .get();

        const batch = db.batch();
        let order = 0;

        snapshot.forEach(doc => {
            batch.update(doc.ref, {
                order: order++,
                updatedAt: serverTimestamp()
            });
        });

        await batch.commit();
    } catch (error) {
        console.error('Reorder after delete error:', error);
    }
}

/**
 * Toggle slide status
 */
async function toggleSlideStatus(slideId) {
    try {
        const db = getDb();

        const docRef = db.collection(SLIDES_COLLECTION).doc(slideId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new ApiError(404, 'Slide not found');
        }

        const currentStatus = docSnap.data().isActive;

        await docRef.update({
            isActive: !currentStatus,
            updatedAt: serverTimestamp()
        });

        return {
            id: slideId,
            isActive: !currentStatus
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        console.error('Toggle slide status error:', error);
        throw new ApiError(500, 'Failed to toggle slide status');
    }
}

module.exports = {
    createSlide,
    getSlideById,
    updateSlide,
    deleteSlide,
    getActiveSlides,
    getAllSlides,
    reorderSlides,
    toggleSlideStatus
};