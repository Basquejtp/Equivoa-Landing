/* ============================================================
   EQUIVOA - SHARED APP LOGIC
   Data model + matching engine + page wiring, plus optional
   Supabase-backed accounts and saved preferences (see the
   SUPABASE section below). Everything degrades gracefully:
   until equivoa-config.js has real keys in it, the site behaves
   exactly as the local-only prototype did - preferences travel
   between pages via URL params instead of being saved.
============================================================ */

/* ---------- Attribute vocabulary (spec section 3) ---------- */
const ATTRS = {
  'turnout-1x': '1x daily turnout',
  'turnout-2x': '2x daily turnout',
  'turnout-3x': '3x daily turnout',
  'turnout-individual': 'Individual turnout',
  'turnout-group': 'Group turnout',
  'turnout-flexible': 'Flexible turnout',
  'care-basic': 'Basic care',
  'care-full': 'Full care',
  'care-hay': 'Hay included',
  'care-mucking': 'Mucking out',
  'care-rugs': 'Rug changes',
  'care-checks': 'Daily checks',
  'facility-indoor': 'Indoor arena',
  'facility-outdoor': 'Outdoor arena',
  'facility-hacking': 'Hacking access',
  'facility-washbay': 'Wash bay',
  'facility-tackroom': 'Tack room',
  'facility-walker': 'Horse walker',
  'training-weekly': 'Weekly instruction',
  'training-multiple': 'Multiple weekly lessons',
  'training-coach': 'BHS-accredited coach',
  'training-competition': 'Competition support',
  'activity-clinics': 'Clinics',
  'activity-shows': 'Shows',
  'activity-social': 'Social yard'
};

const GROUPS = [
  {name:'Turnout', keys:['turnout-1x','turnout-2x','turnout-3x','turnout-individual','turnout-group','turnout-flexible']},
  {name:'Care', keys:['care-basic','care-full','care-hay','care-mucking','care-rugs','care-checks']},
  {name:'Facilities', keys:['facility-indoor','facility-outdoor','facility-hacking','facility-washbay','facility-tackroom','facility-walker']},
  {name:'Training', keys:['training-weekly','training-multiple','training-coach','training-competition']},
  {name:'Activities & yard life', keys:['activity-clinics','activity-shows','activity-social']}
];

const WEIGHT_NAME = {1:'Preferred', 2:'Important', 3:'Requirement'};

/* ---------- Seed listings (spec section 20) ---------- */
const SEED_LISTINGS = [
  {
    id:'EQ-0142', name:'Hazel Copse Livery', location:'Somerset', type:'Full-service yard',
    accommodation:'Stable + turnout', spaces:3, lat:51.03, lng:-3.42,
    attrs:['turnout-2x','turnout-individual','care-full','care-hay','care-mucking','care-rugs','care-checks','facility-indoor','facility-outdoor','facility-hacking','facility-washbay','facility-tackroom','training-weekly','activity-clinics'],
    price:{model:'BOOK', amount:650, period:'month', label:'Full Care Package'},
    extras:[{name:'3x daily turnout', amount:50},{name:'Weekly private lesson', amount:45},{name:'Clipping (per session)', amount:35}],
    description:'A full-service yard on the edge of Exmoor, built for owners who want their horse properly looked after without giving up arena time or hacking.'
  },
  {
    id:'EQ-0209', name:'Fenway Farm DIY', location:'Devon', type:'DIY livery',
    accommodation:'Stable + grazing', spaces:5, lat:50.79, lng:-3.68,
    attrs:['turnout-2x','turnout-group','turnout-flexible','care-basic','facility-outdoor','facility-hacking','facility-tackroom','activity-social'],
    price:{model:'BOOK', amount:48, period:'week', label:'DIY Livery'},
    extras:[{name:'Extra hay net (per week)', amount:6}],
    description:'A friendly, sociable DIY yard where owners manage their own horse\u2019s care day to day, with good hacking straight from the gate.'
  },
  {
    id:'EQ-0317', name:'Oakridge Performance Yard', location:'Surrey', type:'Competition yard',
    accommodation:'Stable + individual turnout', spaces:1, lat:51.19, lng:-0.58,
    attrs:['turnout-1x','turnout-individual','care-full','care-checks','facility-indoor','facility-outdoor','facility-walker','facility-washbay','training-multiple','training-coach','training-competition','activity-shows','activity-clinics'],
    price:{model:'POA', label:'Bespoke competition package'},
    extras:[],
    description:'A serious competition yard with a full training programme, built for horses actively campaigning at affiliated level.'
  },
  {
    id:'EQ-0455', name:'Willow Bank Private Livery', location:'Sussex', type:'Small private yard',
    accommodation:'Stable + individual turnout', spaces:2, lat:50.99, lng:-0.36,
    attrs:['turnout-2x','turnout-individual','turnout-flexible','care-full','care-hay','care-rugs','facility-outdoor','facility-hacking'],
    price:{model:'ENQUIRE', amount:520, period:'month', label:'Private Full Livery'},
    extras:[],
    description:'A small, quiet family-run yard with only a handful of horses at any time, which suits owners who want a lot of individual attention.'
  },
  {
    id:'EQ-0521', name:'Bridleway Equestrian Training Centre', location:'Warwickshire', type:'Training yard',
    accommodation:'Stable + group turnout', spaces:4, lat:52.31, lng:-1.63,
    attrs:['turnout-1x','turnout-group','care-basic','care-mucking','facility-indoor','facility-outdoor','facility-walker','training-weekly','training-multiple','training-coach','activity-clinics','activity-shows'],
    price:{model:'ENQUIRE', amount:395, period:'month', label:'Training Livery'},
    extras:[{name:'Competition day support', amount:60}],
    description:'Built around instruction: multiple lessons a week are part of the culture here, not an add-on, with regular in-house clinics.'
  },
  {
    id:'EQ-0630', name:'Meadowcroft Retirement Grazing', location:'Somerset', type:'Retirement grazing',
    accommodation:'Grass grazing', spaces:6, lat:51.06, lng:-3.05,
    attrs:['turnout-group','turnout-flexible','care-basic','facility-hacking'],
    price:{model:'BOOK', amount:22, period:'week', label:'Retirement Grazing'},
    extras:[],
    description:'Low-key, low-cost grazing for retired or resting horses, with daily checks included and minimal handling required.'
  },
  {
    id:'EQ-0748', name:'Kestrel Stables', location:'Yorkshire', type:'Standard livery yard',
    accommodation:'Stable + turnout', spaces:4, lat:54.28, lng:-1.03,
    attrs:['turnout-2x','turnout-group','care-basic','care-hay','care-mucking','facility-outdoor','facility-tackroom','activity-social'],
    price:{model:'BOOK', amount:58, period:'week', label:'Standard Livery'},
    extras:[{name:'Rug changes (per week)', amount:8}],
    description:'A straightforward, well-run yard on the North York Moors edge: no frills, reliable basic care, an easy-going crowd.'
  },
  {
    id:'EQ-0812', name:'Somerset Grazing Meadows', location:'Somerset', type:'Grass grazing',
    accommodation:'Grass grazing only', spaces:8, lat:51.09, lng:-2.88,
    attrs:['turnout-group','turnout-flexible','facility-hacking'],
    price:{model:'BOOK', amount:18, period:'week', label:'Grass Grazing'},
    extras:[],
    description:'Simple grazing-only fields for owners who manage everything else themselves, with direct access onto bridleways.'
  }
];

/* ---------- Listings: real DB when configured, seed data otherwise ---------- */
let _listingsCache = null;

async function loadListings(){
  if(!sb) return SEED_LISTINGS;
  try{
    const { data, error } = await sb.from('listings').select('*');
    if(error || !data || data.length === 0) return SEED_LISTINGS;
    return data.map(row => ({
      id: row.id,
      name: row.name,
      location: row.location,
      type: row.type,
      accommodation: row.accommodation,
      spaces: row.spaces,
      attrs: row.attrs || [],
      price: row.price || {},
      extras: row.extras || [],
      description: row.description || '',
      lat: row.lat,
      lng: row.lng,
      availableFrom: row.available_from,
      providerId: row.provider_id
    }));
  } catch(e){ console.error('Loading listings failed', e); return SEED_LISTINGS; }
}

async function getListings(){
  if(_listingsCache) return _listingsCache;
  _listingsCache = await loadListings();
  return _listingsCache;
}

function invalidateListingsCache(){
  _listingsCache = null;
}

/* ---------- Matching engine (spec sections 4, 5, 6) ---------- */
const WEIGHT_POINTS = {1:6, 2:15, 3:40};
const MISS_PENALTY = {1:2, 2:6, 3:30};

function scoreListing(listing, prefs){
  let earned = 0, possible = 0;
  const matched = [], missing = [];
  Object.keys(prefs).forEach(key=>{
    const w = prefs[key];
    if(!w) return;
    possible += WEIGHT_POINTS[w];
    if(listing.attrs.includes(key)){
      earned += WEIGHT_POINTS[w];
      matched.push({key,w});
    } else {
      earned -= MISS_PENALTY[w];
      missing.push({key,w});
    }
  });
  if(possible === 0) return {score:null, matched:[], missing:[]};
  const score = Math.max(0, Math.min(100, Math.round((earned/possible)*100)));
  return {score, matched, missing};
}

function matchLabel(score){
  if(score >= 85) return 'Best match';
  if(score >= 70) return 'Very close match';
  if(score >= 50) return 'Good match';
  return 'Partial match';
}

/* Red-to-green hue for a 0-100 score: 0=red(0deg), 100=green(120deg). */
function scoreColor(score){
  const hue = Math.round((score/100) * 120);
  return `hsl(${hue}, 62%, 42%)`;
}

function scoreRingHtml(score, size){
  size = size || 64;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score/100);
  const color = scoreColor(score);
  return `
    <div class="score-ring" style="width:${size}px; height:${size}px;">
      <svg viewBox="0 0 ${size} ${size}">
        <circle class="ring-bg" cx="${size/2}" cy="${size/2}" r="${r}"></circle>
        <circle class="ring-fg" cx="${size/2}" cy="${size/2}" r="${r}"
          stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="ring-label">${score}%</div>
    </div>`;
}

function formatPrice(price){
  if(price.model === 'POA') return {main:'POA', sub:'bespoke quote'};
  const prefix = price.model === 'ENQUIRE' ? 'from ' : '';
  return {main:`${prefix}£${price.amount}`, sub:`/${price.period}`};
}

function badgeHtml(model){
  const map = {BOOK:['book','Book'], ENQUIRE:['enquire','Enquire'], POA:['poa','Request quote']};
  const [cls,label] = map[model];
  return `<span class="price-badge ${cls}">${label}</span>`;
}

/* ---------- prefs <-> query string ---------- */
function prefsFromParams(params){
  const prefs = {};
  [1,2,3].forEach(w=>{
    const param = {1:'pref', 2:'imp', 3:'req'}[w];
    const val = params.get(param);
    if(val) val.split(',').forEach(k=>{ if(ATTRS[k]) prefs[k]=w; });
  });
  return prefs;
}
function prefsToQuery(prefs){
  const byWeight = {1:[],2:[],3:[]};
  Object.keys(prefs).forEach(k=>{ if(prefs[k]) byWeight[prefs[k]].push(k); });
  const parts = [];
  if(byWeight[3].length) parts.push('req='+byWeight[3].join(','));
  if(byWeight[2].length) parts.push('imp='+byWeight[2].join(','));
  if(byWeight[1].length) parts.push('pref='+byWeight[1].join(','));
  return parts.join('&');
}

/* ============================================================
   SUPABASE - accounts, saved preferences, real waitlist rows.
   sb is null until equivoa-config.js has real keys; every helper
   below checks for that and no-ops or falls back sensibly.
============================================================ */
const SB_CONFIGURED = typeof window.EQUIVOA_SUPABASE_URL === 'string'
  && window.EQUIVOA_SUPABASE_URL
  && window.EQUIVOA_SUPABASE_URL !== 'YOUR_SUPABASE_URL'
  && typeof supabase !== 'undefined';

const sb = SB_CONFIGURED
  ? supabase.createClient(window.EQUIVOA_SUPABASE_URL, window.EQUIVOA_SUPABASE_ANON_KEY)
  : null;

async function getSession(){
  if(!sb) return null;
  try{
    const { data } = await sb.auth.getSession();
    return data.session || null;
  } catch(e){ console.error('Session check failed', e); return null; }
}

async function loadPrefsFromDB(userId){
  if(!sb) return {};
  try{
    const { data, error } = await sb.from('preferences').select('attr_key,weight').eq('user_id', userId);
    if(error || !data) return {};
    const prefs = {};
    data.forEach(row => { prefs[row.attr_key] = row.weight; });
    return prefs;
  } catch(e){ console.error('Loading preferences failed', e); return {}; }
}

async function savePrefToDB(userId, key, weight){
  if(!sb) return;
  try{
    if(weight === 0){
      await sb.from('preferences').delete().eq('user_id', userId).eq('attr_key', key);
    } else {
      await sb.from('preferences').upsert({ user_id: userId, attr_key: key, weight, updated_at: new Date().toISOString() });
    }
  } catch(e){ console.error('Saving preference failed', e); }
}

async function loadFavorites(userId){
  if(!sb) return new Set();
  try{
    const { data, error } = await sb.from('favorites').select('listing_id').eq('user_id', userId);
    if(error || !data) return new Set();
    return new Set(data.map(r => r.listing_id));
  } catch(e){ console.error('Loading favourites failed', e); return new Set(); }
}

async function toggleFavorite(userId, listingId, turnOn){
  if(!sb) return;
  try{
    if(turnOn){
      await sb.from('favorites').upsert({ user_id: userId, listing_id: listingId });
    } else {
      await sb.from('favorites').delete().eq('user_id', userId).eq('listing_id', listingId);
    }
  } catch(e){ console.error('Saving favourite failed', e); }
}

async function joinWaitlist(email, role){
  if(!sb) return { ok:true, offline:true };
  try{
    const { error } = await sb.from('waitlist').insert({ email, role });
    return { ok: !error, error };
  } catch(e){ return { ok:false, error:e }; }
}

async function sendMagicLink(email, role){
  if(!sb) return { ok:false, error:'not_configured' };
  try{
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: location.origin + '/account.html',
        data: { role }
      }
    });
    return { ok: !error, error };
  } catch(e){ return { ok:false, error:e }; }
}

async function signOutUser(){
  if(sb) await sb.auth.signOut();
  location.href = 'index.html';
}

/* Updates the "Sign in" nav link on every page once we know session state. */
async function initAuthUI(){
  const link = document.getElementById('navAuthLink');
  if(!link) return;
  const session = await getSession();
  if(session){
    link.textContent = 'Account';
  }
}

/* ============================================================
   NAV (every page)
============================================================ */
function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.navlinks');
  if(toggle && links){
    toggle.addEventListener('click', ()=> links.classList.toggle('open'));
  }
}

/* ============================================================
   FIND PAGE - interactive chip panel + live matches
============================================================ */
async function initFindPage(){
  const chipPanel = document.getElementById('chipPanel');
  const matchList = document.getElementById('matchList');
  if(!chipPanel || !matchList) return;

  const params = new URLSearchParams(location.search);
  const session = await getSession();
  const prefs = session ? await loadPrefsFromDB(session.user.id) : prefsFromParams(params);
  const favSet = session ? await loadFavorites(session.user.id) : new Set();
  const allListings = await getListings();

  let priceMin = null, priceMax = null;
  let neededBy = null;
  let savedOnly = params.get('view') === 'saved';
  let view = 'list';

  const authNote = document.getElementById('authNote');
  if(authNote){
    authNote.innerHTML = session
      ? `SIGNED IN AS ${session.user.email.toUpperCase()} \u00b7 YOUR PICKS SAVE AUTOMATICALLY \u00b7 <a href="#" onclick="signOutUser(); return false;" style="text-decoration:underline;">SIGN OUT</a>`
      : `NOT SIGNED IN \u00b7 YOUR PICKS WON'T BE SAVED AFTER YOU LEAVE \u00b7 <a href="account.html" style="text-decoration:underline;">SIGN IN TO KEEP THEM</a>`;
  }

  /* ---- chips: one click on the label toggles on/off, level dots set the tier ---- */
  GROUPS.forEach(group=>{
    const groupEl = document.createElement('div');
    groupEl.className = 'chip-group';
    const h4 = document.createElement('h4');
    h4.textContent = group.name;
    groupEl.appendChild(h4);
    const row = document.createElement('div');
    row.className = 'chip-row';
    group.keys.forEach(key=>{
      const wrap = document.createElement('span');
      wrap.className = 'chip-wrap';
      wrap.dataset.key = key;
      const startWeight = prefs[key] || 0;
      if(startWeight) wrap.classList.add('active');

      const label = document.createElement('button');
      label.type = 'button';
      label.className = 'chip-label';
      label.textContent = ATTRS[key];
      label.addEventListener('click', ()=>{
        const isActive = wrap.classList.contains('active');
        if(isActive){
          wrap.classList.remove('active');
          delete prefs[key];
          if(session) savePrefToDB(session.user.id, key, 0);
        } else {
          wrap.classList.add('active');
          prefs[key] = 1;
          setLevelDots(1);
          if(session) savePrefToDB(session.user.id, key, 1);
        }
        renderMatches();
      });
      wrap.appendChild(label);

      const levels = document.createElement('span');
      levels.className = 'chip-levels';
      const dots = [1,2,3].map(lvl=>{
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'chip-level';
        dot.dataset.level = lvl;
        dot.title = WEIGHT_NAME[lvl];
        dot.addEventListener('click', (e)=>{
          e.stopPropagation();
          prefs[key] = lvl;
          setLevelDots(lvl);
          if(session) savePrefToDB(session.user.id, key, lvl);
          renderMatches();
        });
        levels.appendChild(dot);
        return dot;
      });
      function setLevelDots(activeLvl){
        dots.forEach(d => d.classList.toggle('on', parseInt(d.dataset.level,10) <= activeLvl));
      }
      setLevelDots(startWeight || 1);
      wrap.appendChild(levels);
      row.appendChild(wrap);
    });
    groupEl.appendChild(row);
    chipPanel.appendChild(groupEl);
  });

  /* ---- filter bar: price range, saved-only, list/map toggle ---- */
  const filterBarHtml = `
    <div class="filter-bar">
      <div class="filter-group">
        <label>NEED SPACE BY</label>
        <input type="date" id="neededByInput">
      </div>
      <div class="filter-group">
        <label>PRICE MIN</label>
        <input type="number" id="priceMinInput" min="0" placeholder="0">
      </div>
      <div class="filter-group">
        <label>PRICE MAX</label>
        <input type="number" id="priceMaxInput" min="0" placeholder="Any">
      </div>
      <label class="fav-filter-toggle">
        <input type="checkbox" id="savedOnlyToggle" ${savedOnly ? 'checked' : ''}> Favourites only
      </label>
      <div class="view-toggle">
        <button type="button" id="listViewBtn" class="active">LIST</button>
        <button type="button" id="mapViewBtn">MAP</button>
      </div>
    </div>
    <div id="mapView"></div>`;
  matchList.insertAdjacentHTML('beforebegin', filterBarHtml);

  document.getElementById('neededByInput').addEventListener('change', e=>{ neededBy = e.target.value || null; renderMatches(); });
  document.getElementById('priceMinInput').addEventListener('input', e=>{ priceMin = e.target.value ? parseFloat(e.target.value) : null; renderMatches(); });
  document.getElementById('priceMaxInput').addEventListener('input', e=>{ priceMax = e.target.value ? parseFloat(e.target.value) : null; renderMatches(); });
  document.getElementById('savedOnlyToggle').addEventListener('change', e=>{ savedOnly = e.target.checked; renderMatches(); });
  document.getElementById('listViewBtn').addEventListener('click', ()=> setView('list'));
  document.getElementById('mapViewBtn').addEventListener('click', ()=> setView('map'));

  function setView(v){
    view = v;
    document.getElementById('listViewBtn').classList.toggle('active', v==='list');
    document.getElementById('mapViewBtn').classList.toggle('active', v==='map');
    document.getElementById('mapView').classList.toggle('active', v==='map');
    matchList.style.display = v==='map' ? 'none' : '';
    renderMatches();
  }

  function passesFilters(listing){
    if(savedOnly && !favSet.has(listing.id)) return false;
    if(neededBy && listing.availableFrom){
      if(new Date(listing.availableFrom) > new Date(neededBy)) return false;
    }
    if(listing.price.amount != null){
      if(priceMin !== null && listing.price.amount < priceMin) return false;
      if(priceMax !== null && listing.price.amount > priceMax) return false;
    } else if(priceMin !== null || priceMax !== null){
      return false; // POA listings excluded once a price range is set
    }
    return true;
  }

  function favToggleHtml(listing){
    const on = favSet.has(listing.id);
    return `<button type="button" class="fav-btn ${on?'on':''}" data-fav-id="${listing.id}" title="${on?'Remove from favourites':'Save to favourites'}">
      <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-8.5C1 9 2.5 5.5 6 5c2-.3 3.7.7 6 3 2.3-2.3 4-3.3 6-3 3.5.5 5 4 3.5 7.5C19 16.65 12 21 12 21z"/></svg>
    </button>`;
  }

  function renderMatches(){
    const anyPrefs = Object.keys(prefs).length > 0;
    const toolbar = document.getElementById('matchToolbar');
    let scored = allListings.filter(passesFilters).map(l => ({listing:l, ...scoreListing(l, prefs)}));
    if(anyPrefs){
      scored.sort((a,b)=> b.score - a.score);
      toolbar.innerHTML = `<h3>${savedOnly ? 'Your favourites' : 'Your matches'}</h3><span>${scored.length} places, ranked for you, nothing hidden</span>`;
    } else {
      toolbar.innerHTML = `<h3>${savedOnly ? 'Your favourites' : 'All places'}</h3><span>${savedOnly ? 'Places you have saved' : 'Tell us what matters above to see these ranked for you'}</span>`;
    }

    if(scored.length === 0){
      matchList.innerHTML = `<div class="empty-state">Nothing matches these filters yet. Try widening the price range or turning off "Favourites only".</div>`;
    } else {
      matchList.innerHTML = scored.map(({listing,score,matched,missing})=>{
        const price = formatPrice(listing.price);
        const query = prefsToQuery(prefs);
        const href = `listing.html?id=${listing.id}${query ? '&'+query : ''}`;
        const scoreBlock = score === null ? '' : `
          <div class="score-ring-block">
            ${scoreRingHtml(score, 60)}
            <div class="score-ring-tag">${matchLabel(score)}</div>
          </div>`;
        const okTags = matched.slice(0,5).map(m=>`<span class="tag-ok">\u2713 ${ATTRS[m.key]}</span>`).join('');
        const missRequirement = missing.filter(m=>m.w===3);
        const missTags = missRequirement.map(m=>`<span class="tag-miss">\u25b3 ${ATTRS[m.key]}: you marked this a must-have</span>`).join('');
        return `
          <div class="match-card">
            <div>
              <div class="match-head">
                <div class="fav-row">
                  ${favToggleHtml(listing)}
                  <div>
                    <div class="match-name">${listing.name}</div>
                    <div class="match-meta">${listing.location} \u00b7 ${listing.type} \u00b7 ${listing.spaces} space${listing.spaces===1?'':'s'} left${listing.availableFrom ? ' \u00b7 available from ' + new Date(listing.availableFrom).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : ''}</div>
                  </div>
                </div>
                <div class="match-price">${price.main}<span>${price.sub}</span></div>
              </div>
              <div class="match-tags">${okTags}${missTags}</div>
              ${anyPrefs ? `<div class="match-why">${matched.length} of your selected preferences are met here.${missRequirement.length ? ' Heads up on the must-have(s) flagged above, worth a look anyway since you might feel differently once you see the place.' : ''}</div>` : ''}
              <div class="match-cta-row">
                ${badgeHtml(listing.price.model)}
                <a href="${href}" class="btn-secondary btn-small">View listing</a>
              </div>
            </div>
            ${scoreBlock}
          </div>`;
      }).join('');

      matchList.querySelectorAll('.fav-btn').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          if(!session){ location.href = 'account.html'; return; }
          const id = btn.dataset.favId;
          const turnOn = !favSet.has(id);
          if(turnOn) favSet.add(id); else favSet.delete(id);
          btn.classList.toggle('on', turnOn);
          await toggleFavorite(session.user.id, id, turnOn);
          if(savedOnly) renderMatches();
        });
      });
    }

    if(view === 'map') renderMapView(scored.map(s=>s.listing), prefs, favSet, session);
  }
  renderMatches();
}

/* ============================================================
   MAP VIEW (find.html) - Mapbox GL, falls back gracefully
============================================================ */
const MAPBOX_CONFIGURED = typeof window.EQUIVOA_MAPBOX_TOKEN === 'string'
  && window.EQUIVOA_MAPBOX_TOKEN
  && window.EQUIVOA_MAPBOX_TOKEN !== 'YOUR_MAPBOX_TOKEN'
  && typeof mapboxgl !== 'undefined';

let _mapInstance = null;
let _mapMarkers = [];

function renderMapView(listings, prefs, favSet, session){
  const mapEl = document.getElementById('mapView');
  if(!mapEl) return;

  if(!MAPBOX_CONFIGURED){
    mapEl.innerHTML = `<div class="map-fallback">The map isn't switched on yet, this site's owner needs to add a Mapbox token. The list view above still works fully.</div>`;
    return;
  }

  if(!_mapInstance){
    mapboxgl.accessToken = window.EQUIVOA_MAPBOX_TOKEN;
    mapEl.innerHTML = '';
    _mapInstance = new mapboxgl.Map({
      container: 'mapView',
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-2.5, 51.3],
      zoom: 6
    });
    _mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }

  _mapMarkers.forEach(m => m.remove());
  _mapMarkers = [];

  listings.forEach(listing=>{
    const price = formatPrice(listing.price);
    const query = prefsToQuery(prefs);
    const href = `listing.html?id=${listing.id}${query ? '&'+query : ''}`;
    const el = document.createElement('div');
    el.style.width = '14px';
    el.style.height = '14px';
    el.style.borderRadius = '50%';
    el.style.background = '#a9673d';
    el.style.border = '2px solid #fff';
    el.style.boxShadow = '0 0 0 1px rgba(31,51,39,0.3)';
    el.style.cursor = 'pointer';

    const popupHtml = `
      <div class="map-popup">
        <div class="map-popup-title">${listing.name}</div>
        <div class="map-popup-price">${price.main}${price.sub}</div>
        <a href="${href}">View listing \u2192</a>
      </div>`;

    const marker = new mapboxgl.Marker(el)
      .setLngLat([listing.lng, listing.lat])
      .setPopup(new mapboxgl.Popup({offset:16}).setHTML(popupHtml))
      .addTo(_mapInstance);
    _mapMarkers.push(marker);
  });

  if(listings.length){
    const bounds = new mapboxgl.LngLatBounds();
    listings.forEach(l => bounds.extend([l.lng, l.lat]));
    _mapInstance.fitBounds(bounds, {padding:60, maxZoom:9});
  }
}

/* ============================================================
   LISTING PAGE - dynamic render from query id + optional prefs
============================================================ */
async function initListingPage(){
  const root = document.getElementById('listingRoot');
  if(!root) return;
  const params = new URLSearchParams(location.search);
  const allListings = await getListings();
  const id = params.get('id') || allListings[0].id;
  const listing = allListings.find(l=>l.id===id) || allListings[0];
  const prefs = prefsFromParams(params);
  const hasPrefs = Object.keys(prefs).length > 0;
  const {score, matched, missing} = hasPrefs ? scoreListing(listing, prefs) : {score:null,matched:[],missing:[]};
  const price = formatPrice(listing.price);

  const session = await getSession();
  const favSet = session ? await loadFavorites(session.user.id) : new Set();
  const isFav = favSet.has(listing.id);

  document.title = `${listing.name} | Equivoa`;

  const missRequirement = missing.filter(m=>m.w===3);
  const calloutHtml = missRequirement.length ? `
    <div class="callout-miss">
      <b>Worth knowing</b>
      This place doesn't offer ${missRequirement.map(m=>ATTRS[m.key]).join(', ')}. You marked ${missRequirement.length>1?'these':'this'} as a must-have. Everything else about the match is below.
    </div>` : '';

  const matchHeaderHtml = hasPrefs ? scoreRingHtml(score, 56) : '';
  const eyebrowText = hasPrefs ? matchLabel(score) : listing.type;

  function tagList(groupKeys){
    return groupKeys.filter(k=>listing.attrs.includes(k)).map(k=>{
      const hit = prefs[k] ? 'hit' : '';
      return `<span class="${hit}">${ATTRS[k]}</span>`;
    }).join('');
  }

  const sections = GROUPS.map(g=>{
    const tags = tagList(g.keys);
    if(!tags) return '';
    return `<div class="listing-section"><h3>${g.name}</h3><div class="tagset">${tags}</div></div>`;
  }).join('');

  const extrasHtml = listing.extras.map((ex,i)=>`
    <div class="pricing-row">
      <label><input type="checkbox" class="extra-check" data-amount="${ex.amount}"> ${ex.name}</label>
      <span>+£${ex.amount}</span>
    </div>`).join('');

  const pricingHtml = listing.price.model === 'POA' ? `
    <div class="pkg-name">Bespoke package</div>
    <div class="pkg-price">Contact the yard for a tailored quote</div>
    <a href="index.html?role=rider#waitlist" class="btn-tan" style="margin-top:18px; width:100%; text-align:center; display:block;">Request a quote</a>
  ` : `
    <div class="pkg-name">${listing.price.label}</div>
    <div class="pkg-price">£${listing.price.amount}<span style="opacity:0.6">/${listing.price.period}</span></div>
    ${extrasHtml}
    <div class="pricing-total"><span>Estimated total</span><span id="estTotal">£${listing.price.amount}/${listing.price.period}</span></div>
    <a href="index.html?role=rider#waitlist" class="btn-tan" style="margin-top:18px; width:100%; text-align:center; display:block;">${listing.price.model==='BOOK'?'Join waitlist to book':'Join waitlist to enquire'}</a>
    <div style="font-family:var(--mono); font-size:11px; color:rgba(20,32,26,0.45); margin-top:10px; text-align:center;">Live booking isn't switched on yet. We'll notify you the moment it is.</div>
  `;

  root.innerHTML = `
    <section class="listing-hero">
      <div class="wrap">
        <div class="eyebrow">${eyebrowText}</div>
        <div class="listing-hero-top">
          <div class="fav-row">
            <button type="button" id="listingFavBtn" class="fav-btn ${isFav?'on':''}" title="${isFav?'Remove from favourites':'Save to favourites'}">
              <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-8.5C1 9 2.5 5.5 6 5c2-.3 3.7.7 6 3 2.3-2.3 4-3.3 6-3 3.5.5 5 4 3.5 7.5C19 16.65 12 21 12 21z"/></svg>
            </button>
            <div>
              <h1>${listing.name}</h1>
              <div class="meta">${listing.location} \u00b7 ${listing.accommodation} \u00b7 ${listing.spaces} space${listing.spaces===1?'':'s'} left</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            ${matchHeaderHtml}
            ${badgeHtml(listing.price.model)}
          </div>
        </div>
        <p class="lede" style="margin-top:18px;">${listing.description}</p>
        <div class="gallery-placeholder">
          <div>Photos coming once this yard is live</div>
          <div>Paddocks</div>
          <div>Stables</div>
        </div>
        ${calloutHtml}
      </div>
    </section>
    <section class="wrap">
      <div class="listing-body">
        <div>
          ${sections}
        </div>
        <div class="pricing-box">
          ${pricingHtml}
          <div class="availability-pill"><i></i>${listing.spaces} space${listing.spaces===1?'':'s'} left</div>
        </div>
      </div>
    </section>
  `;

  const favBtn = document.getElementById('listingFavBtn');
  if(favBtn){
    favBtn.addEventListener('click', async ()=>{
      if(!session){ location.href = 'account.html'; return; }
      const turnOn = !favBtn.classList.contains('on');
      favBtn.classList.toggle('on', turnOn);
      favBtn.title = turnOn ? 'Remove from favourites' : 'Save to favourites';
      await toggleFavorite(session.user.id, listing.id, turnOn);
    });
  }

  root.querySelectorAll('.extra-check').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const base = listing.price.amount;
      let total = base;
      root.querySelectorAll('.extra-check:checked').forEach(c=> total += parseFloat(c.dataset.amount));
      const totalEl = document.getElementById('estTotal');
      if(totalEl) totalEl.textContent = `£${total}/${listing.price.period}`;
    });
  });
}

/* ============================================================
   HOME PAGE - waitlist form + role pre-select from ?role=
============================================================ */
function initWaitlistForm(){
  const form = document.getElementById('waitlistForm');
  if(!form) return;
  const params = new URLSearchParams(location.search);
  const role = params.get('role');
  if(role){
    const radio = form.querySelector(`input[name="role"][value="${role}"]`);
    if(radio) radio.checked = true;
  }
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn = form.querySelector('button');
    const email = form.querySelector('#email').value;
    const selectedRole = form.querySelector('input[name="role"]:checked').value;
    btn.textContent = 'Joining…';
    btn.disabled = true;
    const result = await joinWaitlist(email, selectedRole);
    btn.textContent = result.ok ? "You're on the list." : 'Something went wrong. Try again';
    if(!result.ok){ btn.disabled = false; }
  });
}

/* ============================================================
   PROFILE PAGE - real saved profile when signed in
============================================================ */
async function initProfilePage(){
  const heroRoot = document.getElementById('profileHero');
  const bodyRoot = document.getElementById('profileBody');
  if(!heroRoot || !bodyRoot) return;

  const session = await getSession();
  if(!session) return; // keep the static example markup as-is for signed-out visitors

  const prefs = await loadPrefsFromDB(session.user.id);
  const hasPrefs = Object.keys(prefs).length > 0;

  heroRoot.innerHTML = `
    <div class="eyebrow">Signed in as ${session.user.email}</div>
    <h1>${hasPrefs ? 'Your Equivoa profile.' : "You're signed in. No preferences saved yet."}</h1>
    <p class="lede">${hasPrefs ? 'This is what you told us matters. Head to Find to change anything.' : 'Go to Find and tap what matters to your horse. It saves here automatically.'}</p>
    <div class="hero-ctas">
      <a href="find.html" class="btn-primary">${hasPrefs ? 'Edit on Find' : 'Build your profile'}</a>
      <a href="#" onclick="signOutUser(); return false;" class="btn-secondary">Sign out</a>
    </div>`;

  if(!hasPrefs){
    bodyRoot.innerHTML = `<div class="empty-state">Nothing saved yet. Your picks from the Find page will show up here.</div>`;
    return;
  }

  const cardsHtml = GROUPS.map(group=>{
    const items = group.keys.filter(k=>prefs[k]);
    if(!items.length) return '';
    const tags = items.map(k=>{
      const w = prefs[k];
      const cls = w===3 ? 'req' : (w===2 ? 'imp' : '');
      return `<span class="${cls}">${ATTRS[k]}${w===3?': must have':(w===2?': important':'')}</span>`;
    }).join('');
    return `<div class="profile-card"><h3>${group.name}</h3><div class="tagset">${tags}</div></div>`;
  }).join('');

  bodyRoot.innerHTML = `
    <div class="section-head">
      <div class="eyebrow">Your saved profile</div>
      <h2 style="font-size:clamp(24px,3vw,32px);">You control what you're comfortable sharing.</h2>
    </div>
    <div class="profile-preview-grid">${cardsHtml}</div>`;
}

/* ============================================================
   ACCOUNT PAGE - passwordless sign-in / signed-in state
============================================================ */
async function initAccountPage(){
  const root = document.getElementById('accountRoot');
  if(!root) return;

  if(!sb){
    root.innerHTML = `
      <h2>Accounts aren't switched on yet</h2>
      <p>This site's owner hasn't connected a database yet, so sign-in isn't live. Nothing's broken. Check back soon.</p>`;
    return;
  }

  const session = await getSession();
  if(session){
    root.innerHTML = `
      <h2>You're signed in</h2>
      <div class="signed-in-row"><span>Email</span><b>${session.user.email}</b></div>
      <div class="signed-in-row"><span>Role</span><b>${(session.user.user_metadata && session.user.user_metadata.role) || 'rider'}</b></div>
      <div class="hero-ctas" style="margin-top:24px;">
        <a href="profile.html" class="btn-primary">View your profile</a>
        <a href="#" id="signOutBtn" class="btn-secondary">Sign out</a>
      </div>`;
    document.getElementById('signOutBtn').addEventListener('click', (e)=>{ e.preventDefault(); signOutUser(); });
    return;
  }

  root.innerHTML = `
    <h2>Sign in or create an account</h2>
    <p>Same form either way. If it's your first time, this creates your account too.</p>
    <form id="magicLinkForm">
      <label for="acctEmail">Email address</label>
      <input id="acctEmail" type="email" placeholder="you@email.com" required>
      <label>I am a...</label>
      <div class="role-pick">
        <label><input type="radio" name="acctRole" value="rider" checked style="margin-right:6px;">Rider / owner</label>
        <label><input type="radio" name="acctRole" value="yard" style="margin-right:6px;">Yard</label>
        <label><input type="radio" name="acctRole" value="coach" style="margin-right:6px;">Coach</label>
      </div>
      <button type="submit" class="btn-primary" style="width:100%;">Send magic link</button>
    </form>
    <div class="account-note">We'll email you a one-time sign-in link. No password is ever created or stored.</div>`;

  document.getElementById('magicLinkForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const email = document.getElementById('acctEmail').value;
    const role = e.target.querySelector('input[name="acctRole"]:checked').value;
    btn.textContent = 'Sending…';
    btn.disabled = true;
    const result = await sendMagicLink(email, role);
    if(result.ok){
      root.innerHTML = `<h2>Check your email</h2><p>We've sent a sign-in link to <b>${email}</b>. Click it and you'll land back here, signed in.</p>`;
    } else {
      btn.textContent = 'Send magic link';
      btn.disabled = false;
      root.querySelector('.account-note').textContent = 'Something went wrong sending that. Double check the email and try again.';
    }
  });
}

/* ============================================================
   SIDEBAR - Facebook-style member navigation (find.html, profile.html)
   Real links: Explore, Saved, favourites list. "Friends", "Groups" and
   "Marketplace" are shown but marked soon, since there's no data model
   for any of them yet, and a working link would be misleading.
============================================================ */
const ICONS = {
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>',
  explore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  friends: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c1-3 3.5-5 6-5s5 2 6 5"/><path d="M12 20c1-3 3.5-5 6-5"/></svg>',
  saved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>',
  groups: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  marketplace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z"/><path d="M9 13a3 3 0 0 0 6 0"/></svg>'
};

async function initSidebar(){
  const root = document.getElementById('sidebarRoot');
  if(!root) return;

  const session = await getSession();
  const favSet = session ? await loadFavorites(session.user.id) : new Set();
  const allListings = await getListings();
  const favListings = allListings.filter(l => favSet.has(l.id));
  const page = location.pathname.split('/').pop();

  const profileCardHtml = session ? `
    <div class="sidebar-profile">
      <div class="sidebar-avatar">${session.user.email.charAt(0).toUpperCase()}</div>
      <div>
        <div class="name">${session.user.email.split('@')[0]}</div>
        <div class="sub">${(session.user.user_metadata && session.user.user_metadata.role) || 'rider'}</div>
      </div>
    </div>` : `
    <div class="sidebar-profile">
      <div class="sidebar-avatar">?</div>
      <div>
        <div class="name">Not signed in</div>
        <a href="account.html" class="sub" style="text-decoration:underline;">Sign in</a>
      </div>
    </div>`;

  const myListingsLink = session
    ? `<a href="my-listings.html" class="sidebar-link ${page==='my-listings.html'?'active':''}"><span class="ic">${ICONS.marketplace}</span>My listings</a>`
    : '';

  const navHtml = `
    <div class="sidebar-nav">
      <a href="profile.html" class="sidebar-link ${page==='profile.html'?'active':''}"><span class="ic">${ICONS.profile}</span>Your profile</a>
      <a href="find.html" class="sidebar-link ${page==='find.html'?'active':''}"><span class="ic">${ICONS.explore}</span>Explore</a>
      ${myListingsLink}
      <a href="#" class="sidebar-link soon"><span class="ic">${ICONS.friends}</span>Friends<span class="soon-tag">SOON</span></a>
      <a href="find.html?view=saved" class="sidebar-link"><span class="ic">${ICONS.saved}</span>Saved</a>
      <a href="#" class="sidebar-link soon"><span class="ic">${ICONS.groups}</span>Groups<span class="soon-tag">SOON</span></a>
      <a href="#" class="sidebar-link soon"><span class="ic">${ICONS.marketplace}</span>Marketplace: tack &amp; hacking<span class="soon-tag">SOON</span></a>
    </div>`;

  const favHtml = !session ? `<div class="sidebar-empty">Sign in to save favourite stables, paddocks and riding schools here.</div>`
    : favListings.length === 0 ? `<div class="sidebar-empty">Tap the heart on any listing to save it here.</div>`
    : favListings.map(l => `
      <a href="listing.html?id=${l.id}" class="sidebar-fav-item">
        <span class="dot-type"></span>${l.name}
      </a>`).join('');

  root.innerHTML = `
    ${profileCardHtml}
    ${navHtml}
    <div class="sidebar-heading">Your favourites</div>
    ${favHtml}`;
}

/* ============================================================
   MY LISTINGS - self-serve create/edit/delete for signed-in providers
============================================================ */
async function loadMyListings(userId){
  if(!sb) return [];
  try{
    const { data, error } = await sb.from('listings').select('*').eq('provider_id', userId).order('created_at', {ascending:false});
    if(error || !data) return [];
    return data;
  } catch(e){ console.error('Loading your listings failed', e); return []; }
}

function attrCheckboxesHtml(checkedKeys){
  checkedKeys = checkedKeys || [];
  return GROUPS.map(group => `
    <div class="chip-group">
      <h4>${group.name}</h4>
      <div class="chip-row">
        ${group.keys.map(key => `
          <label class="chip-wrap ${checkedKeys.includes(key)?'active':''}" style="padding:9px 14px; cursor:pointer;">
            <input type="checkbox" name="attrs" value="${key}" ${checkedKeys.includes(key)?'checked':''} style="margin-right:7px;">${ATTRS[key]}
          </label>`).join('')}
      </div>
    </div>`).join('');
}

function listingFormHtml(existing){
  const l = existing || {};
  const price = l.price || {};
  return `
    <form id="listingForm" style="background:#fff; border:1px solid var(--line); border-radius:3px; padding:26px; margin-bottom:28px;">
      <input type="hidden" id="lf_id" value="${l.id || ''}">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
        <div><label class="sr-only" for="lf_name">Name</label><input id="lf_name" placeholder="Yard name" value="${l.name || ''}" required style="width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:2px;"></div>
        <div><label class="sr-only" for="lf_location">Location</label><input id="lf_location" placeholder="Location, e.g. Somerset" value="${l.location || ''}" required style="width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:2px;"></div>
        <div><label class="sr-only" for="lf_type">Type</label><input id="lf_type" placeholder="Type, e.g. Full-service yard" value="${l.type || ''}" required style="width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:2px;"></div>
        <div><label class="sr-only" for="lf_accommodation">Accommodation</label><input id="lf_accommodation" placeholder="Accommodation, e.g. Stable + turnout" value="${l.accommodation || ''}" required style="width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:2px;"></div>
      </div>
      <textarea id="lf_description" placeholder="Description" required style="width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:2px; min-height:70px; margin-bottom:14px; font-family:inherit;">${l.description || ''}</textarea>
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px;">
        <div><label class="sr-only" for="lf_spaces">Spaces</label><input id="lf_spaces" type="number" min="1" placeholder="Spaces" value="${l.spaces || 1}" required style="width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:2px;"></div>
        <div><label class="sr-only" for="lf_available">Available from</label><input id="lf_available" type="date" value="${l.available_from || ''}" style="width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:2px;"></div>
        <div><label class="sr-only" for="lf_lat">Latitude</label><input id="lf_lat" type="number" step="0.0001" placeholder="Latitude" value="${l.lat || ''}" style="width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:2px;"></div>
        <div><label class="sr-only" for="lf_lng">Longitude</label><input id="lf_lng" type="number" step="0.0001" placeholder="Longitude" value="${l.lng || ''}" style="width:100%; padding:11px 14px; border:1px solid var(--line); border-radius:2px;"></div>
      </div>
      <div class="chip-hint" style="margin:-10px 0 16px;">APPROXIMATE COORDINATES ARE FINE, LOOK UP YOUR POSTCODE ONLINE IF UNSURE. LEAVE BLANK TO SKIP THE MAP FOR NOW.</div>

      <div style="margin-bottom:20px;">
        <h4 style="font-family:var(--mono); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:rgba(20,32,26,0.5); margin-bottom:10px;">Pricing</h4>
        <div style="display:flex; gap:16px; margin-bottom:12px; flex-wrap:wrap;">
          <label><input type="radio" name="lf_model" value="BOOK" ${price.model==='BOOK'||!price.model?'checked':''}> Book</label>
          <label><input type="radio" name="lf_model" value="ENQUIRE" ${price.model==='ENQUIRE'?'checked':''}> Enquire</label>
          <label><input type="radio" name="lf_model" value="POA" ${price.model==='POA'?'checked':''}> Request a quote</label>
        </div>
        <div id="priceFields" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px;">
          <input id="lf_price_amount" type="number" min="0" placeholder="Amount, e.g. 650" value="${price.amount || ''}" style="padding:11px 14px; border:1px solid var(--line); border-radius:2px;">
          <select id="lf_price_period" style="padding:11px 14px; border:1px solid var(--line); border-radius:2px;">
            <option value="week" ${price.period==='week'?'selected':''}>per week</option>
            <option value="month" ${price.period==='month'?'selected':''}>per month</option>
          </select>
          <input id="lf_price_label" placeholder="Package name, e.g. Full Care" value="${price.label || ''}" style="padding:11px 14px; border:1px solid var(--line); border-radius:2px;">
        </div>
      </div>

      <h4 style="font-family:var(--mono); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:rgba(20,32,26,0.5); margin-bottom:10px;">What's included</h4>
      ${attrCheckboxesHtml(l.attrs)}

      <div style="display:flex; gap:12px; margin-top:20px;">
        <button type="submit" class="btn-primary">${existing ? 'Save changes' : 'Publish listing'}</button>
        <button type="button" id="cancelFormBtn" class="btn-secondary">Cancel</button>
      </div>
    </form>`;
}

async function initMyListingsPage(){
  const root = document.getElementById('myListingsRoot');
  if(!root) return;

  if(!sb){
    root.innerHTML = `<div class="empty-state">Listings management needs the database switched on. Nothing's broken, check back soon.</div>`;
    return;
  }

  const session = await getSession();
  if(!session){
    root.innerHTML = `<div class="empty-state">Sign in to create and manage your listings. <a href="account.html" style="text-decoration:underline;">Sign in</a></div>`;
    return;
  }

  async function render(){
    const mine = await loadMyListings(session.user.id);
    const listHtml = mine.length === 0
      ? `<div class="empty-state">You haven't listed anything yet. Add your first paddock, stable or lesson slot below.</div>`
      : mine.map(l => `
        <div class="match-card" style="grid-template-columns:1fr auto;">
          <div>
            <div class="match-name">${l.name}</div>
            <div class="match-meta">${l.location} \u00b7 ${l.type} \u00b7 ${l.spaces} space${l.spaces===1?'':'s'}</div>
          </div>
          <div class="match-cta-row" style="margin-top:0;">
            <button type="button" class="btn-secondary btn-small edit-listing-btn" data-id="${l.id}">Edit</button>
            <button type="button" class="btn-secondary btn-small delete-listing-btn" data-id="${l.id}">Delete</button>
          </div>
        </div>`).join('');

    root.innerHTML = `
      <div class="match-toolbar"><h3>Your listings</h3><span>${mine.length} published</span></div>
      <div class="match-list" style="margin-bottom:24px;">${listHtml}</div>
      <button type="button" id="addListingBtn" class="btn-primary">+ Add a new listing</button>
      <div id="formSlot"></div>`;

    document.getElementById('addListingBtn').addEventListener('click', ()=> openForm(null));
    root.querySelectorAll('.edit-listing-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const l = mine.find(x=>x.id===btn.dataset.id);
        openForm(l);
      });
    });
    root.querySelectorAll('.delete-listing-btn').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(!confirm('Delete this listing? This cannot be undone.')) return;
        await sb.from('listings').delete().eq('id', btn.dataset.id);
        invalidateListingsCache();
        render();
      });
    });
  }

  function openForm(existing){
    const slot = document.getElementById('formSlot');
    slot.innerHTML = listingFormHtml(existing);
    document.getElementById('cancelFormBtn').addEventListener('click', ()=> slot.innerHTML = '');
    document.getElementById('listingForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const attrs = Array.from(document.querySelectorAll('input[name="attrs"]:checked')).map(cb=>cb.value);
      const id = document.getElementById('lf_id').value || ('EQ-' + Math.random().toString(16).slice(2,6).toUpperCase());
      const model = document.querySelector('input[name="lf_model"]:checked').value;
      const price = model === 'POA'
        ? { model, label: document.getElementById('lf_price_label').value || 'Bespoke package' }
        : { model, amount: parseFloat(document.getElementById('lf_price_amount').value) || 0,
            period: document.getElementById('lf_price_period').value,
            label: document.getElementById('lf_price_label').value || 'Package' };

      const row = {
        id,
        provider_id: session.user.id,
        name: document.getElementById('lf_name').value,
        location: document.getElementById('lf_location').value,
        type: document.getElementById('lf_type').value,
        accommodation: document.getElementById('lf_accommodation').value,
        description: document.getElementById('lf_description').value,
        spaces: parseInt(document.getElementById('lf_spaces').value, 10) || 1,
        available_from: document.getElementById('lf_available').value || null,
        lat: document.getElementById('lf_lat').value ? parseFloat(document.getElementById('lf_lat').value) : null,
        lng: document.getElementById('lf_lng').value ? parseFloat(document.getElementById('lf_lng').value) : null,
        attrs, price, extras: existing ? existing.extras : [],
        updated_at: new Date().toISOString()
      };

      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Saving…';
      const { error } = await sb.from('listings').upsert(row);
      if(error){
        btn.disabled = false;
        btn.textContent = 'Try again';
        console.error(error);
        return;
      }
      invalidateListingsCache();
      slot.innerHTML = '';
      render();
    });
  }

  render();
}

document.addEventListener('DOMContentLoaded', async ()=>{
  initNav();
  initAuthUI();
  initWaitlistForm();
  initFindPage();
  initListingPage();
  initProfilePage();
  initAccountPage();
  initSidebar();
  initMyListingsPage();
});
