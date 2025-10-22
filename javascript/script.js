/* =========================================================================
   Rowan Rossetti — Animations ++ (GSAP + ScrollTrigger + Canvas Particles)
   Conserve : année auto, impression, partage, idées, toasts, persistance.
   Ajouts : intro cinematic, reveals GSAP, parallax, magnetic buttons,
            tilt 3D, split text, particules, et sécurité prefers-reduced-motion.
   ========================================================================= */

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const prefersReducedMotion = matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

/* --------- Utilitaires --------- */
function toast(message) {
  const tpl = $('#toast');
  if (!tpl) return;
  const el = tpl.content.firstElementChild.cloneNode(true);
  el.textContent = message;
  const duration = prefersReducedMotion ? 1200 : 2400;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

/* Année auto */
(() => { const y = $('#year'); if (y) y.textContent = new Date().getFullYear(); })();

/* Impression PDF */
(() => { $('#btnPrint')?.addEventListener('click', () => window.print()); })();

/* Partage */
(() => {
  $('#btnShare')?.addEventListener('click', async () => {
    const url = location.href;
    try {
      if (navigator.share) { await navigator.share({ title: document.title, url }); toast('Lien partagé'); }
      else { await navigator.clipboard.writeText(url); toast('Lien copié'); }
    } catch {
      try { await navigator.clipboard.writeText(url); toast('Lien copié'); } catch { toast('Impossible de partager'); }
    }
  });
})();

/* Idées */
(() => {
  const ideaButtons = $$('.idea'); const output = $('#ideaOutput');
  if (!ideaButtons.length || !output) return;
  ideaButtons.forEach((btn, idx) => {
    btn.setAttribute('role','button'); btn.setAttribute('tabindex','0'); btn.setAttribute('aria-pressed','false');
    btn.addEventListener('click', () => selectIdea(btn));
    btn.addEventListener('keydown', (e) => {
      const key = e.key; if (key === 'Enter' || key === ' ') { e.preventDefault(); selectIdea(btn); }
      if (['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(key)) {
        e.preventDefault(); const dir = (key==='ArrowRight'||key==='ArrowDown')?1:-1;
        const nextIndex = (idx + dir + ideaButtons.length) % ideaButtons.length; ideaButtons[nextIndex].focus();
      }
    });
    btn.addEventListener('pointerdown', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100; const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty('--x', x + '%'); btn.style.setProperty('--y', y + '%');
    });
  });
  const LS_KEY = 'rowan-lovecv-idea';
  function selectIdea(btn){
    const text = btn.dataset.idea || btn.textContent.trim();
    output.textContent = text; toast('Idée sélectionnée');
    ideaButtons.forEach(b => b.setAttribute('aria-pressed', b===btn ? 'true' : 'false'));
    try { localStorage.setItem(LS_KEY, text); } catch {}
    const url = new URL(location.href); url.searchParams.set('idea', text); history.replaceState(null,'',url);
  }
  function restore(){ try{ const s = localStorage.getItem(LS_KEY); if(!s) return false;
    const m = ideaButtons.find(b => (b.dataset.idea || b.textContent.trim()) === s); if(m){ selectIdea(m); return true; } } catch{} return false; }
  function fromURL(){ const p = new URLSearchParams(location.search); const q = p.get('idea'); if(!q) return false;
    const norm = s => s.toLowerCase().replace(/\s+/g,' ').trim(); const target = norm(q);
    const m = ideaButtons.find(b => { const c = norm(b.dataset.idea || b.textContent); return c.includes(target) || target.includes(c); });
    if(m){ selectIdea(m); return true; } return false;
  }
  if(!fromURL()) restore();
})();

/* ========================= Animations avancées ========================= */
function initAnimations(){
  // Pas d’animations lourdes si réduction demandée
  if (prefersReducedMotion) return;

  // GSAP chargés ?
  if (!window.gsap) return;

  gsap.registerPlugin(ScrollTrigger);

  /* 1) Intro cinematic */
  const intro = gsap.timeline({ defaults:{ ease: "power3.out" } });
  intro
    .from(".header .brand", { y: 20, opacity: 0, duration: .6 })
    .from(".lead", { y: 10, opacity: 0, duration: .4 }, "-=.2")
    .from(".contact-list li", { y: 10, opacity: 0, stagger: .06, duration: .35 }, "-=.2")
    .from(".header-actions .btn", { y: 10, opacity: 0, stagger: .08, duration: .35 }, "-=.2");

  /* 2) Split text (letters) pour .js-split */
  $$(".js-split").forEach(el => {
    const text = el.textContent;
    el.setAttribute("aria-label", text);
    el.innerHTML = text.split("").map(ch => `<span class="char" style="display:inline-block">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
    gsap.fromTo(el.querySelectorAll(".char"), { y: "1.2em", opacity: 0 }, {
      y: 0, opacity: 1, duration: .6, ease: "power3.out", stagger: .03,
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }
    });
  });

  /* 3) Reveal des cards au scroll */
  $$(".card").forEach((card, i) => {
    gsap.fromTo(card, { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: .6, ease: "power2.out",
      scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none reverse" }
    });
  });

  /* 4) Parallaxe douce du background au scroll */
  gsap.to("body", {
    backgroundPosition: "80% -20%", ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.5 }
  });

  /* 5) Magnetic buttons */
  const magnets = $$(".magnetic");
  magnets.forEach(btn => {
    const strength = 18; // px
    let raf = null;
    function onMove(e){
      const r = btn.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width/2);
      const my = e.clientY - (r.top + r.height/2);
      const x = (mx / (r.width/2)) * strength;
      const y = (my / (r.height/2)) * strength;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { gsap.to(btn, { x, y, duration: .25, ease: "power3.out" }); });
    }
    function reset(){ gsap.to(btn, { x:0, y:0, duration: .35, ease: "power3.out" }); }
    btn.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerleave", reset);
  });

  /* 6) Tilt 3D sur les cards */
  $$(".tilt3d").forEach(card => {
    let raf = null;
    const max = 6; // degrés
    function onMove(e){
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const rx = (-py * max);
      const ry = (px * max);
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        gsap.to(card, { rotateX: rx, rotateY: ry, transformPerspective: 700, duration: .3, ease: "power2.out" });
      });
    }
    function reset(){ gsap.to(card, { rotateX:0, rotateY:0, duration: .45, ease: "power2.out" }); }
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", reset);
  });
}

/* ========================= Particules Canvas ========================= */
function initParticles(){
  if (prefersReducedMotion) return;
  const canvas = document.getElementById("bgParticles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  let w, h, dpr, particles = [];

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }
  resize(); window.addEventListener("resize", resize);

  const COUNT = Math.min(100, Math.floor((window.innerWidth * window.innerHeight) / 12000));
  const RED = { r: 225, g: 6, b: 0 };

  function spawn(){
    particles = [];
    for (let i=0;i<COUNT;i++){
      particles.push({
        x: Math.random()*w, y: Math.random()*h,
        vx: (Math.random()*0.6-0.3) * dpr,
        vy: (Math.random()*0.6-0.3) * dpr,
        size: (Math.random()*1.6 + 0.4) * dpr,
        alpha: Math.random()*0.5 + 0.2
      });
    }
  }
  spawn();

  let mouse = { x: w/2, y: h/2, active:false };
  window.addEventListener("pointermove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * dpr; mouse.y = (e.clientY - rect.top) * dpr; mouse.active = true;
  });
  window.addEventListener("pointerleave", () => mouse.active = false);

  function step(){
    ctx.clearRect(0,0,w,h);

    // mouvement
    for (const p of particles){
      p.x += p.vx; p.y += p.vy;

      // attraction légère vers la souris
      if (mouse.active){
        const dx = (mouse.x - p.x), dy = (mouse.y - p.y);
        const dist = Math.hypot(dx, dy) || 1;
        const f = Math.min(0.0008, 1 / (dist*2000));
        p.vx += dx * f; p.vy += dy * f;
      }

      // bordures rebond
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // dessin
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `rgba(${RED.r},${RED.g},${RED.b},${p.alpha})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }

    // connexions fines
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = `rgba(${RED.r},${RED.g},${RED.b},0.15)`;
    for (let i=0;i<particles.length;i++){
      const a = particles[i];
      for (let j=i+1;j<particles.length;j++){
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist2 = dx*dx + dy*dy;
        if (dist2 < (120*dpr)*(120*dpr)) {
          ctx.lineWidth = 0.8 * dpr * (1 - dist2 / ((120*dpr)*(120*dpr)));
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* Init global */
window.addEventListener("DOMContentLoaded", () => {
  initAnimations();
  initParticles();
});