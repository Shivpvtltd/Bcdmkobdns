/**
 * File Upload Component
 * Drag-and-drop file upload with preview
 */

import { uploadApi } from '../services/api.js';
import { showToast } from '../services/auth.js';

class FileUpload {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            multiple: false,
            maxFiles: 5,
            maxSize: 5 * 1024 * 1024, // 5MB
            accept: 'image/*',
            folder: 'uploads',
            prefix: '',
            onUpload: () => {},
            onError: () => {},
            ...options
        };
        
        this.files = [];
        this.previews = [];
        
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        this.render();
        this.attachEvents();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="file-upload" id="${this.container.id}_dropzone">
                <div class="file-upload-icon">📁</div>
                <p class="file-upload-text">
                    ${this.options.multiple ? 'Drag & drop files here or click to browse' : 'Drag & drop a file here or click to browse'}
                </p>
                <p class="file-upload-hint">
                    ${this.options.multiple ? `Up to ${this.options.maxFiles} files` : 'Single file'} • Max ${this.formatFileSize(this.options.maxSize)} • Images only
                </p>
                <input type="file" class="file-upload-input" 
                       ${this.options.multiple ? 'multiple' : ''} 
                       accept="${this.options.accept}" 
                       id="${this.container.id}_input">
            </div>
            <div class="file-previews" id="${this.container.id}_previews"></div>
        `;
        
        this.dropzone = this.container.querySelector(`#${this.container.id}_dropzone`);
        this.input = this.container.querySelector(`#${this.container.id}_input`);
        this.previewsContainer = this.container.querySelector(`#${this.container.id}_previews`);
    }
    
    attachEvents() {
        // Click to browse
        this.dropzone.addEventListener('click', () => this.input.click());
        
        // File selection
        this.input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Drag and drop
        this.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropzone.classList.add('dragover');
        });
        
        this.dropzone.addEventListener('dragleave', () => {
            this.dropzone.classList.remove('dragover');
        });
        
        this.dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropzone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
    }
    
    handleFiles(fileList) {
        const files = Array.from(fileList);
        
        // Validate file count
        if (this.options.multiple && files.length > this.options.maxFiles) {
            showToast(`Maximum ${this.options.maxFiles} files allowed`, 'error');
            return;
        }
        
        if (!this.options.multiple && files.length > 1) {
            showToast('Only one file allowed', 'error');
            return;
        }
        
        // Validate each file
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                showToast(`${file.name} is not an image`, 'error');
                continue;
            }
            
            if (file.size > this.options.maxSize) {
                showToast(`${file.name} exceeds maximum size`, 'error');
                continue;
            }
            
            this.files.push(file);
            this.createPreview(file);
        }
        
        // Clear input
        this.input.value = '';
    }
    
    createPreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const previewHtml = `
                <div class="image-preview" id="${previewId}">
                    <img src="${e.target.result}" alt="${file.name}">
                    <button type="button" class="image-preview-remove" data-preview="${previewId}">×</button>
                </div>
            `;
            
            this.previewsContainer.insertAdjacentHTML('beforeend', previewHtml);
            
            const previewEl = this.previewsContainer.querySelector(`#${previewId}`);
            const removeBtn = previewEl.querySelector('.image-preview-remove');
            
            removeBtn.addEventListener('click', () => {
                this.removeFile(file, previewId);
            });
            
            this.previews.push({ file, previewId, element: previewEl });
        };
        
        reader.readAsDataURL(file);
    }
    
    removeFile(file, previewId) {
        this.files = this.files.filter(f => f !== file);
        this.previews = this.previews.filter(p => p.previewId !== previewId);
        
        const previewEl = this.previewsContainer.querySelector(`#${previewId}`);
        if (previewEl) previewEl.remove();
    }
    
    async upload() {
        if (this.files.length === 0) {
            showToast('No files selected', 'error');
            return null;
        }
        
        try {
            let result;
            
            if (this.options.multiple) {
                result = await uploadApi.uploadMultiple(
                    this.files, 
                    this.options.folder, 
                    this.options.prefix
                );
            } else {
                result = await uploadApi.uploadSingle(
                    this.files[0], 
                    this.options.folder, 
                    this.options.prefix
                );
            }
            
            this.options.onUpload(result);
            return result;
        } catch (error) {
            showToast(error.message || 'Upload failed', 'error');
            this.options.onError(error);
            throw error;
        }
    }
    
    getFiles() {
        return this.files;
    }
    
    clear() {
        this.files = [];
        this.previews = [];
        this.previewsContainer.innerHTML = '';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export default FileUpload;
