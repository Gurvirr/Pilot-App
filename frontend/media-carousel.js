class MediaCarousel {
    constructor() {
        this.container = document.querySelector('.bottom-left');
        this.currentIndex = 0;
        this.mediaItems = [];
        this.autoRotateInterval = null;
        this.autoRefreshInterval = null;
        this.rotationSpeed = 4000; // 4 seconds per slide
        this.refreshSpeed = 10000; // Check for new files every 10 seconds
        
        this.init();
    }

    async init() {
        // Clear the container
        this.container.innerHTML = '';
        
        console.log('🎬 Initializing auto-rotating media carousel...');
        
        // Create carousel structure
        this.createCarouselElements();
        
        // Load media items
        await this.loadMediaItems();
        
        // Render initial view
        this.renderCarousel();
        
        // Start auto-rotation
        this.startAutoRotation();
        
        // Start auto-refresh for new files
        this.startAutoRefresh();
        
        console.log('✅ Auto-rotating media carousel initialized');
    }

    createCarouselElements() {
        // Create main carousel container
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'media-carousel-container';
        carouselContainer.style.cssText = `
            width: 100%;
            height: 100%;
            padding: 35px 15px 15px 15px;
            display: flex;
            flex-direction: column;
            background: rgba(10, 10, 10, 0.3);
            overflow: hidden;
            box-sizing: border-box;
            pointer-events: none; /* Disable all interactions */
        `;

        // Create header
        const header = document.createElement('div');
        header.className = 'carousel-header';
        header.style.cssText = `
            color: #00aaff;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 12px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        `;

        const title = document.createElement('span');
        title.textContent = 'Media Slideshow';
        title.style.fontWeight = 'bold';

        const counter = document.createElement('span');
        counter.id = 'media-counter';
        counter.style.opacity = '0.7';

        header.appendChild(title);
        header.appendChild(counter);

        // Create main display area for current media
        const displayArea = document.createElement('div');
        displayArea.id = 'main-display';
        displayArea.style.cssText = `
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            border-radius: 8px;
            background: rgba(0, 170, 255, 0.05);
            border: 1px solid rgba(0, 170, 255, 0.2);
            margin-bottom: 15px;
        `;

        // Create progress bar
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            height: 4px;
            background: rgba(0, 170, 255, 0.2);
            border-radius: 2px;
            overflow: hidden;
            flex-shrink: 0;
        `;

        const progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #00aaff, #0080ff);
            width: 0%;
            transition: width 0.1s ease;
            border-radius: 2px;
        `;

        progressContainer.appendChild(progressBar);

        // Assemble carousel
        carouselContainer.appendChild(header);
        carouselContainer.appendChild(displayArea);
        carouselContainer.appendChild(progressContainer);
        
        this.container.appendChild(carouselContainer);
    }

    async loadMediaItems() {
        try {
            // Use Electron's IPC to get media files
            const { ipcRenderer } = require('electron');
            
            // Request media files from main process
            const mediaFiles = await ipcRenderer.invoke('get-media-files');
            
            const newMediaItems = mediaFiles.map(file => ({
                name: file.name,
                path: file.path,
                type: file.type, // 'image' or 'video'
                thumbnail: file.thumbnail || file.path // Use thumbnail if available
            }));
            
            // Check if we have new items
            const hasNewItems = newMediaItems.length !== this.mediaItems.length || 
                newMediaItems.some((item, index) => 
                    !this.mediaItems[index] || this.mediaItems[index].path !== item.path
                );
            
            if (hasNewItems) {
                console.log(`📁 Found ${newMediaItems.length} media files (${newMediaItems.length - this.mediaItems.length} new)`);
                this.mediaItems = newMediaItems;
                
                // Reset to first item if we have new items and current index is out of bounds
                if (this.currentIndex >= this.mediaItems.length) {
                    this.currentIndex = 0;
                }
                
                return true; // Indicate that items were updated
            }
            
            return false; // No new items
            
        } catch (error) {
            console.log('Could not load media files:', error);
            // Fallback with mock data for testing
            if (this.mediaItems.length === 0) {
                this.mediaItems = [
                    { name: 'Sample 1', path: '/mock/path1.jpg', type: 'image' },
                    { name: 'Sample 2', path: '/mock/path2.mp4', type: 'video' },
                    { name: 'Sample 3', path: '/mock/path3.png', type: 'image' }
                ];
                return true;
            }
            return false;
        }
    }

    renderCarousel() {
        const displayArea = document.getElementById('main-display');
        const counter = document.getElementById('media-counter');
        
        if (!displayArea || this.mediaItems.length === 0) return;
        
        // Update counter
        counter.textContent = `${this.currentIndex + 1} / ${this.mediaItems.length}`;
        
        // Clear display area
        displayArea.innerHTML = '';
        
        const currentItem = this.mediaItems[this.currentIndex];
        
        // Create item display
        const itemContainer = document.createElement('div');
        itemContainer.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            animation: slideIn 0.5s ease-in-out;
        `;

        // Add slide animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
            }
        `;
        if (!document.querySelector('#carousel-styles')) {
            style.id = 'carousel-styles';
            document.head.appendChild(style);
        }

        // Add type indicator
        const typeIndicator = document.createElement('div');
        typeIndicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            z-index: 3;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        `;
        typeIndicator.textContent = currentItem.type === 'video' ? '🎥 VIDEO' : '🖼️ IMAGE';

        // Add filename
        const filename = document.createElement('div');
        filename.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            right: 10px;
            background: linear-gradient(transparent, rgba(0, 170, 255, 0.9));
            color: white;
            padding: 15px 12px 8px 12px;
            font-size: 11px;
            text-align: center;
            z-index: 3;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-weight: bold;
            border-radius: 0 0 6px 6px;
        `;
        filename.textContent = currentItem.name;

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Try to load actual image/video preview
        if (currentItem.type === 'image') {
            const img = document.createElement('img');
            img.src = `file://${currentItem.path}`;
            img.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
                opacity: 0.95; /* Much less transparent - was default 1.0, now 0.95 */
            `;
            
            img.onload = () => {
                console.log(`✅ Loaded image: ${currentItem.name}`);
            };
            
            img.onerror = () => {
                console.log(`❌ Failed to load image: ${currentItem.name}`);
                // Fallback to icon if image fails to load
                contentContainer.innerHTML = '';
                contentContainer.innerHTML = `
                    <div style="font-size: 48px; color: #00aaff; text-align: center; opacity: 0.95;">
                        🖼️<br>
                        <span style="font-size: 14px;">Image Preview</span>
                    </div>
                `;
            };
            
            contentContainer.appendChild(img);
        } else {
            // For videos, show actual video preview
            const video = document.createElement('video');
            video.src = `file://${currentItem.path}`;
            video.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
                opacity: 0.95;
                border-radius: 4px;
            `;
            
            // Video properties
            video.muted = true; // Mute to avoid audio
            video.loop = false;
            video.preload = 'metadata';
            
            // Store reference for timer-based preview
            video.setAttribute('data-duration', '0');
            
            video.onloadedmetadata = () => {
                console.log(`✅ Loaded video metadata: ${currentItem.name}`);
                video.setAttribute('data-duration', video.duration);
                
                // Start the video preview progression
                this.startVideoPreview(video);
            };
            
            video.onerror = () => {
                console.log(`❌ Failed to load video: ${currentItem.name}`);
                // Fallback to icon if video fails to load
                contentContainer.innerHTML = '';
                contentContainer.innerHTML = `
                    <div style="font-size: 48px; color: #00aaff; text-align: center; opacity: 0.95;">
                        🎥<br>
                        <span style="font-size: 14px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;">Video Preview</span>
                    </div>
                `;
            };
            
            contentContainer.appendChild(video);
        }

        // Assemble item
        itemContainer.appendChild(contentContainer);
        itemContainer.appendChild(typeIndicator);
        itemContainer.appendChild(filename);

        displayArea.appendChild(itemContainer);
    }

    startAutoRotation() {
        if (this.mediaItems.length <= 1) {
            console.log('⚠️ Not enough media items for rotation');
            return;
        }

        console.log(`🔄 Starting auto-rotation (${this.rotationSpeed}ms intervals)`);
        
        // Clear any existing interval
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
        }

        // Start progress bar animation
        this.animateProgressBar();

        // Set up rotation interval
        this.autoRotateInterval = setInterval(() => {
            this.nextSlide();
        }, this.rotationSpeed);
    }

    startVideoPreview(videoElement) {
        const duration = parseFloat(videoElement.getAttribute('data-duration'));
        if (duration <= 0) return;
        
        // Calculate how much of the video to show during the slide duration
        const previewDuration = Math.min(duration, this.rotationSpeed / 1000); // Max preview duration in seconds
        const segments = 8; // Number of segments to show from the video
        const segmentDuration = previewDuration / segments;
        
        let currentSegment = 0;
        
        // Start with the first segment
        videoElement.currentTime = 0;
        
        // Create interval to progress through video segments
        const videoProgressInterval = setInterval(() => {
            if (currentSegment >= segments) {
                clearInterval(videoProgressInterval);
                return;
            }
            
            // Calculate time position in the video (spread across the video duration)
            const timePosition = (currentSegment / segments) * duration;
            videoElement.currentTime = timePosition;
            
            currentSegment++;
        }, this.rotationSpeed / segments); // Progress through segments during the slide duration
        
        // Store interval reference for cleanup
        videoElement.setAttribute('data-progress-interval', videoProgressInterval);
        
        console.log(`🎬 Started video preview for ${duration}s video with ${segments} segments`);
    }

    // Clean up video intervals when switching slides
    cleanupVideoPreview() {
        const displayArea = document.getElementById('main-display');
        if (displayArea) {
            const video = displayArea.querySelector('video');
            if (video) {
                const intervalId = video.getAttribute('data-progress-interval');
                if (intervalId) {
                    clearInterval(parseInt(intervalId));
                }
            }
        }
    }

    nextSlide() {
        // Clean up current video preview
        this.cleanupVideoPreview();
        
        this.currentIndex = (this.currentIndex + 1) % this.mediaItems.length;
        this.renderCarousel();
        this.animateProgressBar();
    }

    animateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;

        // Reset progress bar
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';

        // Start animation after a brief delay
        setTimeout(() => {
            progressBar.style.transition = `width ${this.rotationSpeed}ms linear`;
            progressBar.style.width = '100%';
        }, 50);
    }

    startAutoRefresh() {
        console.log(`🔄 Starting auto-refresh (checking every ${this.refreshSpeed}ms)`);
        
        // Clear any existing refresh interval
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        // Set up refresh interval
        this.autoRefreshInterval = setInterval(async () => {
            const hasNewItems = await this.loadMediaItems();
            if (hasNewItems) {
                console.log('🆕 New media files detected, updating carousel...');
                this.renderCarousel(); // Re-render with new items
            }
        }, this.refreshSpeed);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('⏹️ Auto-refresh stopped');
        }
    }

    stopAutoRotation() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
            console.log('⏹️ Auto-rotation stopped');
        }
        
        // Clean up any video previews
        this.cleanupVideoPreview();
    }

    // Cleanup method
    destroy() {
        this.stopAutoRotation();
        this.stopAutoRefresh();
        this.cleanupVideoPreview(); // Ensure video previews are cleaned up
        console.log('🗑️ Media carousel destroyed');
    }

    // Remove all the old click-based methods
    setupEventListeners() {
        // No event listeners needed for auto-rotating carousel
        console.log('📺 Auto-rotating carousel - no user interactions enabled');
    }

    async openMedia(item) {
        // Removed - no click functionality
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.mediaCarousel = new MediaCarousel();
}); 