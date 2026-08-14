const state = { items: [] };
let currentType = null;

const $ = (id) => document.getElementById(id);
const picker = $('itemPicker');
const modal = $('itemModal');
const modalBody = $('modalBody');
const typeInfo = {
  note: ['NOTE', 'Add a note', 'Write something they can open anytime.', 'textarea', 'Your message...'],
  photo: ['PHOTO', 'Add a photo', 'Choose an image. Small files work best for a share link.', 'file', ''],
  song: ['SONG', 'Add a song', 'Paste a Spotify, Apple Music, YouTube or other music link.', 'url', 'https://...'],
  video: ['VIDEO', 'Add a video', 'Paste a YouTube, Vimeo or other video link.', 'url', 'https://...'],
  voice: ['VOICE', 'Add a voice note', 'The browser records a short audio clip in this parcel.', 'record', ''],
  drawing: ['DRAWING', 'Add a doodle', 'Draw something tiny and save it with your parcel.', 'draw', ''],
  coupon: ['COUPON', 'Add a little promise', 'A homemade coupon, invitation or future plan.', 'text2', 'e.g. one pizza on me'],
  location: ['PLACE', 'Add a special place', 'Paste a Google Maps, Apple Maps or any place link. You can also add a name for the place.', 'location', 'https://maps.google.com/...']
};

function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(window.__toast); window.__toast = setTimeout(()=>t.classList.remove('show'), 2400); }
function escapeHTML(s='') { return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }

picker.addEventListener('click', (e) => { const b = e.target.closest('.item-type'); if(b) openModal(b.dataset.type); });

document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
$('saveItemBtn').addEventListener('click', saveCurrentItem);

function openModal(type) {
  currentType = type;
  const info = typeInfo[type];
  $('modalEyebrow').textContent = info[0];
  $('modalTitle').textContent = info[1];
  let html = `<p class="choice-note">${escapeHTML(info[2])}</p>`;
  if(info[3] === 'textarea') html += `<label class="field-label" style="margin-top:18px;">your note<textarea id="modalValue" placeholder="${info[4]}"></textarea></label>`;
  if(info[3] === 'url') html += `<label class="field-label" style="margin-top:18px;">link<input id="modalValue" type="url" placeholder="${info[4]}"></label><label class="field-label">caption<input id="modalCaption" maxlength="80" placeholder="A tiny caption (optional)"></label>`;
  if(info[3] === 'text2') html += `<label class="field-label" style="margin-top:18px;">details<input id="modalValue" maxlength="180" placeholder="${info[4]}"></label>`;
  if(info[3] === 'location') html += `<label class="field-label" style="margin-top:18px;">place name<input id="modalValue" maxlength="100" placeholder="e.g. our favourite café"></label><label class="field-label">place link<input id="modalLink" type="url" placeholder="${info[4]}"></label>`;
  if(info[3] === 'file') html += `<label class="field-label" style="margin-top:18px;">image<input id="modalFile" type="file" accept="image/*"></label><label class="field-label">caption<input id="modalCaption" maxlength="80" placeholder="A tiny caption (optional)"></label>`;
  if(info[3] === 'record') html += `<div style="margin-top:18px"><button class="button button-ghost" id="recordBtn">Start recording</button> <span id="recordStatus" style="color:var(--muted);font-size:.8rem"></span></div><div id="audioPreview" style="margin-top:12px"></div>`;
  if(info[3] === 'draw') html += `<div style="margin-top:18px"><canvas id="drawCanvas" width="800" height="450" style="width:100%;height:auto;border:1px solid var(--line);border-radius:14px;background:#fff;touch-action:none"></canvas><div style="display:flex;gap:8px;margin-top:10px"><button class="button button-ghost" type="button" id="clearDraw">Clear</button></div></div>`;
  modalBody.innerHTML = html;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  if(info[3] === 'record') setupRecorder();
  if(info[3] === 'draw') setupDrawing();
}
function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); currentType=null; window.mediaRecorder?.stop?.(); }

let recorder, recordedChunks=[];
function setupRecorder(){
  $('recordBtn').addEventListener('click', async ()=>{
    if(!recorder || recorder.state === 'inactive'){
      try { const stream=await navigator.mediaDevices.getUserMedia({audio:true}); recorder=new MediaRecorder(stream); recordedChunks=[]; recorder.ondataavailable=e=>{if(e.data.size) recordedChunks.push(e.data)}; recorder.onstop=()=>{const blob=new Blob(recordedChunks,{type:'audio/webm'}); window.recordedAudio=blob; $('audioPreview').innerHTML='<audio controls style="width:100%" src="'+URL.createObjectURL(blob)+'"></audio>'; stream.getTracks().forEach(t=>t.stop());}; recorder.start(); $('recordBtn').textContent='Stop recording'; $('recordStatus').textContent='recording…'; }
      catch(err){ $('recordStatus').textContent='Microphone access was not available.'; }
    } else { recorder.stop(); $('recordBtn').textContent='Record again'; $('recordStatus').textContent='ready'; }
  });
}

function setupDrawing(){
  const c=$('drawCanvas'),ctx=c.getContext('2d'); let down=false; ctx.strokeStyle='#2d3031';ctx.lineWidth=6;ctx.lineCap='round';
  const point=e=>{const r=c.getBoundingClientRect(); const x=(e.clientX-r.left)*(c.width/r.width), y=(e.clientY-r.top)*(c.height/r.height);return{x,y}};
  c.addEventListener('pointerdown',e=>{down=true;const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y)}); c.addEventListener('pointermove',e=>{if(!down)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke()}); c.addEventListener('pointerup',()=>down=false); c.addEventListener('pointerleave',()=>down=false);
  $('clearDraw').onclick=()=>ctx.clearRect(0,0,c.width,c.height);
}

async function saveCurrentItem(){
  if(!currentType) return;
  const info=typeInfo[currentType]; let item={type:currentType};
  if(info[3]==='textarea' || info[3]==='text2'){ item.value=$('modalValue').value.trim(); if(!item.value){toast('Add something first');return;} }
  if(info[3]==='location'){ item.value=$('modalValue').value.trim(); item.link=$('modalLink').value.trim(); if(!item.value && !item.link){toast('Add a place name or link first');return;} if(item.link && !/^https?:\/\//i.test(item.link)) { toast('Use a complete link starting with https://'); return; } }
  if(info[3]==='url'){ item.value=$('modalValue').value.trim(); item.caption=$('modalCaption').value.trim(); if(!item.value){toast('Add a link first');return;} }
  if(info[3]==='file'){ const f=$('modalFile').files[0]; if(!f){toast('Choose a photo first');return;} if(f.size>650000){toast('That photo is too large for a share link. Try a smaller one.');return;} item.value=await readDataURL(f); item.caption=$('modalCaption').value.trim(); }
  if(info[3]==='record'){ if(!window.recordedAudio){toast('Record a voice note first');return;} item.value=await readDataURL(window.recordedAudio); item.caption='voice note'; }
  if(info[3]==='draw'){ item.value=$('drawCanvas').toDataURL('image/png'); item.caption='drawing'; }
  state.items.push(item); render(); closeModal(); toast('Added to the parcel');
}
function readDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function labelFor(type){return ({note:'Note',photo:'Photo',song:'Song',video:'Video',voice:'Voice note',drawing:'Drawing',coupon:'Coupon',location:'Place'})[type]||type}
function iconFor(type){return ({note:'✎',photo:'▧',song:'♫',video:'▶',voice:'◉',drawing:'✧',coupon:'⌁',location:'⌖'})[type]||'•'}
function summarize(i){ if(i.type==='photo'||i.type==='drawing') return i.caption||'image attached'; if(i.type==='voice') return 'audio attached'; if(i.type==='location') return i.value || i.link || 'place'; return i.value }
function render(){
  $('itemCount').textContent=`${state.items.length} ${state.items.length===1?'item':'items'}`; $('footerCount').textContent=state.items.length;
  const list=$('itemsList'); const prev=$('previewItems');
  if(!state.items.length){ list.innerHTML='<div class="empty-list">Your parcel is empty. Pick something above to start.</div>'; prev.innerHTML='<span>your surprises will appear here</span>'; return; }
  list.innerHTML=state.items.map((i,idx)=>`<div class="item-row"><div class="row-icon">${iconFor(i.type)}</div><div class="row-main"><b>${labelFor(i.type)}</b><span>${escapeHTML(summarize(i))}</span></div><button class="remove" data-remove="${idx}" aria-label="Remove">×</button></div>`).join('');
  prev.innerHTML=state.items.slice(0,5).map(i=>`<span>${iconFor(i.type)} &nbsp;${escapeHTML(labelFor(i.type))}${i.type==='note'?': '+escapeHTML(i.value).slice(0,26):''}</span>`).join('');
}
$('itemsList').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){state.items.splice(Number(b.dataset.remove),1);render();}});

['recipient','sender','title'].forEach(id=>$(id).addEventListener('input',updatePreview));
function updatePreview(){ $('previewTo').textContent=$('recipient').value||'someone special'; $('previewFrom').textContent=$('sender').value||'your bestie'; $('previewTitle').textContent=$('title').value||'A little box of good things'; }
updatePreview(); render();

$('shareBtn').addEventListener('click', async ()=>{
  if(!state.items.length){toast('Add at least one thing first');return;}
  const button=$('shareBtn');
  const payload={r:$('recipient').value||'someone special',s:$('sender').value||'your bestie',t:$('title').value||'A little box of good things',i:state.items};
  button.disabled=true;
  button.dataset.originalText=button.innerHTML;
  button.innerHTML='Saving parcel…';
  try{
    const res=await fetch('/api/parcels',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('save failed');
    const data=await res.json();
    const url=data.url;
    await navigator.clipboard.writeText(url);
    showShareResult(url);
    toast('Short share link copied');
  }catch(e){
    toast('Could not save the parcel. Check that the site is deployed with Cloudflare.');
  }finally{
    button.disabled=false;
    button.innerHTML=button.dataset.originalText||'Create share link <span>↗</span>';
  }
});

function showShareResult(url){
  let box=$('shareResult');
  if(!box){
    box=document.createElement('div'); box.id='shareResult'; box.className='share-result';
    $('shareBtn').closest('.builder-footer').insertAdjacentElement('afterend',box);
  }
  const qr='https://quickchart.io/qr?size=220&margin=1&text='+encodeURIComponent(url);
  box.innerHTML=`<div class="share-result-label">YOUR PARCEL IS READY</div><div class="share-url-row"><input readonly value="${escapeHTML(url)}" aria-label="Share link"><button class="button button-ghost" id="copyShortLink">Copy</button></div><div class="share-qr"><img src="${escapeHTML(qr)}" width="220" height="220" alt="QR code for the parcel link"><div><b>or scan the QR code</b><p>Anyone with this link can open the parcel in a browser. No download needed.</p></div></div>`;
  $('copyShortLink').onclick=async()=>{try{await navigator.clipboard.writeText(url);toast('Link copied');}catch{toast('Copy it from the box above');}};
}

async function loadParcelById(id){
  const res=await fetch('/api/parcels/'+encodeURIComponent(id));
  if(!res.ok) throw new Error('Parcel not found');
  return await res.json();
}

function legacyDecodeParcel(){
  const hash=location.hash;
  if(!hash.startsWith('#parcel=')) return null;
  try{return JSON.parse(decodeURIComponent(escape(atob(hash.slice(8)))))}catch{return null;}
}

function openedItemMarkup(i){
  let body='';
  if(i.type==='note'){
    body='<div class="item-paper note-paper"><span class="paper-mark">note</span><p>'+escapeHTML(i.value)+'</p></div>';
  }
  else if(i.type==='coupon'){
    body='<div class="item-paper coupon-paper"><span class="coupon-badge">COUPON</span><p>'+escapeHTML(i.value)+'</p><span class="coupon-line">redeem whenever you like</span></div>';
  }
  else if(i.type==='location'){
    const linkRaw=(i.link||'').trim();
    const link=linkRaw ? escapeHTML(linkRaw) : '';
    const place=extractPlaceFromLink(linkRaw);
    const name=escapeHTML(place.name || i.value || 'A special place');
    body=`<div class="place-card" data-place-card="1" data-place-url="${link}" data-place-name="${escapeHTML(i.value||place.name||'')}" data-map-query="${escapeHTML(place.mapQuery||'')}">
      <div class="place-map"><div class="map-loading"><span class="map-pin">⌖</span><span>finding this place…</span></div></div>
      <div class="place-info"><span class="place-kicker">A SPECIAL PLACE</span><h3 class="place-title">${name}</h3>${i.value?`<p class="place-description">${escapeHTML(i.value)}</p>`:''}${link?`<a class="place-open" href="${link}" target="_blank" rel="noopener noreferrer">Open in Maps <span>↗</span></a>`:''}</div>
    </div>`;
  }
  else if(i.type==='photo'||i.type==='drawing') body='<div class="standalone-media">'+(i.value.startsWith('data:image')?`<img src="${i.value}" class="opened-media" alt="">`:'')+(i.caption?'<p>'+escapeHTML(i.caption)+'</p>':'')+'</div>';
  else if(i.type==='voice') body=`<div class="audio-paper"><span class="paper-mark">voice note</span><audio controls src="${i.value}"></audio></div>`;
  else if(i.type==='song') body=`<div class="song-paper" data-song-card="1" data-song-url="${escapeHTML(i.value)}" data-song-caption="${escapeHTML(i.caption||'A song for you')}"><div class="song-art-wrap"><div class="song-art song-art-placeholder"><span>♫</span></div></div><div class="song-info"><span class="paper-mark">song</span><h3 class="song-title">${escapeHTML(i.caption||'A song for you')}</h3><p class="song-artist">Loading song details…</p><p class="song-platform"></p><a class="opened-link" href="${escapeHTML(i.value)}" target="_blank" rel="noopener noreferrer">Listen to the song <span>↗</span></a></div></div>`;
  else if(i.type==='video') body=`<div class="link-paper"><span class="paper-mark">video</span><h3>${escapeHTML(i.caption||'A video for you')}</h3><a class="opened-link" href="${escapeHTML(i.value)}" target="_blank" rel="noopener noreferrer">Watch video <span>↗</span></a></div>`;
  return `<article class="opened-item" style="--item-index:0">${body}</article>`;
}

function extractPlaceFromLink(url=''){
  try{
    const u=new URL(url);
    const q = u.searchParams.get('q') || u.searchParams.get('query') || u.searchParams.get('destination') || u.searchParams.get('search') || u.searchParams.get('place');
    if(q){
      const cleaned=decodeURIComponent(q).replace(/\+/g,' ').trim();
      return {name: cleaned, mapQuery: cleaned};
    }
    const data = decodeURIComponent(u.pathname + (u.hash || ''));
    const placeMatch = data.match(/(?:place|search)\/([^/]+)/i);
    if(placeMatch){
      const cleaned=placeMatch[1].replace(/[-_]+/g,' ').trim();
      if(cleaned) return {name: cleaned, mapQuery: cleaned};
    }
    const at=u.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if(at) return {name:'Pinned place', mapQuery:`${at[1]},${at[2]}`};
    // Some Google Maps URLs carry the place name before the coordinate segment.
    const coordName=u.pathname.match(/\/([^/]+)\/@-?\d+\.\d+,-?\d+\.\d+/);
    if(coordName){
      const cleaned=decodeURIComponent(coordName[1]).replace(/[-_]+/g,' ').trim();
      if(cleaned) return {name: cleaned, mapQuery: cleaned};
    }
  }catch{}
  return {name:'A special place', mapQuery:''};
}
function extractPlaceName(url=''){ return extractPlaceFromLink(url).name; }

let backgroundController = { stop(){}, start(){}, hasSong:false };

function songPlatform(url=''){
  try{
    const u=new URL(url); const h=u.hostname.toLowerCase();
    if(h.includes('spotify.com')) return 'Spotify';
    if(h.includes('youtube.com') || h.includes('youtu.be')) return 'YouTube';
    if(h.includes('music.apple.com')) return 'Apple Music';
    if(h.includes('soundcloud.com')) return 'SoundCloud';
  }catch{}
  return 'Music';
}

async function fetchSongMetadata(url=''){
  const platform=songPlatform(url);
  try{
    const res=await fetch('/api/song-meta?url='+encodeURIComponent(url), {headers:{'Accept':'application/json'}});
    if(!res.ok) throw new Error('Metadata unavailable');
    const d=await res.json();
    return {title:d.title||'A song for you', artist:d.artist||'', cover:d.cover||'', platform:d.platform||platform};
  }catch{}
  return {title:'A song for you', artist:'', cover:'', platform};
}

function applySongFallback(card){
  const title=card.querySelector('.song-title');
  const artist=card.querySelector('.song-artist');
  const platform=card.querySelector('.song-platform');
  if(title) title.textContent=card.dataset.songCaption||'A song for you';
  if(artist) artist.textContent='';
  if(platform) platform.textContent=songPlatform(card.dataset.songUrl);
}

async function hydrateSongCard(card){
  const url=card.dataset.songUrl||''; if(!url) return;
  try{
    const meta=await fetchSongMetadata(url);
    const art=card.querySelector('.song-art');
    const title=card.querySelector('.song-title');
    const artist=card.querySelector('.song-artist');
    const platform=card.querySelector('.song-platform');
    if(title) title.textContent=meta.title||card.dataset.songCaption||'A song for you';
    if(artist) artist.textContent=meta.artist||'';
    if(platform) platform.textContent=meta.platform||songPlatform(url);
    if(art && meta.cover){
      art.classList.remove('song-art-placeholder');
      art.innerHTML='<img alt="Album cover" src="'+escapeHTML(meta.cover)+'" referrerpolicy="no-referrer">';
    } else if(art){
      art.classList.add('song-art-placeholder');
      art.innerHTML='<span>♫</span>';
    }
  }catch{ applySongFallback(card); }
}

function setupBackgroundSong(){
  backgroundController={hasSong:false,start(){},stop(){}};
  hideSoundGate();
  $('backgroundMedia').innerHTML='';
}


function initPlaceMap(card){
  if(!window.L || !card || card.dataset.mapReady==='1') return;
  const mapEl=card.querySelector('.place-map');
  if(!mapEl) return;
  const url=card.dataset.placeUrl||'';
  const name=card.dataset.placeName||'';
  const query=card.dataset.mapQuery||'';
  fetch('/api/place-meta?url='+encodeURIComponent(url)+'&name='+encodeURIComponent(query||name),{headers:{'Accept':'application/json'}})
    .then(r=>r.ok?r.json():Promise.reject(new Error('place lookup failed')))
    .then(data=>{
      if(data.lat==null || data.lon==null) throw new Error('coordinates unavailable');
      mapEl.innerHTML='';
      const map=L.map(mapEl,{zoomControl:false,scrollWheelZoom:false,dragging:false,doubleClickZoom:false,touchZoom:false,boxZoom:false,keyboard:false,attributionControl:true,preferCanvas:true});
      L.control.zoom({position:'bottomright'}).addTo(map);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
        maxZoom:20, attribution:'&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);
      const marker=L.circleMarker([data.lat,data.lon],{radius:9,weight:3,color:'#fffdf7',fillColor:'#c56f61',fillOpacity:1});
      marker.addTo(map);
      if(data.name){ marker.bindTooltip(data.name,{direction:'top',offset:[0,-8],opacity:0.95}); }
      map.setView([data.lat,data.lon],16,{animate:false});
      card.dataset.mapReady='1';
      requestAnimationFrame(()=>map.invalidateSize());
    })
    .catch(()=>{
      mapEl.innerHTML='<div class="place-map-fallback"><span>⌖</span><p>The place could not be located automatically.</p></div>';
    });
}

function hydratePlaceCards(){ document.querySelectorAll('[data-place-card]').forEach(initPlaceMap); }

let revealTimers=[];

function clearRevealTimers(){
  revealTimers.forEach(clearTimeout);
  revealTimers=[];
}

function resetOpenSequence(){
  clearRevealTimers();
  const overlay=$('openOverlay');
  overlay.classList.remove('revealed','parcel-arrived','parcel-opened','contents-revealed');
  document.querySelectorAll('.opened-item').forEach(el=>el.classList.remove('is-visible'));
  $('soundGate').classList.add('hidden');
  backgroundController.stop();
  $('backgroundMedia').innerHTML='';
}

function runOpenSequence(){
  resetOpenSequence();
  const overlay=$('openOverlay');
  requestAnimationFrame(()=>{
    overlay.classList.add('revealed');
    revealTimers.push(setTimeout(()=>overlay.classList.add('parcel-arrived'), 120));
    // Give the arrival a real pause before lifting the lid. This is
    // intentionally longer on small screens so the sequence remains readable.
    const mobile = window.matchMedia('(max-width: 620px)').matches;
    const lidDelay = mobile ? 1900 : 1450;
    const contentStart = mobile ? 3200 : 2400;
    const itemStep = mobile ? 520 : 330;
    revealTimers.push(setTimeout(()=>overlay.classList.add('parcel-opened'), lidDelay));
    revealTimers.push(setTimeout(()=>{
      overlay.classList.add('contents-revealed');
      const items=[...document.querySelectorAll('.opened-item')];
      items.forEach((item,idx)=>{
        revealTimers.push(setTimeout(()=>item.classList.add('is-visible'), idx*itemStep));
      });
    }, contentStart));
  });
}

function showOpened(p){
  $('openedTo').textContent=p.r; $('openedFrom').textContent='from '+p.s; $('openedTitle').textContent=p.t; $('openedTitleSmall').textContent='for you';
  const box=$('openedItems');
  box.innerHTML=(p.i||[]).map((i,idx)=>openedItemMarkup(i).replace('--item-index:0',`--item-index:${idx}`)).join('');
  $('openOverlay').classList.remove('hidden');
  runOpenSequence();
  setupBackgroundSong();
  document.querySelectorAll('[data-song-card]').forEach(hydrateSongCard);
  hydratePlaceCards();
}
$('openClose').onclick=()=>{$('openOverlay').classList.add('hidden');resetOpenSequence(); if(location.hash.startsWith('#parcel=')) history.replaceState(null,'',location.pathname+location.search);}
async function loadInitialParcel(){
  const id=new URLSearchParams(location.search).get('p');
  if(id){
    try{ const parcel=await loadParcelById(id); showOpened(parcel); }
    catch{ toast('This parcel could not be found.'); }
    return;
  }
  const legacy=legacyDecodeParcel(); if(legacy) showOpened(legacy);
}
loadInitialParcel();
$('demoBtn').onclick=()=>{showOpened({r:'your favourite person',s:'someone who cares',t:'A tiny box of happy things',i:[{type:'note',value:'Just a reminder that you are doing better than you think.'},{type:'coupon',value:'One emergency coffee + a long walk, redeem whenever needed.'},{type:'song',value:'https://open.spotify.com/',caption:'a song I think you’ll love →'}]})};
