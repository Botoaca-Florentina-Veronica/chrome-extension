/* Popup logic: load local JSON data and show a random item */

const btnJoke = document.getElementById('btn-joke');
const btnQuote = document.getElementById('btn-quote');
const btnMeme = document.getElementById('btn-meme');
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
btnMeme.addEventListener('click', showMeme);
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
        
        chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          world: 'MAIN',
          func: (lottieUrlArg, animUrlArg, quoteText) => {
            try {
              if(document.getElementById('ext-lottie-container')) return;
              const size = 220;
              const boxWidth = 300;
              const boxHeight = 120;
              const ropeLength = 80;
              
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
                'width:' + (size + ropeLength + boxWidth) + 'px;' +
                'height:' + Math.max(size, boxHeight) + 'px;';
              
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
                'width:' + ropeLength + 'px;' +
                'height:50px;' +
                'pointer-events:none;' +
                'overflow:visible;';
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('stroke', '#8B4513');
              line.setAttribute('stroke-width', '3');
              line.setAttribute('stroke-dasharray', '8 4');
              line.setAttribute('x1', '0');
              line.setAttribute('y1', '25');
              line.setAttribute('x2', ropeLength);
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
                  let blurLayer = null;
                  let fallbackFiltered = [];
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
                      'pointer-events:none;';
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

                  move.onfinish = () => {
                    try{
                      if(anim){
                        try{ anim.loop = false; }catch(e){}
                        try{ anim.pause(); }catch(e){}
                        try{ if(anim.destroy) anim.destroy(); }catch(e){}
                      }
                    } catch(e){}
                    try{ container.remove(); }catch(e){}
                    try{
                      if(blurLayer && blurLayer.parentNode) blurLayer.remove();
                      // restore fallback filtered elements
                      for(const item of fallbackFiltered){ try{ item.el.style.filter = item.old || ''; }catch(e){} }
                    }catch(e){}
                  };
                  }catch(e){ console.error('lottie play error', e); try{ container.remove(); }catch(_){} }
              }

              function ensureLottieAndPlay(){
                if(window.lottie){
                  fetch(animUrlArg).then(r=>r.json()).then(data=>startAnimationWithData(data)).catch(err=>{console.error('fetch anim failed', err); container.remove();});
                } else {
                  const s = document.createElement('script');
                  s.src = lottieUrlArg;
                  s.onload = () => {
                    fetch(animUrlArg).then(r=>r.json()).then(data=>startAnimationWithData(data)).catch(err=>{console.error('fetch anim failed', err); container.remove();});
                  };
                  s.onerror = () => { console.error('Failed to load lottie'); container.remove(); };
                  document.head.appendChild(s);
                }
              }

              ensureLottieAndPlay();
            } catch (e) { console.error(e); }
          },
          args: [lottieUrl, animUrl, randomQuote]
        }, (results) => {
          if(chrome.runtime.lastError){
            console.error('Injection failed:', chrome.runtime.lastError.message);
            showPopupMessage('Injection failed: ' + chrome.runtime.lastError.message);
          } else {
            console.log('Injection started successfully');
            showPopupMessage('Animation started on page');
            try{ window.close(); }catch(e){ console.warn('Could not close popup', e); }
          }
        });
      };

      const url = active.url || '';
      const isHttp = /^https?:\/\//i.test(url);
      if(isHttp){
        doInject(active.id);
      } else {
        const msg = 'Cannot inject into this page. Open a regular web page (http/https) and press Play on screen again.';
        console.warn(msg, url || '(no url)');
        showPopupMessage(msg);
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
