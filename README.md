# LinkedIn Post First

A Chrome extension that blocks LinkedIn feed scrolling until you've posted content for the day.

**Philosophy:** Create before you consume.

## Features

- 🚫 Blocks LinkedIn feed until you've posted today
- ✍️ Direct link to create a new post
- 🔥 Tracks your posting streak
- ⏱️ Optional 5-minute bypass for emergencies
- 📱 Works on all LinkedIn pages

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `linkedin-post-first` folder

## How It Works

1. When you visit LinkedIn, the extension checks if you've posted today
2. If not, an overlay blocks the feed with a friendly reminder
3. Click "Create a Post" to go directly to the post composer
4. Once you've posted (or clicked "I Already Posted"), the feed unlocks
5. Resets at midnight for the next day

## Allowed Pages (Always Accessible)

These pages are never blocked, so you can:
- View/edit your profile (`/in/`)
- Create posts (`/post/new`)
- Check messages (`/messaging`)
- Browse jobs (`/jobs`)
- Manage connections (`/mynetwork/`)
- View notifications (`/notifications`)

## Files

```
linkedin-post-first/
├── manifest.json      # Extension config
├── content.js         # Main blocking logic
├── content.css        # Overlay styles
├── background.js      # Service worker for alarms
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
└── icons/             # Extension icons
```

## Customization

To modify blocked/allowed pages, edit the `ALLOWED_PATHS` array in `content.js`.

---

Built to help you be a creator, not just a consumer. 🚀
