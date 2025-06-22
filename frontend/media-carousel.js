class MediaCarousel {
    constructor() {
        this.container = document.querySelector('.bottom-left');
        this.currentIndex = 0;
        this.mediaItems = [];
        this.thumbnailSize = 100;
        this.visibleThumbnails = 4;
        
        this.init();
    }

    async init() {
        // Clear the container
        this.container.innerHTML = '';
        
        // Enable mouse events for this area
        try {
            const { ipcRenderer } = require('electron');
            await ipcRenderer.invoke('set-mouse-events', true);
            console.log('🖱️ Mouse events enabled for media carousel');
        } catch (error) {
            console.log('⚠️ Could not enable mouse events:', error);
        }
        
        // Create carousel structure
        this.createCarouselElements();
        
        // Load media items
        await this.loadMediaItems();
        
        // Render initial view
        this.renderCarousel();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Add hover detection for mouse events
        this.setupMouseEventManagement();
    }

    createCarouselElements() {
        // Create main carousel container
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'media-carousel-container';
        carouselContainer.style.cssText = `
            width: 100%;
            height: 100%;
            padding: 35px 15px 15px 15px; /* More padding for larger window */
            display: flex;
            flex-direction: column;
            background: rgba(10, 10, 10, 0.3); /* Slight background for visibility */
            overflow: hidden;
            box-sizing: border-box;
            pointer-events: auto; /* Ensure clicks work */
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
        title.textContent = 'Media Library';
        title.style.fontWeight = 'bold';

        const counter = document.createElement('span');
        counter.id = 'media-counter';
        counter.style.opacity = '0.7';

        header.appendChild(title);
        header.appendChild(counter);

        // Create scrollable thumbnails container
        const thumbnailsWrapper = document.createElement('div');
        thumbnailsWrapper.style.cssText = `
            flex: 1;
            overflow: hidden;
            position: relative;
            margin-bottom: 15px;
        `;

        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.id = 'thumbnails-container';
        thumbnailsContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            overflow-y: auto;
            overflow-x: hidden;
            height: 100%;
            padding-right: 10px; /* Prevent clipping on right side */
            box-sizing: border-box;
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 170, 255, 0.5) transparent;
        `;

        // Custom scrollbar styling
        const style = document.createElement('style');
        style.textContent = `
            #thumbnails-container::-webkit-scrollbar {
                width: 6px;
            }
            #thumbnails-container::-webkit-scrollbar-track {
                background: rgba(0, 170, 255, 0.1);
                border-radius: 3px;
            }
            #thumbnails-container::-webkit-scrollbar-thumb {
                background: rgba(0, 170, 255, 0.5);
                border-radius: 3px;
            }
            #thumbnails-container::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 170, 255, 0.8);
            }
        `;
        document.head.appendChild(style);

        thumbnailsWrapper.appendChild(thumbnailsContainer);

        // Create refresh button instead of navigation
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-shrink: 0;
        `;

        const refreshButton = document.createElement('button');
        refreshButton.id = 'refresh-btn';
        refreshButton.innerHTML = '🔄 Refresh';
        refreshButton.style.cssText = `
            background: rgba(0, 170, 255, 0.2);
            border: 1px solid rgba(0, 170, 255, 0.5);
            color: #00aaff;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            transition: all 0.2s ease;
        `;

        refreshButton.addEventListener('mouseenter', () => {
            refreshButton.style.background = 'rgba(0, 170, 255, 0.3)';
            refreshButton.style.borderColor = 'rgba(0, 170, 255, 0.8)';
        });

        refreshButton.addEventListener('mouseleave', () => {
            refreshButton.style.background = 'rgba(0, 170, 255, 0.2)';
            refreshButton.style.borderColor = 'rgba(0, 170, 255, 0.5)';
        });

        controlsContainer.appendChild(refreshButton);

        // Assemble carousel
        carouselContainer.appendChild(header);
        carouselContainer.appendChild(thumbnailsWrapper);
        carouselContainer.appendChild(controlsContainer);
        
        this.container.appendChild(carouselContainer);
    }

    async loadMediaItems() {
        try {
            // Use Electron's IPC to get media files
            const { ipcRenderer } = require('electron');
            
            // Request media files from main process
            const mediaFiles = await ipcRenderer.invoke('get-media-files');
            
            this.mediaItems = mediaFiles.map(file => ({
                name: file.name,
                path: file.path,
                type: file.type, // 'image' or 'video'
                thumbnail: file.thumbnail || file.path // Use thumbnail if available
            }));
            
        } catch (error) {
            console.log('Could not load media files:', error);
            // Fallback with mock data for testing
            this.mediaItems = [
                { name: 'Sample 1', path: '/mock/path1.jpg', type: 'image' },
                { name: 'Sample 2', path: '/mock/path2.mp4', type: 'video' },
                { name: 'Sample 3', path: '/mock/path3.png', type: 'image' }
            ];
        }
    }

    renderCarousel() {
        const container = document.getElementById('thumbnails-container');
        const counter = document.getElementById('media-counter');
        
        if (!container) return;
        
        // Clear existing thumbnails
        container.innerHTML = '';
        
        // Update counter
        counter.textContent = `${this.mediaItems.length} items`;
        
        // Create thumbnail elements
        this.mediaItems.forEach((item, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'media-thumbnail';
            thumbnail.style.cssText = `
                width: ${this.thumbnailSize}px;
                height: ${this.thumbnailSize}px;
                background: rgba(0, 170, 255, 0.15); /* More opaque background */
                border: 2px solid rgba(0, 170, 255, 0.4); /* More visible border */
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                flex-shrink: 0;
                box-sizing: border-box;
                pointer-events: auto; /* Explicitly enable clicks */
                z-index: 10; /* Ensure it's above other elements */
            `;

            // Add type indicator
            const typeIndicator = document.createElement('div');
            typeIndicator.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 3px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
                z-index: 3;
                pointer-events: none;
            `;
            typeIndicator.textContent = item.type === 'video' ? '🎥' : '🖼️';

            // Add filename
            const filename = document.createElement('div');
            filename.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
                color: white;
                padding: 8px 6px 4px 6px;
                font-size: 9px;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
                z-index: 3;
                pointer-events: none;
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            `;
            filename.textContent = item.name;

            // Create content container
            const contentContainer = document.createElement('div');
            contentContainer.style.cssText = `
                width: 100%;
                height: 100%;
                position: relative;
                overflow: hidden;
                border-radius: 4px;
            `;

            // Try to load actual image/video thumbnail
            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = `file://${item.path}`;
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                `;
                
                img.onload = () => {
                    console.log(`✅ Loaded image: ${item.name}`);
                };
                
                img.onerror = () => {
                    console.log(`❌ Failed to load image: ${item.name}`);
                    // Fallback to icon if image fails to load
                    contentContainer.innerHTML = '';
                    contentContainer.style.cssText += `
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        color: #00aaff;
                    `;
                    contentContainer.textContent = '🖼️';
                };
                
                contentContainer.appendChild(img);
            } else {
                // For videos, show video icon
                contentContainer.style.cssText += `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    color: #00aaff;
                    background: rgba(0, 170, 255, 0.05);
                `;
                contentContainer.textContent = '🎥';
            }

            // Assemble thumbnail
            thumbnail.appendChild(contentContainer);
            thumbnail.appendChild(typeIndicator);
            thumbnail.appendChild(filename);

            // Add click handler with better error handling
            thumbnail.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🖱️ Clicked on: ${item.name}`);
                console.log(`📁 File path: ${item.path}`);
                console.log(`📋 File type: ${item.type}`);
                
                try {
                    // Add visual feedback
                    thumbnail.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        thumbnail.style.transform = 'scale(1.05)';
                    }, 100);
                    
                    await this.openMedia(item);
                } catch (error) {
                    console.error('Error in click handler:', error);
                }
            });
            
            // Add hover effects
            thumbnail.addEventListener('mouseenter', () => {
                thumbnail.style.borderColor = 'rgba(0, 170, 255, 0.8)';
                thumbnail.style.transform = 'scale(1.05)';
                thumbnail.style.boxShadow = '0 4px 12px rgba(0, 170, 255, 0.3)';
            });
            
            thumbnail.addEventListener('mouseleave', () => {
                thumbnail.style.borderColor = 'rgba(0, 170, 255, 0.3)';
                thumbnail.style.transform = 'scale(1)';
                thumbnail.style.boxShadow = 'none';
            });

            container.appendChild(thumbnail);
        });
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refresh-btn');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                console.log('🔄 Refreshing media library...');
                refreshBtn.innerHTML = '⏳ Loading...';
                refreshBtn.disabled = true;
                
                try {
                    await this.loadMediaItems();
                    this.renderCarousel();
                    console.log('✅ Media library refreshed');
                } catch (error) {
                    console.error('❌ Failed to refresh media library:', error);
                } finally {
                    refreshBtn.innerHTML = '🔄 Refresh';
                    refreshBtn.disabled = false;
                }
            });
        }
    }

    async openMedia(item) {
        console.log(`🎬 Attempting to open media: ${item.name} at ${item.path}`);
        
        try {
            // Check if we're in Electron environment
            if (typeof require !== 'undefined') {
                const { shell } = require('electron');
                console.log('📱 Using Electron shell to open media...');
                
                // Use shell.openPath for opening files with default application
                const result = await shell.openPath(item.path);
                if (result === '') {
                    // Empty string means success in Electron shell.openPath
                    console.log(`✅ Successfully opened: ${item.name}`);
                } else {
                    console.log(`⚠️ Shell returned message: ${result}`);
                    // Try alternative method - show in folder
                    console.log('🔄 Trying to show in folder instead...');
                    shell.showItemInFolder(item.path);
                    console.log(`📁 Showed ${item.name} in folder`);
                }
            } else {
                console.log('🌐 Not in Electron environment');
                throw new Error('Not in Electron environment');
            }
        } catch (error) {
            console.error('❌ Failed to open media with shell:', error);
            
            // Try using IPC to ask main process to open the file
            try {
                console.log('🔄 Trying IPC method...');
                const { ipcRenderer } = require('electron');
                await ipcRenderer.invoke('open-media-file', item.path);
                console.log(`✅ IPC method successful for: ${item.name}`);
            } catch (ipcError) {
                console.error('❌ IPC method also failed:', ipcError);
                
                // Final fallback - show error to user
                const errorMsg = `Could not open ${item.name}. File path: ${item.path}`;
                console.error(errorMsg);
                
                // Try to show in folder as last resort
                try {
                    const { shell } = require('electron');
                    shell.showItemInFolder(item.path);
                    console.log(`📁 Fallback: Showed ${item.name} in folder`);
                } catch (folderError) {
                    console.error('❌ Even folder view failed:', folderError);
                }
            }
        }
    }

    setupMouseEventManagement() {
        // Implementation of setupMouseEventManagement method
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.mediaCarousel = new MediaCarousel();
}); 