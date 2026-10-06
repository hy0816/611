// 第二章互動圖（地圖）：使用 ch1-widgets.js 匯出的 WUtil 共用工具。
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U) return;
  const { el, frame, svgPoint, mercator, ready } = U;
  const fmtNum = (n) => n.toLocaleString('en-US');
  function fmtLen(m) { // 公尺 → 易讀字串
    if (m >= 1000) return (m / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' 公里';
    return m.toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' 公尺';
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // =====================================================================
  // 2-1 地圖要素與方位判斷
  // =====================================================================
  W['map-elements'] = function (host) {
    const body = frame(host, '🧩 地圖要素與方位判斷', '點選地圖上的要素；或切換到方位練習');
    body.innerHTML = `
      <div class="w-tabs"><button class="chip" data-mode="learn">認識地圖要素</button><button class="chip" data-mode="quiz">方位判斷練習</button></div>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 600 420"></svg></div>
        <div class="w-side">
          <div class="w-read w-read-lg"></div>
          <div class="w-dirs" hidden></div>
          <div class="w-quiz-foot" hidden><span class="w-score"></span><button class="chip" data-k="next">下一題 →</button></div>
        </div>
      </div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    const dirsBox = body.querySelector('.w-dirs');
    const foot = body.querySelector('.w-quiz-foot');
    const DIRS = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];

    // 底圖
    el('rect', { x: 10, y: 10, width: 580, height: 400, rx: 10, class: 'w-paper' }, svg);
    [160, 260].forEach((y) => el('line', { x1: 20, x2: 580, y1: y, y2: y, class: 'w-road' }, svg));
    [170, 370].forEach((x) => el('line', { x1: x, x2: x, y1: 20, y2: 400, class: 'w-road' }, svg));
    el('path', { d: 'M20,345 C120,330 180,365 270,350 S430,330 580,345', class: 'w-river' }, svg);
    const PLACES = [
      ['圖書館', '📚', 0, 0], ['醫院', '🏥', 1, 0], ['超市', '🛒', 2, 0], ['郵局', '📮', 3, 0],
      ['學校', '🏫', 1, 1], ['車站', '🚉', 3, 1], ['公園', '🌳', 0, 2], ['廟宇', '⛩️', 2, 2]
    ].map(([name, icon, i, j]) => ({ name, icon, x: 120 + 100 * i, y: 110 + 100 * j }));
    const placeG = el('g', {}, svg);
    PLACES.forEach((p) => {
      p.ring = el('circle', { cx: p.x, cy: p.y, r: 22, class: 'w-place-ring' }, placeG);
      el('text', { x: p.x, y: p.y + 8, 'text-anchor': 'middle', class: 'w-icon', text: p.icon }, placeG);
      p.tag = el('text', { x: p.x, y: p.y + 36, 'text-anchor': 'middle', class: 'w-small w-place-name', text: p.name }, placeG);
    });
    // 要素
    const E = {};
    E.title = el('g', { class: 'w-el', 'data-e': 'title', tabindex: 0 }, svg);
    el('rect', { x: 24, y: 24, width: 176, height: 36, rx: 6, class: 'w-el-box' }, E.title);
    el('text', { x: 112, y: 48, 'text-anchor': 'middle', class: 'w-label', text: '幸福鎮觀光地圖' }, E.title);
    E.north = el('g', { class: 'w-el', 'data-e': 'north', tabindex: 0 }, svg);
    el('circle', { cx: 540, cy: 66, r: 32, class: 'w-el-box' }, E.north);
    const needle = el('g', {}, E.north);
    el('path', { d: 'M540,40 L550,72 L540,66 L530,72 Z', class: 'w-needle' }, needle);
    el('text', { x: 540, y: 36, 'text-anchor': 'middle', class: 'w-label-red', text: 'N' }, needle);
    E.scale = el('g', { class: 'w-el', 'data-e': 'scale', tabindex: 0 }, svg);
    el('rect', { x: 24, y: 368, width: 190, height: 34, rx: 6, class: 'w-el-box' }, E.scale);
    el('rect', { x: 36, y: 380, width: 60, height: 6, class: 'w-bar-dark' }, E.scale);
    el('rect', { x: 96, y: 380, width: 60, height: 6, class: 'w-bar-light' }, E.scale);
    [[36, '0'], [96, '200'], [156, '400 公尺']].forEach(([x, t]) => el('text', { x, y: 399, 'text-anchor': x === 156 ? 'start' : 'middle', class: 'w-small', text: t }, E.scale));
    E.legend = el('g', { class: 'w-el', 'data-e': 'legend', tabindex: 0 }, svg);
    el('rect', { x: 446, y: 292, width: 134, height: 110, rx: 6, class: 'w-el-box' }, E.legend);
    el('text', { x: 456, y: 310, class: 'w-label', text: '圖例' }, E.legend);
    [['🏫 學校', '🚉 車站'], ['🏥 醫院', '📮 郵局'], ['━ 道路', '〰 河流']].forEach((row, r) => row.forEach((t, c) =>
      el('text', { x: 456 + c * 64, y: 334 + r * 24, class: 'w-small w-legend-txt', text: t }, E.legend)));

    const INFO = {
      title: ['圖名', '說明地圖的<b>主題與範圍</b>，讓人一看就知道這張地圖在畫什麼。'],
      north: ['方位（指北針）', '箭頭指向<b>北方</b>。有指北針時以它為準；若沒有指北針、也沒有經緯線，就採用<b>上北、下南、左西、右東</b>。'],
      scale: ['比例尺', '表示圖上距離與實際距離的關係。這張圖的線段式比例尺每一格代表 <b>200 公尺</b>。'],
      legend: ['圖例', '說明地圖上各種<b>符號、線條、顏色</b>代表的意義。']
    };
    let mode = 'learn', rot = 0, q = null, score = [0, 0];
    Object.values(E).forEach((g) => {
      const show = () => {
        if (mode !== 'learn') return;
        Object.values(E).forEach((o) => o.classList.toggle('active', o === g));
        const [t, d] = INFO[g.dataset.e];
        read.innerHTML = `<b class="h">${t}</b>${d}`;
      };
      g.addEventListener('mouseenter', show); g.addEventListener('click', show); g.addEventListener('focus', show);
    });

    function setRot(r, hidden) {
      rot = r;
      needle.setAttribute('transform', `rotate(${r} 540 66)`);
      E.north.style.display = hidden ? 'none' : '';
    }
    function newQ() {
      // 只挑方位剛好是 8 方位之一的兩地
      let a, b;
      do {
        a = PLACES[Math.floor(Math.random() * PLACES.length)];
        b = PLACES[Math.floor(Math.random() * PLACES.length)];
      } while (a === b || !(a.x === b.x || a.y === b.y || Math.abs(a.x - b.x) === Math.abs(a.y - b.y)));
      const noArrow = Math.random() < 0.2;
      const r = noArrow ? 0 : [0, 0, 45, 90, 135, 180, 225, 270, 315][Math.floor(Math.random() * 9)];
      setRot(r, noArrow);
      const screen = (Math.atan2(a.x - b.x, -(a.y - b.y)) * 180 / Math.PI + 360) % 360; // 由 b 看 a
      const ans = Math.round(((screen - r + 720) % 360) / 45) % 8;
      q = { a, b, ans, r, noArrow, done: false };
      PLACES.forEach((p) => { p.ring.classList.toggle('from', p === b); p.ring.classList.toggle('to', p === a); });
      read.innerHTML = `<b class="h">第 ${score[1] + 1} 題</b>${noArrow ? '這張地圖<b>沒有指北針</b>。<br>' : r ? `注意：指北針轉了 <b>${r}°</b>！<br>` : ''}<b>${a.icon} ${a.name}</b> 在 <b>${b.icon} ${b.name}</b> 的哪個方位？`;
      dirsBox.querySelectorAll('button').forEach((x) => { x.disabled = false; x.className = 'chip'; });
    }
    dirsBox.innerHTML = `<div class="w-compass">${[7, 0, 1, 6, -1, 2, 5, 4, 3].map((i) => i < 0 ? '<span class="w-compass-c">?</span>' : `<button class="chip" data-d="${i}">${DIRS[i]}</button>`).join('')}</div>`;
    dirsBox.querySelectorAll('[data-d]').forEach((btn) => btn.addEventListener('click', () => {
      if (!q || q.done) return;
      q.done = true;
      const d = +btn.dataset.d, ok = d === q.ans;
      score[1]++; if (ok) score[0]++;
      dirsBox.querySelectorAll('[data-d]').forEach((x) => { x.disabled = true; if (+x.dataset.d === q.ans) x.classList.add('ok'); else if (x === btn) x.classList.add('bad'); });
      const how = q.noArrow ? '沒有指北針 → 上北下南、左西右東。' : q.r ? `先把地圖轉 ${q.r}°，讓指北針朝上，再判斷方位。` : '指北針朝上，所以上北下南。';
      read.innerHTML += `<br><span class="${ok ? 'w-ok' : 'w-bad'}">${ok ? '✔ 答對了！' : '✘ 答錯了，正確答案是「' + DIRS[q.ans] + '」'}</span><br><span class="w-hint">${how}</span>`;
      foot.querySelector('.w-score').textContent = `答對 ${score[0]} / ${score[1]}`;
    }));
    body.querySelector('[data-k="next"]').addEventListener('click', newQ);

    function setMode(m) {
      mode = m;
      body.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
      dirsBox.hidden = foot.hidden = m !== 'quiz';
      Object.values(E).forEach((o) => o.classList.remove('active'));
      if (m === 'quiz') { foot.querySelector('.w-score').textContent = `答對 ${score[0]} / ${score[1]}`; newQ(); }
      else {
        setRot(0, false);
        PLACES.forEach((p) => p.ring.classList.remove('from', 'to'));
        read.innerHTML = '<b class="h">提示</b>把滑鼠移到地圖上的<b>圖名、指北針、比例尺、圖例</b>，看看它們的功能。';
      }
    }
    body.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    setMode('learn');
  };

  // =====================================================================
  // 2-2 影印放大：哪一種比例尺還正確？
  // =====================================================================
  W['scale-zoom'] = function (host) {
    const body = frame(host, '🖨️ 地圖影印放大後，比例尺還準嗎？', '切換縮放倍率，比較數字式與線段式比例尺');
    body.innerHTML = `
      <div class="w-tabs">
        <button class="chip" data-z="0.5">縮小一半</button><button class="chip" data-z="1">原尺寸</button><button class="chip" data-z="2">放大 2 倍</button>
      </div>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 640 400"></svg></div>
        <div class="w-side"><div class="w-read w-read-lg"></div></div>
      </div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    el('rect', { x: 0, y: 0, width: 640, height: 400, class: 'w-paper' }, svg);
    el('text', { x: 620, y: 28, 'text-anchor': 'end', class: 'w-label', text: '數字式比例尺 1：50,000' }, svg);
    el('text', { x: 620, y: 48, 'text-anchor': 'end', class: 'w-small', text: '（印在紙上的文字，不會跟著縮放）' }, svg);
    const g = el('g', {}, svg);
    // 地圖內容：以 40 單位 = 1 公分（原尺寸）
    el('path', { d: 'M0,70 C40,40 80,95 120,60 S190,50 220,70', class: 'w-river' }, g);
    el('rect', { x: 60, y: 10, width: 46, height: 24, rx: 3, class: 'w-block' }, g);
    el('rect', { x: 150, y: 88, width: 36, height: 22, rx: 3, class: 'w-block' }, g);
    el('line', { x1: 0, y1: 50, x2: 160, y2: 50, class: 'w-road-hl' }, g);
    el('circle', { cx: 0, cy: 50, r: 5, class: 'w-pt' }, g);
    el('circle', { cx: 160, cy: 50, r: 5, class: 'w-pt' }, g);
    el('text', { x: -4, y: 40, 'text-anchor': 'end', class: 'w-label', text: 'A' }, g);
    el('text', { x: 166, y: 40, class: 'w-label', text: 'B' }, g);
    // 線段式比例尺：2 公分 = 1 公里
    el('rect', { x: 0, y: 128, width: 40, height: 7, class: 'w-bar-dark' }, g);
    el('rect', { x: 40, y: 128, width: 40, height: 7, class: 'w-bar-light' }, g);
    [[0, '0'], [40, '0.5'], [80, '1 公里']].forEach(([x, t]) => el('text', { x, y: 150, 'text-anchor': x === 80 ? 'start' : 'middle', class: 'w-small', text: t }, g));
    const ruler = el('g', {}, svg);

    function render(z) {
      body.querySelectorAll('[data-z]').forEach((b) => b.classList.toggle('active', +b.dataset.z === z));
      g.setAttribute('transform', `translate(40,70) scale(${z})`);
      // 紙上的尺：量 A–B
      ruler.innerHTML = '';
      const len = 160 * z, y0 = 70 + 50 * z + 14;
      el('rect', { x: 40, y: y0, width: len, height: 16, class: 'w-ruler-box' }, ruler);
      const cm = 4 * z;
      for (let i = 0; i <= cm * 2; i++) el('line', { x1: 40 + i * 20, x2: 40 + i * 20, y1: y0, y2: y0 + (i % 2 ? 5 : 9), class: 'w-ruler' }, ruler);
      el('text', { x: 40 + len / 2, y: y0 + 30, 'text-anchor': 'middle', class: 'w-label-red', text: `尺量：${cm} 公分` }, ruler);
      const numeric = cm * 50000 / 100000;
      read.innerHTML = `<b class="h">${z === 1 ? '原尺寸' : z > 1 ? '放大 2 倍' : '縮小一半'}：紙上量到 A–B = ${cm} 公分</b>
        ① 用<b>數字式</b>算：${cm} × 50,000 = ${fmtNum(cm * 50000)} 公分 = <b>${numeric} 公里</b> ${z === 1 ? '<span class="w-ok">✔</span>' : '<span class="w-bad">✘ 錯了</span>'}<br>
        ② 用<b>線段式</b>比對：A–B 剛好是比例尺線段的 2 倍長（0～1 公里 × 2）= <b>2 公里</b> <span class="w-ok">✔ 正確</span><br>
        <span class="w-hint">${z === 1 ? '原尺寸時兩種都正確。試試放大或縮小！' : '地圖縮放後，線段跟著一起縮放，所以<b>線段式比例尺仍然正確</b>；數字式與文字式就不準了。'}</span>`;
    }
    body.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => render(+b.dataset.z)));
    render(1);
  };

  // =====================================================================
  // 2-2 比例尺大小與範圍
  // =====================================================================
  W['scale-range'] = function (host) {
    if (!ready() || !window.TW_TOPO) return;
    const body = frame(host, '🔍 比例尺大小 vs 地圖範圍', '拖曳滑桿換比例尺；點地圖可移動框框位置');
    const SC = [5000, 25000, 50000, 100000, 250000, 1000000, 3000000];
    const m = mercator([119.2, 21.8, 122.2, 25.45], 440, 10);
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map w-map-sm"><svg viewBox="0 0 ${m.width} ${m.height}"></svg></div>
        <div class="w-side">
          <label class="w-slider">比例尺 <input type="range" min="0" max="${SC.length - 1}" step="1" value="2"><output></output></label>
          <div class="w-meter">
            <div><span>比例尺</span><i>大</i><div class="w-track"><span data-k="m1"></span></div><i>小</i></div>
            <div><span>範圍</span><i>小</i><div class="w-track"><span data-k="m2"></span></div><i>大</i></div>
            <div><span>內容</span><i>詳細</i><div class="w-track"><span data-k="m3"></span></div><i>簡略</i></div>
          </div>
          <div class="w-read"></div>
          <svg viewBox="0 0 260 40" class="w-scalebar"></svg>
        </div>
      </div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    const input = body.querySelector('input');
    const bar = body.querySelector('.w-scalebar');
    el('rect', { x: 0, y: 0, width: m.width, height: m.height, class: 'w-sea' }, svg);
    U.counties().forEach((f) => el('path', { d: m.path(f), class: 'w-county' }, svg));
    const box = el('rect', { class: 'w-scope' }, svg);
    const dot = el('circle', { r: 3.5, class: 'w-city tw' }, svg);
    let center = [121.52, 25.04];

    function render() {
      const S = SC[+input.value];
      body.querySelector('output').textContent = '1：' + fmtNum(S);
      const km = S * 0.1 / 1000; // 10 公分見方
      const dLat = km / 2 / 111, dLon = km / 2 / (111 * Math.cos(center[1] * Math.PI / 180));
      const [x0, y0] = m.proj(center[0] - dLon, center[1] + dLat), [x1, y1] = m.proj(center[0] + dLon, center[1] - dLat);
      box.setAttribute('x', x0); box.setAttribute('y', y0);
      box.setAttribute('width', Math.max(x1 - x0, 1)); box.setAttribute('height', Math.max(y1 - y0, 1));
      const [cx, cy] = m.proj(...center); dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
      const pos = (+input.value / (SC.length - 1) * 100) + '%';
      ['m1', 'm2', 'm3'].forEach((k) => { body.querySelector(`[data-k="${k}"]`).style.left = pos; });
      const use = S <= 5000 ? '校園、社區導覽圖' : S <= 50000 ? '鄉鎮地圖、登山步道圖' : S <= 250000 ? '縣市地圖、交通路線圖' : S <= 1000000 ? '全臺灣地圖' : '東亞地圖、世界地圖';
      read.innerHTML = `<b class="h">1：${fmtNum(S)}</b>
        文字式：圖上 1 公分代表實際 <b>${fmtLen(S / 100)}</b><br>
        一張 10 × 10 公分的地圖，約可畫出 <b>${fmtLen(km * 1000)} × ${fmtLen(km * 1000)}</b> 的範圍${km < 3 ? '（框框小到快看不見了！）' : ''}<br>
        適合用途：${use}`;
      bar.innerHTML = '';
      el('rect', { x: 10, y: 8, width: 60, height: 7, class: 'w-bar-dark' }, bar);
      el('rect', { x: 70, y: 8, width: 60, height: 7, class: 'w-bar-light' }, bar);
      el('text', { x: 10, y: 32, 'text-anchor': 'middle', class: 'w-small', text: '0' }, bar);
      el('text', { x: 130, y: 32, 'text-anchor': 'middle', class: 'w-small', text: fmtLen(S * 2 / 100) }, bar);
      el('text', { x: 145, y: 16, class: 'w-small', text: '← 線段式（2 公分）' }, bar);
    }
    input.addEventListener('input', render);
    svg.addEventListener('click', (e) => { const p = svgPoint(svg, e); center = m.invert(p.x, p.y); render(); });
    render();
  };

  // =====================================================================
  // 2-2 比例尺計算機
  // =====================================================================
  W['scale-calc'] = function (host) {
    const body = frame(host, '🧮 比例尺計算機', '輸入數字，看完整的換算步驟');
    body.innerHTML = `
      <div class="w-tabs"><button class="chip" data-m="real">求實際距離</button><button class="chip" data-m="map">求圖上距離</button></div>
      <div class="w-calc-row">
        <span>比例尺 1：</span><input type="number" min="1" value="50000" data-k="s" style="width:7em">
        <span data-k="lab">圖上距離</span><input type="number" min="0" step="0.1" value="4" data-k="v"><span data-k="unit">公分</span>
      </div>
      <div class="w-chips">
        <button class="chip" data-p="real,25000,8">1：25,000 量到 8 公分</button>
        <button class="chip" data-p="real,1000000,3.5">1：1,000,000 量到 3.5 公分</button>
        <button class="chip" data-p="map,50000,3">1：50,000 實際 3 公里</button>
      </div>
      <div class="w-read"></div>`;
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    let mode = 'real';
    function calc() {
      body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('active', b.dataset.m === mode));
      $('lab').textContent = mode === 'real' ? '圖上距離' : '實際距離';
      $('unit').textContent = mode === 'real' ? '公分' : '公里';
      const S = Math.max(1, +$('s').value || 1), v = Math.max(0, +$('v').value || 0);
      const out = body.querySelector('.w-read');
      if (mode === 'real') {
        const cm = v * S;
        out.innerHTML = `<b class="h">實際距離 = 圖上距離 × 比例尺分母</b>
          ${v} 公分 × ${fmtNum(S)} = ${fmtNum(+cm.toFixed(2))} 公分<br>
          = ${fmtNum(+(cm / 100).toFixed(2))} 公尺 = <b>${fmtNum(+(cm / 100000).toFixed(3))} 公里</b><br>
          <span class="w-hint">單位換算：1 公里 = 1,000 公尺 = 100,000 公分</span>`;
      } else {
        const cm = v * 100000;
        out.innerHTML = `<b class="h">圖上距離 = 實際距離 ÷ 比例尺分母</b>
          ${v} 公里 = ${fmtNum(cm)} 公分<br>
          ${fmtNum(cm)} ÷ ${fmtNum(S)} = <b>${fmtNum(+(cm / S).toFixed(2))} 公分</b><br>
          <span class="w-hint">先把實際距離換成「公分」，再除以分母。</span>`;
      }
    }
    body.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.m; calc(); }));
    ['s', 'v'].forEach((k) => $(k).addEventListener('input', calc));
    body.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const [m, s, v] = b.dataset.p.split(','); mode = m; $('s').value = s; $('v').value = v; calc();
    }));
    calc();
  };

  // =====================================================================
  // 2-3 等高線與地形剖面
  // =====================================================================
  W['contour'] = function (host) {
    if (!ready()) return;
    const body = frame(host, '⛰️ 等高線地形圖與剖面圖', '拖曳 A、B 兩點畫剖面線；移動滑鼠看海拔與坡度');
    const NX = 120, NY = 84, C = 5, M_PER = 25; // 每格 25 公尺
    const g2 = (x, y, cx, cy, s) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));
    const smooth = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
    function Z(x, y) {
      let z = 30 + 0.6 * (NY - y);
      z += 640 * g2(x, y, 36, 36, 8.5);          // 山頂 A：陡
      z += 460 * g2(x, y, 84, 42, 15);           // 山頂 B：緩
      // 山脊：由 A 往西北延伸
      const ax = 36, ay = 36, bx = 8, by = 8, vx = bx - ax, vy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
      const d2 = (x - (ax + t * vx)) ** 2 + (y - (ay + t * vy)) ** 2;
      z += 260 * Math.exp(-d2 / (2 * 4 * 4)) * smooth(0.12, 0.4, t) * (1 - 0.75 * t);
      // 山谷：在 B 的南坡切出一條谷
      const dx = x - (86 + 0.15 * (y - 56));
      z -= 150 * Math.exp(-(dx * dx) / (2 * 4.5 * 4.5)) * smooth(52, 66, y);
      return Math.max(0, z);
    }
    const values = new Float64Array(NX * NY);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) values[j * NX + i] = Z(i + 0.5, j + 0.5);
    const zmax = d3.max(values);
    // 鞍部：兩山頂連線上的最低點
    let saddle = null;
    for (let s = 0.15; s <= 0.85; s += 0.01) {
      const x = 36 + (84 - 36) * s, y = 36 + (42 - 36) * s, z = Z(x, y);
      if (!saddle || z < saddle.z) saddle = { x, y, z };
    }
    const LAND = [
      { x: 36, y: 36, t: `▲ 山頂 A（${Math.round(Z(36, 36))} m）` },
      { x: 84, y: 42, t: `▲ 山頂 B（${Math.round(Z(84, 42))} m）` },
      { x: saddle.x, y: saddle.y + 4, t: '鞍部' },
      { x: 17, y: 15, t: '山脊（凸向低處）' },
      { x: 92, y: 72, t: '山谷（凸向高處）' },
      { x: 20, y: 40, t: '陡坡（線密）' },
      { x: 108, y: 34, t: '緩坡（線疏）' }
    ];

    body.innerHTML = `
      <div class="w-tabs">
        <span class="w-small-label">等高距</span><button class="chip" data-iv="50">50 公尺</button><button class="chip" data-iv="100">100 公尺</button>
        <label class="w-inline"><input type="checkbox" data-k="color" checked> 分層設色</label>
        <label class="w-inline"><input type="checkbox" data-k="marks" checked> 標示地形</label>
      </div>
      <div class="w-split">
        <div class="w-map w-map-contour"><svg viewBox="0 0 ${NX * C} ${NY * C}" data-k="map"></svg></div>
        <div class="w-side">
          <div class="w-read w-read-lg">把滑鼠移到地圖上</div>
          <div class="w-legend-bar" data-k="legend"></div>
          <p class="w-hint">一格約 25 公尺，整張圖東西寬約 3 公里。</p>
        </div>
      </div>
      <div class="w-profile-title">剖面圖（A → B）</div>
      <svg viewBox="0 0 600 190" class="w-profile" data-k="prof"></svg>`;
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    const svg = $('map'), prof = $('prof'), read = body.querySelector('.w-read');
    const color = d3.scaleLinear().domain([0, 150, 300, 450, 600, 750]).range(['#8cc084', '#c3dc8c', '#efe1a0', '#e0b874', '#bf8a57', '#93603f']);
    const path = d3.geoPath(d3.geoIdentity().scale(C));
    const gFill = el('g', {}, svg), gLine = el('g', {}, svg), gMarks = el('g', {}, svg), gCut = el('g', {}, svg);
    el('rect', { x: 0, y: 0, width: NX * C, height: NY * C, class: 'w-frame' }, svg);
    let iv = 50;
    let A = { x: 6, y: 34 }, B = { x: 114, y: 44 };

    function drawContours() {
      body.querySelectorAll('[data-iv]').forEach((b) => b.classList.toggle('active', +b.dataset.iv === iv));
      gFill.innerHTML = ''; gLine.innerHTML = '';
      const th = d3.range(0, zmax, iv);
      const polys = d3.contours().size([NX, NY]).thresholds(th)(values);
      polys.forEach((p) => {
        el('path', { d: path(p), fill: color(p.value + iv / 2), class: 'w-cfill' }, gFill);
        if (p.value > 0) el('path', { d: path(p), class: 'w-cline' + (p.value % (iv * 4) === 0 ? ' idx' : '') }, gLine);
      });
      gFill.style.display = $('color').checked ? '' : 'none';
      svg.classList.toggle('no-color', !$('color').checked);
      $('legend').innerHTML = `<div class="w-ramp" style="background:linear-gradient(90deg,${[0, 150, 300, 450, 600].map((v) => color(v)).join(',')})"></div><div class="w-ramp-lab"><span>0 m</span><span>300 m</span><span>600 m</span></div><div class="w-small-txt">相鄰兩條等高線相差 <b>${iv} 公尺</b>；粗線每 ${iv * 4} 公尺一條。</div>`;
      drawProfile();
    }
    LAND.forEach((p) => {
      el('text', { x: p.x * C, y: p.y * C, 'text-anchor': 'middle', class: 'w-cmark', text: p.t }, gMarks);
    });

    const handle = (P, name) => {
      const g = el('g', { class: 'w-handle', tabindex: 0 }, gCut);
      el('circle', { r: 11 }, g);
      el('text', { y: 5, 'text-anchor': 'middle', text: name }, g);
      return g;
    };
    const cutLine = el('line', { class: 'w-cut' }, gCut);
    const hA = handle(A, 'A'), hB = handle(B, 'B');
    function placeHandles() {
      cutLine.setAttribute('x1', A.x * C); cutLine.setAttribute('y1', A.y * C);
      cutLine.setAttribute('x2', B.x * C); cutLine.setAttribute('y2', B.y * C);
      hA.setAttribute('transform', `translate(${A.x * C},${A.y * C})`);
      hB.setAttribute('transform', `translate(${B.x * C},${B.y * C})`);
    }
    function drawProfile() {
      placeHandles();
      prof.innerHTML = '';
      const W0 = 50, W1 = 590, H0 = 15, H1 = 160;
      const n = 160, pts = [];
      const len = Math.hypot(B.x - A.x, B.y - A.y) * M_PER;
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([t * len, Z(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t)]); }
      const top = Math.ceil(zmax / 100) * 100;
      const x = d3.scaleLinear().domain([0, Math.max(len, 1)]).range([W0, W1]);
      const y = d3.scaleLinear().domain([0, top]).range([H1, H0]);
      for (let v = 0; v <= top; v += iv) {
        el('line', { x1: W0, x2: W1, y1: y(v), y2: y(v), class: v % (iv * 4) === 0 ? 'w-pgrid idx' : 'w-pgrid' }, prof);
        if (v % (iv * 2) === 0) el('text', { x: W0 - 6, y: y(v) + 4, 'text-anchor': 'end', class: 'w-small', text: v + ' m' }, prof);
      }
      el('path', { d: d3.area().x((d) => x(d[0])).y0(H1).y1((d) => y(d[1]))(pts), class: 'w-parea' }, prof);
      el('path', { d: d3.line().x((d) => x(d[0])).y((d) => y(d[1]))(pts), class: 'w-pline' }, prof);
      el('text', { x: W0, y: 182, 'text-anchor': 'middle', class: 'w-label', text: 'A' }, prof);
      el('text', { x: W1, y: 182, 'text-anchor': 'middle', class: 'w-label', text: 'B' }, prof);
      el('text', { x: (W0 + W1) / 2, y: 182, 'text-anchor': 'middle', class: 'w-small', text: `水平距離約 ${fmtLen(Math.round(len / 10) * 10)}（高度已誇大）` }, prof);
    }
    let drag = null;
    [[hA, A], [hB, B]].forEach(([h, P]) => h.addEventListener('pointerdown', (e) => { drag = P; svg.setPointerCapture(e.pointerId); e.preventDefault(); }));
    svg.addEventListener('pointermove', (e) => {
      const p = svgPoint(svg, e);
      const gx = Math.min(NX - 0.5, Math.max(0.5, p.x / C)), gy = Math.min(NY - 0.5, Math.max(0.5, p.y / C));
      if (drag) { drag.x = gx; drag.y = gy; drawProfile(); }
      const z = Z(gx, gy);
      const gr = Math.hypot(Z(gx + 0.5, gy) - Z(gx - 0.5, gy), Z(gx, gy + 0.5) - Z(gx, gy - 0.5)) / M_PER;
      const lvl = gr > 0.6 ? '<b>陡</b>（等高線很密）' : gr > 0.25 ? '<b>中等</b>' : '<b>緩</b>（等高線稀疏）';
      read.innerHTML = `<b class="h">海拔約 ${Math.round(z)} 公尺</b>坡度：${lvl}<br><span class="w-hint">坡度約 ${Math.round(Math.atan(gr) * 180 / Math.PI)}°</span>`;
    });
    const end = () => { drag = null; };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    body.querySelectorAll('[data-iv]').forEach((b) => b.addEventListener('click', () => { iv = +b.dataset.iv; drawContours(); }));
    $('color').addEventListener('change', drawContours);
    $('marks').addEventListener('change', () => { gMarks.style.display = $('marks').checked ? '' : 'none'; });
    drawContours();
  };

  // =====================================================================
  // 2-4 麥卡托投影：格陵蘭真的那麼大嗎？
  // =====================================================================
  W['true-size'] = function (host) {
    if (!ready() || !window.LAND_TOPO || !window.GREENLAND) return;
    const body = frame(host, '🧊 格陵蘭真的跟非洲一樣大嗎？', '拖曳紅色的格陵蘭，看它在不同緯度的大小');
    const Wd = 800, s = Wd / (2 * Math.PI);
    const yOf = (lat) => s * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
    const top = yOf(82), H = Math.round(top - yOf(-58));
    const proj = d3.geoMercator().scale(s).translate([Wd / 2, top]).clipExtent([[0, 0], [Wd, H]]);
    const path = d3.geoPath(proj);
    body.innerHTML = `
      <div class="w-tabs">
        <button class="chip" data-go="africa">疊到非洲上比一比</button>
        <button class="chip" data-go="equator">移到赤道附近</button>
        <button class="chip" data-go="home">回到原位</button>
      </div>
      <div class="w-map w-map-wide"><svg viewBox="0 0 ${Wd} ${H}"></svg></div>
      <div class="w-read"></div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    el('rect', { x: 0, y: 0, width: Wd, height: H, class: 'w-sea' }, svg);
    el('path', { d: path(d3.geoGraticule().step([30, 30])()), class: 'w-faint' }, svg);
    el('path', { d: path(topojson.feature(LAND_TOPO, LAND_TOPO.objects.land)), class: 'w-land' }, svg);
    el('path', { d: path({ type: 'LineString', coordinates: d3.range(-180, 181, 5).map((x) => [x, 0]) }), class: 'w-eq' }, svg);
    el('path', { d: path(GREENLAND), class: 'w-ghost' }, svg);
    const shape = el('path', { class: 'w-drag-shape' }, svg);
    const c0 = d3.geoCentroid(GREENLAND);
    const r1 = d3.geoRotation([-c0[0], -c0[1]]);
    let center = c0.slice();
    function moved(c1) {
      const r2 = d3.geoRotation([-c1[0], -c1[1]]);
      const map = (c) => (typeof c[0] === 'number' ? r2.invert(r1(c)) : c.map(map));
      return { type: 'Feature', geometry: { type: GREENLAND.geometry.type, coordinates: map(GREENLAND.geometry.coordinates) } };
    }
    function render() {
      const f = moved(center);
      shape.setAttribute('d', path(f));
      const ratio = path.area(f) / path.area(moved([center[0], 0]));
      read.innerHTML = `<b class="h">格陵蘭目前中心：${center[1] >= 0 ? '北緯' : '南緯'} ${Math.abs(center[1]).toFixed(0)}°</b>
        在這張麥卡托地圖上，它看起來是放在赤道時的 <b>${ratio.toFixed(1)} 倍</b>大。<br>
        但它的實際面積永遠約 <b>216 萬平方公里</b>；非洲約 <b>3,000 萬平方公里</b>，是格陵蘭的 <b>14 倍</b>。<br>
        <span class="w-hint">麥卡托投影的地圖<b>愈靠近兩極，面積被放得愈大</b>；虛線是格陵蘭原本的位置。</span>`;
    }
    let drag = null;
    shape.addEventListener('pointerdown', (e) => {
      const p = svgPoint(svg, e);
      drag = { start: proj.invert([p.x, p.y]), c: center.slice() };
      svg.setPointerCapture(e.pointerId); e.preventDefault();
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = svgPoint(svg, e);
      const g = proj.invert([p.x, p.y]);
      center = [drag.c[0] + (g[0] - drag.start[0]), Math.max(-55, Math.min(78, drag.c[1] + (g[1] - drag.start[1])))];
      render();
    });
    const end = () => { drag = null; };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    let anim = null;
    function animateTo(c1) {
      cancelAnimationFrame(anim);
      const from = center.slice(), t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / 900), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        center = [from[0] + (c1[0] - from[0]) * e, from[1] + (c1[1] - from[1]) * e];
        render();
        if (t < 1 && svg.isConnected) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }
    body.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () =>
      animateTo({ africa: [20, 5], equator: [-25, 2], home: c0 }[b.dataset.go])));
    render();
  };

  // =====================================================================
  // 2-5 GIS 圖層疊合
  // =====================================================================
  W['gis-layers'] = function (host) {
    const body = frame(host, '🗂️ GIS 圖層疊合：便利商店要開在哪？', '打開圖層，再按「疊合分析」');
    const NC = 10, NR = 7, S = 50;
    const g2 = (i, j, ci, cj, s) => Math.exp(-((i - ci) ** 2 + (j - cj) ** 2) / (2 * s * s));
    const cells = [];
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
      const pop = Math.round(100 * Math.min(1, g2(i, j, 2, 1.5, 1.8) + 0.95 * g2(i, j, 7.5, 5, 1.7)));
      const road = j === 3 || i === 5;
      const near = !road && (Math.abs(j - 3) === 1 || Math.abs(i - 5) === 1);
      const price = Math.hypot(i - 5, j - 3) <= 2.3;
      cells.push({ i, j, pop, road, near, price, popHigh: pop >= 45 });
    }
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 ${NC * S} ${NR * S}"></svg></div>
        <div class="w-side">
          <div class="w-toggles">
            <label><input type="checkbox" data-l="pop" checked> <i class="w-sw" style="background:#f08c3a"></i>圖層 1：人口密度（愈深愈多）</label>
            <label><input type="checkbox" data-l="road" checked> <i class="w-sw" style="background:#7d8590"></i>圖層 2：道路</label>
            <label><input type="checkbox" data-l="price" checked> <i class="w-sw" style="background:#8e5bd6"></i>圖層 3：地價高的地區</label>
          </div>
          <div class="w-chips"><button class="chip" data-k="run">🔍 疊合分析</button><button class="chip" data-k="clear">清除</button></div>
          <div class="w-read w-read-lg"></div>
        </div>
      </div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    const L = { base: el('g', {}, svg), pop: el('g', {}, svg), road: el('g', {}, svg), price: el('g', {}, svg), res: el('g', {}, svg) };
    cells.forEach((c) => {
      const x = c.i * S, y = c.j * S;
      el('rect', { x, y, width: S, height: S, class: 'w-cell' }, L.base);
      el('rect', { x, y, width: S, height: S, fill: '#f08c3a', 'fill-opacity': (c.pop / 100) * 0.75 }, L.pop);
      if (c.road) el('rect', { x, y, width: S, height: S, fill: '#7d8590', 'fill-opacity': 0.85 }, L.road);
      if (c.price) el('rect', { x: x + 4, y: y + 4, width: S - 8, height: S - 8, class: 'w-price' }, L.price);
    });
    el('line', { x1: 0, x2: NC * S, y1: 3.5 * S, y2: 3.5 * S, class: 'w-road-mid' }, L.road);
    el('line', { x1: 5.5 * S, x2: 5.5 * S, y1: 0, y2: NR * S, class: 'w-road-mid' }, L.road);
    const best = cells.filter((c) => c.popHigh && c.near && !c.price);
    const intro = '<b class="h">選址條件</b>① 人口多（客人多）<br>② 緊鄰道路（交通方便）<br>③ 地價不高（租金便宜）<br><span class="w-hint">把三個圖層疊在一起，同時符合三個條件的格子就是好地點。</span>';
    function apply() { body.querySelectorAll('[data-l]').forEach((cb) => { L[cb.dataset.l].style.display = cb.checked ? '' : 'none'; }); }
    body.querySelectorAll('[data-l]').forEach((cb) => cb.addEventListener('change', apply));
    body.querySelector('[data-k="run"]').addEventListener('click', () => {
      L.res.innerHTML = '';
      cells.forEach((c) => { if (!best.includes(c)) el('rect', { x: c.i * S, y: c.j * S, width: S, height: S, class: 'w-dim' }, L.res); });
      best.forEach((c) => {
        el('rect', { x: c.i * S + 2, y: c.j * S + 2, width: S - 4, height: S - 4, class: 'w-best' }, L.res);
        el('text', { x: c.i * S + S / 2, y: c.j * S + S / 2 + 8, 'text-anchor': 'middle', class: 'w-star', text: '★' }, L.res);
      });
      read.innerHTML = `<b class="h">找到 ${best.length} 個好地點（★）</b>同時符合「人口多、緊鄰道路、地價不高」。<br><span class="w-hint">這就是 GIS 的<b>圖層疊合分析</b>：把不同主題的地圖疊在一起找答案。</span>`;
    });
    body.querySelector('[data-k="clear"]').addEventListener('click', () => { L.res.innerHTML = ''; read.innerHTML = intro; });
    read.innerHTML = intro;
    apply();
  };

  // =====================================================================
  // 2-5 GPS / RS / GIS 分類練習
  // =====================================================================
  W['tech-sort'] = function (host) {
    const body = frame(host, '🛰️ 這是哪一種技術？', '判斷每個情境運用的是 GPS、RS 還是 GIS');
    const ITEMS = [
      ['手機地圖上顯示「你在這裡」的藍色圓點', 'GPS', '接收衛星訊號算出自己的位置 → 定位。'],
      ['登山客迷路時，回報自己所在的經緯度', 'GPS', '求出所在位置的經緯度 → 定位。'],
      ['公車動態 APP 顯示公車現在開到哪裡', 'GPS', '公車上的接收器持續定位，回傳位置。'],
      ['共享單車 APP 顯示附近空車的位置', 'GPS', '車上裝有定位裝置。'],
      ['氣象署發布的衛星雲圖', 'RS', '人造衛星從太空拍攝雲層 → 遙感探測。'],
      ['用衛星影像找出颱風後的山崩、土石流地點', 'RS', '從遠處拍攝地表影像來監測災害。'],
      ['用無人機空拍檢查農作物的生長情形', 'RS', '從空中遠距離拍攝、感測地表。'],
      ['比較 30 年前和現在的空照圖，看都市擴張', 'RS', '空照圖是遙感探測的成果。'],
      ['疊合人口、交通、地價圖層，找出開店地點', 'GIS', '多個圖層疊合分析 → 地理資訊系統。'],
      ['把淹水潛勢圖和避難所位置疊在一起，規劃避難路線', 'GIS', '疊合不同主題的資料做分析。'],
      ['分析各區學童人數與學校分布，規劃新學校位置', 'GIS', '用電腦整合、分析空間資料。']
    ];
    let list, right, done;
    function render() {
      list = shuffle(ITEMS); right = 0; done = 0;
      body.innerHTML = `
        <div class="score-line"><span>答對 <b data-k="r">0</b> / <span data-k="d">0</span>（共 ${list.length} 題）</span><button class="chip" data-k="again">重新出題</button></div>
        <div class="w-sort">${list.map(([t], i) => `
          <div class="w-sort-row" data-i="${i}">
            <div class="w-sort-q">${t}</div>
            <div class="w-sort-btns">${['GPS', 'RS', 'GIS'].map((k) => `<button class="chip" data-a="${k}">${k}</button>`).join('')}</div>
            <div class="w-sort-ex"></div>
          </div>`).join('')}</div>
        <p class="w-hint">GPS 全球定位系統｜RS 遙感探測｜GIS 地理資訊系統</p>`;
      body.querySelector('[data-k="again"]').addEventListener('click', render);
      body.querySelectorAll('.w-sort-row').forEach((row) => {
        const [, ans, why] = list[+row.dataset.i];
        row.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
          if (row.classList.contains('done')) return;
          row.classList.add('done');
          const ok = b.dataset.a === ans;
          done++; if (ok) right++;
          row.querySelectorAll('[data-a]').forEach((x) => { x.disabled = true; if (x.dataset.a === ans) x.classList.add('ok'); else if (x === b) x.classList.add('bad'); });
          row.querySelector('.w-sort-ex').innerHTML = `<span class="${ok ? 'w-ok' : 'w-bad'}">${ok ? '✔' : '✘ 答案是 ' + ans}</span> ${why}`;
          body.querySelector('[data-k="r"]').textContent = right;
          body.querySelector('[data-k="d"]').textContent = done;
        }));
      });
    }
    render();
  };
})();
