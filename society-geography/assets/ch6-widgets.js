// 第六章互動圖（水資源）
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U || !U.makeSorter) return;
  const { el, frame, mercator, ready } = U;

  // =====================================================================
  // 6-1 水循環
  // =====================================================================
  W['water-cycle'] = function (host) {
    const body = frame(host, '💧 水循環', '點選各個步驟，或按「依序播放」');
    const S = [
      ['evap', '蒸發', '太陽加熱，海洋、湖泊的水變成<b>水氣</b>上升到空中。'],
      ['trans', '蒸散', '植物把吸收的水分從葉片散發到空氣中。'],
      ['cond', '凝結', '水氣上升後遇冷，<b>凝結</b>成小水滴，聚集成雲。'],
      ['rain', '降水', '雲中的水滴變大變重，以雨、雪等形式<b>降落</b>到地面。臺灣的水資源主要來自降水。'],
      ['run', '地表逕流', '雨水沿著地表流動，匯集成<b>河川、湖泊</b>，最後流回海洋。'],
      ['inf', '入滲', '部分雨水<b>滲入地下</b>，儲存在岩層與土壤的孔隙中。'],
      ['gw', '地下水流', '<b>地下水</b>在地底慢慢流動，最後也流回海洋。']
    ];
    body.innerHTML = `
      <div class="w-tabs">${S.map(([k, n]) => `<button class="chip" data-s="${k}">${n}</button>`).join('')}<span class="w-tab-sep"></span><button class="chip" data-k="play">▶ 依序播放</button></div>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 640 340"></svg></div>
        <div class="w-side"><div class="w-read w-read-lg"></div></div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    svg.innerHTML = `
      <rect width="640" height="340" class="w-sky"/>
      <circle cx="70" cy="55" r="30" class="w-sun"/>
      <path d="M0,250 L250,250 L250,340 L0,340 Z" class="w-water"/>
      <path d="M250,250 C300,240 340,200 400,130 C430,100 460,95 490,120 C540,160 600,140 640,120 L640,340 L250,340 Z" class="w-land"/>
      <path d="M250,300 L640,300 L640,340 L250,340 Z" class="w-aquifer"/>
      <path d="M470,125 C440,170 400,210 330,240 C300,250 270,250 250,252" class="w-river"/>
      <text x="40" y="300" class="w-label-sea">海洋</text><text x="560" y="325" class="w-small">地下水層</text>
      <g transform="translate(560,160)"><rect x="-3" y="0" width="6" height="22" class="w-trunk"/><circle cx="0" cy="-6" r="16" class="w-tree"/></g>
      <g transform="translate(320,60)"><ellipse rx="60" ry="24" class="w-cloud"/><ellipse cx="-36" cy="8" rx="34" ry="18" class="w-cloud"/><ellipse cx="38" cy="8" rx="36" ry="18" class="w-cloud"/></g>`;
    const G = {};
    const add = (k, d, lx, ly, label) => {
      G[k] = el('g', { class: 'w-step', 'data-s': k }, svg);
      el('path', { d, class: 'w-step-path' }, G[k]);
      el('text', { x: lx, y: ly, 'text-anchor': 'middle', class: 'w-step-label', text: label }, G[k]);
      G[k].addEventListener('click', () => show(k));
    };
    add('evap', 'M110,245 C110,190 150,140 230,90', 150, 180, '蒸發 ↑');
    add('trans', 'M560,135 C560,110 520,90 400,70', 520, 105, '蒸散 ↑');
    add('cond', 'M240,70 C260,62 280,60 300,60', 270, 40, '凝結');
    add('rain', 'M380,95 L410,150 M420,95 L450,150 M460,95 L490,150', 470, 90, '降水 ↓');
    add('run', 'M470,130 C440,170 400,210 330,240 C300,250 270,250 250,252', 360, 200, '地表逕流');
    add('inf', 'M520,160 L520,295 M580,170 L580,295', 545, 250, '入滲 ↓');
    add('gw', 'M620,318 L270,318', 420, 312, '← 地下水流');
    function show(k) {
      const s = S.find((x) => x[0] === k);
      Object.entries(G).forEach(([key, g]) => g.classList.toggle('on', key === k));
      body.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('active', b.dataset.s === k && b.tagName === 'BUTTON'));
      read.innerHTML = `<b class="h">${s[1]}</b>${s[2]}`;
    }
    let timer = null;
    body.querySelectorAll('button[data-s]').forEach((b) => b.addEventListener('click', () => { clearInterval(timer); show(b.dataset.s); }));
    body.querySelector('[data-k="play"]').addEventListener('click', () => {
      clearInterval(timer);
      const order = ['evap', 'trans', 'cond', 'rain', 'run', 'inf', 'gw'];
      let i = 0; show(order[0]);
      timer = setInterval(() => { if (!svg.isConnected || ++i >= order.length) return clearInterval(timer); show(order[i]); }, 1800);
    });
    read.innerHTML = '<b class="h">提示</b>水在海洋、天空、陸地之間不斷循環。點選圖上的步驟或上方按鈕。';
  };

  // =====================================================================
  // 6-2 河川流量的季節變化
  // =====================================================================
  W['river-season'] = function (host) {
    const body = frame(host, '🏞️ 豐水期與枯水期', '拖曳月份，看南部河川的水位變化（示意）');
    const LV = [0.12, 0.1, 0.12, 0.2, 0.45, 0.8, 0.85, 0.95, 0.7, 0.3, 0.15, 0.12]; // 相對水位（示意）
    body.innerHTML = `
      <label class="w-slider">月份 <input type="range" min="1" max="12" value="8"><output></output></label>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 520 260"></svg></div>
        <div class="w-side"><div class="w-mini-bars"></div><div class="w-read w-read-lg"></div></div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read'), input = body.querySelector('input');
    el('rect', { width: 520, height: 260, class: 'w-sky' }, svg);
    const bed = 'M0,60 L60,70 C120,90 150,210 260,215 C370,210 400,90 460,70 L520,60 L520,260 L0,260 Z';
    const water = el('path', { class: 'w-water' }, svg);
    el('path', { d: bed, class: 'w-land' }, svg);
    const gravel = el('g', {}, svg);
    for (let i = 0; i < 14; i++) el('ellipse', { cx: 175 + i * 13, cy: 206 + (i % 3) * 3, rx: 6, ry: 3.5, class: 'w-gravel' }, gravel);
    const lvl = el('text', { x: 500, 'text-anchor': 'end', class: 'w-small' }, svg);
    body.querySelector('.w-mini-bars').innerHTML = LV.map((v, i) => `<span style="height:${Math.round(v * 60) + 4}px" title="${i + 1}月"></span>`).join('');
    function render() {
      const mo = +input.value, v = LV[mo - 1];
      body.querySelector('output').textContent = mo + ' 月';
      body.querySelectorAll('.w-mini-bars span').forEach((s, i) => s.classList.toggle('on', i === mo - 1));
      const y = 212 - v * 150;
      water.setAttribute('d', `M0,${y} L520,${y} L520,260 L0,260 Z`);
      lvl.setAttribute('y', y - 6); lvl.textContent = '水位';
      gravel.style.display = v < 0.2 ? '' : 'none';
      const wet = mo >= 5 && mo <= 10;
      read.innerHTML = wet
        ? `<b class="h">${mo} 月：豐水期</b>梅雨、颱風帶來大量雨水，河水暴漲、流速快${v > 0.75 ? '，<b class="w-bad">容易氾濫成災</b>' : ''}。<br><span class="w-hint">但雨水很快流入海洋，不容易留住。</span>`
        : `<b class="h">${mo} 月：枯水期</b>雨量少，河川流量小，部分河段<b>河床裸露</b>甚至乾涸。<br><span class="w-hint">南部冬季位於東北季風背風側，枯水期特別明顯。</span>`;
    }
    input.addEventListener('input', render);
    render();
  };

  // =====================================================================
  // 6-3 主要河川與水庫
  // =====================================================================
  W['rivers-map'] = function (host) {
    if (!ready() || !window.TW_TOPO) return;
    const body = frame(host, '🗺️ 臺灣的主要河川與水庫', '點選河川或水庫看說明（河道為示意）');
    const m = mercator([119.55, 21.85, 122.1, 25.35], 430, 12);
    const RIV = [
      { n: '濁水溪', pts: [[121.27, 24.12], [121.1, 23.86], [120.85, 23.8], [120.6, 23.82], [120.23, 23.85]], d: '臺灣<b>最長</b>的河川（約 187 公里），含沙量高、河水混濁；是彰化縣與雲林縣的界河，下游形成濁水溪沖積扇。' },
      { n: '高屏溪', pts: [[120.95, 23.42], [120.75, 23.0], [120.56, 22.75], [120.43, 22.48]], d: '<b>流域面積最大</b>的河川，高雄、屏東的重要水源。' },
      { n: '淡水河', pts: [[121.3, 24.6], [121.35, 24.85], [121.45, 25.0], [121.48, 25.08], [121.41, 25.18]], d: '流經臺北盆地，主要支流有<b>大漢溪、新店溪、基隆河</b>；北部全年有雨，流量較穩定，早期有航運之利。（圖中上游段為大漢溪）' },
      { n: '新店溪', pts: [[121.66, 24.85], [121.55, 24.95], [121.48, 25.03]], d: '淡水河支流，上游有<b>翡翠水庫</b>，供應大臺北用水。', sub: true },
      { n: '基隆河', pts: [[121.82, 25.03], [121.68, 25.07], [121.58, 25.08], [121.47, 25.1]], d: '淡水河支流，流經基隆、汐止與臺北市。', sub: true },
      { n: '大甲溪', pts: [[121.3, 24.36], [121.0, 24.25], [120.75, 24.3], [120.57, 24.34]], d: '上游坡陡，建有多座水壩發展<b>水力發電</b>（如德基水庫）。' },
      { n: '曾文溪', pts: [[120.78, 23.42], [120.53, 23.22], [120.3, 23.1], [120.08, 23.05]], d: '上游有<b>曾文水庫</b>，灌溉嘉南平原。' },
      { n: '蘭陽溪', pts: [[121.4, 24.45], [121.6, 24.6], [121.84, 24.72]], d: '沖積出三角形的<b>蘭陽平原</b>。' },
      { n: '立霧溪', pts: [[121.35, 24.17], [121.52, 24.18], [121.63, 24.13]], d: '強烈下切侵蝕大理岩，形成<b>太魯閣峽谷</b>。' },
      { n: '秀姑巒溪', pts: [[121.22, 23.1], [121.33, 23.35], [121.42, 23.5], [121.5, 23.47]], d: '東部唯一<b>切穿海岸山脈</b>的河川，以<b>泛舟</b>聞名。' },
      { n: '卑南溪', pts: [[121.05, 23.2], [121.13, 22.95], [121.16, 22.77]], d: '流經臺東縱谷南段，在臺東市附近入海。' }
    ];
    const RES = [
      ['翡翠水庫', 121.58, 24.9, '位於新店溪上游，供應<b>大臺北</b>民生用水。'], ['石門水庫', 121.24, 24.81, '位於大漢溪上游，供應桃園地區用水。'],
      ['德基水庫', 121.17, 24.25, '位於大甲溪上游，以<b>水力發電</b>為主。'], ['日月潭', 120.91, 23.86, '臺灣最大的<b>天然湖泊</b>，曾引濁水溪水加高水位用於發電。'],
      ['曾文水庫', 120.53, 23.25, '臺灣<b>容量最大</b>的水庫，供應嘉南地區灌溉與民生用水。']
    ];
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map w-map-xs"><svg viewBox="0 0 ${m.width} ${m.height}"></svg></div>
        <div class="w-side">
          <div class="w-chips">${RIV.map((r, i) => `<button class="chip" data-r="${i}">${r.n}</button>`).join('')}</div>
          <label class="w-inline"><input type="checkbox" data-k="div" checked> 中央山脈分水嶺</label>
          <div class="w-read w-read-lg"></div>
        </div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    el('rect', { width: m.width, height: m.height, class: 'w-sea' }, svg);
    U.counties().forEach((f) => el('path', { d: m.path(f), class: 'w-county' }, svg));
    const divide = el('path', { d: U.curve([[121.8, 24.58], [121.45, 24.3], [121.27, 23.95], [121.12, 23.5], [120.95, 23.0], [120.85, 22.5], [120.82, 22.0]], m), class: 'w-divide' }, svg);
    const lines = RIV.map((r, i) => {
      const n = el('path', { d: U.curve(r.pts, m), class: 'w-riv' + (r.sub ? ' sub' : '') }, svg);
      const hit = el('path', { d: U.curve(r.pts, m), class: 'w-riv-hit' }, svg);
      hit.addEventListener('click', () => pick(i));
      const [x, y] = m.proj(...r.pts[r.pts.length - 1]);
      const west = r.pts[r.pts.length - 1][0] < 121.2;
      el('text', { x: x + (west ? -6 : 6), y: y + 4, 'text-anchor': west ? 'end' : 'start', class: 'w-pin-label', text: r.n }, svg);
      return n;
    });
    RES.forEach(([n, lon, lat, d]) => {
      const [x, y] = m.proj(lon, lat);
      const g = el('g', { class: 'w-pin', tabindex: 0 }, svg);
      el('rect', { x: x - 5, y: y - 5, width: 10, height: 10, rx: 2, class: 'w-res' }, g);
      el('text', { x: x + 8, y: y - 6, class: 'w-small', text: n }, g);
      g.addEventListener('click', () => { pick(null); read.innerHTML = `<b class="h">💧 ${n}</b>${d}`; });
    });
    function pick(i) {
      lines.forEach((n, j) => { n.classList.toggle('on', j === i); n.classList.toggle('dim', i != null && j !== i); });
      body.querySelectorAll('[data-r]').forEach((b) => b.classList.toggle('active', +b.dataset.r === i));
      if (i != null) read.innerHTML = `<b class="h">${RIV[i].n}</b>${RIV[i].d}`;
    }
    body.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => pick(+b.dataset.r)));
    body.querySelector('[data-k="div"]').addEventListener('change', (e) => { divide.style.display = e.target.checked ? '' : 'none'; });
    read.innerHTML = '<b class="h">提示</b>中央山脈是主要<b>分水嶺</b>，河川大多由中央山地向東、西兩側流入海洋，所以<b>河短流急</b>。<br><span class="w-hint">藍色方塊是水庫／湖泊。</span>';
  };

  // =====================================================================
  // 6-4 河川地形：上游到河口
  // =====================================================================
  W['river-landforms'] = function (host) {
    const body = frame(host, '⛰️➡️🌊 河川從上游到河口', '點選河段，看不同位置的作用與地形');
    const Z = [
      { k: 'up', n: '上游', x0: 0, x1: 190, act: '坡陡流急，以<b>下切侵蝕</b>為主', land: '<b>V 形谷</b>、<b>峽谷</b>（如太魯閣）、瀑布',
        fig: `<path d="M10,10 L90,110 L170,10" class="w-land-stroke"/><path d="M80,100 L100,100 L90,112 Z" class="w-water"/><text x="90" y="60" text-anchor="middle" class="w-small">V 形谷（橫剖面）</text>` },
      { k: 'mid', n: '中游', x0: 190, x1: 420, act: '坡度變緩，<b>側蝕</b>與搬運作用', land: '<b>曲流</b>；地殼抬升後河川再下切，形成階梯狀的<b>河階</b>',
        fig: `<path d="M10,60 C40,10 70,10 90,60 S140,110 170,60" class="w-river"/><text x="90" y="110" text-anchor="middle" class="w-small">曲流（俯視）</text>` },
      { k: 'fan', n: '出山口', x0: 420, x1: 560, act: '坡度突然變緩、流速變慢，泥沙<b>堆積</b>', land: '扇形的<b>沖積扇</b>（如濁水溪沖積扇）',
        fig: `<path d="M90,15 L20,105 C60,118 120,118 160,105 Z" class="w-fan"/><path d="M90,5 L90,20" class="w-river"/><path d="M90,20 L50,100 M90,20 L90,108 M90,20 L130,100" class="w-river thin"/><text x="90" y="80" text-anchor="middle" class="w-small">沖積扇（俯視）</text>` },
      { k: 'mouth', n: '河口', x0: 560, x1: 760, act: '流速最慢，泥沙大量<b>堆積</b>', land: '<b>三角洲</b>、沖積平原',
        fig: `<rect x="0" y="70" width="180" height="50" class="w-water"/><path d="M60,0 L60,70 L20,110 L160,110 L120,70 L120,0 Z" class="w-fan"/><path d="M90,0 L90,70 M90,70 L55,105 M90,70 L90,110 M90,70 L125,105" class="w-river thin"/><text x="90" y="40" text-anchor="middle" class="w-small">三角洲（俯視）</text>` }
    ];
    body.innerHTML = `
      <div class="w-tabs">${Z.map((z) => `<button class="chip" data-z="${z.k}">${z.n}</button>`).join('')}</div>
      <div class="w-map w-map-wide"><svg viewBox="0 0 760 240" data-k="main"></svg></div>
      <div class="w-split"><div class="w-fig-box"><svg viewBox="0 0 180 120" data-k="fig"></svg></div><div class="w-side"><div class="w-read w-read-lg"></div></div></div>`;
    const svg = body.querySelector('[data-k="main"]'), fig = body.querySelector('[data-k="fig"]'), read = body.querySelector('.w-read');
    const prof = [[0, 30], [80, 50], [190, 110], [300, 150], [420, 175], [560, 195], [690, 205], [760, 206]];
    el('rect', { width: 760, height: 240, class: 'w-sky' }, svg);
    el('rect', { x: 690, y: 200, width: 70, height: 40, class: 'w-water' }, svg);
    el('path', { d: d3.area().curve(d3.curveMonotoneX).x((p) => p[0]).y0(240).y1((p) => p[1] + 12)(prof.slice(0, 7)), class: 'w-land' }, svg);
    const riverD = d3.line().curve(d3.curveMonotoneX).x((p) => p[0]).y((p) => p[1] + 10)(prof.slice(0, 7));
    el('path', { d: riverD, class: 'w-river' }, svg);
    el('path', { d: riverD, class: 'w-river-flow' }, svg);
    el('text', { x: 725, y: 228, 'text-anchor': 'middle', class: 'w-label-sea', text: '海' }, svg);
    const zones = Z.map((z) => {
      const g = el('g', { class: 'w-zone2', tabindex: 0 }, svg);
      el('rect', { x: z.x0, y: 0, width: z.x1 - z.x0, height: 240 }, g);
      el('text', { x: (z.x0 + z.x1) / 2, y: 22, 'text-anchor': 'middle', class: 'w-label', text: z.n }, g);
      g.addEventListener('click', () => show(z.k));
      return g;
    });
    el('text', { x: 20, y: 228, class: 'w-small', text: '坡陡流急 → 侵蝕' }, svg);
    el('text', { x: 560, y: 160, class: 'w-small', text: '流速變慢 → 堆積' }, svg);
    function show(k) {
      const z = Z.find((o) => o.k === k);
      zones.forEach((g, i) => g.classList.toggle('on', Z[i].k === k));
      body.querySelectorAll('[data-z]').forEach((b) => b.classList.toggle('active', b.dataset.z === k));
      fig.innerHTML = `<rect width="180" height="120" class="w-sky"/>${z.fig}`;
      read.innerHTML = `<b class="h">${z.n}</b>作用：${z.act}<br>地形：${z.land}`;
    }
    body.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => show(b.dataset.z)));
    show('up');
  };

  // =====================================================================
  // 6-5 超抽地下水
  // =====================================================================
  W['groundwater'] = function (host) {
    const body = frame(host, '🚰 超抽地下水會怎樣？', '拖曳抽水量，看地下水位、地層與海水的變化（示意）');
    body.innerHTML = `
      <label class="w-slider">抽水量 <input type="range" min="0" max="100" value="0"><output></output></label>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 600 300"></svg></div>
        <div class="w-side"><div class="w-read w-read-lg"></div></div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read'), input = body.querySelector('input');
    el('rect', { width: 600, height: 300, class: 'w-sky' }, svg);
    const sea = el('rect', { x: 470, width: 130, height: 300, class: 'w-water' }, svg);
    const ground = el('path', { class: 'w-land' }, svg);
    const aquifer = el('path', { class: 'w-aquifer' }, svg);
    const salt = el('path', { class: 'w-salt' }, svg);
    const table = el('path', { class: 'w-table' }, svg);
    const things = el('g', {}, svg);
    const flood = el('rect', { x: 0, height: 0, class: 'w-flood' }, svg);
    el('text', { x: 535, y: 120, 'text-anchor': 'middle', class: 'w-label-sea', text: '海' }, svg);
    const tTable = el('text', { x: 20, class: 'w-small', text: '地下水位' }, svg);
    function render() {
      const p = +input.value / 100;
      body.querySelector('output').textContent = p < 0.34 ? '適量' : p < 0.67 ? '偏多' : '超抽！';
      const sink = p * 28, sY = 120 + sink;
      sea.setAttribute('y', 128);
      ground.setAttribute('d', `M0,${sY} L470,${sY} L470,300 L0,300 Z`);
      aquifer.setAttribute('d', `M0,${200 + sink * 0.6} L470,${200 + sink * 0.6} L470,${260} L0,260 Z`);
      const wt = 160 + p * 70; // 地下水位
      table.setAttribute('d', `M0,${wt - 10} C120,${wt - 8} 160,${wt + p * 40} 200,${wt + p * 50} C240,${wt + p * 40} 300,${wt - 6} 470,${150}`);
      tTable.setAttribute('y', wt - 16);
      const reach = 470 - p * 300; // 海水入侵到哪
      salt.setAttribute('d', `M470,180 L470,260 L${reach},260 C${reach + 60},240 ${(reach + 470) / 2},200 470,180 Z`);
      things.innerHTML = '';
      el('rect', { x: 196, y: sY - 70, width: 8, height: 160 + sink, class: 'w-well' }, things);
      el('text', { x: 200, y: sY - 76, 'text-anchor': 'middle', class: 'w-small', text: '抽水井' }, things);
      [[60, '🏠'], [300, '🏠'], [390, '🐟']].forEach(([x, ic]) => el('text', { x, y: sY - 4, 'text-anchor': 'middle', class: 'w-icon', text: ic }, things));
      const fl = sY > 128 ? sY - 128 : 0;
      flood.setAttribute('y', 128); flood.setAttribute('height', fl); flood.setAttribute('width', p > 0.7 ? 470 : 0);
      read.innerHTML = p < 0.34
        ? '<b class="h">適量抽水</b>抽水量和雨水補注差不多，地下水位穩定。'
        : `<b class="h">${p < 0.67 ? '抽水偏多' : '長期超抽地下水'}</b>
           ① 地下水位<b>下降</b>，在井的周圍形成漏斗狀。<br>
           ② 土層失去水分被壓縮 → <b>地層下陷</b>${p > 0.7 ? '，地面低於海平面，<b class="w-bad">下雨、漲潮就淹水</b>' : ''}。<br>
           ③ 海水往陸地<b>入侵</b> → 地下水變鹹、土地<b>鹽化</b>。<br>
           <span class="w-hint">西南沿海（屏東林邊、佳冬，雲林、彰化）就曾因養殖超抽而嚴重下陷。</span>`;
    }
    input.addEventListener('input', render);
    render();
  };

  // =====================================================================
  // 6-6 開源還是節流？
  // =====================================================================
  W['water-sort'] = (host) => U.makeSorter(host, {
    title: '🚿 開源還是節流？', desc: '判斷每個做法是增加水源，還是減少用水',
    cats: ['開源', '節流'],
    hint: '開源＝增加可用的水；節流＝減少浪費、節約用水。',
    items: [
      ['興建水庫、攔河堰', '開源', '把雨水留下來，增加水源。'], ['澎湖、金門興建海水淡化廠', '開源', '把海水變成淡水。'],
      ['學校設置雨水貯留系統', '開源', '收集雨水再利用。'], ['汙水處理後做成再生水供工廠使用', '開源', '增加可利用的水。'],
      ['缺水時從水量多的地區調度用水', '開源', '跨區調度增加缺水區的水源。'], ['選購有省水標章的馬桶', '節流', '同樣使用，用水更少。'],
      ['用洗米水澆花', '節流', '一水多用，減少用水。'], ['修理漏水的自來水管線', '節流', '減少水的浪費。'],
      ['農田改用滴灌', '節流', '精準給水，減少灌溉用水。'], ['縮短淋浴時間', '節流', '家庭節約用水。']
    ]
  });
})();
