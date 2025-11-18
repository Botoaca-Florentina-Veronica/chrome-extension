# Chrome Extension: Jokes, Quotes & Memes

A fun Chrome extension that displays random jokes, motivational quotes, and memes. Features an animated camel that walks across your screen pulling a quote banner!

## ✨ Features

- 🎭 **Random Jokes** - Display funny jokes in the popup
- 💭 **Motivational Quotes** - 76+ inspiring quotes
- 🖼️ **Memes** - Show random meme images
- 🐫 **Animated Screen Overlay** - Click "Play on screen" to see an animated camel walk across any webpage, pulling a quote banner
- 🎨 **Background Blur Effect** - Page blurs during the animation for better visibility
- 📋 **Copy to Clipboard** - Easy copy function for jokes and quotes

## 📁 Project Structure

chrome-extension/
- manifest.json
- icons/
- popup/
    - popup.html
    - popup.css
- src/
    - popup.js
    - background.js
    - content.js
- data/
    - jokes.json
    - quotes.json
    - memes.json
- assets/
    - memes/

Files and purpose

- `manifest.json`: Extension manifest (Manifest V3).
- `popup/popup.html`: Popup UI shown when the extension action is clicked.
- `popup/popup.css`: Styles for the popup UI.
- `src/popup.js`: Logic to load random jokes/quotes/memes and display them.
- `src/background.js`: Background service worker (basic placeholder).
- `src/content.js`: Content script placeholder (not required for popup-only functionality).
- `data/*.json`: Local data files with example jokes, quotes and meme filenames.
- `assets/memes/*`: Local meme images (SVG/PNG) used by the popup.

## 🚀 How to Install

### Method 1: Load Unpacked (Developer Mode)

1. **Download or Clone** this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `chrome-extension` folder
6. The extension icon should appear in your toolbar!

### Method 2: After Installation

- Click the extension icon to open the popup
- Use the buttons: **Joke**, **Quote**, **Meme**, or **Play on screen**
- Click **Next** to see another random item
- Click **Copy** to copy jokes/quotes to clipboard

## 🎬 Using the Animation Feature

1. Open **any regular website** (e.g., google.com, youtube.com, wikipedia.org)
2. Click the extension icon
3. Click **"Play on screen"** button
4. Watch the animated camel walk across your screen with a motivational quote!

### ⚠️ Where Animation CANNOT Work

The animation **will not work** on these protected pages:
- ❌ `chrome://` pages (browser settings, extensions, etc.)
- ❌ Chrome Web Store (`chrome.google.com/webstore`)
- ❌ Edge Add-ons store
- ❌ PDF viewer pages
- ❌ `file://` local files

**Error message:** `"The extensions gallery cannot be scripted"`

**Solution:** Simply open any normal website (http:// or https://) and try again!

### ✅ Recommended Test Sites

Works perfectly on:
- ✅ google.com
- ✅ youtube.com
- ✅ wikipedia.org
- ✅ stackoverflow.com
- ✅ reddit.com
- ✅ Most news sites and blogs

## 🐛 Troubleshooting

### Animation doesn't appear?

1. **Check the page type**: Make sure you're on a regular website (http/https)
2. **Open browser console** (F12 → Console tab)
3. Look for messages starting with `[Chrome Extension]`
4. **Refresh the page** (F5) and try again
5. **Reload the extension** at `chrome://extensions`

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "extensions gallery cannot be scripted" | You're on Chrome Web Store | Open any regular website |
| "Cannot access chrome://" | Browser internal page | Navigate to a normal website |
| "Failed to load Lottie library" | CSP blocking scripts | Try a different website |

### Still having issues?

- Check browser console (F12) for detailed error logs
- Make sure extension has permission for "all sites"
- Test on `wikipedia.org` as a simple test case

## 🔧 Customization

### Add Your Own Content

**Jokes** - Edit `data/jokes.json`:
```json
[
  "Why did the chicken cross the road? To get to the other side!",
  "Your joke here..."
]
```

**Quotes** - Edit `data/quotes.json`:
```json
[
  "Your motivational quote here",
  "Another inspiring quote..."
]
```

**Memes** - Add images to `assets/memes/` and update `data/memes.json`:
```json
[
  "meme1.svg",
  "your-meme.png"
]
```

### Animation Settings

To adjust animation speed, edit `src/popup.js`:
```javascript
const durationMs = 18000; // Duration in milliseconds (18s = slower, 8s = faster)
anim.setSpeed(0.7); // Lottie playback speed (0.5 = slower, 1.0 = normal, 2.0 = faster)
```

## 🛠️ Technical Details

- **Manifest Version:** V3
- **Permissions:** storage, scripting, activeTab, `<all_urls>`
- **Animation Library:** Lottie Web 5.12.2
- **Injection Method:** Chrome Scripting API (MAIN world)
- **Content Security Policy:** Respects site CSP restrictions

## 📜 Files Overview