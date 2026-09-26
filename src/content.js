/* Sem Política — content script: acha os "cards" de cada site e esconde os que falam de política. */
(() => {
  'use strict';
  const api = globalThis.browser ?? globalThis.chrome;
  const { DEFAULT_SETTINGS, buildMatcher } = globalThis.SemPolitica;

  const host = location.hostname;
  const SITE = /(^|\.)youtube\.com$/.test(host) ? 'youtube'
    : /(^|\.)instagram\.com$/.test(host) ? 'instagram'
    : /(^|\.)google\.com(\.br)?$/.test(host) ? 'google'
    : null;
  if (!SITE) return;

  const ATTR = 'data-sp'; // hide | blur | cover | revealed
  const MARKED = `[${ATTR}]`;
  const SUGGESTIONS = '[role="listbox"] [role="option"]';

  // pick: 'outer' = ignora candidato dentro de outro candidato; 'leaf' = só o mais interno.
  // exclude: nunca esconder candidato dentro disso.
  const RULES = {
    youtube: [
      {
        s: [
          'ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-compact-video-renderer', 'ytd-grid-video-renderer',
          'ytd-playlist-renderer', 'ytd-compact-playlist-renderer', 'ytd-radio-renderer', 'ytd-compact-radio-renderer',
          'ytd-channel-renderer', 'ytd-reel-item-renderer', 'ytd-backstage-post-thread-renderer', 'ytd-post-renderer',
          'ytd-movie-renderer', 'ytd-universal-watch-card-renderer', 'ytd-notification-renderer',
          'yt-lockup-view-model', 'ytm-shorts-lockup-view-model', 'ytm-shorts-lockup-view-model-v2',
        ].join(','),
        action: 'hide',
        pick: 'outer',
      },
      { s: 'ytd-reel-video-renderer', action: 'cover', pick: 'outer' }, // player do Shorts
      { s: SUGGESTIONS, action: 'hide', pick: 'outer' },
    ],
    google: [
      {
        // resultados, notícias (aba Notícias, "Principais notícias"), vídeos, "as pessoas também perguntam", Google News
        s: '.MjjYud, .g, .SoaBEf, g-inner-card, .WlydOe, .JJZKK, .related-question-pair, article',
        action: 'hide',
        pick: 'leaf',
      },
      { s: SUGGESTIONS, action: 'hide', pick: 'outer' },
    ],
    // Google Notícias: classes ofuscadas; cada card de notícia/fonte é o <c-wiz> mais interno.
    gnews: [
      {
        s: 'c-wiz',
        action: 'hide',
        pick: 'leaf',
        exclude: 'header, nav, [role="navigation"], [role="tablist"], [role="banner"]',
      },
      { s: SUGGESTIONS, action: 'hide', pick: 'outer' },
    ],
    instagram: [
      { s: 'article', action: 'hide', pick: 'outer' }, // posts do feed
      {
        s: 'a[href*="/p/"], a[href*="/reel/"]', // miniaturas do Explorar / perfis
        skipInside: 'article, a[href*="/p/"], a[href*="/reel/"]',
        action: 'hide',
        pick: 'outer',
      },
    ],
  };
  const RULESET = RULES[host === 'news.google.com' ? 'gnews' : SITE];

  // Mutations dentro disso não disparam varredura (player atualiza o tempo o tempo todo).
  const IGNORE_MUTATIONS = {
    youtube: '.html5-video-player, yt-live-chat-renderer, #chat',
    google: null,
    instagram: null,
  }[SITE];

  // Candidatos que não saem de seletor simples.
  const EXTRA = {
    // Vídeo aberto em /watch: se o título/canal for política, cobre o player e some título/descrição/comentários.
    youtube(out) {
      if (location.pathname !== '/watch') return;
      const player = document.querySelector('#movie_player');
      const meta = document.querySelector('ytd-watch-metadata');
      if (!player || !meta) return;
      const text = ['#title', 'ytd-channel-name']
        .map((q) => meta.querySelector(q)?.textContent || '')
        .join(' ');
      out.set(player, { action: 'cover', text });
      out.set(meta, { action: 'hide', text });
      const comments = document.querySelector('ytd-comments#comments');
      if (comments) out.set(comments, { action: 'hide', text });
    },
    instagram(out) {
      expandCaptions();
      // Posts do feed (com ou sem <article>): o post é o maior ancestral do botão Curtir com um único botão Curtir.
      // Assim a legenda entra no texto e o post inteiro é escondido/borrado.
      for (const like of document.querySelectorAll(LIKE)) {
        if (like.closest('article')) continue;
        const post = postBox(like);
        if (post && !post.closest('article') && !out.has(post)) out.set(post, { action: 'hide', text: null });
      }
      // Reels (aba Reels, /reel/ID, modal) sem post identificado: cobre o maior ancestral com um único vídeo.
      for (const v of document.querySelectorAll('video')) {
        if (v.closest('article') || [...out.keys()].some((p) => p.contains(v))) continue;
        const box = videoBox(v);
        if (box && !out.has(box)) out.set(box, { action: 'cover', text: null });
      }
    },
  };

  const LIKE = 'svg[aria-label="Curtir"], svg[aria-label="Like"]';

  // Legenda cortada ("C... mais"): o texto completo só entra no DOM depois do clique. Clica sozinho, uma vez.
  const MORE = /^[\s….]*(mais|more|más|ver más|もっと見る|続きを読む|더 보기)$/i;
  let expanding = false;
  function expandCaptions() {
    for (const b of document.querySelectorAll('span[role="button"], div[role="button"], span[tabindex], button')) {
      if (b.hasAttribute('data-sp-more') || b.closest('a') || b.textContent.length > 20 || !MORE.test(b.textContent)) continue;
      b.setAttribute('data-sp-more', '');
      expanding = true;
      try {
        b.click();
      } finally {
        expanding = false;
      }
    }
  }

  function postBox(like) {
    let best = null;
    for (let el = like.parentElement, d = 0; el && d < 25; el = el.parentElement, d++) {
      if (el === document.body || el.matches('main, [role="main"], [role="dialog"]')) break;
      if (el.querySelectorAll(LIKE).length > 1) break;
      if (el.querySelector('video, img')) best = el;
    }
    return best;
  }

  function videoBox(v) {
    const maxH = innerHeight * 1.15;
    let best = null;
    for (let el = v.parentElement, d = 0; el && d < 20; el = el.parentElement, d++) {
      if (el === document.body || el.matches('main, [role="main"], [role="dialog"]')) break;
      if (el.querySelectorAll('video').length > 1) break;
      if (el.getBoundingClientRect().height > maxH) break;
      best = el;
    }
    return best;
  }

  const SKIP_TEXT = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'TEMPLATE']);
  const textFilter = {
    acceptNode: (n) => (SKIP_TEXT.has(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  };

  // Texto "legível" do card: nós de texto separados por espaço (textContent cola "G1" + "Lula" = "G1Lula"),
  // + alt (Instagram descreve o texto das imagens no alt) + aria-label/title.
  function blob(el) {
    const parts = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, textFilter);
    for (let n; (n = w.nextNode()); ) parts.push(n.data);
    const own = el.getAttribute('aria-label');
    if (own) parts.push(own);
    for (const n of el.querySelectorAll('img[alt], [aria-label], [title]')) {
      for (const a of ['alt', 'aria-label', 'title']) {
        const v = n.getAttribute(a);
        if (v) parts.push(v);
      }
    }
    return parts.join(' ');
  }

  function collect() {
    const out = new Map(); // el -> { action, text }
    for (const r of RULESET) {
      for (const el of document.querySelectorAll(r.s)) {
        const skip = r.pick === 'leaf' ? el.querySelector(r.s) : el.parentElement?.closest(r.skipInside || r.s);
        if (skip || out.has(el) || (r.exclude && el.closest(r.exclude))) continue;
        out.set(el, { action: r.action, text: null });
      }
    }
    EXTRA[SITE]?.(out);
    return out;
  }

  let settings = DEFAULT_SETTINGS;
  let test = () => null;
  let cache = new WeakMap(); // el -> { text, hit }

  function mark(el, state, term) {
    if (state === 'cover' && getComputedStyle(el).position === 'static') {
      el.style.setProperty('position', 'relative');
      el.setAttribute('data-sp-pos', '');
    }
    el.setAttribute('data-sp-term', term);
    el.setAttribute(ATTR, state);
  }

  function unmark(el) {
    if (el.hasAttribute('data-sp-pos')) {
      el.style.removeProperty('position');
      el.removeAttribute('data-sp-pos');
    }
    el.removeAttribute('data-sp-term');
    el.removeAttribute(ATTR);
  }

  function silence(el) {
    for (const v of el.querySelectorAll('video')) if (!v.paused) v.pause();
  }

  function scan() {
    if (!settings.enabled || !settings.sites?.[SITE]) {
      for (const el of document.querySelectorAll(MARKED)) unmark(el);
      return;
    }
    const keep = new Set();
    for (const [el, { action, text }] of collect()) {
      const t = text ?? blob(el);
      let c = cache.get(el);
      if (!c || c.text !== t) {
        // Elemento reciclado com conteúdo novo (YouTube faz isso): refaz o veredito e esquece o "revelado".
        c = { text: t, hit: test(t) };
        cache.set(el, c);
        if (el.getAttribute(ATTR) === 'revealed') unmark(el);
      }
      if (!c.hit) continue;
      keep.add(el);
      const cur = el.getAttribute(ATTR);
      if (cur === 'revealed') continue;
      const want = action === 'cover' ? 'cover' : settings.mode === 'blur' ? 'blur' : 'hide';
      if (cur !== want) mark(el, want, c.hit);
      if (want === 'cover') silence(el);
    }
    for (const el of document.querySelectorAll(MARKED)) if (!keep.has(el)) unmark(el);
  }

  let timer = 0;
  let lastRun = 0;
  function schedule() {
    if (timer || document.hidden) return;
    const wait = Math.max(0, 300 - (performance.now() - lastRun));
    timer = setTimeout(() => {
      timer = 0;
      lastRun = performance.now();
      scan();
    }, wait);
  }

  function onMutations(records) {
    if (!IGNORE_MUTATIONS) return schedule();
    for (const r of records) {
      const node = r.target.nodeType === Node.ELEMENT_NODE ? r.target : r.target.parentElement;
      if (!node?.closest(IGNORE_MUTATIONS)) return schedule();
    }
  }

  async function load() {
    settings = await api.storage.sync.get(DEFAULT_SETTINGS);
    test = buildMatcher(settings);
    cache = new WeakMap();
    schedule();
  }

  // Clique num item borrado/coberto revela (e não abre o link nesse clique).
  document.addEventListener(
    'click',
    (e) => {
      if (expanding) return;
      const el = e.target.closest?.(`[${ATTR}="blur"], [${ATTR}="cover"]`);
      if (!el) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const group = el.id === 'movie_player' ? document.querySelectorAll('ytd-watch-metadata, ytd-comments#comments') : [];
      for (const x of [el, ...group]) {
        unmark(x);
        x.setAttribute(ATTR, 'revealed');
      }
    },
    true,
  );

  // Site tentando dar play em vídeo escondido/coberto (autoplay de Reels/Shorts/preview): pausa.
  document.addEventListener(
    'play',
    (e) => {
      const v = e.target;
      if (v instanceof HTMLMediaElement && v.closest(`[${ATTR}="cover"], [${ATTR}="hide"], [${ATTR}="blur"]`)) v.pause();
    },
    true,
  );

  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(onMutations).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  api.storage.onChanged.addListener((_changes, area) => {
    if (area === 'sync') load();
  });

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'sp:count') {
      sendResponse(document.querySelectorAll(`[${ATTR}]:not([${ATTR}="revealed"])`).length);
    }
  });

  load();
})();
