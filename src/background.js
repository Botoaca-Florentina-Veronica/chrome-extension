// Background service worker - placeholder
chrome.runtime.onInstalled.addListener(() => {
  console.log('Jokes & Quotes extension installed');
});

// Listen for messages from popup to set/clear alarms
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if(!msg || !msg.action) return;
  if(msg.action === 'setAlarm'){
    const enabled = !!msg.enabled;
    const minutes = Math.max(1, parseInt(msg.minutes, 10) || 10);
    if(enabled){
      chrome.alarms.create('autoPlay', { periodInMinutes: minutes });
      chrome.storage.sync.set({ autoEnabled: true, autoMinutes: minutes }, ()=>{});
      console.log('AutoPlay alarm set:', minutes, 'min');
      sendResponse({ok:true});
    } else {
      chrome.alarms.clear('autoPlay', (wasCleared)=>{
        chrome.storage.sync.set({ autoEnabled: false }, ()=>{});
        console.log('AutoPlay alarm cleared');
        sendResponse({ok: wasCleared});
      });
    }
    // indicate we'll respond asynchronously
    return true;
  }
});

// helper to inject animation into a specific tab
async function triggerAnimationOnTab(tab){
  if(!tab || !tab.id || !tab.url) return;
  const url = tab.url || '';
  if(!/^https?:\/\//i.test(url)) return;
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
  if(restrictedPatterns.some(p=>p.test(url))) return;

  try{
    // determine whether user prefers quotes or jokes for auto-play
    chrome.storage.sync.get({ autoType: 'quote' }, async (items) => {
      const type = items && items.autoType ? items.autoType : 'quote';
      // fetch a random item from the chosen dataset
      let text = 'Keep going!';
      try{
        const path = type === 'joke' ? 'data/jokes.json' : 'data/quotes.json';
        const resp = await fetch(chrome.runtime.getURL(path));
        const arr = await resp.json();
        if(Array.isArray(arr) && arr.length>0){ text = arr[Math.floor(Math.random()*arr.length)]; }
      }catch(e){ console.warn('Could not load data for alarm', e); }

      const animUrl = chrome.runtime.getURL('assets/Baby Camel.json');
      // inject lottie and injector, then call starter
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        files: ['src/lottie.min.js', 'src/injector.js']
      }, (res)=>{
        if(chrome.runtime.lastError){ console.warn('Alarm injection failed (library):', chrome.runtime.lastError.message); return; }
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: (animUrlArg, quoteText) => {
            try{ if(window && window.__extStartCamel) window.__extStartCamel(animUrlArg, quoteText); }
            catch(e){ console.error('alarm starter call error', e); }
          },
          args: [animUrl, text]
        }, (r)=>{
          if(chrome.runtime.lastError){ console.warn('Alarm injection failed (starter):', chrome.runtime.lastError.message); }
        });
      });
    });
  }catch(e){ console.error('triggerAnimationOnTab error', e); }
}

// Alarm fired -> inject into active tab of last focused window
chrome.alarms.onAlarm.addListener((alarm)=>{
  if(!alarm || alarm.name !== 'autoPlay') return;
  chrome.tabs.query({active:true, lastFocusedWindow:true}, (tabs)=>{
    if(!tabs || !tabs[0]) return;
    triggerAnimationOnTab(tabs[0]);
  });
});
