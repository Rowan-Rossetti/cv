/* =========================================================================
   Rowan Rossetti — JS pour toute la page
   Fonctions : année auto, impression, partage, idées de rendez-vous (accessible),
               toasts avec respect de prefers-reduced-motion, persistance locale.
   ========================================================================= */

// Sélecteurs utilitaires
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// Accessibilité / confort
const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

// Toast minimal
function toast(message) {
  const tpl = $('#toast');
  if (!tpl) return;
  const el = tpl.content.firstElementChild.cloneNode(true);
  el.textContent = message;

  // Durée plus courte si l'utilisateur préfère moins d'animations
  const duration = prefersReducedMotion ? 1200 : 2400;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// 1) Année automatique dans le footer
(function setYear() {
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

// 2) Impression PDF
(function wirePrint() {
  $('#btnPrint')?.addEventListener('click', () => {
    // Option : forcer le reflow pour éviter certains bugs de layout avant print
    document.body.offsetHeight; // no-op
    window.print();
  });
})();

// 3) Partage / copie de lien
(function wireShare() {
  $('#btnShare')?.addEventListener('click', async () => {
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        toast('Lien partagé');
      } else {
        await navigator.clipboard.writeText(url);
        toast('Lien copié');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast('Lien copié');
      } catch {
        toast('Impossible de partager');
      }
    }
  });
})();

// 4) Idées de rendez-vous : affichage, accessibilité, persistance, deep-link
(function wireIdeas() {
  const ideaButtons = $$('.idea');
  const output = $('#ideaOutput');

  if (!ideaButtons.length || !output) return;

  // Rôle et état accessibles
  ideaButtons.forEach((btn, idx) => {
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-pressed', 'false');

    // Click
    btn.addEventListener('click', () => selectIdea(btn));

    // Entrée/Espace au clavier
    btn.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        selectIdea(btn);
      }
      // Navigation circulaire au clavier (flèches)
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(key)) {
        e.preventDefault();
        const dir = (key === 'ArrowRight' || key === 'ArrowDown') ? 1 : -1;
        const nextIndex = (idx + dir + ideaButtons.length) % ideaButtons.length;
        ideaButtons[nextIndex].focus();
      }
    });
  });

  // Sauvegarde/restauration
  const LS_KEY = 'rowan-lovecv-idea';

  function selectIdea(btn) {
    const text = btn.dataset.idea || btn.textContent.trim();
    output.textContent = text;
    toast('Idée sélectionnée');

    // Met à jour l’état visuel et ARIA
    ideaButtons.forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));

    // Persiste le choix
    try { localStorage.setItem(LS_KEY, text); } catch { /* ignore */ }
  }

  function restoreFromLocalStorage() {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (!saved) return false;
      const match = ideaButtons.find(b => (b.dataset.idea || b.textContent.trim()) === saved);
      if (match) {
        selectIdea(match);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }

  function preselectFromURL() {
    const params = new URLSearchParams(location.search);
    const q = params.get('idea');
    if (!q) return false;

    // On compare de façon souple (case-insensitive, espaces compactés)
    const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const target = norm(q);

    const match = ideaButtons.find(b => {
      const candidate = norm(b.dataset.idea || b.textContent);
      return candidate.includes(target) || target.includes(candidate);
    });

    if (match) {
      selectIdea(match);
      return true;
    }
    return false;
  }

  // Ordre de priorité : URL > localStorage > rien
  if (!preselectFromURL()) {
    restoreFromLocalStorage();
  }
})();

/* =========================================================================
   Fin du script — Ce fichier remplace le contenu précédent de ./javascript/script.js
   Il fonctionne avec ta structure HTML actuelle.
   ========================================================================= */