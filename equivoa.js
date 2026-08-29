/* ============================================================
   EQUIVOA — SHARED APP LOGIC
   Data model + matching engine + page wiring, plus optional
   Supabase-backed accounts and saved preferences (see the
   SUPABASE section below). Everything degrades gracefully:
   until equivoa-config.js has real keys in it, the site behaves
   exactly as the local-only prototype did — preferences travel
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
const LISTINGS = [
  {
    id:'EQ-0142', name:'Hazel Copse Livery', location:'Somerset', type:'Full-service yard',
    accommodation:'Stable + turnout', spaces:3,
    attrs:['turnout-2x','turnout-individual','care-full','care-hay','care-mucking','care-rugs','care-checks','facility-indoor','facility-outdoor','facility-hacking','facility-washbay','facility-tackroom','training-weekly','activity-clinics'],
    price:{model:'BOOK', amount:650, period:'month', label:'Full Care Package'},
    extras:[{name:'3x daily turnout', amount:50},{name:'Weekly private lesson', amount:45},{name:'Clipping (per session)', amount:35}],
    description:'A full-service yard on the edge of Exmoor, built for owners who want their horse properly looked after without giving up arena time or hacking.'
  },
  {
    id:'EQ-0209', name:'Fenway Farm DIY', location:'Devon', type:'DIY livery',
    accommodation:'Stable + grazing', spaces:5,
    attrs:['turnout-2x','turnout-group','turnout-flexible','care-basic','facility-outdoor','facility-hacking','facility-tackroom','activity-social'],
    price:{model:'BOOK', amount:48, period:'week', label:'DIY Livery'},
    extras:[{name:'Extra hay net (per week)', amount:6}],
    description:'A friendly, sociable DIY yard where owners manage their own horse\u2019s care day to day, with good hacking straight from the gate.'
  },
  {
    id:'EQ-0317', name:'Oakridge Performance Yard', location:'Surrey', type:'Competition yard',
    accommodation:'Stable + individual turnout', spaces:1,
    attrs:['turnout-1x','turnout-individual','care-full','care-checks','facility-indoor','facility-outdoor','facility-walker','facility-washbay','training-multiple','training-coach','training-competition','activity-shows','activity-clinics'],
    price:{model:'POA', label:'Bespoke competition package'},
    extras:[],
    description:'A serious competition yard with a full training programme, built for horses actively campaigning at affiliated level.'
  },
  {
    id:'EQ-0455', name:'Willow Bank Private Livery', location:'Sussex', type:'Small private yard',
    accommodation:'Stable + individual turnout', spaces:2,
    attrs:['turnout-2x','turnout-individual','turnout-flexible','care-full','care-hay','care-rugs','facility-outdoor','facility-hacking'],
    price:{model:'ENQUIRE', amount:520, period:'month', label:'Private Full Livery'},
    extras:[],
    description:'A small, quiet family-run yard with only a handful of horses at any time \u2014 good for owners who want a lot of individual attention.'
  },
  {
    id:'EQ-0521', name:'Bridleway Equestrian Training Centre', location:'Warwickshire', type:'Training yard',
    accommodation:'Stable + group turnout', spaces:4,
    attrs:['turnout-1x','turnout-group','care-basic','care-mucking','facility-indoor','facility-outdoor','facility-walker','training-weekly','training-multiple','training-coach','activity-clinics','activity-shows'],
    price:{model:'ENQUIRE', amount:395, period:'month', label:'Training Livery'},
    extras:[{name:'Competition day support', amount:60}],
    description:'Built around instruction \u2014 multiple lessons a week are part of the culture here, not an add-on, with regular in-house clinics.'
  },
  {
    id:'EQ-0630', name:'Meadowcroft Retirement Grazing', location:'Somerset', type:'Retirement grazing',
    accommodation:'Grass grazing', spaces:6,
    attrs:['turnout-group','turnout-flexible','care-basic','facility-hacking'],
    price:{model:'BOOK', amount:22, period:'week', label:'Retirement Grazing'},
    extras:[],
    description:'Low-key, low-cost grazing for retired or resting horses \u2014 daily checks included, minimal handling required.'
  },
  {
    id:'EQ-0748', name:'Kestrel Stables', location:'Yorkshire', type:'Standard livery yard',
    accommodation:'Stable + turnout', spaces:4,
    attrs:['turnout-2x','turnout-group','care-basic','care-hay','care-mucking','facility-outdoor','facility-tackroom','activity-social'],
    price:{model:'BOOK', amount:58, period:'week', label:'Standard Livery'},
    extras:[{name:'Rug changes (per week)', amount:8}],
    description:'A straightforward, well-run yard on the North York Moors edge \u2014 no frills, reliable basic care, an easy-going crowd.'
  },
  {
    id:'EQ-0812', name:'Somerset Grazing Meadows', location:'Somerset', type:'Grass grazing',
    accommodation:'Grass grazing only', spaces:8,
    attrs:['turnout-group','turnout-flexible','facility-hacking'],
    price:{model:'BOOK', amount:18, period:'week', label:'Grass Grazing'},
    extras:[],
    description:'Simple grazing-only fields for owners who manage everything else themselves, with direct access onto bridleways.'
  }
];

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
   SUPABASE — accounts, saved preferences, real waitlist rows.
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
   FIND PAGE — interactive chip panel + live matches
============================================================ */
async function initFindPage(){
  const chipPanel = document.getElementById('chipPanel');
  const matchList = document.getElementById('matchList');
  if(!chipPanel || !matchList) return;

  const params = new URLSearchParams(location.search);
  const session = await getSession();
  const prefs = session ? await loadPrefsFromDB(session.user.id) : prefsFromParams(params);

  const authNote = document.getElementById('authNote');
  if(authNote){
    authNote.innerHTML = session
      ? `SIGNED IN AS ${session.user.email.toUpperCase()} \u00b7 YOUR PICKS SAVE AUTOMATICALLY \u00b7 <a href="#" onclick="signOutUser(); return false;" style="text-decoration:underline;">SIGN OUT</a>`
      : `NOT SIGNED IN \u00b7 YOUR PICKS WON'T BE SAVED AFTER YOU LEAVE \u00b7 <a href="account.html" style="text-decoration:underline;">SIGN IN TO KEEP THEM</a>`;
  }

  GROUPS.forEach(group=>{
    const groupEl = document.createElement('div');
    groupEl.className = 'chip-group';
    const h4 = document.createElement('h4');
    h4.textContent = group.name;
    groupEl.appendChild(h4);
    const row = document.createElement('div');
    row.className = 'chip-row';
    group.keys.forEach(key=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = ATTRS[key];
      btn.dataset.key = key;
      btn.dataset.state = prefs[key] || 0;
      btn.addEventListener('click', ()=>{
        const cur = parseInt(btn.dataset.state,10);
        const next = (cur + 1) % 4;
        btn.dataset.state = next;
        if(next === 0) delete prefs[key]; else prefs[key] = next;
        if(session) savePrefToDB(session.user.id, key, next);
        renderMatches();
      });
      row.appendChild(btn);
    });
    groupEl.appendChild(row);
    chipPanel.appendChild(groupEl);
  });

  function renderMatches(){
    const anyPrefs = Object.keys(prefs).length > 0;
    const toolbar = document.getElementById('matchToolbar');
    let scored = LISTINGS.map(l => ({listing:l, ...scoreListing(l, prefs)}));
    if(anyPrefs){
      scored.sort((a,b)=> b.score - a.score);
      toolbar.innerHTML = `<h3>Your matches</h3><span>${scored.length} places, ranked for you \u2014 nothing hidden</span>`;
    } else {
      toolbar.innerHTML = `<h3>All places</h3><span>Tell us what matters above to see these ranked for you</span>`;
    }
    matchList.innerHTML = scored.map(({listing,score,matched,missing})=>{
      const price = formatPrice(listing.price);
      const query = prefsToQuery(prefs);
      const href = `listing.html?id=${listing.id}${query ? '&'+query : ''}`;
      const scoreBlock = score === null ? '' : `
        <div class="match-score">
          <div><div class="score-num">${score}%</div><div class="score-label">${matchLabel(score)}</div></div>
        </div>`;
      const okTags = matched.slice(0,5).map(m=>`<span class="tag-ok">\u2713 ${ATTRS[m.key]}</span>`).join('');
      const missRequirement = missing.filter(m=>m.w===3);
      const missTags = missRequirement.map(m=>`<span class="tag-miss">\u25b3 ${ATTRS[m.key]} \u2014 you marked this a must-have</span>`).join('');
      return `
        <div class="match-card">
          <div>
            <div class="match-head">
              <div>
                <div class="match-name">${listing.name}</div>
                <div class="match-meta">${listing.location} \u00b7 ${listing.type} \u00b7 ${listing.spaces} space${listing.spaces===1?'':'s'} left</div>
              </div>
              <div class="match-price">${price.main}<span>${price.sub}</span></div>
            </div>
            <div class="match-tags">${okTags}${missTags}</div>
            ${anyPrefs ? `<div class="match-why">${matched.length} of your selected preferences are met here.${missRequirement.length ? ' Heads up on the must-have(s) flagged above \u2014 worth a look anyway, since you might feel differently once you see the place.' : ''}</div>` : ''}
            <div class="match-cta-row">
              ${badgeHtml(listing.price.model)}
              <a href="${href}" class="btn-secondary btn-small">View listing</a>
            </div>
          </div>
          ${scoreBlock}
        </div>`;
    }).join('');
  }
  renderMatches();
}

/* ============================================================
   LISTING PAGE — dynamic render from query id + optional prefs
============================================================ */
function initListingPage(){
  const root = document.getElementById('listingRoot');
  if(!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || LISTINGS[0].id;
  const listing = LISTINGS.find(l=>l.id===id) || LISTINGS[0];
  const prefs = prefsFromParams(params);
  const hasPrefs = Object.keys(prefs).length > 0;
  const {score, matched, missing} = hasPrefs ? scoreListing(listing, prefs) : {score:null,matched:[],missing:[]};
  const price = formatPrice(listing.price);

  document.title = `${listing.name} \u2014 Equivoa`;

  const missRequirement = missing.filter(m=>m.w===3);
  const calloutHtml = missRequirement.length ? `
    <div class="callout-miss">
      <b>Worth knowing</b>
      This place doesn't offer ${missRequirement.map(m=>ATTRS[m.key]).join(', ')} \u2014 you marked ${missRequirement.length>1?'these':'this'} as a must-have. Everything else about the match is below.
    </div>` : '';

  const matchHeaderHtml = hasPrefs ? `<div class="eyebrow">${matchLabel(score)} \u00b7 ${score}%</div>` : `<div class="eyebrow">${listing.type}</div>`;

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
    <div style="font-family:var(--mono); font-size:11px; color:rgba(20,32,26,0.45); margin-top:10px; text-align:center;">Live booking isn't switched on yet \u2014 we'll notify you the moment it is.</div>
  `;

  root.innerHTML = `
    <section class="listing-hero">
      <div class="wrap">
        ${matchHeaderHtml}
        <div class="listing-hero-top">
          <div>
            <h1>${listing.name}</h1>
            <div class="meta">${listing.location} \u00b7 ${listing.accommodation} \u00b7 ${listing.spaces} space${listing.spaces===1?'':'s'} left</div>
          </div>
          ${badgeHtml(listing.price.model)}
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
   HOME PAGE — waitlist form + role pre-select from ?role=
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
    btn.textContent = result.ok ? "You're on the list." : 'Something went wrong — try again';
    if(!result.ok){ btn.disabled = false; }
  });
}

/* ============================================================
   PROFILE PAGE — real saved profile when signed in
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
    <h1>${hasPrefs ? 'Your Equivoa profile.' : "You're signed in — no preferences saved yet."}</h1>
    <p class="lede">${hasPrefs ? 'This is what you told us matters. Head to Find to change anything.' : 'Go to Find and tap what matters to your horse — it saves here automatically.'}</p>
    <div class="hero-ctas">
      <a href="find.html" class="btn-primary">${hasPrefs ? 'Edit on Find' : 'Build your profile'}</a>
      <a href="#" onclick="signOutUser(); return false;" class="btn-secondary">Sign out</a>
    </div>`;

  if(!hasPrefs){
    bodyRoot.innerHTML = `<div class="empty-state">Nothing saved yet — your picks from the Find page will show up here.</div>`;
    return;
  }

  const cardsHtml = GROUPS.map(group=>{
    const items = group.keys.filter(k=>prefs[k]);
    if(!items.length) return '';
    const tags = items.map(k=>{
      const w = prefs[k];
      const cls = w===3 ? 'req' : (w===2 ? 'imp' : '');
      return `<span class="${cls}">${ATTRS[k]}${w===3?' — must have':(w===2?' — important':'')}</span>`;
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
   ACCOUNT PAGE — passwordless sign-in / signed-in state
============================================================ */
async function initAccountPage(){
  const root = document.getElementById('accountRoot');
  if(!root) return;

  if(!sb){
    root.innerHTML = `
      <h2>Accounts aren't switched on yet</h2>
      <p>This site's owner hasn't connected a database yet, so sign-in isn't live. Nothing's broken — check back soon.</p>`;
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
    <p>Same form either way — if it's your first time, this creates your account too.</p>
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
      root.querySelector('.account-note').textContent = 'Something went wrong sending that — double check the email and try again.';
    }
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  initNav();
  initAuthUI();
  initWaitlistForm();
  initFindPage();
  initListingPage();
  initProfilePage();
  initAccountPage();
});
