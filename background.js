// LinkedIn Post First - Background Service Worker

const STORAGE_KEY = 'lpf_last_post_date';
const STREAK_KEY = 'lpf_streak';

// Initial setup
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Post First installed');
  
  // Set default values
  chrome.storage.local.get([STREAK_KEY], (result) => {
    if (!result[STREAK_KEY]) {
      chrome.storage.local.set({ [STREAK_KEY]: 0 });
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'POST_CREATED') {
    const today = new Date().toDateString();
    chrome.storage.local.set({ [STORAGE_KEY]: today });
    sendResponse({ success: true });
  }
  return true;
});
