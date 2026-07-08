/* ═══════════════════════════════════════════════════════════════
   Academic Project Page — Scripts
   (adapted from the tune-to-learn template; site-specific
    poll / widget code removed)
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initComparisonSliders();
  initCarousels();
  initCopyButtons();
  initLazyVideos();
  initLazyIframes();
  initReplayButtons();
  initSyncVideos();
  initStickyHeader();
  buildDynamicToc();
});

/* ── Tabs ──────────────────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach(tabGroup => {
    const buttons  = tabGroup.querySelectorAll('.tab-btn');
    const contents = tabGroup.querySelectorAll('.tab-content');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b  => b.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const target = tabGroup.querySelector('#' + btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  });
}

/* ── Image Comparison Slider ───────────────────────────────── */
function initComparisonSliders() {
  document.querySelectorAll('[data-comparison]').forEach(slider => {
    const before = slider.querySelector('.comparison-before');
    const handle = slider.querySelector('.comparison-handle');
    let isDragging = false;

    function setPosition(x) {
      const rect = slider.getBoundingClientRect();
      let pct = ((x - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left = pct + '%';
    }

    slider.addEventListener('mousedown',  (e) => { isDragging = true; setPosition(e.clientX); });
    slider.addEventListener('touchstart', (e) => { isDragging = true; setPosition(e.touches[0].clientX); }, { passive: true });

    window.addEventListener('mousemove', (e) => { if (isDragging) setPosition(e.clientX); });
    window.addEventListener('touchmove', (e) => { if (isDragging) setPosition(e.touches[0].clientX); }, { passive: true });

    window.addEventListener('mouseup',  () => { isDragging = false; });
    window.addEventListener('touchend', () => { isDragging = false; });
  });
}

/* ── Carousel ──────────────────────────────────────────────── */
function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track    = carousel.querySelector('.carousel-track');
    const slides   = carousel.querySelectorAll('.carousel-slide');
    const prevBtn  = carousel.querySelector('.carousel-btn.prev');
    const nextBtn  = carousel.querySelector('.carousel-btn.next');
    const dotsWrap = carousel.querySelector('.carousel-dots');
    let current = 0;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    const dots = dotsWrap.querySelectorAll('.carousel-dot');

    function goTo(index) {
      current = ((index % slides.length) + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    let startX = 0;
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? goTo(current + 1) : goTo(current - 1);
      }
    });

    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    });
  });
}

/* ── Copy BibTeX ───────────────────────────────────────────── */
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.copy;
      const target   = document.getElementById(targetId);
      if (!target) return;

      navigator.clipboard.writeText(target.textContent.trim()).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = original;
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  });
}

/* ── Lazy-load videos on scroll ────────────────────────────── */
function initLazyVideos() {
  const videos = document.querySelectorAll('video[data-src]');
  if (!videos.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        const source = video.querySelector('source');
        if (source && source.dataset.src) {
          source.src = source.dataset.src;
          video.load();
          if (video.hasAttribute('autoplay')) {
            video.play().catch(() => {});
          }
        }
        observer.unobserve(video);
      }
    });
  }, { rootMargin: '200px' });

  videos.forEach(v => observer.observe(v));
}

/* ── Replay buttons for non-looping videos ────────────────── */
function initReplayButtons() {
  document.querySelectorAll('.replay-video').forEach(function(vid) {
    if (vid._replayInit) return;
    vid._replayInit = true;
    var btn = vid.parentElement.querySelector('.replay-btn');
    if (!btn) return;
    vid.addEventListener('ended', function() {
      btn.style.display = 'block';
    });
    btn.addEventListener('click', function() {
      vid.currentTime = 0;
      vid.play();
      btn.style.display = 'none';
    });
  });
}

/* ── Sync looping videos (restart together) ───────────────── */
function initSyncVideos() {
  var groups = {};
  document.querySelectorAll('.sync-video').forEach(function(vid) {
    if (vid._syncInit) return;
    var group = vid.dataset.syncGroup;
    if (!group) return;
    if (!groups[group]) groups[group] = [];
    groups[group].push(vid);
  });
  Object.keys(groups).forEach(function(group) {
    var vids = groups[group];
    if (vids.length < 2) return;
    vids.forEach(function(vid) {
      if (vid._syncInit) return;
      vid._syncInit = true;
      vid.addEventListener('ended', function() {
        vids.forEach(function(v) {
          v.currentTime = 0;
          v.play();
        });
      });
      vid.removeAttribute('loop');
    });
  });
}

/* ── Lazy-load iframes on scroll ───────────────────────────── */
function initLazyIframes() {
  const iframes = document.querySelectorAll('iframe[data-src]');
  if (!iframes.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        if (iframe.dataset.src) {
          iframe.src = iframe.dataset.src;
          iframe.removeAttribute('data-src');
          iframe.addEventListener('load', () => {
            iframe.classList.add('lazy-loaded');
          }, { once: true });
        }
        observer.unobserve(iframe);
      }
    });
  }, { rootMargin: '100px' });

  iframes.forEach(iframe => observer.observe(iframe));
}

/* ── Sticky Header ─────────────────────────────────────────── */
function initStickyHeader() {
  const hero = document.querySelector('.hero');
  const sticky = document.getElementById('sticky-header');
  if (!hero || !sticky) return;

  function onScroll() {
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    if (window.scrollY > heroBottom - 10) {
      sticky.classList.add('visible');
    } else {
      sticky.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Dynamic TOC — right sidebar, built from sections ──────── */
function buildDynamicToc() {
  var nav = document.getElementById('dynamic-toc');
  if (!nav) return;

  var entries = [];
  document.querySelectorAll('section.section[id]').forEach(function(sec) {
    var h2 = sec.querySelector('h2');
    if (!h2) return;
    entries.push({ id: sec.id, text: h2.textContent.trim() });
    sec.querySelectorAll('h3[id]').forEach(function(h3) {
      entries.push({ id: h3.id, text: h3.textContent.trim(), sub: true });
    });
  });

  if (!entries.length) { nav.innerHTML = ''; return; }

  var html = '<span class="toc-title">Table of Contents</span><ul>';
  entries.forEach(function(e) {
    var cls = e.sub ? ' class="toc-sub"' : '';
    html += '<li' + cls + '><a href="#' + e.id + '">' + e.text + '</a></li>';
  });
  html += '</ul>';
  nav.innerHTML = html;

  /* Smooth-scroll without changing the URL hash */
  nav.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      var targetId = this.getAttribute('href').slice(1);
      var target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* Scroll spy */
  var tocLinks = nav.querySelectorAll('a');
  var spyIds = Array.from(tocLinks).map(function(a) { return a.getAttribute('href').slice(1); });
  var spySecs = spyIds.map(function(id) { return document.getElementById(id); }).filter(Boolean);

  function onScroll() {
    var scrollY = window.scrollY + window.innerHeight / 3;
    var currentId = spyIds[0];
    spySecs.forEach(function(sec) {
      var top = sec.getBoundingClientRect().top + window.scrollY;
      if (top <= scrollY) currentId = sec.id;
    });
    tocLinks.forEach(function(link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
