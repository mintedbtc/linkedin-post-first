// LinkedIn Post First - Popup Script

const STORAGE_KEY = 'lpf_last_post_date';
const STREAK_KEY = 'lpf_streak';
const STREAK_DATES_KEY = 'lpf_streak_dates';

async function checkStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY, STREAK_KEY, STREAK_DATES_KEY], (result) => {
      const lastPostDate = result[STORAGE_KEY];
      const today = new Date().toDateString();
      const streak = result[STREAK_KEY] || 0;
      
      resolve({
        postedToday: lastPostDate === today,
        streak: streak
      });
    });
  });
}

async function markPostedToday() {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY, STREAK_KEY], (result) => {
      const lastPostDate = result[STORAGE_KEY];
      let streak = result[STREAK_KEY] || 0;
      
      // Update streak
      if (lastPostDate === yesterday) {
        streak += 1;
      } else if (lastPostDate !== today) {
        streak = 1; // Reset streak if not consecutive
      }
      
      chrome.storage.local.set({
        [STORAGE_KEY]: today,
        [STREAK_KEY]: streak
      }, () => {
        resolve();
        updateUI();
      });
    });
  });
}

async function resetStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.remove([STORAGE_KEY], () => {
      resolve();
      updateUI();
    });
  });
}

async function updateUI() {
  const status = await checkStatus();
  
  const statusEl = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const statusSubtext = document.getElementById('status-subtext');
  const actionsEl = document.getElementById('actions');
  const streakCount = document.getElementById('streak-count');
  
  streakCount.textContent = status.streak;
  
  if (status.postedToday) {
    statusEl.className = 'status posted';
    statusText.textContent = "You've posted today! ✅";
    statusSubtext.textContent = "Feed unlocked. Happy scrolling!";
    
    actionsEl.innerHTML = `
      <a href="https://www.linkedin.com/feed/" class="btn btn-primary" target="_blank">
        Open LinkedIn
      </a>
      <button class="btn btn-danger" id="reset-btn">
        Reset for testing
      </button>
    `;
  } else {
    statusEl.className = 'status not-posted';
    statusText.textContent = "No post yet today";
    statusSubtext.textContent = "Create something before scrolling!";
    
    actionsEl.innerHTML = `
      <a href="https://www.linkedin.com/post/new" class="btn btn-primary" target="_blank">
        Create a Post
      </a>
      <button class="btn btn-secondary" id="mark-posted-btn">
        I Already Posted
      </button>
    `;
  }
  
  // Re-attach event listeners
  const markBtn = document.getElementById('mark-posted-btn');
  if (markBtn) {
    markBtn.addEventListener('click', markPostedToday);
  }
  
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetStatus);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', updateUI);
