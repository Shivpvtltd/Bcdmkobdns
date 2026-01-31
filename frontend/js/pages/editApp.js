/**
 * Edit App Page
 * Edit existing app details
 */

import { appsApi } from '../services/api.js';
import { isAuthenticated, signInWithGoogle, showToast } from '../services/auth.js';
import FileUpload from '../components/fileUpload.js';
import router from '../router.js';

const editAppPage = {
    name: 'editApp',
    currentApp: null,
    
    async render(params) {
        const appId = params.id;
        
        if (!appId) {
            return this.renderNotFound();
        }

        if (!isAuthenticated()) {
            return `
                <header class="page-header">
                    <div class="page-header-content">
                        <h1 class="page-title">Edit App</h1>
                        <p class="page-subtitle">Update your app details</p>
                    </div>
                </header>
                <main class="page-content">
                    <div class="empty-state">
                        <div class="empty-icon">🔐</div>
                        <h3>Authentication Required</h3>
                        <p>You need to be signed in to edit an app.</p>
                        <button id="signInToEditAppBtn" class="btn btn-primary" style="margin-top: 16px;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Sign In with Google
                        </button>
                    </div>
                </main>
            `;
        }
        
        return `
            <header class="page-header">
                <div class="page-header-content">
                    <h1 class="page-title">Edit App</h1>
                    <p class="page-subtitle">Update your app details</p>
                </div>
            </header>
            
            <main class="page-content">
                <div id="loadingState">
                    <div class="form-group">
                        <div class="skeleton-text" style="width: 100px; height: 14px; margin-bottom: 8px;"></div>
                        <div class="skeleton-text" style="height: 48px;"></div>
                    </div>
                    <div class="form-group">
                        <div class="skeleton-text" style="width: 100px; height: 14px; margin-bottom: 8px;"></div>
                        <div class="skeleton-text" style="height: 120px;"></div>
                    </div>
                    <div class="form-group">
                        <div class="skeleton-text" style="width: 100px; height: 14px; margin-bottom: 8px;"></div>
                        <div class="skeleton-text" style="height: 48px;"></div>
                    </div>
                </div>
                
                <form id="editForm" style="display: none;">
                    <div class="form-group">
                        <label class="form-label form-label-required" for="appName">App Name</label>
                        <input type="text" id="appName" name="appName" class="form-input" 
                               placeholder="Enter your app name" required maxlength="100">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label form-label-required" for="category">Category</label>
                        <select id="category" name="category" class="form-select" required>
                            <option value="">Select a category</option>
                            <option value="Games">Games</option>
                            <option value="Productivity">Productivity</option>
                            <option value="Social">Social</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Education">Education</option>
                            <option value="Finance">Finance</option>
                            <option value="Health & Fitness">Health & Fitness</option>
                            <option value="Lifestyle">Lifestyle</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Tools">Tools</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label form-label-required" for="description">Description</label>
                        <textarea id="description" name="description" class="form-textarea" 
                                  placeholder="Describe your app..." required minlength="50" maxlength="1000"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label form-label-required" for="downloadURL">Download URL</label>
                        <input type="url" id="downloadURL" name="downloadURL" class="form-input" 
                               placeholder="https://play.google.com/store/apps/..." required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">App Logo</label>
                        <div id="currentLogo"></div>
                        <div id="logoUpload"></div>
                    </div>
                    
                    <div class="form-group" style="display: flex; gap: 12px; margin-top: 32px;">
                        <a href="/my-apps" class="btn btn-secondary" data-route="/my-apps">Cancel</a>
                        <button type="submit" class="btn btn-primary" id="saveBtn">
                            Save Changes
                        </button>
                    </div>
                </form>
            </main>
            
            <footer class="footer">
                <div class="footer-content">
                    <div class="footer-brand">
                        <a href="/" class="logo" data-route="/">
                            <img src="assets/images/icon.png" alt="UPlayG" class="logo-img">
                            <span class="logo-text">UPlayG</span>
                        </a>
                        <p class="footer-tagline">Discover and share amazing apps</p>
                    </div>
                    <div class="footer-links">
                        <a href="/" data-route="/">Home</a>
                        <a href="/browse" data-route="/browse">Browse</a>
                        <a href="/add-app" data-route="/add-app">Add App</a>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${new Date().getFullYear()} UPlayG. All rights reserved.</p>
                </div>
            </footer>
        `;
    },
    
    async mount(params) {
        if (!isAuthenticated()) {
            document.getElementById('signInToEditAppBtn')?.addEventListener('click', async () => {
                const result = await signInWithGoogle();
                if (result.success) {
                    router.handleRoute(window.location.pathname);
                }
            });
            return;
        }
        
        const appId = params.id;
        
        try {
            const response = await appsApi.getApp(appId);
            this.currentApp = response.data;
            
            if (!this.currentApp) {
                this.showNotFound();
                return;
            }
            
            this.renderForm();
            this.attachEvents();
        } catch (error) {
            console.error('Failed to load app:', error);
            this.showNotFound();
        }
    },
    
    renderForm() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('editForm').style.display = 'block';
        
        const app = this.currentApp;
        
        document.getElementById('appName').value = app.appName;
        document.getElementById('category').value = app.category;
        document.getElementById('description').value = app.description;
        document.getElementById('downloadURL').value = app.downloadURL;
        
        if (app.logoURL) {
            document.getElementById('currentLogo').innerHTML = `
                <div class="image-preview" style="margin-bottom: 12px;">
                    <img src="${app.logoURL}" alt="Current logo">
                </div>
                <p class="form-hint">Upload a new logo to replace the current one</p>
            `;
        }
        
        this.logoUpload = new FileUpload('logoUpload', {
            multiple: false,
            folder: 'apps/logos',
            prefix: 'logo'
        });
    },
    
    attachEvents() {
        document.getElementById('editForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    },
    
    async handleSubmit() {
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></span> Saving...';
        
        try {
            const updateData = {
                appName: document.getElementById('appName').value.trim(),
                category: document.getElementById('category').value,
                description: document.getElementById('description').value.trim(),
                downloadURL: document.getElementById('downloadURL').value.trim()
            };
            
            const logoFiles = this.logoUpload.getFiles();
            if (logoFiles.length > 0) {
                showToast('Uploading new logo...', 'info');
                const logoResult = await this.logoUpload.upload();
                updateData.logoURL = logoResult.data?.url;
            }
            
            await appsApi.updateApp(this.currentApp.id, updateData);
            
            showToast('App updated successfully!', 'success');
            
            setTimeout(() => {
                router.navigate('/my-apps');
            }, 1500);
        } catch (error) {
            console.error('Update error:', error);
            showToast(error.message || 'Failed to update app', 'error');
            
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
        }
    },
    
    showNotFound() {
        const contentArea = document.querySelector('.page-content');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">😕</div>
                    <h3>App not found</h3>
                    <p>The app you're looking for doesn't exist or you don't have permission to edit it.</p>
                    <a href="/my-apps" class="btn btn-primary" style="margin-top: 16px;" data-route="/my-apps">Back to My Apps</a>
                </div>
            `;
        }
    },
    
    renderNotFound() {
        return `
            <div class="empty-state" style="padding-top: 100px;">
                <div class="empty-icon">😕</div>
                <h3>App not found</h3>
                <p>The app you're looking for doesn't exist.</p>
                <a href="/my-apps" class="btn btn-primary" style="margin-top: 16px;" data-route="/my-apps">Back to My Apps</a>
            </div>
        `;
    }
};

export default editAppPage;