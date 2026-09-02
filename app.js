(() => {
  const $ = (s) => document.querySelector(s);

  // Theme toggle removed — theme is fixed to dark.

  // Cursor glow
  const cursor = $('#cursor');
  document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
  }, { passive: true });

  // Background music — subtle, quiet, on/off via nav button
  const bgMusic = $('#bgMusic');
  const soundBtn = $('#navSound');
  const soundIcon = $('#navSoundIcon');
  if (bgMusic && soundBtn) {
    bgMusic.volume = 0.12; // barely audible
    soundBtn.addEventListener('click', () => {
      if (bgMusic.paused) {
        bgMusic.play();
        soundBtn.classList.add('playing');
        soundIcon.textContent = '\u23F8';
      } else {
        bgMusic.pause();
        soundBtn.classList.remove('playing');
        soundIcon.textContent = '\u266B';
      }
    });
  }

  // Nav backdrop on scroll
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Grid population — fixed order from images/z01..z15
  const featured = $('#featured');
  const IMG_COUNT = 15;
  const cats = ['SURVIVOR', 'HORDE', 'WALKER', 'GRAVEYARD', 'PATIENT ZERO', 'CRAWLER', 'ROT', 'OUTBREAK'];
  const titles = [
    'Feeding Hour', 'First Bite', 'The Hollow Ones', 'Patient Zero', 'Night of the Dead',
    'Rot & Rebirth', 'The Crawl', 'Empty Streets', 'Last Standing', 'The Bridge',
    'Twilight of the Undead', 'Into the Horde', 'Cold Grave', 'The Return', 'Bright Rot'
  ];

  for (let i = 0; i < IMG_COUNT; i++) {
    const n = String(i + 1).padStart(2, '0');
    const src = i === 14 ? 'images/z16.webp' : `images/z${n}.webp`;
    const card = document.createElement('a');
    card.className = 'card';
    card.href = '#work';
    card.innerHTML = `
      <img src="${src}" alt="${titles[i]}" loading="lazy" />
      <span class="card-idx">${String(i + 1).padStart(2, '0')}</span>
      <span class="card-overlay">
        <span class="card-cat">${cats[i % cats.length]}</span>
        <span class="card-num">${titles[i]}</span>
      </span>
    `;
    featured.appendChild(card);
  }

  // Scroll reveal — smooth fade + rise + blur
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const d = e.target.style.transitionDelay || '0s';
        e.target.style.transition = 'opacity 2.1s cubic-bezier(.19,.7,.22,1), transform 2.3s cubic-bezier(.19,.7,.22,1), filter 2.1s ease';
        e.target.style.transitionDelay = d;
        e.target.style.opacity = '1';
        e.target.style.transform = '';
        e.target.style.filter = 'blur(0)';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px 30px 0px' });

  const hidden = (el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(80px)';
    el.style.filter = 'blur(2px)';
  };
  let cardIdx = 0;
  document.querySelectorAll('.hero-kicker, .hero-title, .hero-foot, .section-head, .section-title, blockquote, .quote-author, .card, .studio-col, .studio-visual, .contact-mail').forEach((el, i) => {
    hidden(el);
    el.style.transitionDelay = (el.classList.contains('card') ? cardIdx * 0.12 : (i % 4) * 0.07) + 's';
    if (el.classList.contains('card')) cardIdx++;
    io.observe(el);
  });

  // Smooth anchor offset for fixed nav
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    if (a.classList.contains('card')) return;
    a.addEventListener('click', (e) => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      smoothScrollTo(t);
    });
  });

  // Buttery smooth scroll (custom eased rAF animation, offset for fixed nav)
  let scrollAnim = null;
  function smoothScrollTo(target) {
    const top = target.getBoundingClientRect().top + window.pageYOffset - 0;
    const from = window.pageYOffset;
    const dist = top - from;
    const dur = 500;
    let start = null;
    cancelAnimationFrame(scrollAnim);
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      window.scrollTo(0, from + dist * ease(p));
      if (p < 1) scrollAnim = requestAnimationFrame(step);
    };
    scrollAnim = requestAnimationFrame(step);
  }

  // Parallax: hero content + 3D head drift on scroll, subtle parallax on studio photo
  const heroContent = document.querySelector('.hero-content');
  const head3d = document.querySelector('.head3d');
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  const parallaxCfg = [];
  const vhCache = { v: window.innerHeight };
  parallaxEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const mid = rect.top + window.pageYOffset + rect.height / 2;
    parallaxCfg.push({
      el,
      mid,
      speed: parseFloat(el.getAttribute('data-parallax')) || 0.15
    });
  });
  let ticking = false;
  function onScrollParallax() {
    const y = window.pageYOffset;
    if (heroContent) heroContent.style.transform = `translateY(${y * 0.18}px)`;
    if (head3d) head3d.style.transform = `translateY(${y * -0.12}px)`;
    parallaxCfg.forEach(({ el, mid, speed }) => {
      const pos = ((mid - y - vhCache.v / 2) / vhCache.v) * 100;
      el.style.transform = `translateY(${pos * speed}px)`;
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollParallax);
    }
  }, { passive: true });
  onScrollParallax();
  window.addEventListener('resize', () => {
    vhCache.v = window.innerHeight;
  });

  // Lightbox — open big photo on card click
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxClose = $('#lightboxClose');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const img = card.querySelector('img');
      openLightbox(img.getAttribute('src'), img.getAttribute('alt'));
    });
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightboxClose) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Slow chaotic per-letter drift on [data-letters-drift] headings
  document.querySelectorAll('.letters-drift').forEach((el) => {
    const wrap = (node) => {
      const t = node.textContent;
      node.textContent = '';
      let idx = 0;
      for (const ch of t) {
        const s = document.createElement('span');
        s.className = 'drift-l';
        s.textContent = ch;
        s.style.animationDuration = 6 + (idx % 5) * 1.3 + 's';
        s.style.animationDelay = (idx * 0.18) + 's';
        node.appendChild(s);
        idx++;
      }
    };
    const direct = el.querySelectorAll(':scope > span');
    if (direct.length) {
      direct.forEach(wrap);
    } else {
      wrap(el);
    }
  });
})();
