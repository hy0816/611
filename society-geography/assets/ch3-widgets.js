// 第三章互動圖（地形），並提供 WUtil.makeSorter / WUtil.pointMap 給後續章節使用。
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U) return;
  const { el, frame, svgPoint, mercator, ready } = U;
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

  // =====================================================================
  // 3-1 板塊擠壓與臺灣島的形成
  // =====================================================================
  W['plate-collision'] = function (host) {
    const body = frame(host, '🌋 板塊擠壓，臺灣島長高了！', '按「播放」或拖曳滑桿，看板塊如何擠出臺灣島');
    body.innerHTML = `
      <div class="w-time-head"><button class="chip" data-k="play">▶ 播放</button><input type="range" min="0" max="100" value="0" data-k="t" aria-label="時間"><span class="w-small-label" data-k="lab"></span></div>
      <div class="w-map w-map-wide"><svg viewBox="0 0 760 330"></svg></div>
      <div class="w-read"></div>`;
    const svg = body.querySelector('svg');
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    const read = body.querySelector('.w-read');
    const arrow = U.arrowMarker(svg, 'w-arrowhead-red');
    el('rect', { x: 0, y: 0, width: 760, height: 150, class: 'w-sky' }, svg);
    el('rect', { x: 0, y: 150, width: 760, height: 40, class: 'w-water' }, svg);
    const eura = el('path', { class: 'w-plate-eu' }, svg);
    const phil = el('path', { class: 'w-plate-ph' }, svg);
    const mtn = el('path', { class: 'w-mountain' }, svg);
    el('rect', { x: 0, y: 188, width: 760, height: 142, class: 'w-mantle' }, svg);
    const T = (x, y, t, c) => el('text', { x, y, 'text-anchor': 'middle', class: c || 'w-label', text: t }, svg);
    T(150, 225, '歐亞板塊', 'w-label-big');
    const phLab = T(600, 225, '菲律賓海板塊', 'w-label-big');
    T(380, 300, '地 函', 'w-label-muted');
    const push = el('line', { y1: 215, y2: 215, class: 'w-arrow-red', 'marker-end': arrow }, svg);
    const twLab = T(0, 0, '臺灣島', 'w-label-red');
    T(90, 140, '亞洲大陸', 'w-label');
    const seaL = T(270, 172, '臺灣海峽', 'w-label-sea');
    const seaR = T(690, 172, '太平洋', 'w-label-sea');
    const quakes = el('g', {}, svg);
    function render() {
      const t = +$('t').value / 100;
      const bx = 430 + (1 - t) * 120; // 菲律賓海板塊前緣
      eura.setAttribute('d', `M0,150 L0,190 L${bx + 10},190 L${bx},150 Z`);
      phil.setAttribute('d', `M${bx - 4},150 L${bx + 30},190 L760,190 L760,165 L${bx + 40},165 Z`);
      const h = 8 + 132 * t, w = 70 + 60 * t, cx = bx - 25;
      mtn.setAttribute('d', `M${cx - w},152 C${cx - w * 0.5},152 ${cx - w * 0.35},${152 - h} ${cx - 8},${152 - h} C${cx + 8},${152 - h * 1.02} ${cx + w * 0.25},${152 - h * 0.6} ${cx + w * 0.55},152 Z`);
      twLab.setAttribute('x', cx); twLab.setAttribute('y', 152 - h - 10);
      twLab.style.display = t > 0.25 ? '' : 'none';
      phLab.setAttribute('x', (bx + 760) / 2 + 20);
      push.setAttribute('x1', bx + 150); push.setAttribute('x2', bx + 60);
      seaL.setAttribute('x', Math.min(300, cx - w - 40));
      quakes.innerHTML = '';
      if (t > 0.15) for (let i = 0; i < Math.round(t * 5); i++) {
        el('text', { x: bx - 20 + ((i * 37) % 60) - 30, y: 170 + ((i * 23) % 30), 'text-anchor': 'middle', class: 'w-quake', text: '✸' }, quakes);
      }
      const yrs = t < 0.05 ? '數百萬年前' : t < 0.95 ? '持續擠壓中…' : '現在';
      $('lab').textContent = yrs;
      read.innerHTML = t < 0.15
        ? '<b class="h">一開始</b>這裡原本是海。菲律賓海板塊從東南方向西北移動，向歐亞板塊靠近。'
        : t < 0.6
          ? '<b class="h">板塊擠壓</b>兩個板塊互相推擠，地殼<b>褶皺、隆起</b>，臺灣島露出海面；擠壓處也產生許多<b>斷層</b>與<b>地震</b>（✸）。'
          : '<b class="h">現在的臺灣</b>板塊至今仍在擠壓 → 山地持續<b>抬升</b>，形成許多 3,000 公尺以上的高山，<b>地震</b>也很頻繁。';
    }
    let anim = null;
    $('t').addEventListener('input', render);
    $('play').addEventListener('click', () => {
      cancelAnimationFrame(anim);
      if (+$('t').value >= 100) $('t').value = 0;
      const step = () => {
        $('t').value = Math.min(100, +$('t').value + 0.6);
        render();
        if (+$('t').value < 100 && svg.isConnected) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    });
    render();
  };

  // =====================================================================
  // 3-2 內營力 / 外營力
  // =====================================================================
  W['forces-sort'] = (host) => makeSorter(host, {
    title: '⚒️ 內營力還是外營力？', desc: '判斷每個現象是哪一種力量造成的',
    cats: ['內營力', '外營力'],
    hint: '內營力來自地球<b>內部</b>（地殼變動、火山、地震），讓地表起伏變大；外營力來自<b>外部</b>（流水、風、海浪），削高填低。',
    items: [
      ['兩個板塊互相擠壓，使臺灣島抬升', '內營力', '板塊運動屬於地殼變動。'],
      ['斷層錯動，引發地震', '內營力', '地震來自地球內部的能量。'],
      ['火山噴發，形成大屯火山群', '內營力', '火山活動屬於內營力。'],
      ['岩層受擠壓而彎曲，形成褶皺', '內營力', '褶皺是地殼變動的結果。'],
      ['立霧溪長期向下侵蝕，形成太魯閣峽谷', '外營力', '流水侵蝕屬於外營力。'],
      ['河流在出海口堆積泥沙，形成三角洲', '外營力', '流水堆積屬於外營力。'],
      ['海浪侵蝕岩石，形成野柳女王頭', '外營力', '海浪侵蝕屬於外營力。'],
      ['岩石長期日曬雨淋，逐漸碎裂', '外營力', '風化作用屬於外營力。'],
      ['強風把沙子吹成沙丘', '外營力', '風的堆積作用屬於外營力。']
    ]
  });

  // =====================================================================
  // 3-4 五大山脈地圖 + 東西剖面
  // =====================================================================
  W['ranges-map'] = function (host) {
    if (!ready() || !window.TW_TOPO) return;
    const body = frame(host, '🏔️ 臺灣五大山脈', '點選山脈看說明；下方是北緯約 23.5° 的東西向剖面（示意）');
    const m = mercator([119.95, 21.85, 122.1, 25.35], 400, 12);
    const R = [
      { k: 'coast', n: '海岸山脈', col: '#e17f0e', pts: [[121.58, 23.98], [121.47, 23.5], [121.32, 23.05], [121.17, 22.78]], peak: ['新港山', 1682, 121.36, 23.18],
        d: '位於臺灣東部、<b>花東縱谷東側</b>，是唯一位在<b>菲律賓海板塊</b>上的山脈，高度最低。' },
      { k: 'central', n: '中央山脈', col: '#2f7d5b', pts: [[121.8, 24.58], [121.45, 24.3], [121.27, 23.95], [121.12, 23.5], [120.95, 23.0], [120.85, 22.5], [120.82, 22.0]], peak: ['秀姑巒山', 3825, 121.07, 23.5],
        d: '北起宜蘭蘇澳、南到屏東鵝鑾鼻，縱貫全島，是<b>最長</b>的山脈，也是臺灣的<b>主要分水嶺</b>（臺灣屋脊）。' },
      { k: 'xue', n: '雪山山脈', col: '#0a6fc2', pts: [[121.92, 25.0], [121.55, 24.78], [121.25, 24.42], [121.05, 24.1], [120.95, 23.85]], peak: ['雪山', 3886, 121.23, 24.38],
        d: '位於中央山脈<b>西北側</b>，北起新北市三貂角。主峰雪山為臺灣第二高峰。' },
      { k: 'yu', n: '玉山山脈', col: '#6c5ce7', pts: [[121.0, 23.72], [120.96, 23.47], [120.85, 23.1], [120.75, 22.88]], peak: ['玉山', 3952, 120.96, 23.47],
        d: '位於中央山脈<b>西南側</b>，山體高大。主峰<b>玉山（3,952 m）是臺灣最高峰</b>。' },
      { k: 'ali', n: '阿里山山脈', col: '#b5651d', pts: [[120.86, 23.92], [120.77, 23.5], [120.66, 23.12], [120.6, 22.92]], peak: ['大塔山', 2663, 120.8, 23.48],
        d: '位於玉山山脈<b>西側</b>，高度較低，以日出、雲海與森林鐵路聞名。' }
    ];
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map w-map-xs"><svg viewBox="0 0 ${m.width} ${m.height}" data-k="map"></svg></div>
        <div class="w-side">
          <div class="w-legend">${R.map((r) => `<button class="w-leg" data-r="${r.k}"><i class="w-sw" style="background:${r.col}"></i>${r.n}<b>${r.peak[0]} ${r.peak[1].toLocaleString()} m</b></button>`).join('')}</div>
          <div class="w-read w-read-lg"></div>
        </div>
      </div>
      <div class="w-profile-title">東西向剖面（北緯約 23.5°，高度誇大）</div>
      <svg viewBox="0 0 760 230" class="w-profile" data-k="prof"></svg>`;
    const svg = body.querySelector('[data-k="map"]'), prof = body.querySelector('[data-k="prof"]');
    const read = body.querySelector('.w-read');
    el('rect', { x: 0, y: 0, width: m.width, height: m.height, class: 'w-sea' }, svg);
    U.counties().forEach((f) => el('path', { d: m.path(f), class: 'w-county' }, svg));
    const [, y235] = m.proj(121, 23.5);
    el('line', { x1: 0, x2: m.width, y1: y235, y2: y235, class: 'w-grid' }, svg);
    R.forEach((r) => {
      r.line = el('path', { d: curve(r.pts, m), class: 'w-mrange', stroke: r.col }, svg);
      const [x, y] = m.proj(r.peak[2], r.peak[3]);
      r.pk = el('g', { class: 'w-peak' }, svg);
      el('path', { d: `M${x},${y - 7} L${x + 6},${y + 4} L${x - 6},${y + 4} Z`, fill: r.col }, r.pk);
      const left = r.k === 'ali';
      el('text', { x: x + (left ? -8 : 8), y: y - 4, 'text-anchor': left ? 'end' : 'start', class: 'w-small w-peak-lab', text: r.peak[0] }, r.pk);
      r.line.addEventListener('click', () => pick(r.k));
    });
    // 剖面（示意，西 → 東）
    const P = [[0, -40], [40, -30], [60, 5], [200, 40], [240, 400], [270, 1500], [300, 2600], [325, 1700], [350, 2400], [380, 3952], [405, 2900], [440, 3825], [475, 2600], [510, 900], [530, 250], [560, 200], [590, 900], [610, 1682], [635, 900], [660, 0], [700, -60], [760, -80]];
    const x = (v) => v, y = (h) => 196 - Math.max(h, -80) * 0.037;
    el('rect', { x: 0, y: y(0), width: 760, height: 40, class: 'w-water' }, prof);
    el('path', { d: d3.area().curve(d3.curveMonotoneX).x((p) => x(p[0])).y0(230).y1((p) => y(p[1]))(P), class: 'w-parea' }, prof);
    el('path', { d: d3.line().curve(d3.curveMonotoneX).x((p) => x(p[0])).y((p) => y(p[1]))(P), class: 'w-pline' }, prof);
    const segs = { ali: [250, 330, '阿里山山脈'], yu: [340, 410, '玉山山脈'], central: [415, 500, '中央山脈'], coast: [570, 650, '海岸山脈'] };
    const marks = {};
    Object.entries(segs).forEach(([k, [a, b, n]]) => {
      marks[k] = el('rect', { x: a, y: 0, width: b - a, height: 230, class: 'w-seg' }, prof);
      el('text', { x: (a + b) / 2, y: 14, 'text-anchor': 'middle', class: 'w-small', text: n }, prof);
    });
    [[30, '臺灣海峽', 'w-label-sea'], [130, '嘉南平原', 'w-small'], [545, '花東縱谷', 'w-small'], [715, '太平洋', 'w-label-sea'], [380, '▲玉山 3,952 m', 'w-label-red']]
      .forEach(([px, t, c]) => el('text', { x: px, y: px === 380 ? y(3952) - 8 : px === 545 ? y(200) - 10 : px === 130 ? y(40) - 10 : 175, 'text-anchor': 'middle', class: c, text: t }, prof));
    el('text', { x: 10, y: 225, class: 'w-small', text: '西' }, prof);
    el('text', { x: 750, y: 225, 'text-anchor': 'end', class: 'w-small', text: '東' }, prof);
    function pick(k) {
      R.forEach((r) => {
        const on = !k || r.k === k;
        r.line.classList.toggle('dim', !on); r.pk.classList.toggle('dim', !on);
      });
      body.querySelectorAll('[data-r]').forEach((b) => b.classList.toggle('active', b.dataset.r === k));
      Object.entries(marks).forEach(([mk, n]) => n.classList.toggle('on', mk === k));
      const r = R.find((o) => o.k === k);
      read.innerHTML = r
        ? `<b class="h">${r.n}</b>${r.d}<br>最高峰：<b>${r.peak[0]}（${r.peak[1].toLocaleString()} m）</b>`
        : '<b class="h">由東到西</b>海岸山脈 → 中央山脈 → 雪山山脈（北）／玉山山脈（南）→ 阿里山山脈。<br><span class="w-hint">地圖上的山脈位置為示意。點選右方按鈕或地圖上的色帶。</span>';
    }
    body.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => pick(b.classList.contains('active') ? null : b.dataset.r)));
    pick(null);
  };

  // =====================================================================
  // 3-5 / 3-6 地形分布地圖
  // =====================================================================
  const LANDFORMS = [
    { n: '竹苗丘陵', c: 'hill', lon: 120.98, lat: 24.65, d: '新竹、苗栗一帶起伏和緩的丘陵，海拔約 100～1,000 公尺。' },
    { n: '恆春丘陵', c: 'hill', lon: 120.82, lat: 22.12, d: '恆春半島上的丘陵地。', left: true },
    { n: '林口臺地', c: 'plateau', lon: 121.36, lat: 25.08, d: '位於新北市，臺地頂部平坦、四周有陡崖。', left: true },
    { n: '桃園臺地', c: 'plateau', lon: 121.18, lat: 24.93, d: '臺灣面積最大的臺地之一；灌溉不易，開鑿許多<b>埤塘</b>蓄水。', left: true },
    { n: '后里臺地', c: 'plateau', lon: 120.73, lat: 24.31, d: '位於臺中市北部，大甲溪與大安溪之間。' },
    { n: '大肚臺地', c: 'plateau', lon: 120.56, lat: 24.17, d: '位於臺中盆地西側，臺地上設有臺中都會公園等。', left: true },
    { n: '八卦臺地', c: 'plateau', lon: 120.55, lat: 23.95, d: '位於彰化縣，多種植鳳梨、茶等旱作。', left: true },
    { n: '恆春臺地', c: 'plateau', lon: 120.74, lat: 21.98, d: '位於恆春半島南端。', left: true },
    { n: '臺北盆地', c: 'basin', lon: 121.52, lat: 25.05, d: '臺灣<b>最大</b>的盆地，北部政治、經濟中心；夏季悶熱、空氣汙染較難擴散。' },
    { n: '臺中盆地', c: 'basin', lon: 120.68, lat: 24.14, d: '位於臺中市，中部的都會中心。' },
    { n: '埔里盆地群', c: 'basin', lon: 120.97, lat: 23.97, d: '位於南投縣，由多個小盆地組成，臺灣地理中心碑就在附近。' },
    { n: '泰源盆地', c: 'basin', lon: 121.3, lat: 22.99, d: '位於臺東縣海岸山脈中的小盆地。' },
    { n: '嘉南平原', c: 'plain', lon: 120.3, lat: 23.25, d: '臺灣<b>面積最大</b>的平原，重要稻米產區，有「臺灣穀倉」之稱。', left: true },
    { n: '屏東平原', c: 'plain', lon: 120.53, lat: 22.62, d: '臺灣第二大平原，由高屏溪等河川沖積而成。', left: true },
    { n: '蘭陽平原', c: 'plain', lon: 121.76, lat: 24.7, d: '由蘭陽溪沖積而成，形狀呈<b>三角形</b>。' },
    { n: '花東縱谷平原', c: 'plain', lon: 121.3, lat: 23.35, d: '中央山脈與海岸山脈之間的狹長谷地，由<b>斷層</b>作用形成，也是兩板塊的交界。' },
    { n: '大屯火山群', c: 'volcano', lon: 121.55, lat: 25.18, d: '位於臺北陽明山一帶，有溫泉、硫磺噴氣孔，七星山為最高峰。' },
    { n: '基隆火山群', c: 'volcano', lon: 121.86, lat: 25.1, d: '九份、金瓜石一帶，過去盛產<b>金礦</b>。' },
    { n: '澎湖群島', c: 'volcano', lon: 119.58, lat: 23.57, d: '玄武岩熔岩流形成的<b>方山</b>，有著名的<b>柱狀玄武岩</b>。' },
    { n: '龜山島', c: 'volcano', lon: 121.95, lat: 24.84, d: '宜蘭外海的火山島，外形像海龜。' },
    { n: '綠島', c: 'volcano', lon: 121.49, lat: 22.66, d: '臺東外海的火山島，有海底溫泉。' },
    { n: '蘭嶼', c: 'volcano', lon: 121.55, lat: 22.05, d: '臺東外海的火山島，達悟族的家園。' }
  ];
  const LF_CATS = { hill: ['丘陵', '#8cc084'], plateau: ['臺地', '#e1a33b'], basin: ['盆地', '#0a6fc2'], plain: ['平原', '#d4b106'], volcano: ['火山', '#d63031'] };
  W['landforms-map'] = (host) => pointMap(host, {
    title: '🗺️ 臺灣的地形分布', desc: '用上方按鈕篩選地形；按「找找看」練習位置',
    bbox: [119.3, 21.85, 122.15, 25.35], width: 460,
    cats: LF_CATS, items: LANDFORMS, filter: host.dataset.filter || 'all',
    intro: '<b class="h">提示</b>點選地圖上的圓點看說明。也可以按「找找看」，練習在地圖上找出各種地形。'
  });

})();
