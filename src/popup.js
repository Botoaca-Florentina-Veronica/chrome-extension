/* Popup logic: load local JSON data and show a random item */

const btnJoke = document.getElementById('btn-joke');
const btnQuote = document.getElementById('btn-quote');
const btnNext = document.getElementById('btn-next');
const btnCopy = document.getElementById('btn-copy');
const btnScreen = document.getElementById('btn-screen');
const display = document.getElementById('display');
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
    memeImg.src = chrome.runtime.getURL('assets/memes/' + m);
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
}).catch(err=>{
  display.textContent = 'Failed to load data.';
  console.error(err);
});

// Play Lottie animation across the user's screen (inject into active tab)
if(btnScreen){
  btnScreen.addEventListener('click', ()=>{
    console.log('Play on screen button clicked');
    chrome.tabs.query({active:true, currentWindow:true}, (tabs)=>{
      if(!tabs || !tabs[0]) return;
      const active = tabs[0];
      const lottieUrl = chrome.runtime.getURL('src/lottie.min.js');
      const animUrl = chrome.runtime.getURL('assets/memes/Baby Camel.json');

      const doInject = (targetTabId) => {
        // fetch a random quote to pass into the injected script
        const randomQuote = quotes && quotes.length > 0 ? quotes[Math.floor(Math.random() * quotes.length)] : 'Keep going!';
        
        // First try to inject the Lottie library file directly using the Scripting API.
        // This avoids appending a <script> tag to the page (which many sites block via CSP).
        chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          world: 'MAIN',
          files: ['src/lottie.min.js']
        }, (res) => {
          if(chrome.runtime.lastError){
            console.error('[Chrome Extension] Failed to inject lottie library:', chrome.runtime.lastError.message);
            showPopupMessage('Failed to inject animation library: ' + chrome.runtime.lastError.message, 6000);
            return;
          }

          // Now run the original injector function (it expects window.lottie to be present)
          chrome.scripting.executeScript({
            target: { tabId: targetTabId },
            world: 'MAIN',
            func: (lottieUrlArg, animUrlArg, quoteText) => {
              try {
                console.log('[Chrome Extension] Starting animation injection...');
                console.log('[Chrome Extension] Current URL:', window.location.href);
                console.log('[Chrome Extension] Document ready state:', document.readyState);
                
                if(document.getElementById('ext-lottie-container')) {
                  console.warn('[Chrome Extension] Animation already exists on page');
                  return;
                }
                const size = 220;
                const boxWidth = 300;
                const boxHeight = 120;
                const ropeLength = 80;
                const ropeExtra = 60; // extra length so rope visually connects to the camel
                
                // create a single container that moves all elements together
                const container = document.createElement('div');
                container.id = 'ext-lottie-container';
                container.style.cssText = '' +
                  'position:fixed;' +
                  'top:50%;' +
                  'left:0px;' +
                  'transform:translateY(-50%) translateX(-' + (size + ropeLength + boxWidth) + 'px);' +
                  'z-index:2147483647!important;' +
                  'pointer-events:none;' +
                  'width:' + (size + ropeLength + boxWidth + ropeExtra) + 'px;' +
                  'height:' + Math.max(size, boxHeight) + 'px;' +
                  'overflow:visible;';
                
                // create white quote box (leftmost in container)
                const quoteBox = document.createElement('div');
                quoteBox.id = 'ext-quote-box';
                quoteBox.style.cssText = '' +
                  'position:absolute;' +
                  'top:50%;' +
                  'left:0px;' +
                  'transform:translateY(-50%);' +
                  'width:' + boxWidth + 'px;' +
                  'height:' + boxHeight + 'px;' +
                  'pointer-events:none;' +
                  'background:#ffffff;' +
                  'border:2px solid #333;' +
                  'border-radius:8px;' +
                  'box-shadow:0 4px 12px rgba(0,0,0,0.2);' +
                  'padding:16px;' +
                  'display:flex;' +
                  'align-items:center;' +
                  'justify-content:center;' +
                  'text-align:center;' +
                  'font-family:Arial,Helvetica,sans-serif;' +
                  'font-size:14px;' +
                  'line-height:1.4;' +
                  'color:#333;' +
                  'overflow:hidden;' +
                  'box-sizing:border-box;';
                quoteBox.textContent = quoteText;
                container.appendChild(quoteBox);
                
                // create SVG rope (middle in container)
                const rope = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                rope.id = 'ext-rope-line';
                rope.style.cssText = '' +
                  'position:absolute;' +
                  'top:50%;' +
                  'left:' + boxWidth + 'px;' +
                  'transform:translateY(-50%);' +
                  'width:' + (ropeLength + ropeExtra) + 'px;' +
                  'height:50px;' +
                  'pointer-events:none;' +
                  'overflow:visible;';
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('stroke', '#8B4513');
                line.setAttribute('stroke-width', '3');
                line.setAttribute('stroke-dasharray', '8 4');
                line.setAttribute('x1', '0');
                line.setAttribute('y1', '25');
                // extend rope slightly into the camel area so it visually touches the body
                line.setAttribute('x2', ropeLength + ropeExtra);
                line.setAttribute('y2', '25');
                rope.appendChild(line);
                container.appendChild(rope);

                // create camel overlay (rightmost in container)
                const overlay = document.createElement('div');
                overlay.id = 'ext-lottie-overlay';
                overlay.style.cssText = '' +
                  'position:absolute;' +
                  'top:50%;' +
                  'left:' + (boxWidth + ropeLength) + 'px;' +
                  'transform:translateY(-50%);' +
                  'width:' + size + 'px;' +
                  'height:' + size + 'px;' +
                  'pointer-events:none;' +
                  'overflow:visible;' +
                  'background:transparent;' +
                  'display:block;';
                container.appendChild(overlay);
                
                try{
                  (document.body || document.documentElement).appendChild(container);
                }catch(e){ document.documentElement.appendChild(container); }

                function startAnimationWithData(animationData){
                  try{
                    // create player and make it loop while moving
                    const anim = window.lottie.loadAnimation({
                      container: overlay,
                      renderer: 'svg',
                      loop: true,
                      autoplay: true,
                      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
                      animationData: animationData
                    });

                    // create fullscreen blur layer under the overlay to blur the page
                    // and block user interaction while the animation runs
                    let blurLayer = null;
                    let fallbackFiltered = [];
                    const blockingListeners = [];
                    function addInteractionBlockers(){
                      const block = (e) => { try{ e.stopPropagation(); e.preventDefault(); }catch(_){}}
                      const opts = { capture: true, passive: false };
                      ['click','mousedown','mouseup','pointerdown','pointerup','touchstart','touchend','wheel'].forEach(ev=>{
                        document.addEventListener(ev, block, opts);
                        blockingListeners.push({ev, fn: block, opts});
                      });
                      // block basic keyboard interactions (space/enter/tab etc.)
                      const blockKey = (e) => { try{ e.stopPropagation(); e.preventDefault(); }catch(_){}};
                      document.addEventListener('keydown', blockKey, { capture:true });
                      blockingListeners.push({ ev: 'keydown', fn: blockKey, opts: { capture:true } });
                      // also prevent scrolling via touch on mobile
                      document.addEventListener('touchmove', block, opts);
                      blockingListeners.push({ ev: 'touchmove', fn: block, opts });
                    }
                    function removeInteractionBlockers(){
                      for(const item of blockingListeners){
                        try{ document.removeEventListener(item.ev, item.fn, item.opts); }catch(e){}
                      }
                      blockingListeners.length = 0;
                    }

                    try{
                      blurLayer = document.createElement('div');
                      blurLayer.id = 'ext-blur-layer';
                      blurLayer.style.cssText = '' +
                        'position:fixed;' +
                        'inset:0px;' +
                        'background: rgba(255,255,255,0.02);' +
                        'backdrop-filter: blur(6px);' +
                        '-webkit-backdrop-filter: blur(6px);' +
                        'z-index:2147483646!important;' +
                        'pointer-events:auto;' +
                        'touch-action:none;' +
                        'opacity:1;' +
                        'transition:opacity 300ms linear;';
                      try{ (document.body || document.documentElement).appendChild(blurLayer); }
                      catch(e){ document.documentElement.appendChild(blurLayer); }
                      // detect if backdrop-filter was applied (best-effort)
                      const hasBackdrop = CSS && CSS.supports && (CSS.supports('backdrop-filter','blur(1px)') || CSS.supports('-webkit-backdrop-filter','blur(1px)'));
                      if(!hasBackdrop){
                        // fallback: apply filter to main children except overlay and blurLayer
                        const root = document.body || document.documentElement;
                        for(const child of Array.from(root.children)){
                          if(child === overlay || child === blurLayer) continue;
                          try{ fallbackFiltered.push({el: child, old: child.style.filter}); child.style.filter = (child.style.filter ? child.style.filter + ' ' : '') + 'blur(6px)'; }catch(e){}
                        }
                      }
                      // add interaction blockers so clicks/scrolls/keys don't affect the page
                      addInteractionBlockers();
                    }catch(e){ blurLayer = null; }

                    // ensure playback started and slow down the Lottie playback slightly for readability
                    try{ if(anim && anim.play) anim.play(); }catch(e){}
                    try{ if(anim && anim.setSpeed) anim.setSpeed(0.7); }catch(e){}

                    // animate the entire container from left to right (slower)
                    const vw = window.innerWidth || document.documentElement.clientWidth;
                    // increased duration so the banner is easier to read
                    const durationMs = 18000;
                    
                    container.style.willChange = 'transform';
                    const containerWidth = size + ropeLength + boxWidth;
                    const startPos = 'translateY(-50%) translateX(-' + containerWidth + 'px)';
                    // move to viewport width + container width so the whole container leaves the screen
                    const endPos = 'translateY(-50%) translateX(' + (vw + containerWidth) + 'px)';

                    const move = container.animate([
                      { transform: startPos },
                      { transform: endPos }
                    ], {
                      duration: durationMs,
                      easing: 'linear',
                      fill: 'forwards'
                    });

                  // monitor position so we can remove the blur as soon as the container fully leaves the viewport
                  const vwCheck = window.innerWidth || document.documentElement.clientWidth;
                  const monitorInterval = setInterval(()=>{
                    try{
                      const rect = container.getBoundingClientRect();
                      // when the container's left edge is beyond the viewport, it's fully off-screen
                      if(rect.left >= vwCheck){
                        clearInterval(monitorInterval);
                        if(blurLayer){
                          try{ blurLayer.style.opacity = '0'; }catch(e){}
                          // remove interaction blockers and the blur after the fade
                          setTimeout(()=>{
                            try{ removeInteractionBlockers(); }catch(e){}
                            try{ if(blurLayer.parentNode) blurLayer.remove(); }catch(e){}
                          }, 320);
                        } else {
                          try{ removeInteractionBlockers(); }catch(e){}
                        }
                      }
                    }catch(e){}
                  }, 100);

                  move.onfinish = () => {
                    clearInterval(monitorInterval);
                      try{
                        if(anim){
                          try{ anim.loop = false; }catch(e){}
                          try{ anim.pause(); }catch(e){}
                          try{ if(anim.destroy) anim.destroy(); }catch(e){}
                        }
                      } catch(e){}
                      try{ container.remove(); }catch(e){}
                    try{
                      // ensure blockers removed and blur removed if still present
                      try{ removeInteractionBlockers(); }catch(e){}
                      if(blurLayer && blurLayer.parentNode) blurLayer.remove();
                      // restore fallback filtered elements
                      for(const item of fallbackFiltered){ try{ item.el.style.filter = item.old || ''; }catch(e){} }
                    }catch(e){}
                    };
                    }catch(e){ console.error('lottie play error', e); try{ container.remove(); }catch(_){} }
                }

                // This function assumes window.lottie is already available (we injected it).
                function ensureLottieAndPlay(){
                  if(window.lottie){
                    fetch(animUrlArg).then(r=>r.json()).then(data=>{
                      startAnimationWithData(data);
                    }).catch(err=>{
                      console.error('[Chrome Extension] Failed to fetch animation data:', err);
                      try{ container.remove(); }catch(e){}
                    });
                  } else {
                    console.error('[Chrome Extension] Lottie not present after file injection');
                    try{ container.remove(); }catch(e){}
                  }
                }

                ensureLottieAndPlay();
              } catch (e) { 
                console.error('[Chrome Extension] Fatal error during injection:', e);
                alert('Chrome Extension Error: ' + e.message + '\n\nThis site may block extensions. Check the browser console (F12) for details.');
              }
            },
            args: [lottieUrl, animUrl, randomQuote]
          }, (results) => {
            if(chrome.runtime.lastError){
              const errorMsg = chrome.runtime.lastError.message || 'Unknown error';
              console.error('Injection failed:', errorMsg);
              
              let displayMsg = '❌ Animation failed to start\n\n';
              
              // Provide specific guidance for common errors
              if(errorMsg.includes('Cannot access') || errorMsg.includes('cannot be scripted')){
                displayMsg += '🔒 This page is protected by the browser.\n\n';
                displayMsg += 'Common protected pages:\n';
                displayMsg += '• chrome:// or edge:// pages\n';
                displayMsg += '• Chrome Web Store\n';
                displayMsg += '• Browser settings\n';
                displayMsg += '• PDF viewer\n\n';
                displayMsg += '✅ Solution: Open any regular website (google.com, youtube.com, etc.)';
              } else if(errorMsg.includes('Frame') || errorMsg.includes('frame')){
                displayMsg += '🖼️ Cannot inject into iframes or special frames.\n\n';
                displayMsg += '✅ Solution: Click on the main page area and try again.';
              } else if(errorMsg.includes('No tab') || errorMsg.includes('tab')){
                displayMsg += '📑 Tab not found or closed.\n\n';
                displayMsg += '✅ Solution: Reopen the page and try again.';
              } else {
                displayMsg += '⚠️ Error: ' + errorMsg + '\n\n';
                displayMsg += '✅ Try:\n';
                displayMsg += '1. Refresh the page (F5)\n';
                displayMsg += '2. Reload extension at chrome://extensions\n';
                displayMsg += '3. Test on wikipedia.org';
              }
              
              showPopupMessage(displayMsg, 7000);
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
