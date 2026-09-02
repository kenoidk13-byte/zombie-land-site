(() => {
  const $ = (s) => document.querySelector(s);

  // Theme toggle removed — theme is fixed to dark.

  // Mobile hamburger menu
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

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

  // Editorial grid — photos of varying sizes
  const IMG_COUNT = 15;
  const titles = [
    'Feeding Hour', 'First Bite', 'The Hollow Ones', 'Patient Zero', 'Night of the Dead',
    'Rot & Rebirth', 'The Crawl', 'Empty Streets', 'Last Standing', 'The Bridge',
    'Twilight of the Undead', 'Into the Horde', 'Cold Grave', 'The Return', 'Bright Rot'
  ];
  const srcOf = (i) => i === 14 ? 'images/z16.webp' : `images/z${String(i + 1).padStart(2, '0')}.webp`;

  const stage = $('#editStage');
  const grid = document.createElement('div');
  grid.className = 'edit-grid';
  stage.appendChild(grid);

  for (let i = 0; i < IMG_COUNT; i++) {
    const a = document.createElement('a');
    a.className = 'card edit-card';
    a.href = '#work';
    a.innerHTML = `
      <img src="${srcOf(i)}" alt="${titles[i]}" loading="lazy" />
      <span class="edit-card-num">${titles[i]}</span>
    `;
    grid.appendChild(a);
  }

  // Hover distortion on cards (2D port of experiment-space shader — applied to the card itself)
  const prefersFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (prefersFine) {
    const easeSmooth = (a, b, x) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const DUR = 520;

    document.querySelectorAll('#featured .card').forEach((card) => {
      const img = card.querySelector('img');
      const canvas = document.createElement('canvas');
      canvas.className = 'card-effect';
      canvas.setAttribute('aria-hidden', 'true');
      card.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      const src = document.createElement('canvas');
      const sctx = src.getContext('2d');
      let raf = 0, running = false;
      let p = 0, startT = 0, ready = false;

      const measure = () => {
        const r = card.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(r.width * dpr));
        canvas.height = Math.max(1, Math.round(r.height * dpr));
        src.width = canvas.width;
        src.height = canvas.height;
      };

      const sample = () => {
        measure();
        if (!img.complete || !img.naturalWidth) { ready = false; return false; }
        sctx.setTransform(1, 0, 0, 1, 0, 0);
        sctx.clearRect(0, 0, src.width, src.height);
        const ir = img.naturalWidth / img.naturalHeight;
        const cr = src.width / src.height;
        let dw = src.width, dh = src.height, dx = 0, dy = 0;
        if (ir > cr) { dw = src.height * ir; dh = src.height; dx = (src.width - dw) / 2; }
        else { dw = src.width; dh = src.width / ir; dy = (src.height - dh) / 2; }
        sctx.drawImage(img, dx, dy, dw, dh);
        ready = true;
        return true;
      };

      const draw = (now) => {
        const W = canvas.width, H = canvas.height;
        const tile = Math.max(10, Math.round(Math.min(W, H) / dpr / 26)) * dpr;
        const cols = Math.ceil(W / tile), rows = Math.ceil(H / tile);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const pp = easeSmooth(0, 1, p);
        const time = now * 0.001;
        const amt = Math.sin(pp * Math.PI) * 0.045;
        for (let r = 0; r < rows; r++) {
          const v = (r * tile + tile / 2) / H;
          const dy = r * tile;
          for (let c = 0; c < cols; c++) {
            const u = (c * tile + tile / 2) / W;
            const dmx = c * tile;
            const waves = Math.sin(v * 28 + time * 2) * Math.sin(u * 10 - time * 1.3);
            const sx = (u + waves * amt) * W - tile / 2;
            const sy = (v + waves * amt * 0.6) * H - tile / 2;
            ctx.drawImage(src, sx, sy, tile, tile, dmx, dy, tile, tile);
          }
        }
      };

      const tick = (now) => {
        if (!running) { raf = 0; return; }
        const k = Math.min(1, (now - startT) / DUR);
        p = easeSmooth(0, 1, k);
        draw(now);
        if (k >= 1) {
          running = false;
          raf = 0;
        } else {
          raf = requestAnimationFrame(tick);
        }
      };

      const enter = (now) => {
        if (!ready) sample();
        if (!ready) return;
        stop();
        running = true;
        p = 0;
        startT = now;
        canvas.style.opacity = '1';
        raf = requestAnimationFrame(tick);
      };

      const leave = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        running = false;
        canvas.style.opacity = '0';
      };

      const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; running = false; };

      card.addEventListener('mouseenter', (e) => enter(e.timeStamp));
      card.addEventListener('focus', (e) => enter(e.timeStamp));
      card.addEventListener('mouseleave', leave);
      card.addEventListener('blur', leave);
      card.addEventListener('touchstart', stop, { passive: true });
      window.addEventListener('resize', () => { if (!running) sample(); });
    });
  }

  // --- Forever dripping blood (ambient background layer over the whole site) ---
  const forever = (() => {
    const cv = document.createElement('canvas');
    cv.className = 'forever-blood';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const cx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0;
    const drips = [];
    const MAXD = 220;

    const size = () => {
      W = cv.width = Math.max(1, Math.round(window.innerWidth * dpr));
      H = cv.height = Math.max(1, Math.round(window.innerHeight * dpr));
    };

    const make = (fromTop) => {
      const dense = !prefersFine; // on touch/mobile: heavier ambient rain
      return {
        x: Math.random() * W,
        y: fromTop ? -Math.random() * H * 0.4 : Math.random() * H,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (dense ? 1 : 0.5) + Math.random() * 1.6,
        r: (Math.random() * 3 + 2) * dpr * 0.6 * (dense ? 1.5 : 1),
        phase: Math.random() * Math.PI * 2,
        wob: (Math.random() * 1.1 + 0.2) * dpr,
        alpha: (dense ? 0.3 : 0.15) + Math.random() * 0.45
      };
    };

    const seeded = () => {
      const dense = !prefersFine;
      const n = Math.round(W ? Math.min(MAXD, W / (dense ? 14 : 22 * dpr)) : 40);
      drips.length = 0;
      for (let i = 0; i < n; i++) drips.push(make(true));
    };

    const step = () => {
      const t = performance.now() * 0.001;
      for (let i = drips.length - 1; i >= 0; i--) {
        const d = drips[i];
        d.vy += 0.03;
        d.y += d.vy;
        d.x += d.vx + Math.sin(t * 2 + d.phase) * d.wob * 0.02;
        if (d.y > H + d.r * 4) { drips[i] = make(true); }
        // occasional bleed trail
        if (Math.random() < 0.004 && drips.length < MAXD) {
          drips.push({ x: d.x, y: d.y - d.r, vx: (Math.random() - 0.5) * 0.5, vy: 0.3 + Math.random(),
            r: d.r * 0.6, phase: Math.random() * Math.PI * 2, wob: d.wob * 0.5, alpha: d.alpha * 0.7 });
        }
      }
    };

    const draw = () => {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, W, H);
      const t = performance.now() * 0.001;
      for (let i = 0; i < drips.length; i++) {
        const d = drips[i];
        const wobx = Math.sin(t * 3 + d.phase) * d.wob;
        cx.globalAlpha = d.alpha;
        cx.fillStyle = '#a01416';
        cx.beginPath();
        cx.ellipse(d.x + wobx, d.y, d.r * 0.5, d.r, 0, 0, Math.PI * 2);
        cx.fill();
        // thin dripline tail
        cx.globalAlpha = d.alpha * 0.5;
        cx.beginPath();
        cx.rect(d.x + wobx - d.r * 0.14, d.y - d.r * 2.4, d.r * 0.28, d.r * 2);
        cx.fill();
      }
      cx.globalAlpha = 1;
    };

    const loop = () => {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    };

    const init = () => {
      size();
      seeded();
      if (!raf) raf = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', () => { size(); seeded(); });

    return { init };
  })();
  forever.init();

  // --- Constant blood stream from the cursor (always, over the whole page) ---
  const cursorBlood = (() => {
    if (!prefersFine) return {}; // no cursor blood on touch/mobile
    const cv = document.createElement('canvas');
    cv.className = 'cursor-blood';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const cx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0;
    let mx = -999, my = -999, acc = 0;
    const drops = [];
    const MAX = 160;

    const size = () => {
      W = cv.width = Math.max(1, Math.round(window.innerWidth * dpr));
      H = cv.height = Math.max(1, Math.round(window.innerHeight * dpr));
    };

    const spawn = (x, y) => {
      if (drops.length >= MAX) return;
      drops.push({
        x: x * dpr,
        y: y * dpr,
        vx: (Math.random() - 0.5) * 1.8,
        vy: 0.8 + Math.random() * 1.2,
        r: (Math.random() * 5 + 5) * dpr * 0.5,
        phase: Math.random() * Math.PI * 2,
        wob: (Math.random() * 0.7 + 0.2) * dpr,
        grav: 0.05 + Math.random() * 0.1,
        life: 1
      });
    };

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    const step = () => {
      const now = performance.now();
      if (mx > -100) {
        acc += 1;
        if (acc >= 2) {
          acc = 0;
          spawn(mx, my);
        }
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy += d.grav;
        d.y += d.vy;
        d.x += d.vx;
        d.life -= 0.008;
        if (d.y > H + d.r * 4 || d.life <= 0) { drops.splice(i, 1); }
      }
    };

    const draw = () => {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, W, H);
      const t = performance.now() * 0.001;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const wobx = Math.sin(t * 5 + d.phase) * d.wob;
        // pooling at spawn point (leader + trail)
        cx.fillStyle = '#a01416';
        cx.beginPath();
        cx.ellipse(d.x + wobx, d.y, d.r * 0.5, d.r, 0, 0, Math.PI * 2);
        cx.fill();
        cx.globalAlpha = 0.6;
        cx.beginPath();
        cx.rect(d.x + wobx - d.r * 0.14, d.y - d.r * 2.2, d.r * 0.28, d.r * 2);
        cx.fill();
        cx.globalAlpha = 1;
      }
    };

    const loop = () => {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    };

    size();
    raf = requestAnimationFrame(loop);
    window.addEventListener('resize', size);

    return {};
  })();

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

  // Disable parallax transforms on mobile for cleaner layout
  const isMobile = () => window.matchMedia('(max-width:820px)').matches;

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
    if (isMobile()) {
      if (heroContent) heroContent.style.transform = '';
      if (head3d) head3d.style.transform = '';
      ticking = false;
      return;
    }
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
      for (const token of t.split(/(\s+)/)) {
        if (/^\s+$/.test(token)) {
          node.appendChild(document.createTextNode(token));
          continue;
        }
        const w = document.createElement('span');
        w.className = 'drift-w';
        for (const ch of token) {
          const s = document.createElement('span');
          s.className = 'drift-l';
          s.textContent = ch;
          s.style.animationDuration = 6 + (idx % 5) * 1.3 + 's';
          s.style.animationDelay = (idx * 0.18) + 's';
          w.appendChild(s);
          idx++;
        }
        node.appendChild(w);
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
