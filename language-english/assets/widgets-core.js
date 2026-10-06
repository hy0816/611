// 互動圖共用工具：在筆記中放 <div data-widget="名稱"></div>，由 app.js 呼叫 WIDGETS[名稱](el)。
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;

  // ---------- 共用工具 ----------
  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs || {}) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(node);
    return node;
  }
  function frame(host, title, desc) {
    host.classList.add('widget');
    host.innerHTML = `<div class="w-head"><span class="w-title">${title}</span><span class="w-desc">${desc}</span></div><div class="w-body"></div>`;
    return host.querySelector('.w-body');
  }
  function svgPoint(svg, e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function arrowMarker(svg, cls) {
    const id = 'wa' + (++uid);
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }, mk);
    return `url(#${id})`;
  }
  const tw = (s) => s.replace(/台/g, '臺');
  function latlon(lon, lat, dp) {
    return `${lat >= 0 ? '北緯' : '南緯'} ${Math.abs(lat).toFixed(dp)}°，${lon >= 0 ? '東經' : '西經'} ${Math.abs(lon).toFixed(dp)}°`;
  }
  // 平面麥卡托投影（資料已裁切過，不需要球面裁切）
  function mercator(bbox, width, pad) {
    pad = pad == null ? 16 : pad;
    const [x0, y0, x1, y1] = bbox;
    const X = (l) => l * Math.PI / 180;
    const Y = (p) => Math.log(Math.tan(Math.PI / 4 + p * Math.PI / 360));
    const k = (width - 2 * pad) / (X(x1) - X(x0));
    const height = Math.round(k * (Y(y1) - Y(y0)) + 2 * pad);
    const proj = (lon, lat) => [pad + (X(lon) - X(x0)) * k, pad + (Y(y1) - Y(lat)) * k];
    const invert = (x, y) => [x0 + ((x - pad) / k) * 180 / Math.PI, (2 * Math.atan(Math.exp(Y(y1) - (y - pad) / k)) - Math.PI / 2) * 180 / Math.PI];
    const path = d3.geoPath(d3.geoTransform({ point(lon, lat) { const p = proj(lon, lat); this.stream.point(p[0], p[1]); } }));
    const line = (pts) => 'M' + pts.map((p) => proj(p[0], p[1]).map((n) => n.toFixed(1)).join(',')).join('L');
    return { proj, invert, path, line, width, height };
  }
  function counties() {
    return topojson.feature(TW_TOPO, TW_TOPO.objects.counties).features
      .map((f) => Object.assign(f, { name: tw(f.properties.COUNTYNAME) }));
  }
  const ready = () => window.d3 && window.topojson;
  window.WUtil = { el, frame, svgPoint, arrowMarker, mercator, latlon, counties, ready };

  const U = window.WUtil;
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const curve = (pts, m) => d3.line().curve(d3.curveCatmullRom)(pts.map((p) => m.proj(p[0], p[1])));

  // ---------- 通用：分類練習 ----------
  function makeSorter(host, cfg) {
    const body = frame(host, cfg.title, cfg.desc);
    let list, right, done;
    function render() {
      list = shuffle(cfg.items); right = 0; done = 0;
      body.innerHTML = `
        <div class="score-line"><span>答對 <b data-k="r">0</b> / <span data-k="d">0</span>（共 ${list.length} 題）</span><button class="chip" data-k="again">重新出題</button></div>
        <div class="w-sort">${list.map(([t], i) => `
          <div class="w-sort-row" data-i="${i}">
            <div class="w-sort-q">${t}</div>
            <div class="w-sort-btns">${cfg.cats.map((k) => `<button class="chip" data-a="${k}">${k}</button>`).join('')}</div>
            <div class="w-sort-ex"></div>
          </div>`).join('')}</div>
        ${cfg.hint ? `<p class="w-hint">${cfg.hint}</p>` : ''}`;
      body.querySelector('[data-k="again"]').addEventListener('click', render);
      body.querySelectorAll('.w-sort-row').forEach((row) => {
        const [, ans, why] = list[+row.dataset.i];
        row.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
          if (row.classList.contains('done')) return;
          row.classList.add('done');
          const ok = b.dataset.a === ans;
          done++; if (ok) right++;
          row.querySelectorAll('[data-a]').forEach((x) => { x.disabled = true; if (x.dataset.a === ans) x.classList.add('ok'); else if (x === b) x.classList.add('bad'); });
          row.querySelector('.w-sort-ex').innerHTML = `<span class="${ok ? 'w-ok' : 'w-bad'}">${ok ? '✔' : '✘ 答案是「' + ans + '」'}</span> ${why}`;
          body.querySelector('[data-k="r"]').textContent = right;
          body.querySelector('[data-k="d"]').textContent = done;
        }));
      });
    }
    render();
  }

  // ---------- 通用：臺灣點位地圖（分類篩選 + 找找看） ----------
  // cfg: { title, desc, bbox, width, cats: {key: [名稱, 顏色]}, items: [{n, c, lon, lat, d}], filter, extra(svg, m) }
  function pointMap(host, cfg) {
    if (!ready() || !window.TW_TOPO) return;
    const body = frame(host, cfg.title, cfg.desc);
    const m = mercator(cfg.bbox, cfg.width || 460, 14);
    const keys = Object.keys(cfg.cats);
    body.innerHTML = `
      <div class="w-tabs">
        <button class="chip" data-f="all">全部</button>
        ${keys.map((k) => `<button class="chip" data-f="${k}"><i class="w-dot" style="background:${cfg.cats[k][1]}"></i>${cfg.cats[k][0]}</button>`).join('')}
        <span class="w-tab-sep"></span>
        <button class="chip" data-k="quiz">🎯 找找看</button>
      </div>
      <div class="w-split">
        <div class="w-map w-map-sm"><svg viewBox="0 0 ${m.width} ${m.height}"></svg></div>
        <div class="w-side"><div class="w-read w-read-lg"></div><div class="w-quiz-foot" hidden><span class="w-score"></span><button class="chip" data-k="next">下一題 →</button></div></div>
      </div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    const foot = body.querySelector('.w-quiz-foot');
    el('rect', { x: 0, y: 0, width: m.width, height: m.height, class: 'w-sea' }, svg);
    U.counties().forEach((f) => el('path', { d: m.path(f), class: 'w-county' }, svg));
    if (cfg.extra) cfg.extra(svg, m);
    const items = cfg.items.map((it) => {
      const [x, y] = m.proj(it.lon, it.lat);
      const g = el('g', { class: 'w-pin', tabindex: 0 }, svg);
      el('circle', { cx: x, cy: y, r: 7, fill: cfg.cats[it.c][1] }, g);
      const lab = el('text', { x: x + (it.left ? -10 : 10), y: y + 4, 'text-anchor': it.left ? 'end' : 'start', class: 'w-pin-label', text: it.n }, g);
      return Object.assign({ g, lab }, it);
    });
    let filter = cfg.filter || 'all', quiz = null, score = [0, 0];
    const visible = (it) => filter === 'all' || it.c === filter;
    function applyFilter() {
      body.querySelectorAll('[data-f]').forEach((b) => b.classList.toggle('active', b.dataset.f === filter));
      items.forEach((it) => {
        it.g.style.display = visible(it) ? '' : 'none';
        it.lab.style.display = quiz ? 'none' : '';
        it.g.classList.remove('sel', 'ok', 'bad');
      });
    }
    function show(it) {
      items.forEach((o) => o.g.classList.toggle('sel', o === it));
      read.innerHTML = `<b class="h">${it.n}（${cfg.cats[it.c][0]}）</b>${it.d}`;
    }
    function ask() {
      const pool = items.filter(visible);
      quiz = { target: pool[Math.floor(Math.random() * pool.length)], done: false };
      applyFilter();
      read.innerHTML = `<b class="h">找找看（${score[1] + 1}）</b>請在地圖上點出 <b>${quiz.target.n}</b> 的位置。`;
      foot.querySelector('.w-score').textContent = `答對 ${score[0]} / ${score[1]}`;
    }
    items.forEach((it) => {
      const pick = () => {
        if (!quiz) return show(it);
        if (quiz.done) return;
        quiz.done = true;
        const ok = it === quiz.target;
        score[1]++; if (ok) score[0]++;
        it.g.classList.add(ok ? 'ok' : 'bad');
        quiz.target.g.classList.add('ok');
        quiz.target.lab.style.display = '';
        if (!ok) it.lab.style.display = '';
        read.innerHTML = `<b class="h">${ok ? '✔ 答對了！' : '✘ 這是「' + it.n + '」'}</b><b>${quiz.target.n}</b>：${quiz.target.d}`;
        foot.querySelector('.w-score').textContent = `答對 ${score[0]} / ${score[1]}`;
      };
      it.g.addEventListener('click', pick);
      it.g.addEventListener('keydown', (e) => { if (e.key === 'Enter') pick(); });
    });
    body.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.f;
      if (quiz) ask(); else { applyFilter(); read.innerHTML = cfg.intro || '點選地圖上的圓點看說明。'; }
    }));
    body.querySelector('[data-k="quiz"]').addEventListener('click', (e) => {
      const on = !quiz;
      e.currentTarget.classList.toggle('active', on);
      foot.hidden = !on;
      if (on) ask(); else { quiz = null; applyFilter(); read.innerHTML = cfg.intro || '點選地圖上的圓點看說明。'; }
    });
    body.querySelector('[data-k="next"]').addEventListener('click', ask);
    applyFilter();
    read.innerHTML = cfg.intro || '點選地圖上的圓點看說明。';
  }

  Object.assign(U, { makeSorter, pointMap, shuffle, curve });

})();
