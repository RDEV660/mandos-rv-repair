/* Applies owner-saved content from /api/content (or /data/site-content.json fallback) */
(function (global) {
  function loadContent() {
    return fetch('/api/content', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .catch(function () {
        return fetch('/data/site-content.json', { cache: 'no-store' }).then(function (r) { return r.json(); });
      });
  }

  function applyTheme(theme) {
    if (!theme) return;
    var root = document.documentElement;
    if (theme.navy800) root.style.setProperty('--cms-navy-800', theme.navy800);
    if (theme.brandOrange) root.style.setProperty('--cms-brand-orange', theme.brandOrange);
    if (theme.brandAmber) root.style.setProperty('--cms-brand-amber', theme.brandAmber);
    if (theme.cloud) root.style.setProperty('--cms-cloud', theme.cloud);

    var style = document.getElementById('cms-theme-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'cms-theme-style';
      document.head.appendChild(style);
    }
    style.textContent =
      ':root{' +
      (theme.navy700 ? '--tw-navy-700:' + theme.navy700 + ';' : '') +
      (theme.navy800 ? '--tw-navy-800:' + theme.navy800 + ';' : '') +
      (theme.navy900 ? '--tw-navy-900:' + theme.navy900 + ';' : '') +
      (theme.navy950 ? '--tw-navy-950:' + theme.navy950 + ';' : '') +
      '}' +
      (theme.navy800 ? '.bg-navy-800{background-color:' + theme.navy800 + '!important}' : '') +
      (theme.navy900 ? '.bg-navy-900{background-color:' + theme.navy900 + '!important}' : '') +
      (theme.navy950 ? '.bg-navy-950,.bg-navy-950\\/70{background-color:' + theme.navy950 + '!important}' : '') +
      (theme.brandOrange ? '.bg-brand-orange,.text-brand-orange{border-color:transparent}.bg-brand-orange{background-color:' + theme.brandOrange + '!important}.text-brand-orange{color:' + theme.brandOrange + '!important}' : '') +
      (theme.brandAmber ? '.text-brand-amber,.bg-brand-amber{color:' + theme.brandAmber + '}.bg-brand-amber{background-color:' + theme.brandAmber + '!important}' : '') +
      (theme.cloud ? '.bg-cloud{background-color:' + theme.cloud + '!important}' : '');
  }

  function mergeI18n(base, patch) {
    if (!patch) return base;
    ['en', 'es', 'fr'].forEach(function (lang) {
      if (patch[lang]) Object.assign(base[lang], patch[lang]);
    });
    return base;
  }

  function applyContact(contact) {
    if (!contact) return;
    var tel = contact.phoneTel || '+19565227058';
    var display = contact.phone || '(956) 522-7058';
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      a.href = 'tel:' + tel.replace(/\s/g, '');
      var label = a.getAttribute('aria-label');
      if (label && label.indexOf('Call') !== -1) a.setAttribute('aria-label', "Call Mando's RV Repair at " + display);
    });
    document.querySelectorAll('.cms-phone-display').forEach(function (el) { el.textContent = display; });
    var map = document.querySelector('iframe[title*="Map"]');
    if (map && contact.street) {
      var q = encodeURIComponent(contact.street + ' ' + (contact.city || 'Mission') + ' ' + (contact.state || 'TX') + ' ' + (contact.zip || ''));
      map.src = 'https://www.google.com/maps?q=' + q + '&output=embed';
    }
    var addr = document.querySelector('.cms-address');
    if (addr && contact.addressLine) addr.textContent = contact.addressLine;
  }

  function applyLogo(logo) {
    if (!logo) return;
    document.querySelectorAll('.site-logo, .hero-logo, .cms-logo').forEach(function (img) {
      img.src = logo;
    });
    var fav = document.querySelector('link[rel="icon"]');
    if (fav) fav.href = logo;
  }

  function applyHeroSlides(slides) {
    if (!slides || !slides.length) return;
    var wrap = document.querySelector('.heroSwiper .swiper-wrapper');
    if (!wrap) return;
    wrap.innerHTML = slides.map(function (s) {
      return '<div class="swiper-slide"><img src="' + s.src + '" alt="' + (s.alt || '') + '" /></div>';
    }).join('');
  }

  function applyWork(project, selector) {
    if (!project || !project.length) return;
    var figures = document.querySelectorAll(selector);
    project.forEach(function (step, i) {
      var fig = figures[i];
      if (!fig) return;
      var img = fig.querySelector('img');
      if (img) { img.src = step.src; img.alt = step.alt || ''; }
      fig.setAttribute('data-full', step.src);
      var cap = fig.querySelector('figcaption');
      if (cap && step.caption) cap.textContent = step.caption;
    });
  }

  function applyReviews(reviews, i18n) {
    if (!reviews || !reviews.length) return;
    var keys = ['rev.q1', 'rev.q2', 'rev.q3'];
    reviews.forEach(function (text, i) {
      var key = keys[i];
      if (!key) return;
      var quote = text.indexOf('"') === 0 ? text : '"' + text + '"';
      if (i18n && i18n.en) i18n.en[key] = quote;
      if (i18n && i18n.es) i18n.es[key] = quote;
      if (i18n && i18n.fr) i18n.fr[key] = quote;
    });
  }

  function applyWorkCaptionsToI18n(work, i18n) {
    if (!work || !i18n) return;
    if (work.roof && i18n.en) {
      work.roof.forEach(function (s, i) {
        var k = 'work.roof.s' + (i + 1);
        if (s.caption) { i18n.en[k] = s.caption; }
      });
    }
    if (work.floor && i18n.en) {
      work.floor.forEach(function (s, i) {
        var k = 'work.floor.s' + (i + 1);
        if (s.caption) { i18n.en[k] = s.caption; }
      });
    }
  }

  function applyAll(content, I18N) {
    if (!content) return I18N;
    applyTheme(content.theme);
    applyLogo(content.logo);
    applyContact(content.contact);
    applyHeroSlides(content.heroSlides);
    applyWork(content.work && content.work.roof, '#work .reveal.mt-12 .gal');
    applyWork(content.work && content.work.floor, '#work .reveal.mt-14 .gal');
    applyWorkCaptionsToI18n(content.work, content.text);
    applyReviews(content.reviews, content.text);
    return mergeI18n(I18N, content.text);
  }

  global.MandoCms = {
    load: loadContent,
    apply: applyAll,
  };
})(window);
