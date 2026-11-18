/* AUSA — scripts du site (aucun traceur, aucun cookie). */
(function () {
  'use strict';

  /* ---- Menu mobile ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---- Année du pied de page ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Apparition douce ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---- Outils ---- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var PORTAGE = {
    ausa: ['badge-ausa', 'Porté par l’AUSA'],
    collectif: ['badge-collectif', 'Action collective'],
    soutien: ['badge-soutien', 'En soutien à un partenaire']
  };
  function frDate(iso) {
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  var PHOTO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-9 7"/></svg>';

  function newsCard(a) {
    var p = PORTAGE[a.portage] || null;
    var img = a.image
      ? '<div class="photo-slot"><img src="' + esc(a.image) + '" alt="' + esc(a.image_alt || a.titre) + '" loading="lazy"></div>'
      : '<div class="photo-slot"><div class="ph">' + PHOTO_ICON + esc(a.categorie || 'Actualité') + '</div></div>';
    var body = '';
    if (a.texte) {
      body = '<details><summary>Lire la suite</summary>' +
        String(a.texte).split(/\n\s*\n/).map(function (para) { return '<p>' + esc(para) + '</p>'; }).join('') +
        '</details>';
    }
    return '<article class="news-card reveal visible">' + img +
      '<div class="body">' +
      '<div class="badges">' + (a.categorie ? '<span class="badge badge-piste">' + esc(a.categorie) + '</span>' : '') +
      (p ? '<span class="badge ' + p[0] + '">' + p[1] + '</span>' : '') + '</div>' +
      '<time datetime="' + esc(a.date) + '">' + frDate(a.date) + '</time>' +
      '<h3>' + esc(a.titre) + '</h3>' +
      '<p>' + esc(a.resume) + '</p>' + body +
      '</div></article>';
  }

  /* ---- Actualités (lues dans actualites/actualites.json) ---- */
  var newsTargets = document.querySelectorAll('[data-news]');
  if (newsTargets.length) {
    var base = document.body.getAttribute('data-root') || '';
    fetch(base + 'actualites/actualites.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var items = (data.articles || []).filter(function (a) { return a.publie !== false; })
          .sort(function (x, y) { return x.date < y.date ? 1 : -1; });
        newsTargets.forEach(function (target) {
          var limit = parseInt(target.getAttribute('data-news'), 10) || 0;
          var render = function (cat) {
            var list = cat ? items.filter(function (a) { return a.categorie === cat; }) : items;
            if (limit) list = list.slice(0, limit);
            target.innerHTML = list.length ? list.map(newsCard).join('')
              : '<p class="empty">Aucune publication pour le moment. Revenez bientôt !</p>';
          };
          render('');
          var filters = document.querySelector('[data-news-filters]');
          if (filters && !limit) {
            var cats = [];
            items.forEach(function (a) { if (a.categorie && cats.indexOf(a.categorie) < 0) cats.push(a.categorie); });
            filters.innerHTML = ['Tout'].concat(cats).map(function (c, i) {
              return '<button type="button" aria-pressed="' + (i === 0) + '" data-cat="' + (i ? esc(c) : '') + '">' + esc(c) + '</button>';
            }).join('');
            filters.addEventListener('click', function (e) {
              var b = e.target.closest('button'); if (!b) return;
              filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
              render(b.getAttribute('data-cat'));
            });
          }
        });
        renderGallery(data.galerie || []);
      })
      .catch(function () {
        newsTargets.forEach(function (t) { t.innerHTML = '<p class="empty">Les actualités n’ont pas pu être chargées.</p>'; });
      });
  }

  /* ---- Galerie photo ---- */
  function renderGallery(photos) {
    var g = document.querySelector('[data-gallery]');
    if (!g) return;
    if (!photos.length) {
      g.innerHTML = '<p class="empty">La galerie sera alimentée au fil de nos actions, dans le respect du droit à l’image de chacun.</p>';
      return;
    }
    g.innerHTML = photos.map(function (p, i) {
      return '<figure><button type="button" data-i="' + i + '"><img src="' + esc(p.image) + '" alt="' + esc(p.legende) + '" loading="lazy"></button>' +
        '<figcaption>' + esc(p.legende) + '</figcaption></figure>';
    }).join('');
    var lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button type="button" aria-label="Fermer">×</button><img alt=""><p></p>';
    document.body.appendChild(lb);
    var close = function () { lb.classList.remove('open'); };
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'BUTTON') close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]'); if (!b) return;
      var p = photos[+b.getAttribute('data-i')];
      lb.querySelector('img').src = p.image; lb.querySelector('img').alt = p.legende;
      lb.querySelector('p').textContent = p.legende;
      lb.classList.add('open'); lb.querySelector('button').focus();
    });
  }

  /* ---- Formulaires (contact, bénévolat, adhésion) ---- */
  document.querySelectorAll('form[data-ajax]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var btn = form.querySelector('[type=submit]');
      status.className = 'form-status';
      if (!form.checkValidity()) { form.reportValidity(); return; }
      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Envoi en cours…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { success: false }; }); })
        .then(function (res) {
          if (res.success) {
            form.reset();
            status.className = 'form-status ok';
            status.textContent = 'Merci ! Votre message a bien été envoyé. Nous vous répondrons dans les meilleurs délais.';
          } else { throw new Error(res.error || 'erreur'); }
        })
        .catch(function () {
          status.className = 'form-status err';
          status.textContent = 'L’envoi n’a pas abouti. Vous pouvez réessayer ou nous écrire directement par e-mail.';
        })
        .then(function () { btn.disabled = false; btn.textContent = label; status.focus && status.focus(); });
    });
  });


  /* ---- Bulletin d'adhésion : blocs conditionnels ---- */
  var adh = document.getElementById('form-adhesion');
  if (adh) {
    var blocMineur = document.getElementById('a-bloc-mineur');
    var blocFamille = document.getElementById('a-bloc-famille');
    var naissance = document.getElementById('a-naissance');
    var setBloc = function (bloc, on) { bloc.hidden = !on; bloc.disabled = !on; };
    var majAdh = function () {
      var mineur = false;
      if (naissance.value) {
        var d = new Date(naissance.value + 'T12:00:00'), now = new Date();
        var age = now.getFullYear() - d.getFullYear();
        if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
        mineur = age < 18;
      }
      setBloc(blocMineur, mineur);
      var f = adh.querySelector('input[name=formule]:checked');
      setBloc(blocFamille, !!f && f.value === 'Adhésion famille');
    };
    adh.addEventListener('change', majAdh);
    adh.addEventListener('reset', function () { setTimeout(majAdh, 0); });
    majAdh();
  }

  /* Pré-sélection du type de demande via l’URL (?type=benevolat) */
  var typeSel = document.getElementById('type');
  if (typeSel) {
    var m = location.search.match(/type=([a-z]+)/);
    if (m) typeSel.value = m[1];
  }
})();
