// LinkedIn Post First - Content Script
// Blocks feed until user has posted today

(function() {
  'use strict';

  const OVERLAY_ID = 'lpf-overlay';
  const STORAGE_KEY = 'lpf_last_post_date';
  
  console.log('[LinkedIn Post First] Extension loaded on:', window.location.pathname);
  
  // Pages that are allowed without posting (be specific)
  const ALLOWED_PATHS = [
    '/post/new',
    '/messaging',
    '/jobs',
    '/notifications',
  ];
  
  // Paths that start with these are allowed
  const ALLOWED_PREFIXES = [
    '/in/', // Profile pages
    '/mynetwork/',
  ];

  // Check if current page should be allowed
  function isAllowedPage() {
    const path = window.location.pathname;
    
    // Check exact matches
    if (ALLOWED_PATHS.includes(path)) return true;
    
    // Check prefix matches
    if (ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix))) return true;
    
    return false;
  }

  // Check if user has posted today
  async function hasPostedToday() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const lastPostDate = result[STORAGE_KEY];
        const today = new Date().toDateString();
        resolve(lastPostDate === today);
      });
    });
  }

  // Mark that user has posted today
  function markPostedToday() {
    const today = new Date().toDateString();
    chrome.storage.local.set({ [STORAGE_KEY]: today });
  }

  // Create the blocking overlay
  function createOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;
    
    // Wait for body to exist
    if (!document.body) {
      console.log('[LinkedIn Post First] Waiting for body...');
      setTimeout(createOverlay, 50);
      return;
    }
    
    console.log('[LinkedIn Post First] Creating overlay');

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `
      <div class="lpf-content">
        <div class="lpf-icon">✍️</div>
        <h1>Post First, Scroll Later</h1>
        <p>You haven't posted on LinkedIn today yet.</p>
        <p class="lpf-subtitle">Create before you consume.</p>
        <div class="lpf-buttons">
          <a href="https://www.linkedin.com/post/new" class="lpf-btn lpf-btn-primary">
            Create a Post
          </a>
          <button class="lpf-btn lpf-btn-secondary" id="lpf-posted-btn">
            I Already Posted
          </button>
        </div>
        <div class="lpf-footer">
          <button id="lpf-bypass-btn" class="lpf-bypass">Skip for 5 minutes</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);

    // Handle "I Already Posted" button
    document.getElementById('lpf-posted-btn').addEventListener('click', () => {
      markPostedToday();
      removeOverlay();
    });

    // Handle bypass button
    document.getElementById('lpf-bypass-btn').addEventListener('click', () => {
      removeOverlay();
      // Re-enable after 5 minutes
      setTimeout(checkAndBlock, 5 * 60 * 1000);
    });
  }

  // Remove the overlay
  function removeOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
      overlay.remove();
    }
  }

  // Detect if user is creating/has created a post
  function detectPosting() {
    // Check for post creation success indicators
    const observer = new MutationObserver((mutations) => {
      // Look for the post composer or success message
      const postCreated = document.querySelector('[data-test-id="post-success"]') ||
                         document.querySelector('.share-box-feed-entry__closed-share-box') ||
                         document.querySelector('.feed-shared-update-v2__description');
      
      // Also detect if user is on the new post page and has content
      const postComposer = document.querySelector('.share-creation-state__text-editor');
      const postButton = document.querySelector('[data-control-name="share.post"]');
      
      // If we detect successful posting behavior, mark as posted
      if (postCreated && window.location.pathname.includes('/feed')) {
        // User likely just posted
        markPostedToday();
        removeOverlay();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Check URL for post completion
  function checkForPostCompletion() {
    // If redirected back from post creation, might have posted
    if (document.referrer.includes('/post/new')) {
      // Could have posted - but we'll rely on manual confirmation or detection
    }
  }

  // Main check and block function
  async function checkAndBlock() {
    console.log('[LinkedIn Post First] Checking page:', window.location.pathname);
    
    // Skip on allowed pages
    if (isAllowedPage()) {
      console.log('[LinkedIn Post First] Allowed page, not blocking');
      removeOverlay();
      return;
    }

    // Check if already posted today
    const posted = await hasPostedToday();
    console.log('[LinkedIn Post First] Posted today:', posted);
    if (posted) {
      removeOverlay();
      return;
    }

    // Block the feed
    console.log('[LinkedIn Post First] Blocking feed!');
    createOverlay();
  }

  // Listen for storage changes (if user marks posted in another tab)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes[STORAGE_KEY]) {
      checkAndBlock();
    }
  });

  // Initial check when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkAndBlock();
      detectPosting();
    });
  } else {
    checkAndBlock();
    detectPosting();
  }

  // Re-check on navigation (LinkedIn is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(checkAndBlock, 100);
    }
  }).observe(document, { subtree: true, childList: true });

})();
