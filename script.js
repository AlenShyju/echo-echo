// App State
let state = {
    currentSong: null,
    isPlaying: false,
    player: null,
    queue: [],
    currentIndex: -1,
    volume: 80,
    isShuffle: false,
    isRepeat: false,
    likedSongs: JSON.parse(localStorage.getItem('likedSongs')) || [],
    recentSongs: JSON.parse(localStorage.getItem('recentSongs')) || [],
    searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || [],
    theme: localStorage.getItem('theme') || 'light',
    apiStatus: 'checking' // checking, available, unavailable
};

// DOM Elements
const elements = {
    // Buttons
    playBtn: document.getElementById('play-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    repeatBtn: document.getElementById('repeat-btn'),
    likeBtn: document.getElementById('like-btn'),
    volumeBtn: document.getElementById('volume-btn'),
    queueBtn: document.getElementById('queue-btn'),
    menuBtn: document.getElementById('menu-btn'),
    themeBtn: document.getElementById('theme-btn'),
    clearSearch: document.getElementById('clear-search'),
    closeSidebar: document.getElementById('close-sidebar'),
    closeQueue: document.getElementById('close-queue'),
    createPlaylist: document.getElementById('create-playlist'),
    clearHistory: document.getElementById('clear-history'),
    
    // Inputs
    searchInput: document.getElementById('search-input'),
    volumeSlider: document.getElementById('volume'),
    
    // Containers
    searchSuggestions: document.getElementById('search-suggestions'),
    featuredPlaylists: document.getElementById('featured-playlists'),
    recentSongs: document.getElementById('recent-songs'),
    likedSongs: document.getElementById('liked-songs'),
    userPlaylists: document.getElementById('user-playlists'),
    genresGrid: document.getElementById('genres-grid'),
    queueList: document.getElementById('queue-list'),
    queueModal: document.getElementById('queue-modal'),
    sidebar: document.getElementById('sidebar'),
    
    // Player Elements
    currentTitle: document.getElementById('current-title'),
    currentArtist: document.getElementById('current-artist'),
    currentThumbnail: document.getElementById('current-thumbnail'),
    currentTime: document.getElementById('current-time'),
    duration: document.getElementById('duration'),
    progressBar: document.getElementById('progress-bar'),
    progress: document.getElementById('progress'),
    nowPlayingBar: document.getElementById('now-playing-bar'),
    
    // Counters
    likedCount: document.getElementById('liked-count'),
    playedCount: document.getElementById('played-count'),
    
    // Loading
    loading: document.getElementById('loading'),
    mainContainer: document.getElementById('main-container')
};

// Genres for exploration
const genres = [
    { id: 'pop', name: 'Pop', icon: 'fas fa-play-circle', color: '#3B82F6' },
    { id: 'rock', name: 'Rock', icon: 'fas fa-guitar', color: '#EF4444' },
    { id: 'hiphop', name: 'Hip Hop', icon: 'fas fa-microphone', color: '#10B981' },
    { id: 'electronic', name: 'Electronic', icon: 'fas fa-sliders-h', color: '#8B5CF6' },
    { id: 'jazz', name: 'Jazz', icon: 'fas fa-music', color: '#F59E0B' },
    { id: 'classical', name: 'Classical', icon: 'fas fa-violin', color: '#6366F1' },
    { id: 'rnb', name: 'R&B', icon: 'fas fa-headphones', color: '#EC4899' },
    { id: 'country', name: 'Country', icon: 'fas fa-guitar', color: '#F97316' },
    { id: 'reggae', name: 'Reggae', icon: 'fas fa-cloud-sun', color: '#84CC16' }
];

// Mock playlists for featured section
const mockPlaylists = [
    { 
        title: 'Top Hits 2024', 
        desc: 'Latest chart toppers', 
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
    },
    { 
        title: 'Chill Vibes', 
        desc: 'Relax and unwind', 
        image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop'
    },
    { 
        title: 'Workout Energy', 
        desc: 'High energy tracks', 
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop'
    },
    { 
        title: 'Throwback Classics', 
        desc: 'All time favorites', 
        image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop'
    }
];

// Initialize App
async function initApp() {
    // Set theme
    document.documentElement.setAttribute('data-theme', state.theme);
    elements.themeBtn.innerHTML = state.theme === 'dark' ? 
        '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    // Check API status
    await checkAPIStatus();
    
    // Initialize YouTube Player
    initYouTubePlayer();
    
    // Load initial data
    setTimeout(() => {
        loadFeaturedPlaylists();
        loadGenres();
        updateLibraryCounts();
        loadRecentSongs();
        loadLikedSongs();
        
        // Hide loading screen
        elements.loading.style.opacity = '0';
        setTimeout(() => {
            elements.loading.style.display = 'none';
            elements.mainContainer.style.display = 'block';
        }, 500);
    }, 1500);
    
    // Setup event listeners
    setupEventListeners();
}

// Check API status
async function checkAPIStatus() {
    try {
        const response = await fetch('/api/search?query=test');
        if (response.ok) {
            state.apiStatus = 'available';
        } else {
            state.apiStatus = 'unavailable';
        }
    } catch (error) {
        state.apiStatus = 'unavailable';
        console.log('API not available, using mock data');
    }
}

// Initialize YouTube Player
function initYouTubePlayer() {
    // Load YouTube IFrame API
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
        createPlayer();
    }
}

// YouTube API ready callback
window.onYouTubeIframeAPIReady = function() {
    createPlayer();
};

function createPlayer() {
    state.player = new YT.Player('player', {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube Player Ready');
    event.target.setVolume(state.volume);
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        state.isPlaying = true;
        updatePlayButton();
        updateProgress();
    } else if (event.data === YT.PlayerState.PAUSED) {
        state.isPlaying = false;
        updatePlayButton();
    } else if (event.data === YT.PlayerState.ENDED) {
        playNext();
    }
}

// Event Listeners
function setupEventListeners() {
    // Player Controls
    elements.playBtn.addEventListener('click', togglePlay);
    elements.prevBtn.addEventListener('click', playPrev);
    elements.nextBtn.addEventListener('click', playNext);
    elements.shuffleBtn.addEventListener('click', toggleShuffle);
    elements.repeatBtn.addEventListener('click', toggleRepeat);
    elements.likeBtn.addEventListener('click', toggleLike);
    elements.volumeSlider.addEventListener('input', updateVolume);
    
    // Navigation
    elements.menuBtn.addEventListener('click', () => {
        elements.sidebar.classList.add('open');
    });
    
    elements.closeSidebar.addEventListener('click', () => {
        elements.sidebar.classList.remove('open');
    });
    
    elements.themeBtn.addEventListener('click', toggleTheme);
    
    // Search
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.clearSearch.addEventListener('click', clearSearch);
    
    // Queue
    elements.queueBtn.addEventListener('click', () => {
        elements.queueModal.classList.add('open');
        updateQueueList();
    });
    
    elements.closeQueue.addEventListener('click', () => {
        elements.queueModal.classList.remove('open');
    });
    
    // History
    elements.clearHistory.addEventListener('click', clearHistory);
    
    // Tabs
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    // Progress Bar
    elements.progressBar.addEventListener('click', (e) => {
        const rect = elements.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        if (state.player && state.player.seekTo) {
            state.player.seekTo(state.player.getDuration() * percent);
        }
    });
    
    // Quick Play Buttons
    document.querySelectorAll('.quick-play-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const genre = btn.getAttribute('data-genre');
            searchGenre(genre);
        });
    });
    
    // Sidebar items
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const text = item.querySelector('span').textContent.toLowerCase();
            switchTab(text);
        });
    });
    
    // Create playlist
    elements.createPlaylist.addEventListener('click', createNewPlaylist);
    
    // Close modal on background click
    elements.queueModal.addEventListener('click', (e) => {
        if (e.target === elements.queueModal) {
            elements.queueModal.classList.remove('open');
        }
    });
}

// Player Functions
function togglePlay() {
    if (!state.currentSong) return;
    
    if (state.isPlaying) {
        state.player.pauseVideo();
    } else {
        state.player.playVideo();
    }
    state.isPlaying = !state.isPlaying;
    updatePlayButton();
}

function playPrev() {
    if (state.queue.length === 0) return;
    
    if (state.isShuffle) {
        state.currentIndex = Math.floor(Math.random() * state.queue.length);
    } else {
        state.currentIndex = state.currentIndex > 0 ? state.currentIndex - 1 : state.queue.length - 1;
    }
    
    playSong(state.queue[state.currentIndex]);
}

function playNext() {
    if (state.queue.length === 0) return;
    
    if (state.isShuffle) {
        state.currentIndex = Math.floor(Math.random() * state.queue.length);
    } else {
        state.currentIndex = (state.currentIndex + 1) % state.queue.length;
    }
    
    if (state.isRepeat && state.currentIndex === state.queue.length - 1) {
        state.currentIndex = 0;
    }
    
    playSong(state.queue[state.currentIndex]);
}

function toggleShuffle() {
    state.isShuffle = !state.isShuffle;
    elements.shuffleBtn.classList.toggle('active', state.isShuffle);
}

function toggleRepeat() {
    state.isRepeat = !state.isRepeat;
    elements.repeatBtn.classList.toggle('active', state.isRepeat);
}

function toggleLike() {
    if (!state.currentSong) return;
    
    const index = state.likedSongs.findIndex(s => s.id === state.currentSong.id);
    if (index === -1) {
        state.likedSongs.push(state.currentSong);
        elements.likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
        elements.likeBtn.classList.add('active');
        showNotification('Added to liked songs');
    } else {
        state.likedSongs.splice(index, 1);
        elements.likeBtn.innerHTML = '<i class="far fa-heart"></i>';
        elements.likeBtn.classList.remove('active');
        showNotification('Removed from liked songs');
    }
    
    localStorage.setItem('likedSongs', JSON.stringify(state.likedSongs));
    updateLibraryCounts();
    loadLikedSongs();
}

function updateVolume() {
    state.volume = elements.volumeSlider.value;
    if (state.player) {
        state.player.setVolume(state.volume);
    }
}

// Play Song
async function playSong(song) {
    if (!song) return;
    
    state.currentSong = song;
    state.currentIndex = state.queue.findIndex(s => s.id === song.id);
    
    // Update UI
    elements.currentTitle.textContent = song.title;
    elements.currentArtist.textContent = song.artist;
    elements.currentThumbnail.src = song.thumbnail;
    
    // Update like button
    const isLiked = state.likedSongs.some(s => s.id === song.id);
    elements.likeBtn.innerHTML = isLiked ? 
        '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    elements.likeBtn.classList.toggle('active', isLiked);
    
    // Load and play video
    if (state.player) {
        state.player.loadVideoById(song.videoId);
        state.player.playVideo();
    }
    
    // Add to recent songs
    addToRecent(song);
    
    // Update now playing bar visibility
    elements.nowPlayingBar.style.display = 'flex';
    
    // Show notification
    showNotification(`Now playing: ${song.title}`);
}

// Search Functions
let searchTimeout;
async function handleSearchInput() {
    const query = elements.searchInput.value.trim();
    if (query.length === 0) {
        elements.searchSuggestions.style.display = 'none';
        return;
    }
    
    // Clear previous timeout
    if (searchTimeout) clearTimeout(searchTimeout);
    
    // Debounce search
    searchTimeout = setTimeout(async () => {
        if (query.length < 2) return;
        
        const suggestions = await searchYouTube(query, 5);
        displaySuggestions(suggestions);
    }, 300);
}

async function searchYouTube(query, maxResults = 50) {
    try {
        const response = await fetch(
            `/api/search?query=${encodeURIComponent(query)}&maxResults=${maxResults}`
        );
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const videos = await response.json();
        
        // Add to queue if it's empty
        if (state.queue.length === 0 && videos.length > 0) {
            state.queue = videos;
        }
        
        return videos;
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

function displaySuggestions(suggestions) {
    elements.searchSuggestions.innerHTML = '';
    
    if (suggestions.length === 0) {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = 'No results found';
        elements.searchSuggestions.appendChild(div);
    } else {
        suggestions.slice(0, 5).forEach(song => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <strong>${song.title}</strong><br>
                <small>${song.artist}</small>
            `;
            div.addEventListener('click', () => {
                playSong(song);
                elements.searchInput.value = '';
                elements.searchSuggestions.style.display = 'none';
            });
            elements.searchSuggestions.appendChild(div);
        });
    }
    
    elements.searchSuggestions.style.display = 'block';
}

function clearSearch() {
    elements.searchInput.value = '';
    elements.searchSuggestions.style.display = 'none';
}

function clearHistory() {
    state.recentSongs = [];
    localStorage.setItem('recentSongs', JSON.stringify(state.recentSongs));
    loadRecentSongs();
    showNotification('History cleared');
}

// Data Loading Functions
function loadFeaturedPlaylists() {
    elements.featuredPlaylists.innerHTML = mockPlaylists.map(playlist => `
        <div class="playlist-card" onclick="window.searchPlaylist('${playlist.title}')">
            <img src="${playlist.image}" alt="${playlist.title}" class="playlist-image" loading="lazy">
            <div class="playlist-info">
                <div class="playlist-title">${playlist.title}</div>
                <div class="playlist-desc">${playlist.desc}</div>
            </div>
        </div>
    `).join('');
}

function loadGenres() {
    elements.genresGrid.innerHTML = genres.map(genre => `
        <div class="genre-card" data-genre="${genre.id}" style="background: ${genre.color}20; color: ${genre.color};">
            <i class="${genre.icon}"></i>
            <span>${genre.name}</span>
        </div>
    `).join('');
}

function loadRecentSongs() {
    if (state.recentSongs.length === 0) {
        elements.recentSongs.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-music"></i>
                <p>No recent songs</p>
                <small>Start playing music to see your history here</small>
            </div>
        `;
        return;
    }
    
    elements.recentSongs.innerHTML = state.recentSongs.slice(0, 10).map((song, index) => `
        <div class="song-item" onclick="window.playSong(${JSON.stringify(song).replace(/"/g, '&quot;')})">
            <img src="${song.thumbnail}" alt="${song.title}" class="song-thumbnail" loading="lazy">
            <div class="song-details">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
            <div class="song-duration">${song.duration}</div>
        </div>
    `).join('');
}

function loadLikedSongs() {
    if (state.likedSongs.length === 0) {
        elements.likedSongs.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <p>No liked songs yet</p>
                <small>Like songs by clicking the heart icon</small>
            </div>
        `;
        return;
    }
    
    elements.likedSongs.innerHTML = state.likedSongs.map(song => `
        <div class="song-item" onclick="window.playSong(${JSON.stringify(song).replace(/"/g, '&quot;')})">
            <img src="${song.thumbnail}" alt="${song.title}" class="song-thumbnail" loading="lazy">
            <div class="song-details">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
            <div class="song-duration">${song.duration}</div>
        </div>
    `).join('');
}

// Helper Functions
function addToRecent(song) {
    // Remove if already exists
    state.recentSongs = state.recentSongs.filter(s => s.id !== song.id);
    // Add to beginning
    state.recentSongs.unshift(song);
    // Keep only last 50
    state.recentSongs = state.recentSongs.slice(0, 50);
    localStorage.setItem('recentSongs', JSON.stringify(state.recentSongs));
    loadRecentSongs();
}

function updateLibraryCounts() {
    elements.likedCount.textContent = state.likedSongs.length;
    elements.playedCount.textContent = state.recentSongs.length;
}

function updatePlayButton() {
    elements.playBtn.innerHTML = state.isPlaying ? 
        '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function updateProgress() {
    if (!state.player || !state.currentSong) return;
    
    const current = state.player.getCurrentTime();
    const total = state.player.getDuration();
    
    elements.currentTime.textContent = formatTime(current);
    elements.duration.textContent = formatTime(total);
    elements.progress.style.width = `${(current / total) * 100}%`;
    
    if (state.isPlaying) {
        requestAnimationFrame(updateProgress);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    elements.themeBtn.innerHTML = state.theme === 'dark' ? 
        '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', state.theme);
}

function switchTab(tab) {
    // Update active tab button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    
    // Update sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        const itemText = item.querySelector('span').textContent.toLowerCase();
        item.classList.toggle('active', itemText === tab);
    });
    
    // Show corresponding content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        elements.sidebar.classList.remove('open');
    }
}

function searchGenre(genre) {
    const genreNames = {
        pop: 'pop music 2024',
        rock: 'rock music',
        hiphop: 'hip hop rap',
        electronic: 'electronic dance music',
        jazz: 'jazz music',
        classical: 'classical music',
        rnb: 'r&b soul',
        country: 'country music',
        reggae: 'reggae music'
    };
    
    elements.searchInput.value = genreNames[genre] || genre;
    handleSearchInput();
}

function createNewPlaylist() {
    const playlistName = prompt('Enter playlist name:');
    if (playlistName && playlistName.trim()) {
        showNotification(`Playlist "${playlistName}" created`);
        // Here you would normally save to localStorage
    }
}

function updateQueueList() {
    if (state.queue.length === 0) {
        elements.queueList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <p>Queue is empty</p>
                <small>Search and play songs to add to queue</small>
            </div>
        `;
        return;
    }
    
    elements.queueList.innerHTML = state.queue.map((song, index) => `
        <div class="song-item ${index === state.currentIndex ? 'active' : ''}" 
             onclick="window.playSong(${JSON.stringify(song).replace(/"/g, '&quot;')})">
            <img src="${song.thumbnail}" alt="${song.title}" class="song-thumbnail">
            <div class="song-details">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
            <div class="song-duration">${song.duration}</div>
        </div>
    `).join('');
}

function showNotification(message, duration = 3000) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: var(--primary);
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 90%;
        width: auto;
    `;
    
    // Add inner content styles
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Add notification styles to head
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: var(--primary);
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
        max-width: 90%;
        width: auto;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            togglePlay();
            break;
        case 'ArrowLeft':
            if (e.altKey) playPrev();
            break;
        case 'ArrowRight':
            if (e.altKey) playNext();
            break;
        case 'KeyM':
            toggleTheme();
            break;
        case 'KeyL':
            if (e.ctrlKey) toggleLike();
            break;
    }
});

// Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Global functions for HTML onclick
window.playSong = playSong;
window.searchPlaylist = searchGenre;