// LinkedIn Post First - Content Script
// Blocks feed until user has posted today

(function() {
  'use strict';

  const OVERLAY_ID = 'lpf-overlay';
  const STORAGE_KEY = 'lpf_last_post_date';
  
  // Pages that are allowed without posting
  const ALLOWED_PATHS = [
    '/in/', // Profile pages (for posting)
    '/post/new', // New post page
    '/feed/update', // When creating a post
    '/messaging', // Messages
    '/jobs', // Job search
    '/mynetwork/invite-connect', // Connection requests
    '/notifications', // Notifications
  ];

  // Check if current page should be allowed
  function isAllowedPage() {
    const path = window.location.pathname;
    return ALLOWED_PATHS.some(allowed => path.startsWith(allowed));
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
    
    document.documentElement.appendChild(overlay);

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
    // Skip on allowed pages
    if (isAllowedPage()) {
      removeOverlay();
      return;
    }

    // Check if already posted today
    const posted = await hasPostedToday();
    if (posted) {
      removeOverlay();
      return;
    }

    // Block the feed
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
