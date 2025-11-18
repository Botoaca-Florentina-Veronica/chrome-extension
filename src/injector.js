// Page-level injector used by both popup and background to start the camel animation
(function(){
  // attach global starter so callers can invoke it after lottie is injected
  window.__extStartCamel = function(animUrlArg, quoteText){
    try {
      console.log('[Chrome Extension] __extStartCamel invoked');
      if(document.getElementById('ext-lottie-container')) {
        console.warn('[Chrome Extension] Animation already exists on page');
        return;
      }
      const size = 220;
      const boxWidth = 300;
      const boxHeight = 120;
      const ropeLength = 80;
      const ropeExtra = 60; // extra length so rope visually connects to the camel

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
      quoteBox.textContent = quoteText || 'Keep going!';
      container.appendChild(quoteBox);

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
      line.setAttribute('x2', ropeLength + ropeExtra);
      line.setAttribute('y2', '25');
      rope.appendChild(line);
      container.appendChild(rope);

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

      try{ (document.body || document.documentElement).appendChild(container); }
      catch(e){ document.documentElement.appendChild(container); }

      function startAnimationWithData(animationData){
        try{
          const anim = window.lottie.loadAnimation({
            container: overlay,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
            animationData: animationData
          });

          let blurLayer = null;
          let fallbackFiltered = [];
          const blockingListeners = [];
          function addInteractionBlockers(){
            const block = (e) => { try{ e.stopPropagation(); e.preventDefault(); }catch(_){} }
            const opts = { capture: true, passive: false };
            ['click','mousedown','mouseup','pointerdown','pointerup','touchstart','touchend','wheel'].forEach(ev=>{
              document.addEventListener(ev, block, opts);
              blockingListeners.push({ev, fn: block, opts});
            });
            const blockKey = (e) => { try{ e.stopPropagation(); e.preventDefault(); }catch(_){}};
            document.addEventListener('keydown', blockKey, { capture:true });
            blockingListeners.push({ ev: 'keydown', fn: blockKey, opts: { capture:true } });
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
            const hasBackdrop = CSS && CSS.supports && (CSS.supports('backdrop-filter','blur(1px)') || CSS.supports('-webkit-backdrop-filter','blur(1px)'));
            if(!hasBackdrop){
              const root = document.body || document.documentElement;
              for(const child of Array.from(root.children)){
                if(child === overlay || child === blurLayer) continue;
                try{ fallbackFiltered.push({el: child, old: child.style.filter}); child.style.filter = (child.style.filter ? child.style.filter + ' ' : '') + 'blur(6px)'; }catch(e){}
              }
            }
            addInteractionBlockers();
          }catch(e){ blurLayer = null; }

          try{ if(anim && anim.play) anim.play(); }catch(e){}
          try{ if(anim && anim.setSpeed) anim.setSpeed(0.7); }catch(e){}

          const vw = window.innerWidth || document.documentElement.clientWidth;
          const durationMs = 18000;

          container.style.willChange = 'transform';
          const containerWidth = size + ropeLength + boxWidth;
          const startPos = 'translateY(-50%) translateX(-' + containerWidth + 'px)';
          const endPos = 'translateY(-50%) translateX(' + (vw + containerWidth) + 'px)';

          const move = container.animate([
            { transform: startPos },
            { transform: endPos }
          ], {
            duration: durationMs,
            easing: 'linear',
            fill: 'forwards'
          });

          const vwCheck = window.innerWidth || document.documentElement.clientWidth;
          const monitorInterval = setInterval(()=>{
            try{
              const rect = container.getBoundingClientRect();
              if(rect.left >= vwCheck){
                clearInterval(monitorInterval);
                if(blurLayer){
                  try{ blurLayer.style.opacity = '0'; }catch(e){}
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
              if(anim){ try{ anim.loop = false; }catch(e){} try{ anim.pause(); }catch(e){} try{ if(anim.destroy) anim.destroy(); }catch(e){} }
            } catch(e){}
            try{ container.remove(); }catch(e){}
            try{ removeInteractionBlockers(); }catch(e){}
            if(blurLayer && blurLayer.parentNode) blurLayer.remove();
            for(const item of fallbackFiltered){ try{ item.el.style.filter = item.old || ''; }catch(e){} }
          };
        }catch(e){ console.error('lottie play error', e); try{ container.remove(); }catch(_){} }
      }

      if(window.lottie){
        fetch(animUrlArg).then(r=>r.json()).then(data=>{ startAnimationWithData(data); }).catch(err=>{ console.error('[Chrome Extension] Failed to fetch animation data:', err); try{ container.remove(); }catch(e){} });
      } else {
        console.error('[Chrome Extension] Lottie not present when __extStartCamel called');
        try{ container.remove(); }catch(e){}
      }
    } catch (e) {
      console.error('[Chrome Extension] __extStartCamel fatal:', e);
    }
  };
})();
