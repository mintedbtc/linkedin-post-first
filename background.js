// LinkedIn Post First - Background Service Worker

const STORAGE_KEY = 'lpf_last_post_date';
const STREAK_KEY = 'lpf_streak';

// Reset at midnight
function scheduleReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const msUntilMidnight = tomorrow - now;
  
  // Set alarm for midnight
  chrome.alarms.create('midnight-reset', {
    when: Date.now() + msUntilMidnight,
    periodInMinutes: 24 * 60 // Repeat daily
  });
}

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'midnight-reset') {
    // Don't reset the storage - just let the date check handle it
    // This alarm is mainly for refreshing any open LinkedIn tabs
    console.log('LinkedIn Post First: New day started');
  }
});

// Initial setup
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Post First installed');
  scheduleReset();
  
  // Set default values
  chrome.storage.local.get([STREAK_KEY], (result) => {
    if (!result[STREAK_KEY]) {
      chrome.storage.local.set({ [STREAK_KEY]: 0 });
    }
  });
});

// Handle startup
chrome.runtime.onStartup.addListener(() => {
  scheduleReset();
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
