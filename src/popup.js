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
// animation in popup removed — no popup lottie container

let jokes = [];
let quotes = [];
let memes = [];
let currentType = 'joke';
let currentItem = null;

function rand(arr){
  if(!arr || arr.length===0) return null;
  return arr[Math.floor(Math.random()*arr.length)];
}

async function loadData(){
  const jResp = await fetch(chrome.runtime.getURL('data/jokes.json'));
  jokes = await jResp.json();
  const qResp = await fetch(chrome.runtime.getURL('data/quotes.json'));
  quotes = await qResp.json();
  const mResp = await fetch(chrome.runtime.getURL('data/memes.json'));
  memes = await mResp.json();
}

function showJoke(){
  memeWrap.hidden = true;
  const j = rand(jokes);
  currentType = 'joke';
  currentItem = j;
  display.textContent = j || 'No jokes available.';
}

function showQuote(){
  memeWrap.hidden = true;
  const q = rand(quotes);
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
      showPopupMessage(enabled ? ('Auto animation enabled, every ' + minutes + ' min') : 'Auto animation disabled', 2000);
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
        showPopupMessage('Auto interval updated: ' + minutes + ' min', 2000);
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
          if(jokes && jokes.length>0) randomQuote = jokes[Math.floor(Math.random()*jokes.length)];
        } else {
          if(quotes && quotes.length>0) randomQuote = quotes[Math.floor(Math.random()*quotes.length)];
        }
        
        // Inject Lottie and the shared injector, then call the injector starter
        chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          world: 'MAIN',
          files: ['src/lottie.min.js', 'src/injector.js']
        }, (res) => {
          if(chrome.runtime.lastError){
            console.error('[Chrome Extension] Failed to inject library or injector:', chrome.runtime.lastError.message);
            showPopupMessage('Failed to inject animation library: ' + chrome.runtime.lastError.message, 6000);
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
              showPopupMessage('❌ Animation failed to start: ' + errorMsg, 6000);
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
        let msg = '❌ Cannot inject animation on this page.\n\n';
        
        if(/^chrome:\/\//i.test(url) || /^edge:\/\//i.test(url)){
          msg += '🔒 This is a browser internal page.\n';
        } else if(/webstore|addons/i.test(url)){
          msg += '🏪 The extensions gallery cannot be scripted.\n';
        } else if(/^file:\/\//i.test(url)){
          msg += '📁 Local files are not supported.\n';
        } else {
          msg += '🚫 This URL type is not supported.\n';
        }
        
        msg += '\n✅ Please open a regular website:\n• google.com\n• youtube.com\n• wikipedia.org\n• any http/https website';
        
        console.warn('Cannot inject on restricted page:', url);
        showPopupMessage(msg, 6000);
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
