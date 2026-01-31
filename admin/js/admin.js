/**
 * UPlayG Admin Dashboard
 * Admin panel JavaScript
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    query, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    orderBy,
    limit,
    where,
    addDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBoFvMjv9vZtXIe1lnodlN27QDr164BsPI",
    authDomain: "uplayg-1.firebaseapp.com",
    projectId: "uplayg-1",
    storageBucket: "uplayg-1.firebasestorage.app",
    messagingSenderId: "271034906725",
    appId: "1:271034906725:web:4c7ff03f28150d6055ee8c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ==================== State ====================
let currentUser = null;
let isAdmin = false;
let allApps = [];
let allUsers = [];
let allSlides = [];
let editingSlideId = null;

// ==================== DOM Elements ====================
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const pageTitle = document.getElementById('pageTitle');
const adminName = document.getElementById('adminName');
const signOutBtn = document.getElementById('signOutBtn');

// ==================== Auth ====================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        adminName.textContent = user.displayName || user.email;
        
        // Check if admin
        const userDoc = await getDocs(query(
            collection(db, 'users'),
            where('uid', '==', user.uid)
        ));
        
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            isAdmin = userData.role === 'admin';
        }
        
        if (!isAdmin) {
            showToast('Access denied. Admin only.', 'error');
            await signOut(auth);
            return;
        }
        
        // Load dashboard data
        loadDashboard();
        loadApps();
        loadSlides();
        loadUsers();
    } else {
        // Redirect to sign in
        window.location.href = '../frontend/index.html';
    }
});

signOutBtn?.addEventListener('click', async () => {
    await signOut(auth);
});

// ==================== Navigation ====================
menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        showSection(section);
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });
});

function showSection(sectionName) {
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionName}Section`)?.classList.add('active');
    
    const titles = {
        dashboard: 'Dashboard',
        apps: 'All Apps',
        slider: 'Hero Slider',
        users: 'Users'
    };
    
    pageTitle.textContent = titles[sectionName] || sectionName;
}

// ==================== Dashboard ====================
async function loadDashboard() {
    try {
        // Get stats
        const appsSnapshot = await getDocs(collection(db, 'apps'));
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        const apps = appsSnapshot.docs.map(d => d.data());
        const activeApps = apps.filter(a => a.status === 'active');
        const pendingApps = apps.filter(a => a.status === 'draft');
        
        document.getElementById('totalApps').textContent = apps.length;
        document.getElementById('activeApps').textContent = activeApps.length;
        document.getElementById('pendingApps').textContent = pendingApps.length;
        document.getElementById('totalUsers').textContent = usersSnapshot.size;
        
        // Recent apps
        const recentApps = apps
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
            .slice(0, 5);
        
        renderRecentApps(recentApps);
    } catch (error) {
        console.error('Dashboard error:', error);
        showToast('Failed to load dashboard', 'error');
    }
}

function renderRecentApps(apps) {
    const tbody = document.getElementById('recentAppsTable');
    
    if (apps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No apps yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = apps.map(app => `
        <tr>
            <td>
                <div class="app-cell">
                    <img src="${app.logoURL || '../frontend/assets/images/icon.png'}" alt="">
                    <div class="app-cell-info">
                        <span class="app-cell-name">${escapeHtml(app.appName)}</span>
                    </div>
                </div>
            </td>
            <td>${app.category || 'Uncategorized'}</td>
            <td><span class="status-badge ${app.status}">${app.status}</span></td>
            <td>${formatDate(app.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="viewApp('${app.slug}')" title="View">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================== Apps ====================
async function loadApps() {
    try {
        const snapshot = await getDocs(query(collection(db, 'apps'), orderBy('createdAt', 'desc')));
        allApps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        renderApps(allApps);
    } catch (error) {
        console.error('Load apps error:', error);
        showToast('Failed to load apps', 'error');
    }
}

function renderApps(apps) {
    const tbody = document.getElementById('appsTable');
    
    if (apps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No apps found</td></tr>';
        return;
    }
    
    tbody.innerHTML = apps.map(app => `
        <tr>
            <td>
                <div class="app-cell">
                    <img src="${app.logoURL || '../frontend/assets/images/icon.png'}" alt="">
                    <div class="app-cell-info">
                        <span class="app-cell-name">${escapeHtml(app.appName)}</span>
                    </div>
                </div>
            </td>
            <td>${app.ownerUid?.substring(0, 8) || 'Unknown'}...</td>
            <td>${app.category || 'Uncategorized'}</td>
            <td>${(app.rating || 0).toFixed(1)} ★</td>
            <td><span class="status-badge ${app.status}">${app.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="toggleAppStatus('${app.id}', '${app.status}')" title="${app.status === 'active' ? 'Disable' : 'Enable'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${app.status === 'active' 
                                ? '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line>'
                                : '<path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>'
                            }
                        </svg>
                    </button>
                    <button class="btn-icon danger" onclick="deleteApp('${app.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Status filter
document.getElementById('statusFilter')?.addEventListener('change', (e) => {
    const status = e.target.value;
    if (status) {
        renderApps(allApps.filter(a => a.status === status));
    } else {
        renderApps(allApps);
    }
});

window.toggleAppStatus = async (appId, currentStatus) => {
    try {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        await updateDoc(doc(db, 'apps', appId), {
            status: newStatus,
            updatedAt: serverTimestamp()
        });
        
        showToast(`App ${newStatus === 'active' ? 'published' : 'unpublished'}`, 'success');
        loadApps();
    } catch (error) {
        console.error('Toggle status error:', error);
        showToast('Failed to update status', 'error');
    }
};

window.deleteApp = async (appId) => {
    if (!confirm('Are you sure you want to delete this app?')) return;
    
    try {
        await deleteDoc(doc(db, 'apps', appId));
        showToast('App deleted', 'success');
        loadApps();
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete app', 'error');
    }
};

window.viewApp = (slug) => {
    window.open(`../frontend/index.html#/app/${slug}`, '_blank');
};

// ==================== Slider ====================
async function loadSlides() {
    try {
        const snapshot = await getDocs(query(collection(db, 'heroSlides'), orderBy('order', 'asc')));
        allSlides = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        renderSlides();
        updateAppSelect();
    } catch (error) {
        console.error('Load slides error:', error);
        showToast('Failed to load slides', 'error');
    }
}

function renderSlides() {
    const container = document.getElementById('slidesList');
    
    if (allSlides.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No slides yet</p>';
        return;
    }
    
    container.innerHTML = allSlides.map((slide, index) => `
        <div class="slide-item" data-slide-id="${slide.id}">
            <img src="${slide.imageUrl}" alt="${slide.title}">
            <div class="slide-item-info">
                <div class="slide-item-title">${escapeHtml(slide.title)}</div>
                <div class="slide-item-subtitle">${escapeHtml(slide.subtitle || '')}</div>
                <span class="status-badge ${slide.isActive ? 'active' : 'disabled'}">
                    ${slide.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="slide-item-actions">
                <button class="btn-icon" onclick="moveSlide('${slide.id}', ${index - 1})" ${index === 0 ? 'disabled' : ''} title="Move up">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
                <button class="btn-icon" onclick="moveSlide('${slide.id}', ${index + 1})" ${index === allSlides.length - 1 ? 'disabled' : ''} title="Move down">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <button class="btn-icon" onclick="editSlide('${slide.id}')" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-icon danger" onclick="deleteSlide('${slide.id}')" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function updateAppSelect() {
    const select = document.getElementById('slideAppId');
    const activeApps = allApps.filter(a => a.status === 'active');
    
    select.innerHTML = '<option value="">None</option>' + 
        activeApps.map(app => `<option value="${app.id}">${escapeHtml(app.appName)}</option>`).join('');
}

// Modal
document.getElementById('addSlideBtn')?.addEventListener('click', () => {
    editingSlideId = null;
    document.getElementById('modalTitle').textContent = 'Add Slide';
    document.getElementById('slideForm').reset();
    document.getElementById('slideModal').classList.add('open');
});

document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('cancelSlideBtn')?.addEventListener('click', closeModal);

function closeModal() {
    document.getElementById('slideModal').classList.remove('open');
    editingSlideId = null;
}

document.getElementById('slideForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const slideData = {
        title: document.getElementById('slideTitle').value,
        subtitle: document.getElementById('slideSubtitle').value,
        imageUrl: document.getElementById('slideImageUrl').value,
        appId: document.getElementById('slideAppId').value,
        buttonText: document.getElementById('slideButtonText').value,
        isActive: document.getElementById('slideActive').checked,
        updatedAt: serverTimestamp()
    };
    
    try {
        if (editingSlideId) {
            await updateDoc(doc(db, 'heroSlides', editingSlideId), slideData);
            showToast('Slide updated', 'success');
        } else {
            slideData.order = allSlides.length;
            slideData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'heroSlides'), slideData);
            showToast('Slide added', 'success');
        }
        
        closeModal();
        loadSlides();
    } catch (error) {
        console.error('Save slide error:', error);
        showToast('Failed to save slide', 'error');
    }
});

window.editSlide = (slideId) => {
    const slide = allSlides.find(s => s.id === slideId);
    if (!slide) return;
    
    editingSlideId = slideId;
    document.getElementById('modalTitle').textContent = 'Edit Slide';
    document.getElementById('slideTitle').value = slide.title;
    document.getElementById('slideSubtitle').value = slide.subtitle || '';
    document.getElementById('slideImageUrl').value = slide.imageUrl;
    document.getElementById('slideAppId').value = slide.appId || '';
    document.getElementById('slideButtonText').value = slide.buttonText || 'View App';
    document.getElementById('slideActive').checked = slide.isActive;
    
    document.getElementById('slideModal').classList.add('open');
};

window.deleteSlide = async (slideId) => {
    if (!confirm('Are you sure?')) return;
    
    try {
        await deleteDoc(doc(db, 'heroSlides', slideId));
        showToast('Slide deleted', 'success');
        loadSlides();
    } catch (error) {
        console.error('Delete slide error:', error);
        showToast('Failed to delete slide', 'error');
    }
};

window.moveSlide = async (slideId, newIndex) => {
    if (newIndex < 0 || newIndex >= allSlides.length) return;
    
    const currentIndex = allSlides.findIndex(s => s.id === slideId);
    if (currentIndex === -1) return;
    
    // Reorder array
    const [movedSlide] = allSlides.splice(currentIndex, 1);
    allSlides.splice(newIndex, 0, movedSlide);
    
    // Update orders in Firestore
    try {
        for (let i = 0; i < allSlides.length; i++) {
            await updateDoc(doc(db, 'heroSlides', allSlides[i].id), {
                order: i,
                updatedAt: serverTimestamp()
            });
        }
        
        renderSlides();
    } catch (error) {
        console.error('Move slide error:', error);
        showToast('Failed to reorder slides', 'error');
    }
};

// ==================== Users ====================
async function loadUsers() {
    try {
        const snapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
        allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        renderUsers();
    } catch (error) {
        console.error('Load users error:', error);
    }
}

function renderUsers() {
    const tbody = document.getElementById('usersTable');
    
    if (allUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = allUsers.map(user => `
        <tr>
            <td>
                <div class="app-cell">
                    <img src="${user.photoURL || '../frontend/assets/images/icon.png'}" alt="">
                    <div class="app-cell-info">
                        <span class="app-cell-name">${escapeHtml(user.name || 'Anonymous')}</span>
                    </div>
                </div>
            </td>
            <td>${user.email || 'N/A'}</td>
            <td><span class="status-badge ${user.role === 'admin' ? 'active' : 'draft'}">${user.role || 'user'}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon ${user.role === 'admin' ? 'danger' : ''}" 
                            onclick="toggleUserRole('${user.id}', '${user.role}')" 
                            title="${user.role === 'admin' ? 'Remove admin' : 'Make admin'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.toggleUserRole = async (userId, currentRole) => {
    try {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        await updateDoc(doc(db, 'users', userId), {
            role: newRole,
            updatedAt: serverTimestamp()
        });
        
        showToast(`User is now ${newRole}`, 'success');
        loadUsers();
    } catch (error) {
        console.error('Toggle role error:', error);
        showToast('Failed to update role', 'error');
    }
};

// ==================== Utilities ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}
