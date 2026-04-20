
const GENRES = ['All','Action','Adventure','Fantasy','Romance','Comedy','Horror','Sci-Fi','Thriller','Sports','Slice of Life','Mystery','Mecha','Isekai'];
let allAnime = [];
let filteredAnime = [];
let currentPage = 1;
const PER_PAGE = 24;
let activeGenre = 'All';
let searchTerm = '';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchPage(page) {
  const res = await fetch(`https://api.jikan.moe/v4/top/anime?page=${page}&limit=25`);
  if (!res.ok) throw new Error('fetch fail');
  const data = await res.json();
  return data.data || [];
}

async function loadAllAnime() {
  const allLoading = document.getElementById('all-loading');
  try {
    let results = [];
    for (let p = 1; p <= 4; p++) {
      const page = await fetchPage(p);
      results = results.concat(page);
      if (p < 4) await sleep(400);
    }
    allAnime = results.slice(0,100);
    filteredAnime = [...allAnime];
    document.getElementById('all-loading').style.display = 'none';
    document.getElementById('anime-count').textContent = `${allAnime.length} titles`;
    renderAllGrid();
    renderFeatured(allAnime[0]);
    renderTrending(allAnime.slice(0,20));
    renderTopRated([...allAnime].sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,20));
    renderGenreTabs();
  } catch(e) {
    allLoading.innerHTML = '<p style="color:var(--text2)">Failed to load anime. Please refresh.</p>';
  }
}

function renderFeatured(anime) {
  if (!anime) return;
  const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
  const wrap = document.getElementById('featured-wrap');
  wrap.innerHTML = `
  <div class="featured-banner" onclick="openModal(${anime.mal_id})">
    <img class="featured-img" src="${img}" alt="${anime.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/1280x540/12121a/606078?text=No+Image'"/>
    <div class="featured-info">
      <div class="featured-badge">Editor's Pick</div>
      <div class="featured-title">${anime.title}</div>
      <div class="featured-meta">
        ${anime.score?`<span class="rating">★ ${anime.score}</span>`:''}
        ${anime.year?`<span>📅 ${anime.year}</span>`:''}
        ${anime.episodes?`<span>📺 ${anime.episodes} eps</span>`:''}
        ${anime.status?`<span>${anime.status}</span>`:''}
      </div>
      <div class="featured-desc">${(anime.synopsis||'').substring(0,180)}${anime.synopsis?.length>180?'...':''}</div>
      <button class="featured-play" onclick="event.stopPropagation();openModal(${anime.mal_id})">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Watch Trailer
      </button>
    </div>
  </div>`;
}

function createCard(anime) {
  const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
  const score = anime.score ? anime.score.toFixed(1) : 'N/A';
  const genres = (anime.genres||[]).slice(0,2).map(g=>g.name).join(', ');
  const card = document.createElement('div');
  card.className = 'anime-card';
  card.onclick = () => openModal(anime.mal_id);
  card.innerHTML = `
    <div class="card-poster">
      <img src="${img}" alt="${anime.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/225x318/12121a/606078?text=No+Image'"/>
      <div class="card-overlay">
        <div class="play-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <span style="font-size:.72rem;color:#fff;font-weight:500">Watch Trailer</span>
      </div>
      ${anime.type?`<div class="card-type">${anime.type}</div>`:''}
      ${anime.episodes?`<div class="card-ep">${anime.episodes} EP</div>`:''}
      <div class="card-score">★ ${score}</div>
    </div>
    <div class="card-info">
      <div class="card-title" title="${anime.title}">${anime.title}</div>
      <div class="card-sub">
        ${anime.year?`<span>${anime.year}</span>`:'<span>—</span>'}
        ${anime.status?`<span>${anime.status==='Finished Airing'?'Finished':anime.status}</span>`:''}
      </div>
      ${genres?`<div class="card-genre">${genres}</div>`:''}
    </div>`;
  return card;
}

function renderTrending(list) {
  const grid = document.getElementById('trending-grid');
  grid.innerHTML = '';
  list.forEach(a => grid.appendChild(createCard(a)));
}

function renderTopRated(list) {
  const grid = document.getElementById('toprated-grid');
  grid.innerHTML = '';
  list.forEach(a => grid.appendChild(createCard(a)));
}

function renderGenreTabs() {
  const tabs = document.getElementById('genre-tabs');
  tabs.innerHTML = '';
  GENRES.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'genre-tab' + (g===activeGenre?' active':'');
    btn.textContent = g;
    btn.onclick = () => {
      activeGenre = g;
      tabs.querySelectorAll('.genre-tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      filterAndRender();
    };
    tabs.appendChild(btn);
  });
}

function filterAndRender() {
  filteredAnime = allAnime.filter(a => {
    const matchGenre = activeGenre==='All' || (a.genres||[]).some(g=>g.name===activeGenre);
    const matchSearch = !searchTerm || a.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchGenre && matchSearch;
  });
  currentPage = 1;
  renderAllGrid();
  renderTrending(filteredAnime.slice(0,20));
}

function renderAllGrid() {
  const grid = document.getElementById('all-grid');
  grid.innerHTML = '';
  const start = (currentPage-1)*PER_PAGE;
  const end = start + PER_PAGE;
  const page = filteredAnime.slice(start, end);
  page.forEach(a => grid.appendChild(createCard(a)));
  document.getElementById('anime-count').textContent = `${filteredAnime.length} titles`;
  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filteredAnime.length / PER_PAGE);
  const pag = document.getElementById('pagination');
  pag.innerHTML = '';
  if (total <= 1) return;

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.disabled = currentPage===1;
  prev.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>`;
  prev.onclick = () => { currentPage--; renderAllGrid(); document.getElementById('all-anime').scrollIntoView({behavior:'smooth'}); };
  pag.appendChild(prev);

  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = `Page ${currentPage} of ${total}`;
  pag.appendChild(info);

  for (let i=1;i<=total;i++) {
    if (total > 7 && Math.abs(i-currentPage)>2 && i!==1 && i!==total) {
      if (i===2||i===total-1) { const d=document.createElement('span'); d.className='page-info'; d.textContent='…'; pag.appendChild(d); }
      continue;
    }
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i===currentPage?' active':'');
    btn.textContent = i;
    btn.onclick = () => { currentPage=i; renderAllGrid(); document.getElementById('all-anime').scrollIntoView({behavior:'smooth'}); };
    pag.appendChild(btn);
  }

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.disabled = currentPage===total;
  next.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>`;
  next.onclick = () => { currentPage++; renderAllGrid(); document.getElementById('all-anime').scrollIntoView({behavior:'smooth'}); };
  pag.appendChild(next);
}

async function openModal(malId) {
  const overlay = document.getElementById('modal-overlay');
  const playerEl = document.getElementById('modal-player');
  const bodyEl = document.getElementById('modal-body');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  playerEl.innerHTML = `<div class="no-trailer"><div class="spinner"></div><span style="font-size:.875rem">Loading...</span></div>`;
  bodyEl.innerHTML = '';

  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
    const data = await res.json();
    const anime = data.data;

    // Trailer
    const ytId = anime.trailer?.youtube_id;
    if (ytId) {
      playerEl.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    } else {
      const img = anime.images?.jpg?.large_image_url || '';
      playerEl.innerHTML = `<div class="no-trailer" style="background:url('${img}') center/cover no-repeat;">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,.7);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;position:relative;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z"/></svg>
          <span style="font-size:.9rem;color:var(--text2)">No trailer available</span>
        </div>
      </div>`;
    }

    // Body
    const genres = (anime.genres||[]).map(g=>`<span class="tag">${g.name}</span>`).join('');
    const studios = (anime.studios||[]).map(s=>s.name).join(', ');
    const score = anime.score ? anime.score.toFixed(2) : 'N/A';
    const img = anime.images?.jpg?.image_url || '';

    bodyEl.innerHTML = `
    <div class="modal-header">
      <div class="modal-poster"><img src="${img}" alt="${anime.title}" onerror="this.style.display='none'"/></div>
      <div class="modal-meta">
        <div class="modal-title">${anime.title}</div>
        ${anime.title_english && anime.title_english!==anime.title ? `<div style="color:var(--text3);font-size:.875rem;margin-bottom:.5rem">${anime.title_english}</div>` : ''}
        <div class="modal-tags">
          ${anime.type?`<span class="tag red">${anime.type}</span>`:''}
          ${anime.status?`<span class="tag">${anime.status}</span>`:''}
          ${anime.rating?`<span class="tag">${anime.rating}</span>`:''}
          ${genres}
        </div>
        <div class="modal-stats">
          <div class="mstat"><div class="mstat-val" style="color:var(--gold)">${score}</div><div class="mstat-key">Score</div></div>
          <div class="mstat"><div class="mstat-val">${anime.episodes||'?'}</div><div class="mstat-key">Episodes</div></div>
          <div class="mstat"><div class="mstat-val">${anime.year||'—'}</div><div class="mstat-key">Year</div></div>
          ${anime.rank?`<div class="mstat"><div class="mstat-val">#${anime.rank}</div><div class="mstat-key">Rank</div></div>`:''}
          ${anime.members?`<div class="mstat"><div class="mstat-val">${(anime.members/1000).toFixed(0)}K</div><div class="mstat-key">Members</div></div>`:''}
        </div>
        ${studios?`<div style="font-size:.8rem;color:var(--text3)">Studio: <span style="color:var(--text2)">${studios}</span></div>`:''}
      </div>
    </div>
    <div class="modal-synopsis">${anime.synopsis||'No synopsis available.'}</div>
    `;
  } catch(e) {
    bodyEl.innerHTML = '<p style="color:var(--text2);padding:1rem">Failed to load details.</p>';
  }
}

function closeModal(e, force=false) {
  if (force || (e && e.target===document.getElementById('modal-overlay'))) {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('modal-player').innerHTML = '';
  }
}

// Search
document.getElementById('search-input').addEventListener('input', e => {
  searchTerm = e.target.value;
  filterAndRender();
});

// Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal(null, true);
});

// Back to top
window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-top');
  if (window.scrollY > 500) btn.classList.add('visible');
  else btn.classList.remove('visible');
});

function toggleMenu() {
  const links = document.querySelector('.nav-links');
  if (links.style.display === 'flex') {
    links.style.display = 'none';
  } else {
    links.style.cssText = 'display:flex;flex-direction:column;position:fixed;top:64px;left:0;right:0;background:var(--bg2);padding:1rem 2rem;gap:1rem;border-bottom:1px solid rgba(255,255,255,.08);z-index:99';
  }
}

// Start loading
loadAllAnime();
