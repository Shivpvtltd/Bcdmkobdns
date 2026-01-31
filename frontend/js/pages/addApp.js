/**
 * Add App Page
 * Form for submitting new apps with file uploads
 */

import { appsApi } from '../services/api.js';
import { isAuthenticated, signInWithGoogle, showToast } from '../services/auth.js';
import FileUpload from '../components/fileUpload.js';
import router from '../router.js';

const addAppPage = {
    name: 'addApp',
    isUserAuthenticated: false,
    
    async render(params) {
        this.isUserAuthenticated = isAuthenticated();
        
        if (!this.isUserAuthenticated) {
            return `
                <header class="page-header">
                    <div class="page-header-content">
                        <h1 class="page-title">Add Your App</h1>
                        <p class="page-subtitle">Share your app with the UPlayG community</p>
                    </div>
                </header>
                <main class="page-content">
                    <div class="empty-state">
                        <div class="empty-icon">🔐</div>
                        <h3>Authentication Required</h3>
                        <p>You need to be signed in to add an app.</p>
                        <button id="signInToAddAppBtn" class="btn btn-primary" style="margin-top: 16px;">
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
                    <h1 class="page-title">Add Your App</h1>
                    <p class="page-subtitle">Share your app with the UPlayG community</p>
                </div>
            </header>
            
            <main class="page-content">
                <div id="alertContainer"></div>
                
                <form id="appForm">
                    <div class="form-group">
                        <label class="form-label form-label-required" for="appName">App Name</label>
                        <input type="text" id="appName" name="appName" class="form-input" 
                               placeholder="Enter your app name" required maxlength="100">
                        <p class="form-hint">2-100 characters</p>
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
                        <p class="form-hint">Minimum 50 characters, maximum 1000 characters</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label form-label-required" for="downloadURL">Download URL</label>
                        <input type="url" id="downloadURL" name="downloadURL" class="form-input" 
                               placeholder="https://play.google.com/store/apps/..." required>
                        <p class="form-hint">Link to download or purchase your app</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label form-label-required">App Logo</label>
                        <div id="logoUpload"></div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Screenshots</label>
                        <div id="screenshotsUpload"></div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Features</label>
                        <div class="features-list" id="featuresList">
                            <div class="feature-item">
                                <input type="text" class="form-input feature-input" 
                                       placeholder="Enter a feature (e.g., Fast withdrawals)" maxlength="100">
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary" id="addFeatureBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Feature
                        </button>
                    </div>
                    
                    <div class="form-group" style="display: flex; gap: 12px; margin-top: 32px;">
                        <a href="/" class="btn btn-secondary" data-route="/">Cancel</a>
                        <button type="submit" class="btn btn-primary" id="submitBtn">
                            Submit App
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
    
    async mount() {
        if (!this.isUserAuthenticated) {
            document.getElementById('signInToAddAppBtn')?.addEventListener('click', async () => {
                const result = await signInWithGoogle();
                if (result.success) {
                    this.isUserAuthenticated = true;
                    await this.reRenderPage();
                }
            });
            return;
        }
        
        await this.initForm();
    },
    
    async initForm() {
        this.logoUpload = new FileUpload('logoUpload', {
            multiple: false,
            folder: 'apps/logos',
            prefix: 'logo'
        });
        
        this.screenshotsUpload = new FileUpload('screenshotsUpload', {
            multiple: true,
            maxFiles: 5,
            folder: 'apps/screenshots',
            prefix: 'screenshot'
        });
        
        this.attachEvents();
    },
    
    attachEvents() {
        document.getElementById('addFeatureBtn')?.addEventListener('click', () => {
            const featuresList = document.getElementById('featuresList');
            const featureCount = featuresList.querySelectorAll('.feature-item').length;
            
            if (featureCount >= 10) {
                showToast('Maximum 10 features allowed', 'warning');
                return;
            }
            
            const featureItem = document.createElement('div');
            featureItem.className = 'feature-item';
            featureItem.innerHTML = `
                <input type="text" class="form-input feature-input" 
                       placeholder="Enter a feature" maxlength="100">
                <button type="button" class="btn-remove" title="Remove feature">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            
            featuresList.appendChild(featureItem);
            
            featureItem.querySelector('input').focus();
            
            featureItem.querySelector('.btn-remove').addEventListener('click', () => {
                featureItem.remove();
            });
        });
        
        document.getElementById('appForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    },
    
    async handleSubmit() {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></span> Submitting...';
        
        try {
            const logoFiles = this.logoUpload.getFiles();
            if (logoFiles.length === 0) {
                throw new Error('Please upload an app logo');
            }
            
            showToast('Uploading logo...', 'info');
            const logoResult = await this.logoUpload.upload();
            const logoURL = logoResult.data?.url;
            
            let screenshots = [];
            const screenshotFiles = this.screenshotsUpload.getFiles();
            if (screenshotFiles.length > 0) {
                showToast('Uploading screenshots...', 'info');
                const screenshotsResult = await this.screenshotsUpload.upload();
                screenshots = screenshotsResult.data?.uploads?.map(u => u.url) || [];
            }
            
            const features = [];
            document.querySelectorAll('.feature-input').forEach(input => {
                const value = input.value.trim();
                if (value) features.push(value);
            });
            
            const appData = {
                appName: document.getElementById('appName').value.trim(),
                category: document.getElementById('category').value,
                description: document.getElementById('description').value.trim(),
                downloadURL: document.getElementById('downloadURL').value.trim(),
                logoURL,
                screenshots,
                features
            };
            
            showToast('Creating app...', 'info');
            await appsApi.createApp(appData);
            
            showToast('App submitted successfully!', 'success');
            
            setTimeout(() => {
                router.navigate('/my-apps');
            }, 1500);
        } catch (error) {
            console.error('Submit error:', error);
            showToast(error.message || 'Failed to submit app', 'error');
            
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit App';
        }
    },
    
    async reRenderPage() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        const newContent = await this.render(router.getParams());
        mainContent.innerHTML = newContent;
        
        await this.mount();
    }
};

export default addAppPage;