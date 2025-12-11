/* Popup logic: load local JSON data and show a random item */

const btnJoke = document.getElementById('btn-joke');
const btnQuote = document.getElementById('btn-quote');
const btnNext = document.getElementById('btn-next');
const btnCopy = document.getElementById('btn-copy');
const btnScreen = document.getElementById('btn-screen');
const display = document.getElementById('display');
const autoEnable = document.getElementById('auto-enable');
const autoInterval = document.getElementById('auto-interval');
const autoType = document.getElementById('auto-type');
const memeWrap = document.getElementById('meme-wrap');
const memeImg = document.getElementById('meme-img');
const errorPanel = document.getElementById('error-panel');
const errorMsgEl = document.getElementById('error-msg');
const errorDetailsEl = document.getElementById('error-details');
const btnOpenSite = document.getElementById('btn-open-site');
const btnExtensionDetails = document.getElementById('btn-extension-details');
const btnEnableFileUrls = document.getElementById('btn-enable-file-urls');
const autoStatusEl = document.getElementById('auto-status');
const statusTextEl = document.getElementById('status-text');

let jokes = [];
let quotes = [];
let memes = [];
let currentType = 'joke';
let currentItem = null;
let quotesQueue = []; // holds remaining indexes in current shuffle cycle
let jokesQueue = []; // holds remaining indexes for jokes

function rand(arr){
  if(!arr || arr.length===0) return null;
  return arr[Math.floor(Math.random()*arr.length)];
}

function shuffleArray(a){
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
}

function saveQuoteQueue(){
  try{ chrome.storage.local.set({quotesQueue}); }catch(e){ console.warn('saveQuoteQueue', e); }
}

function saveJokeQueue(){
  try{ chrome.storage.local.set({jokesQueue}); }catch(e){ console.warn('saveJokeQueue', e); }
}

function initQuoteQueue(){
  return new Promise((resolve)=>{
    try{
      chrome.storage.local.get(['quotesQueue'], (res)=>{
        try{
          const stored = res && res.quotesQueue;
          if(Array.isArray(stored) && stored.length === quotes.length && quotes.length>0){
            quotesQueue = stored.slice();
          } else {
            quotesQueue = Array.from({length: quotes.length}, (_,i) => i);
            shuffleArray(quotesQueue);
            saveQuoteQueue();
          }
        }catch(e){
          quotesQueue = Array.from({length: quotes.length}, (_,i) => i);
          shuffleArray(quotesQueue);
          saveQuoteQueue();
        }
        resolve();
      });
    }catch(e){
      // fallback: create a fresh queue
      quotesQueue = Array.from({length: quotes.length}, (_,i) => i);
      shuffleArray(quotesQueue);
      resolve();
    }
  });
}

function initJokeQueue(){
  return new Promise((resolve)=>{
    try{
      chrome.storage.local.get(['jokesQueue'], (res)=>{
        try{
          const stored = res && res.jokesQueue;
          if(Array.isArray(stored) && stored.length === jokes.length && jokes.length>0){
            jokesQueue = stored.slice();
          } else {
            jokesQueue = Array.from({length: jokes.length}, (_,i) => i);
            shuffleArray(jokesQueue);
            saveJokeQueue();
          }
        }catch(e){
          jokesQueue = Array.from({length: jokes.length}, (_,i) => i);
          shuffleArray(jokesQueue);
          saveJokeQueue();
        }
        resolve();
      });
    }catch(e){
      jokesQueue = Array.from({length: jokes.length}, (_,i) => i);
      shuffleArray(jokesQueue);
      resolve();
    }
  });
}

function getNextQuote(){
  if(!quotes || quotes.length===0) return null;
  if(!Array.isArray(quotesQueue) || quotesQueue.length === 0){
    quotesQueue = Array.from({length: quotes.length}, (_,i) => i);
    shuffleArray(quotesQueue);
  }
  const idx = quotesQueue.shift();
  saveQuoteQueue();
  return quotes[idx] || null;
}

function getNextJoke(){
  if(!jokes || jokes.length===0) return null;
  if(!Array.isArray(jokesQueue) || jokesQueue.length === 0){
    jokesQueue = Array.from({length: jokes.length}, (_,i) => i);
    shuffleArray(jokesQueue);
  }
  const idx = jokesQueue.shift();
  saveJokeQueue();
  return jokes[idx] || null;
}

async function loadData(){
  const jResp = await fetch(chrome.runtime.getURL('data/jokes.json'));
  jokes = await jResp.json();
  try{ await initJokeQueue(); }catch(e){ console.warn('initJokeQueue failed', e); }
  const qResp = await fetch(chrome.runtime.getURL('data/quotes.json'));
  quotes = await qResp.json();
  try{ await initQuoteQueue(); }catch(e){ console.warn('initQuoteQueue failed', e); }
  const mResp = await fetch(chrome.runtime.getURL('data/memes.json'));
  memes = await mResp.json();
}

function showJoke(){
  memeWrap.hidden = true;
  const j = getNextJoke();
  currentType = 'joke';
  currentItem = j;
  display.textContent = j || 'No jokes available.';
}

function showQuote(){
  memeWrap.hidden = true;
  const q = getNextQuote();
  currentType = 'quote';
  currentItem = q;
  display.textContent = q || 'No quotes available.';
}

function showMeme(){
  const m = rand(memes);
  currentType = 'meme';
  currentItem = m;
  if(m){
    memeImg.src = chrome.runtime.getURL('assets/' + m);
    memeWrap.hidden = false;
    display.textContent = '';
  } else {
    display.textContent = 'No memes available.';
    memeWrap.hidden = true;
  }
}

btnJoke.addEventListener('click', showJoke);
btnQuote.addEventListener('click', showQuote);
btnNext.addEventListener('click', ()=>{
  if(currentType==='meme') showMeme();
  else if(currentType==='quote') showQuote();
  else showJoke();
});

btnCopy.addEventListener('click', ()=>{
  if(currentType==='meme') return; // copying image not implemented
  if(!currentItem) return;
  navigator.clipboard.writeText(currentItem).then(()=>{
    btnCopy.textContent = 'Copied!';
    setTimeout(()=> btnCopy.textContent = 'Copy', 1200);
  });
});

loadData().then(()=>{
  showJoke();
  // initialize auto-play controls from storage
  try{
    chrome.storage.sync.get({autoEnabled:false, autoMinutes:10}, (items)=>{
      try{ autoEnable.checked = !!items.autoEnabled; }catch(e){}
      try{ autoInterval.value = items.autoMinutes || 10; }catch(e){}
      try{ if(autoType) autoType.value = items.autoType || 'quote'; }catch(e){}
      // show persistent auto status (do not disappear)
      try{ updateAutoStatus(!!items.autoEnabled, items.autoMinutes || 10); }catch(e){}
    });
  }catch(e){}
}).catch(err=>{
  display.textContent = 'Failed to load data.';
  console.error(err);
});

// auto-play controls
if(autoEnable && autoInterval){
  autoEnable.addEventListener('change', ()=>{
    const enabled = !!autoEnable.checked;
    const minutes = Math.max(1, parseInt(autoInterval.value,10) || 10);
    // persist current type as well
    const type = autoType ? (autoType.value || 'quote') : 'quote';
    chrome.storage.sync.set({autoEnabled: enabled, autoMinutes: minutes, autoType: type}, ()=>{});
    chrome.runtime.sendMessage({action:'setAlarm', enabled, minutes}, (resp)=>{
      if(chrome.runtime.lastError) console.warn('setAlarm error', chrome.runtime.lastError.message);
      // update persistent status above the enable checkbox (green when enabled)
      updateAutoStatus(enabled, minutes);
    });
  });

  autoInterval.addEventListener('change', ()=>{
    const minutes = Math.max(1, parseInt(autoInterval.value,10) || 10);
    const enabled = !!autoEnable.checked;
    const type = autoType ? (autoType.value || 'quote') : 'quote';
    chrome.storage.sync.set({autoMinutes: minutes, autoType: type}, ()=>{});
    if(enabled){
      chrome.runtime.sendMessage({action:'setAlarm', enabled:true, minutes}, (resp)=>{
        if(chrome.runtime.lastError) console.warn('setAlarm error', chrome.runtime.lastError.message);
        // update persistent status text to show new interval without transient toast
        updateAutoStatus(enabled, minutes);
      });
    }
  });
}

if(autoType){
  autoType.addEventListener('change', ()=>{
    const type = autoType.value || 'quote';
    chrome.storage.sync.set({autoType: type}, ()=>{});
    showPopupMessage('Auto content set: ' + type, 1200);
  });
}

// Play Lottie animation across the user's screen (inject into active tab)
if(btnScreen){
  btnScreen.addEventListener('click', ()=>{
    console.log('Play on screen button clicked');
    chrome.tabs.query({active:true, currentWindow:true}, (tabs)=>{
      if(!tabs || !tabs[0]) return;
      const active = tabs[0];
      const lottieUrl = chrome.runtime.getURL('src/lottie.min.js');
      const animUrl = chrome.runtime.getURL('assets/Baby Camel.json');

      const doInject = (targetTabId) => {
        // fetch a random quote to pass into the injected script
        // choose content type for manual play: prefer the selector, fallback to quotes
        const chosenType = (autoType && autoType.value) ? autoType.value : 'quote';
        let randomQuote = 'Keep going!';
        if(chosenType === 'joke'){
          if(jokes && jokes.length>0) randomQuote = getNextJoke() || jokes[Math.floor(Math.random()*jokes.length)];
        } else {
          if(quotes && quotes.length>0) randomQuote = getNextQuote() || quotes[Math.floor(Math.random()*quotes.length)];
        }
        
        // Inject Lottie and the shared injector, then call the injector starter
        chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          world: 'MAIN',
          files: ['src/lottie.min.js', 'src/injector.js']
        }, (res) => {
          if(chrome.runtime.lastError){
            const msg = chrome.runtime.lastError.message || '';
            console.error('[Chrome Extension] Failed to inject library or injector:', msg);
            // Provide clearer user-facing guidance depending on the error
            if(/extensions gallery cannot be scripted|extensions gallery/i.test(msg)){
              showErrorPanel('Cannot inject animation on this page: extensions gallery', 'This page (Chrome Web Store or similar) blocks script injection. Open a normal website (https://) and try again.');
            } else if(/file:|file:\/\//i.test(msg) || /^file:\/\//i.test(msg)){
              showErrorPanel('Cannot inject into local files', 'Local file URLs (file://) are blocked by default. To allow injection on local files, enable "Allow access to file URLs" for this extension on the Extensions page.');
            } else if(/Cannot access contents of the page|cannot access/i.test(msg)){
              showErrorPanel('Page restricts script injection', msg);
            } else {
              showErrorPanel('Failed to inject animation library', msg || 'Unknown error while injecting required script files.');
            }
            return;
          }

          // call the global starter exposed by injector.js
          chrome.scripting.executeScript({
            target: { tabId: targetTabId },
            world: 'MAIN',
            func: (animUrlArg, quoteText) => {
              try{
                if(window && window.__extStartCamel){
                  window.__extStartCamel(animUrlArg, quoteText);
                } else {
                  console.error('[Chrome Extension] __extStartCamel not found');
                }
              }catch(e){ console.error('starter call error', e); }
            },
            args: [animUrl, randomQuote]
          }, (results) => {
            if(chrome.runtime.lastError){
              const errorMsg = chrome.runtime.lastError.message || 'Unknown error';
              console.error('Injection failed:', errorMsg);
              // Try to explain common causes
              if(/extensions gallery cannot be scripted|extensions gallery/i.test(errorMsg)){
                showErrorPanel('Animation blocked on this page', 'The extensions gallery (Chrome Web Store) or similar pages cannot be scripted by extensions. Open a normal website and try again.');
              } else if(/Cannot access|not allowed|blocked/i.test(errorMsg)){
                showErrorPanel('Injection blocked by the page', errorMsg);
              } else {
                showErrorPanel('Animation failed to start', errorMsg);
              }
            } else {
              console.log('Injection started successfully');
              showPopupMessage('✅ Animation started!', 1500);
              try{ window.close(); }catch(e){ console.warn('Could not close popup', e); }
            }
          });
        });
      };

      const url = active.url || '';
      
      // Check for restricted URLs that cannot be scripted
      const restrictedPatterns = [
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^edge:\/\//i,
        /^about:/i,
        /^file:\/\//i,
        /^view-source:/i,
        /chrome\.google\.com\/webstore/i,
        /microsoftedge\.microsoft\.com\/addons/i
      ];
      
      const isRestricted = restrictedPatterns.some(pattern => pattern.test(url));
      const isHttp = /^https?:\/\//i.test(url);
      
      if(isRestricted || !isHttp){
        // Show actionable error panel with suggestions
        let shortMsg = 'Cannot inject animation on this page';
        let details = '';
        if(/^chrome:\/\//i.test(url) || /^edge:\/\//i.test(url)){
          shortMsg = 'Browser internal page';
          details = 'This is a browser internal page (chrome://, edge://, about:). Extensions cannot inject scripts into these pages.';
        } else if(/webstore|addons/i.test(url)){
          shortMsg = 'Extensions gallery cannot be scripted';
          details = 'This page (Chrome Web Store or Edge Add-ons) blocks script injection. Open a normal website (https://) and try again.';
        } else if(/^file:\/\//i.test(url)){
          shortMsg = 'Local files are blocked';
          details = 'Local file URLs (file://) are disabled by default for script injection. You can enable "Allow access to file URLs" for this extension on the Extensions page.';
        } else {
          shortMsg = 'Unsupported URL type';
          details = 'This URL type is not supported for script injection. Try opening any http/https website (e.g., https://wikipedia.org) and play the animation there.';
        }

        console.warn('Cannot inject on restricted page:', url);
        showErrorPanel(shortMsg, details + '\n\nURL: ' + url);
      } else {
        doInject(active.id);
      }
    });
  });
}


// small helper to show a temporary visible message inside the popup
function showPopupMessage(text, timeout = 3500){
  try{
    let container = document.getElementById('popup-msg');
    if(!container){
      container = document.createElement('div');
      container.id = 'popup-msg';
      container.className = 'toast';
      const parent = document.querySelector('.container') || document.body;
      parent.insertBefore(container, parent.firstChild);
    }
    container.textContent = text;
    container.classList.remove('toast-hidden');
    if(timeout > 0){
      setTimeout(()=>{
        try{ container.classList.add('toast-hidden'); }catch(e){}
      }, timeout);
    }
  }catch(e){ console.warn('showPopupMessage error', e); }
}

// Show a persistent error panel with optional technical details and action buttons
function showErrorPanel(message, details){
  try{
    // hide transient popup message if present
    const tmp = document.getElementById('popup-msg');
    if(tmp) tmp.classList.add('toast-hidden');

    if(!errorPanel) return console.warn('Error panel element not found');
    errorMsgEl.textContent = message || 'Error';
    if(details){
      errorDetailsEl.textContent = details;
      errorDetailsEl.hidden = false;
    } else {
      errorDetailsEl.hidden = true;
    }
    errorPanel.hidden = false;
  }catch(e){ console.warn('showErrorPanel failure', e); }
}

function hideErrorPanel(){
  try{ if(errorPanel) errorPanel.hidden = true; }catch(e){}
}

// Error panel action buttons
if(btnOpenSite){
  btnOpenSite.addEventListener('click', ()=>{
    chrome.tabs.create({url:'https://wikipedia.org'});
  });
}

if(btnExtensionDetails){
  btnExtensionDetails.addEventListener('click', ()=>{
    // Open the Extensions page so user can inspect permissions and allow file URLs
    try{ chrome.tabs.create({url: 'chrome://extensions/?id=' + chrome.runtime.id}); }catch(e){ try{ chrome.tabs.create({url:'chrome://extensions/'}); }catch(_){}}
  });
}

if(btnEnableFileUrls){
  btnEnableFileUrls.addEventListener('click', ()=>{
    // Show short instructions in the details area (can't programmatically toggle the setting)
    const instr = 'To enable access to local files:\n1) Open Extensions (chrome://extensions/)\n2) Find this extension and click "Details"\n3) Enable "Allow access to file URLs"\n\nThen reload the local file page and try again.';
    showErrorPanel('How to allow access to local files', instr);
  });
}

// Update the persistent auto status area (keeps visible; green when enabled)
function updateAutoStatus(enabled, minutes){
  try{
    if(!autoStatusEl || !statusTextEl) return;
    const mins = Math.max(1, parseInt(minutes,10) || 10);
    if(enabled){
      statusTextEl.textContent = ' — every ' + mins + ' min';
      autoStatusEl.classList.add('enabled');
      autoStatusEl.classList.remove('disabled');
      autoStatusEl.hidden = false;
    } else {
      statusTextEl.textContent = ' — disabled';
      autoStatusEl.classList.add('disabled');
      autoStatusEl.classList.remove('enabled');
      autoStatusEl.hidden = false;
    }
  }catch(e){ console.warn('updateAutoStatus', e); }
}
