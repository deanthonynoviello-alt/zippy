const fallbackDeals = [
  { id: 1, category: 'Food', emoji: '🍔', title: '$7.99 Burger + Fries', business: 'Beachside Burger Co.', distance: 1.2, expires: 'Ends tonight', discount: 'SAVE 35%', price: '$7.99', oldPrice: '$12.29', score: 9.2, address: 'Port Orange, FL', verified: 'Verified today', description: 'Classic burger with fries for one low price. A strong nearby dinner deal when you want something quick without paying full menu price.', terms: 'Dine-in or takeout. One offer per customer. Not valid with other discounts. Availability may vary by location.' },
  { id: 2, category: 'Coffee', emoji: '☕', title: 'Buy One, Get One Free', business: 'Sunrise Coffee', distance: 0.8, expires: 'Ends 6 PM', discount: 'BOGO', price: '$4.75', oldPrice: '$9.50', score: 9.6, address: 'Port Orange, FL', verified: 'Verified today', description: 'Buy one handcrafted drink and get a second eligible drink free. Great for two people or a two-coffee kind of day.', terms: 'Equal or lesser value drink is free. Participating drinks only. Limit one redemption per visit.' },
  { id: 3, category: 'Shopping', emoji: '👟', title: '40% Off Select Shoes', business: 'Coastal Kicks', distance: 2.4, expires: 'Ends Sunday', discount: 'SAVE 40%', price: '$53.99', oldPrice: '$89.99', score: 8.8, address: 'Port Orange, FL', verified: 'Verified yesterday', description: 'Save 40% on select casual and athletic shoes while promotional inventory lasts.', terms: 'Select styles only. Excludes clearance and limited releases. In-store availability may differ.' },
  { id: 4, category: 'Fun', emoji: '🎳', title: '$12 Unlimited Bowling', business: 'Strike Zone', distance: 3.1, expires: 'Tonight only', discount: 'SAVE 45%', price: '$12', oldPrice: '$22', score: 9.0, address: 'South Daytona, FL', verified: 'Verified today', description: 'Unlimited bowling during the promotional evening window for $12 per person.', terms: 'Shoe rental may be separate. Lane availability is first come, first served. Valid during posted promotional hours.' },
  { id: 5, category: 'Food', emoji: '🍕', title: '$10 Large Cheese Pizza', business: 'Volusia Pizza House', distance: 2.0, expires: 'Ends 9 PM', discount: 'SAVE 38%', price: '$10', oldPrice: '$16.25', score: 9.4, address: 'Port Orange, FL', verified: 'Verified today', description: 'Large cheese pizza for $10. Add toppings at regular menu pricing.', terms: 'Carryout only. One discounted pizza per order. Taxes and add-ons are extra.' },
  { id: 6, category: 'Shopping', emoji: '🧴', title: 'Buy 2, Get 1 Free', business: 'Glow & Co.', distance: 4.6, expires: 'Ends Aug 18', discount: '3 FOR 2', price: '$18', oldPrice: '$27', score: 8.4, address: 'Daytona Beach, FL', verified: 'Verified yesterday', description: 'Mix and match eligible skincare and body-care items and receive the lowest-priced item free.', terms: 'Eligible items only. Lowest-priced qualifying item is free. Cannot be combined with other offers.' }
];

let deals = [...fallbackDeals];


const REFERENCE_LOCATION = { lat: 29.1383, lon: -80.9926 };

function distanceMiles(lat1, lon1, lat2, lon2) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapDbDeal(row) {
  const hasCoords = Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude));
  return {
    id: Number(row.id),
    category: row.category,
    emoji: row.emoji || '🏷️',
    title: row.title,
    business: row.businessName,
    distance: hasCoords
      ? distanceMiles(
          REFERENCE_LOCATION.lat,
          REFERENCE_LOCATION.lon,
          Number(row.latitude),
          Number(row.longitude)
        )
      : 0,
    expires: row.expirationText || '',
    discount: row.discountLabel || '',
    price: row.price || '',
    oldPrice: row.originalPrice || '',
    score: Number(row.score || 0),
    address: [row.address, row.city, row.state, row.zipCode].filter(Boolean).join(', '),
    verified: row.verifiedText || '',
    description: row.description || '',
    terms: row.terms || ''
  };
}

async function loadDealsFromDatabase() {
  try {
    const response = await fetch('/api/deals', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Deal API returned ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.deals)) throw new Error('Deal API returned an unexpected response.');
    deals = payload.deals.map(mapDbDeal);
  } catch (error) {
    console.warn('Could not load database deals; using fallback sample deals.', error);
    deals = [...fallbackDeals];
  }
  renderDeals();
}

let activeCategory = 'All';
let ascending = true;
let activeDeal = null;

// Local HTML files on some mobile browsers (especially iOS) can block localStorage.
// Zippy falls back to in-memory saves instead of letting that error stop all JavaScript.
function loadSavedDeals() {
  try {
    const raw = window.localStorage ? localStorage.getItem('zippySavedDeals') : null;
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Saved deals storage is unavailable in this browser session.', error);
    return [];
  }
}

function persistSavedDeals() {
  try {
    if (window.localStorage) {
      localStorage.setItem('zippySavedDeals', JSON.stringify(savedDeals));
    }
  } catch (error) {
    console.warn('Could not persist saved deals; keeping them for this session only.', error);
  }
}

let savedDeals = loadSavedDeals();
const dealGrid = document.getElementById('dealGrid');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const locationDialog = document.getElementById('locationDialog');
const businessDialog = document.getElementById('businessDialog');
const dealDialog = document.getElementById('dealDialog');

function openDialog(dialog) {
  if (!dialog) return;
  try {
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  } catch (error) {
    console.warn('Dialog could not be opened modally; using fallback.', error);
    dialog.setAttribute('open', '');
  }
}

function closeDialog(dialog) {
  if (!dialog) return;
  try {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  } catch (error) {
    dialog.removeAttribute('open');
  }
}


function renderDeals() {
  const q = searchInput.value.trim().toLowerCase();
  let visible = deals.filter(d => {
    const categoryMatch = activeCategory === 'All' || d.category === activeCategory;
    const searchMatch = !q || `${d.title} ${d.business} ${d.category}`.toLowerCase().includes(q);
    return categoryMatch && searchMatch;
  });

  visible.sort((a, b) => ascending ? a.distance - b.distance : b.distance - a.distance);

  if (!visible.length) {
    dealGrid.innerHTML = `<div class="empty-state"><strong>No deals found.</strong><br>Try another search or category.</div>`;
    return;
  }

  dealGrid.innerHTML = visible.map(d => `
    <article class="deal-card" data-deal-id="${d.id}">
      <div class="deal-visual">
        <div class="deal-emoji">${d.emoji}</div>
        <div class="discount-badge">${d.discount}</div>
      </div>
      <div class="deal-body">
        <div class="deal-meta"><span>📍 ${d.distance.toFixed(1)} mi</span><span>⏰ ${d.expires}</span></div>
        <h3>${d.title}</h3>
        <p class="business-name">${d.business}</p>
        <div class="deal-footer">
          <div class="price-wrap"><span class="price">${d.price}</span><span class="old-price">${d.oldPrice}</span></div>
          <button class="deal-btn" data-open-deal="${d.id}" aria-label="View ${d.title} at ${d.business}">View deal</button>
        </div>
      </div>
    </article>
  `).join('');
}

function openDeal(id) {
  const d = deals.find(deal => deal.id === Number(id));
  if (!d) return;
  activeDeal = d;
  document.getElementById('detailEmoji').textContent = d.emoji;
  document.getElementById('detailDiscount').textContent = d.discount;
  document.getElementById('detailCategory').textContent = d.category.toUpperCase();
  document.getElementById('detailTitle').textContent = d.title;
  document.getElementById('detailBusiness').textContent = d.business;
  document.getElementById('detailPrice').textContent = d.price;
  document.getElementById('detailOldPrice').textContent = d.oldPrice;
  document.getElementById('detailScore').textContent = `${d.score.toFixed(1)} Zippy Score`;
  document.getElementById('detailDistance').textContent = `${d.distance.toFixed(1)} mi away`;
  document.getElementById('detailAddress').textContent = d.address;
  document.getElementById('detailExpires').textContent = d.expires;
  document.getElementById('detailVerified').textContent = d.verified;
  document.getElementById('detailDescription').textContent = d.description;
  document.getElementById('detailTerms').textContent = d.terms;
  document.getElementById('dealActionStatus').textContent = '';
  updateSaveButton();
  openDialog(dealDialog);
}

dealGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-open-deal]');
  if (button) openDeal(button.dataset.openDeal);
});

document.getElementById('dealCloseBtn').addEventListener('click', () => closeDialog(dealDialog));

document.getElementById('directionsBtn').addEventListener('click', () => {
  if (!activeDeal) return;
  const destination = encodeURIComponent(`${activeDeal.business}, ${activeDeal.address}`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, '_blank', 'noopener');
});

document.getElementById('getDealBtn').addEventListener('click', () => {
  if (!activeDeal) return;
  const status = document.getElementById('dealActionStatus');
  status.textContent = `Deal ready — show this page at ${activeDeal.business}.`;
});

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.category;
    renderDeals();
  });
});

searchInput.addEventListener('input', () => {
  clearSearch.style.display = searchInput.value ? 'block' : 'none';
  renderDeals();
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  clearSearch.style.display = 'none';
  searchInput.focus();
  renderDeals();
});

document.getElementById('sortBtn').addEventListener('click', (e) => {
  ascending = !ascending;
  e.currentTarget.textContent = ascending ? 'Nearest ↕' : 'Farthest ↕';
  renderDeals();
});

document.getElementById('locationBtn').addEventListener('click', () => openDialog(locationDialog));
document.getElementById('businessBtn').addEventListener('click', () => openDialog(businessDialog));

document.getElementById('locationForm').addEventListener('submit', () => {
  const val = document.getElementById('manualLocation').value.trim();
  if (val) document.getElementById('locationText').textContent = val;
});

document.getElementById('geoBtn').addEventListener('click', () => {
  const status = document.getElementById('geoStatus');
  if (!navigator.geolocation) {
    status.textContent = 'Location is not supported by this browser.';
    return;
  }
  status.textContent = 'Getting your location…';
  navigator.geolocation.getCurrentPosition(
    () => {
      document.getElementById('locationText').textContent = 'Current location';
      status.textContent = 'Location found. Real nearby deal matching comes when we connect the database.';
      setTimeout(() => closeDialog(locationDialog), 900);
    },
    () => { status.textContent = 'Could not access your location. You can enter it manually instead.'; }
  );
});

loadDealsFromDatabase();


function updateSaveButton() {
  const btn = document.getElementById('saveDealBtn');
  if (!btn || !activeDeal) return;
  const saved = savedDeals.includes(activeDeal.id);
  btn.textContent = saved ? '♥ Saved' : '♡ Save';
  btn.classList.toggle('saved', saved);
}

document.getElementById('saveDealBtn').addEventListener('click', () => {
  if (!activeDeal) return;
  if (savedDeals.includes(activeDeal.id)) {
    savedDeals = savedDeals.filter(id => id !== activeDeal.id);
  } else {
    savedDeals.push(activeDeal.id);
  }
  persistSavedDeals();
  updateSaveButton();
  document.getElementById('dealActionStatus').textContent =
    savedDeals.includes(activeDeal.id) ? 'Saved for later.' : 'Removed from saved deals.';
});

const appPanel = document.getElementById('appPanel');
const homeSections = [
  document.querySelector('.hero'),
  document.querySelector('.quick-row'),
  document.querySelector('.section-head'),
  document.getElementById('dealGrid'),
  document.querySelector('.business-banner')
];

function dealMiniCard(d) {
  return `<button class="mini-deal" data-open-deal="${d.id}">
    <span class="mini-emoji">${d.emoji}</span>
    <span><strong>${d.title}</strong><small>${d.business} · ${d.distance.toFixed(1)} mi</small></span>
    <b>${d.discount}</b>
  </button>`;
}

function showView(view) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  const isHome = view === 'home';
  homeSections.forEach(el => el.hidden = !isHome);
  appPanel.hidden = isHome;
  if (isHome) return;

  const kicker = document.getElementById('panelKicker');
  const title = document.getElementById('panelTitle');
  const text = document.getElementById('panelText');
  const content = document.getElementById('panelContent');

  if (view === 'explore') {
    kicker.textContent = 'EXPLORE';
    title.textContent = 'Discover more nearby';
    text.textContent = 'Browse the best food, shopping, activities, and entertainment deals.';
    content.innerHTML = `
      <div class="explore-categories">
        <button data-explore-category="Food">🍔<strong>Food</strong><small>${deals.filter(d=>d.category==='Food').length} deals</small></button>
        <button data-explore-category="Shopping">🛍️<strong>Shopping</strong><small>${deals.filter(d=>d.category==='Shopping').length} deals</small></button>
        <button data-explore-category="Fun">🎳<strong>Activities</strong><small>${deals.filter(d=>d.category==='Fun').length} deal</small></button>
        <button data-explore-category="Coffee">☕<strong>Coffee</strong><small>${deals.filter(d=>d.category==='Coffee').length} deal</small></button>
      </div>
      <div class="panel-list">${deals.map(dealMiniCard).join('')}</div>`;
  }

  if (view === 'map') {
    kicker.textContent = 'MAP';
    title.textContent = 'Deals around you';
    text.textContent = 'A lightweight map preview for the MVP. Live map pins can plug in when the deal database is connected.';
    content.innerHTML = `<div class="fake-map">
      <div class="map-road road-one"></div><div class="map-road road-two"></div>
      ${deals.slice(0,5).map((d,i)=>`<button class="map-pin pin-${i+1}" data-open-deal="${d.id}" aria-label="${d.title}">${d.emoji}<span>${d.price}</span></button>`).join('')}
      <div class="you-dot"><span></span>You</div>
    </div>
    <div class="panel-list">${deals.slice(0,3).map(dealMiniCard).join('')}</div>`;
  }

  if (view === 'saved') {
    const saved = deals.filter(d => savedDeals.includes(d.id));
    kicker.textContent = 'SAVED';
    title.textContent = saved.length ? 'Your saved deals' : 'Nothing saved yet';
    text.textContent = saved.length ? 'Keep your favorites here so they’re easy to find later.' : 'Tap “Save” on a deal and it’ll show up here.';
    content.innerHTML = saved.length
      ? `<div class="panel-list">${saved.map(dealMiniCard).join('')}</div>`
      : `<div class="saved-empty"><span>♡</span><strong>Save something worth coming back to.</strong><button data-go-explore>Explore deals</button></div>`;
  }
  window.scrollTo({top: 0, behavior: 'smooth'});
}

document.querySelector('.bottom-nav').addEventListener('click', (e) => {
  const item = e.target.closest('[data-view]');
  if (!item) return;
  e.preventDefault();
  showView(item.dataset.view);
});

appPanel.addEventListener('click', (e) => {
  const dealBtn = e.target.closest('[data-open-deal]');
  if (dealBtn) openDeal(dealBtn.dataset.openDeal);
  const cat = e.target.closest('[data-explore-category]');
  if (cat) {
    activeCategory = cat.dataset.exploreCategory;
    showView('home');
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.category === activeCategory));
    renderDeals();
    document.querySelector('.section-head').scrollIntoView({behavior:'smooth'});
  }
  if (e.target.closest('[data-go-explore]')) showView('explore');
});

// Make external link and dialog behavior safer when this prototype is opened from Files on mobile.
window.addEventListener('error', (event) => {
  console.warn('Zippy prototype error:', event.error || event.message);
});