/* Popup logic: load local JSON data and show a random item */

const btnJoke = document.getElementById('btn-joke');
const btnQuote = document.getElementById('btn-quote');
const btnMeme = document.getElementById('btn-meme');
const btnNext = document.getElementById('btn-next');
const btnCopy = document.getElementById('btn-copy');
const display = document.getElementById('display');
const memeWrap = document.getElementById('meme-wrap');
const memeImg = document.getElementById('meme-img');

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
  // show initial random joke
  showJoke();
}).catch(err=>{
  display.textContent = 'Failed to load data.';
  console.error(err);
});
