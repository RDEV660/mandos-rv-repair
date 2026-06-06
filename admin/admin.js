(function () {
  var TOKEN_KEY = 'mando_admin_token';
  var state = null;

  var $ = function (id) { return document.getElementById(id); };

  function token() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  function toast(msg, ok) {
    var el = $('toast');
    el.textContent = msg;
    el.className = 'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-bold shadow-lg ' +
      (ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white');
    el.classList.remove('hidden');
    setTimeout(function () { el.classList.add('hidden'); }, 3500);
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    if (token()) headers.Authorization = 'Bearer ' + token();
    return fetch(path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.error || 'Request failed');
        return j;
      });
    });
  }

  function showLogin(show) {
    $('loginScreen').classList.toggle('hidden', !show);
    $('dashboard').classList.toggle('hidden', show);
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function uploadImage(file, folder) {
    return fileToDataUrl(file).then(function (dataUrl) {
      return api('/api/upload', {
        method: 'POST',
        body: { filename: file.name, dataUrl: dataUrl, folder: folder || 'uploads' },
      });
    });
  }

  function bindText(id, getter, setter) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', function () { setter(el.value); });
  }

  function fillForm() {
    var c = state;
    $('logoPreview').src = c.logo || '';
    $('inpLogoPath').value = c.logo || '';
    $('inpPhone').value = (c.contact && c.contact.phone) || '';
    $('inpPhoneTel').value = (c.contact && c.contact.phoneTel) || '';
    $('inpAddress').value = (c.contact && c.contact.addressLine) || '';
    $('inpStreet').value = (c.contact && c.contact.street) || '';
    $('inpCity').value = (c.contact && c.contact.city) || '';
    $('inpState').value = (c.contact && c.contact.state) || '';
    $('inpZip').value = (c.contact && c.contact.zip) || '';

    var t = c.theme || {};
    $('colorNavy800').value = t.navy800 || '#102e58';
    $('colorOrange').value = t.brandOrange || '#ef7a26';
    $('colorAmber').value = t.brandAmber || '#ffb061';
    $('colorCloud').value = t.cloud || '#eef3fa';

    var en = (c.text && c.text.en) || {};
    var fields = [
      'hero.title', 'hero.subtitle', 'hero.badge1', 'hero.badge2', 'hero.badge3', 'hero.note',
      'work.title', 'work.intro', 'work.roof.title', 'work.floor.title',
      'about.title', 'about.body', 'services.title', 'contact.title', 'contact.body',
      'contact.hoursval', 'contact.pickup', 'footer.slogan'
    ];
    fields.forEach(function (key) {
      var el = document.querySelector('[data-field="' + key + '"]');
      if (el) el.value = en[key] || '';
    });

    renderSlides('heroSlidesList', c.heroSlides || [], 'hero');
    renderWork('roofSteps', (c.work && c.work.roof) || [], 'roof');
    renderWork('floorSteps', (c.work && c.work.floor) || [], 'floor');

    (c.reviews || ['', '', '']).forEach(function (r, i) {
      var el = $('review' + (i + 1));
      if (el) el.value = (r || '').replace(/^"|"$/g, '');
    });
  }

  function renderSlides(containerId, slides, type) {
    var box = $(containerId);
    box.innerHTML = '';
    slides.forEach(function (s, i) {
      box.appendChild(slideCard(s, i, type));
    });
    var add = document.createElement('button');
    add.type = 'button';
    add.className = 'rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 text-sm font-semibold text-slate-500 hover:border-brand-orange hover:text-brand-orange';
    add.textContent = '+ Add slide';
    add.addEventListener('click', function () {
      slides.push({ src: '', alt: '' });
      renderSlides(containerId, slides, type);
    });
    box.appendChild(add);
  }

  function slideCard(s, i, type) {
    var div = document.createElement('div');
    div.className = 'rounded-xl border border-slate-200 bg-white p-4';
    div.innerHTML =
      '<div class="flex flex-wrap items-start gap-4">' +
        '<img src="' + (s.src || '') + '" class="h-20 w-28 rounded-lg bg-slate-100 object-cover" alt="" />' +
        '<div class="min-w-0 flex-1 space-y-2">' +
          '<label class="block text-xs font-bold text-slate-500">Image path or upload</label>' +
          '<input type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" data-slide-src value="' + (s.src || '') + '" />' +
          '<input type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" data-slide-alt placeholder="Alt text" value="' + (s.alt || '') + '" />' +
          '<input type="file" accept="image/*" class="text-xs" data-slide-file />' +
        '</div>' +
        '<button type="button" class="text-xs font-bold text-red-600" data-remove>Remove</button>' +
      '</div>';

    div.querySelector('[data-slide-src]').addEventListener('input', function (e) { s.src = e.target.value; div.querySelector('img').src = s.src; });
    div.querySelector('[data-slide-alt]').addEventListener('input', function (e) { s.alt = e.target.value; });
    div.querySelector('[data-slide-file]').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      uploadImage(f, 'hero').then(function (r) {
        s.src = r.path || r.url;
        div.querySelector('[data-slide-src]').value = s.src;
        div.querySelector('img').src = s.src;
        toast('Image uploaded', true);
      }).catch(function (err) { toast(err.message, false); });
    });
    div.querySelector('[data-remove]').addEventListener('click', function () {
      var arr = type === 'hero' ? state.heroSlides : null;
      if (arr) { arr.splice(i, 1); renderSlides('heroSlidesList', arr, 'hero'); }
    });
    return div;
  }

  function renderWork(containerId, steps, kind) {
    var box = $(containerId);
    box.innerHTML = '';
    steps.forEach(function (s, i) {
      var div = document.createElement('div');
      div.className = 'rounded-xl border border-slate-200 bg-white p-4';
      div.innerHTML =
        '<p class="mb-2 text-xs font-bold uppercase text-slate-400">Step ' + (i + 1) + '</p>' +
        '<div class="flex flex-wrap gap-4">' +
          '<img src="' + (s.src || '') + '" class="h-24 w-20 rounded-lg bg-slate-100 object-cover" />' +
          '<div class="min-w-0 flex-1 space-y-2">' +
            '<input type="text" class="w-full rounded-lg border px-3 py-2 text-sm" data-src value="' + (s.src || '') + '" placeholder="Image path" />' +
            '<input type="text" class="w-full rounded-lg border px-3 py-2 text-sm" data-cap value="' + (s.caption || '') + '" placeholder="Caption" />' +
            '<input type="file" accept="image/*" class="text-xs" data-file />' +
          '</div>' +
        '</div>';
      div.querySelector('[data-src]').addEventListener('input', function (e) { s.src = e.target.value; div.querySelector('img').src = s.src; });
      div.querySelector('[data-cap]').addEventListener('input', function (e) { s.caption = e.target.value; });
      div.querySelector('[data-file]').addEventListener('change', function (e) {
        var f = e.target.files[0];
        if (!f) return;
        uploadImage(f, 'work').then(function (r) {
          s.src = r.path || r.url;
          div.querySelector('[data-src]').value = s.src;
          div.querySelector('img').src = s.src;
          toast('Photo uploaded', true);
        }).catch(function (err) { toast(err.message, false); });
      });
      box.appendChild(div);
    });
  }

  function collectForm() {
    var c = JSON.parse(JSON.stringify(state));
    c.contact = c.contact || {};
    c.theme = c.theme || {};
    c.text = c.text || { en: {}, es: {}, fr: {} };
    c.work = c.work || { roof: [], floor: [] };
    c.heroSlides = c.heroSlides || [];
    c.logo = $('inpLogoPath').value.trim() || c.logo;
    c.contact.phone = $('inpPhone').value.trim();
    c.contact.phoneTel = $('inpPhoneTel').value.trim();
    c.contact.addressLine = $('inpAddress').value.trim();
    c.contact.street = $('inpStreet').value.trim();
    c.contact.city = $('inpCity').value.trim();
    c.contact.state = $('inpState').value.trim();
    c.contact.zip = $('inpZip').value.trim();

    c.theme.navy800 = $('colorNavy800').value;
    c.theme.brandOrange = $('colorOrange').value;
    c.theme.brandAmber = $('colorAmber').value;
    c.theme.cloud = $('colorCloud').value;

    document.querySelectorAll('[data-field]').forEach(function (el) {
      var key = el.getAttribute('data-field');
      if (!c.text.en) c.text.en = {};
      c.text.en[key] = el.value;
    });

    c.reviews = [1, 2, 3].map(function (n) {
      var v = ($('review' + n).value || '').trim();
      return v;
    });

    // sync work captions to i18n keys
    if (c.work.roof) {
      c.work.roof.forEach(function (s, i) {
        c.text.en['work.roof.s' + (i + 1)] = s.caption;
      });
    }
    if (c.work.floor) {
      c.work.floor.forEach(function (s, i) {
        c.text.en['work.floor.s' + (i + 1)] = s.caption;
      });
    }

    c.version = 1;
    c.updatedAt = new Date().toISOString();
    return c;
  }

  function loadDashboard() {
    return api('/api/content').then(function (data) {
      state = data;
      fillForm();
      showLogin(false);
    });
  }

  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    api('/api/auth', { method: 'POST', body: { password: $('loginPassword').value } })
      .then(function (r) {
        setToken(r.token);
        return loadDashboard();
      })
      .catch(function (err) { toast(err.message || 'Login failed', false); });
  });

  $('btnLogout').addEventListener('click', function () {
    clearToken();
    showLogin(true);
  });

  $('btnSave').addEventListener('click', function () {
    var payload = collectForm();
    $('btnSave').disabled = true;
    $('btnSave').textContent = 'Saving…';
    api('/api/content', { method: 'PUT', body: payload })
      .then(function () {
        state = payload;
        toast('Changes saved! Refresh the main site to see updates.', true);
      })
      .catch(function (err) { toast(err.message || 'Save failed', false); })
      .finally(function () {
        $('btnSave').disabled = false;
        $('btnSave').textContent = 'Save All Changes';
      });
  });

  $('btnPreview').addEventListener('click', function () {
    window.open('/', '_blank');
  });

  $('logoUpload').addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    uploadImage(f, 'branding').then(function (r) {
      var p = r.path || r.url;
      state.logo = p;
      $('inpLogoPath').value = p;
      $('logoPreview').src = p;
      toast('Logo uploaded — click Save All Changes', true);
    }).catch(function (err) { toast(err.message, false); });
  });

  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) {
        b.classList.remove('bg-navy-800', 'text-white');
        b.classList.add('bg-white', 'text-navy-800');
      });
      btn.classList.add('bg-navy-800', 'text-white');
      btn.classList.remove('bg-white', 'text-navy-800');
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.add('hidden'); });
      $('panel-' + btn.getAttribute('data-tab')).classList.remove('hidden');
    });
  });

  if (token()) {
    loadDashboard().catch(function () { clearToken(); showLogin(true); });
  } else {
    showLogin(true);
  }
})();
