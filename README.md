# Chrome Extension: Jokes, Quotes & Memes

This repository contains a small Chrome extension which can show random jokes, funny memes and motivational quotes.

Project structure

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

How to load the extension (developer mode)

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and choose this repository's root folder.

Next steps

- Replace the sample content in `data/*.json` with your own jokes, quotes and meme images.
- Improve UI/UX in `popup/popup.html` and `popup/popup.css`.
- Add sync or remote fetching of content if needed.

If you want, I can now scaffold the folders and create the sample files (manifest, popup UI, scripts, data and a sample meme). Say "Yes, scaffold files" or ask for changes to the structure.