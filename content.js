// LinkedIn Post First - Content Script
(function() {
  'use strict';

  const OVERLAY_ID = 'lpf-overlay';
  const STORAGE_KEY = 'lpf_last_post_date';
  
  // Immediately log to confirm script is running
  console.log('[LinkedIn Post First] 🚀 Script loaded!');

  // Check if user has posted today
  function hasPostedToday() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const lastPostDate = result[STORAGE_KEY];
        const today = new Date().toDateString();
        console.log('[LinkedIn Post First] Last post:', lastPostDate, 'Today:', today);
        resolve(lastPostDate === today);
      });
    });
  }

  // Mark posted
  function markPostedToday() {
    const today = new Date().toDateString();
    chrome.storage.local.set({ [STORAGE_KEY]: today });
    console.log('[LinkedIn Post First] Marked as posted');
  }

  // Create overlay
  function createOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;
    
    console.log('[LinkedIn Post First] Creating overlay NOW');

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.95);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    overlay.innerHTML = `
      <div style="text-align:center;color:white;padding:40px;">
        <div style="font-size:64px;margin-bottom:20px;">✍️</div>
        <h1 style="font-size:28px;margin-bottom:16px;">Post First, Scroll Later</h1>
        <p style="font-size:18px;color:#aaa;margin-bottom:32px;">Create before you consume.</p>
        <a href="https://www.linkedin.com/post/new" 
           style="display:inline-block;background:#0a66c2;color:white;padding:14px 28px;border-radius:24px;text-decoration:none;font-weight:600;margin-right:12px;">
          Create a Post
        </a>
        <button id="lpf-posted-btn"
           style="background:transparent;color:white;padding:14px 28px;border-radius:24px;border:2px solid #444;font-weight:600;cursor:pointer;">
          I Already Posted
        </button>
        <div style="margin-top:40px;">
          <button id="lpf-bypass-btn" style="background:none;border:none;color:#666;cursor:pointer;font-size:14px;">
            Skip for 5 minutes
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    console.log('[LinkedIn Post First] Overlay added to page!');

    document.getElementById('lpf-posted-btn').onclick = () => {
      markPostedToday();
      overlay.remove();
    };

    document.getElementById('lpf-bypass-btn').onclick = () => {
      overlay.remove();
      setTimeout(init, 5 * 60 * 1000);
    };
  }

  // Main init
  async function init() {
    const path = window.location.pathname;
    console.log('[LinkedIn Post First] Checking path:', path);
    
    // Allow these pages
    if (path.startsWith('/post/') || path.startsWith('/in/') || 
        path.startsWith('/messaging') || path.startsWith('/jobs') ||
        path.startsWith('/mynetwork')) {
      console.log('[LinkedIn Post First] Allowed page');
      return;
    }

    const posted = await hasPostedToday();
    if (posted) {
      console.log('[LinkedIn Post First] Already posted today');
      return;
    }

    console.log('[LinkedIn Post First] BLOCKING!');
    createOverlay();
  }

  // Run when body exists
  function waitForBody() {
    if (document.body) {
      init();
    } else {
      setTimeout(waitForBody, 10);
    }
  }

  waitForBody();

  // Re-run on SPA navigation
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      waitForBody();
    }
  }, 500);

})();
