// 第四章互動圖（海岸與島嶼）
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U || !U.makeSorter) return;
  const { el, frame, mercator, ready } = U;

  const COAST = {
    cape: { n: '岬灣海岸', where: '北部（淡水河口～三貂角）', col: '#8e5bd6',
      why: '岩層<b>軟硬相間</b>，受海浪<b>差異侵蝕</b>：硬岩突出成岬角、軟岩凹入成海灣。',
      feat: '海岸曲折，多海蝕地形：野柳女王頭（蕈狀岩）、和平島豆腐岩、海蝕平臺、海蝕洞。',
      svg: `<svg viewBox="0 0 260 130"><rect width="260" height="130" class="w-water"/>
        <path d="M0,130 L0,70 C20,70 25,30 45,30 C65,30 70,85 95,85 C120,85 120,25 145,25 C170,25 175,80 200,80 C225,80 230,40 260,40 L260,130 Z" class="w-land"/>
        <text x="45" y="22" text-anchor="middle" class="w-small">岬角</text><text x="95" y="78" text-anchor="middle" class="w-small">海灣</text>
        <text x="145" y="18" text-anchor="middle" class="w-small">岬角</text><text x="200" y="73" text-anchor="middle" class="w-small">海灣</text>
        <text x="130" y="118" text-anchor="middle" class="w-small">硬岩突出、軟岩凹入</text></svg>` },
    sand: { n: '沙岸', where: '西部（淡水河口～屏東枋寮），以及蘭陽平原沿岸', col: '#d4a017',
      why: '河川帶來大量泥沙，海岸坡度平緩，以<b>堆積</b>作用為主。',
      feat: '海岸平直，多沙灘、<b>沙洲</b>、<b>潟湖</b>、潮間帶：外傘頂洲、七股潟湖、大鵬灣。天然良港少，多人工港。',
      svg: `<svg viewBox="0 0 260 130"><rect width="260" height="130" class="w-water"/>
        <rect x="0" y="85" width="260" height="45" class="w-land"/>
        <path d="M30,45 C80,38 180,38 230,48 L228,54 C180,46 80,46 32,52 Z" class="w-sandbar"/>
        <rect x="40" y="56" width="180" height="27" rx="6" class="w-lagoon"/>
        <text x="130" y="35" text-anchor="middle" class="w-small">沙洲</text><text x="130" y="74" text-anchor="middle" class="w-small">潟湖</text>
        <text x="130" y="112" text-anchor="middle" class="w-small">海岸平直、坡度平緩</text></svg>` },
    fault: { n: '斷層海岸', where: '東部（蘇澳～屏東旭海一帶）', col: '#0a6fc2',
      why: '<b>斷層</b>作用使山地直接面臨深海。',
      feat: '海岸<b>平直、陡峭</b>，海岸平原狹窄，天然良港少；代表景觀為<b>清水斷崖</b>，也有<b>海階</b>。',
      svg: `<svg viewBox="0 0 260 130"><rect width="260" height="130" class="w-sky"/>
        <path d="M0,130 L0,20 L110,15 L120,130 Z" class="w-land"/><rect x="118" y="60" width="142" height="70" class="w-water"/>
        <text x="55" y="70" text-anchor="middle" class="w-small">山地</text><text x="190" y="100" text-anchor="middle" class="w-small">深海</text>
        <text x="150" y="45" class="w-small">← 斷崖</text></svg>` },
    coral: { n: '珊瑚礁海岸', where: '南部恆春半島（墾丁一帶）', col: '#e8608a',
      why: '熱帶溫暖、清澈的淺海中，<b>珊瑚</b>生長堆積，後來隨地殼抬升出露。',
      feat: '<b>裙礁</b>（緊貼海岸生長）與<b>隆起珊瑚礁</b>；劃設<b>墾丁國家公園</b>保護。',
      svg: `<svg viewBox="0 0 260 130"><rect width="260" height="130" class="w-sky"/>
        <rect x="0" y="70" width="260" height="60" class="w-water"/>
        <path d="M0,130 L0,55 L80,58 L90,70 L170,78 L175,130 Z" class="w-land"/>
        <path d="M88,70 L170,77 L172,90 L92,84 Z" class="w-reef"/>
        <text x="40" y="48" text-anchor="middle" class="w-small">陸地</text><text x="130" y="105" text-anchor="middle" class="w-small">裙礁（珊瑚礁）</text>
        <text x="220" y="100" text-anchor="middle" class="w-small">淺海</text></svg>` }
  };

  // =====================================================================
  // 4-1 四種海岸分布
  // =====================================================================
  W['coast-map'] = function (host) {
    if (!ready() || !window.TW_TOPO) return;
    const body = frame(host, '🏖️ 臺灣的四種海岸', '點選右方按鈕或海岸線；圓點是代表地形');
    const m = mercator([119.5, 21.85, 122.1, 25.35], 420, 12);
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map w-map-xs"><svg viewBox="0 0 ${m.width} ${m.height}"></svg></div>
        <div class="w-side">
          <div class="w-legend">${Object.entries(COAST).map(([k, c]) => `<button class="w-leg" data-c="${k}"><i class="w-sw" style="background:${c.col}"></i>${c.n}<b>${c.where.split('（')[0]}</b></button>`).join('')}</div>
          <div class="w-coast-fig"></div>
          <div class="w-read"></div>
        </div>
      </div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read'), fig = body.querySelector('.w-coast-fig');
    el('rect', { x: 0, y: 0, width: m.width, height: m.height, class: 'w-sea' }, svg);
    U.counties().forEach((f) => el('path', { d: m.path(f), class: 'w-county' }, svg));
    // 取本島最大的環，依位置分類海岸
    const nation = topojson.feature(TW_TOPO, TW_TOPO.objects.nation);
    const geoms = nation.features ? nation.features.map((f) => f.geometry) : [nation.geometry];
    const polys = geoms.flatMap((g) => (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]));
    const ring = polys.map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
    const kind = ([lon, lat]) => {
      if (lat < 22.3) return 'coral';
      if (lat >= 24.98 && lon >= 121.4) return 'cape';
      const east = lon > 120.65 + (lat - 22.5) * 0.28;
      if (east && lat >= 24.6) return 'sand';
      return east ? 'fault' : 'sand';
    };
    const segs = [];
    let cur = null;
    ring.forEach((p) => {
      const k = kind(p);
      if (!cur || cur.k !== k) { if (cur) cur.pts.push(p); cur = { k, pts: cur ? [cur.pts[cur.pts.length - 1]] : [] }; segs.push(cur); }
      cur.pts.push(p);
    });
    const lines = segs.map((s) => {
      const n = el('path', { d: m.line(s.pts), class: 'w-coastline', stroke: COAST[s.k].col, 'data-c': s.k }, svg);
      n.addEventListener('click', () => pick(s.k));
      return n;
    });
    const PTS = [
      ['野柳', 121.69, 25.21, 'cape', '女王頭等蕈狀岩，海蝕地形的代表。'], ['和平島', 121.76, 25.16, 'cape', '豆腐岩、海蝕平臺。'],
      ['外傘頂洲', 120.12, 23.48, 'sand', '雲嘉外海的大沙洲，因泥沙減少逐漸縮小、南移。'], ['七股潟湖', 120.08, 23.12, 'sand', '臺南的潟湖，發展牡蠣養殖。'],
      ['大鵬灣', 120.46, 22.44, 'sand', '屏東的潟湖。'], ['清水斷崖', 121.66, 24.2, 'fault', '山壁直落太平洋，斷層海岸的代表。'],
      ['墾丁', 120.8, 21.95, 'coral', '裙礁與隆起珊瑚礁，劃設國家公園保護。']
    ];
    const pins = PTS.map(([n, lon, lat, k, d]) => {
      const [x, y] = m.proj(lon, lat);
      const g = el('g', { class: 'w-pin', tabindex: 0 }, svg);
      el('circle', { cx: x, cy: y, r: 5.5, fill: COAST[k].col }, g);
      el('text', { x: x + (lon < 121 ? -8 : 8), y: y + 4, 'text-anchor': lon < 121 ? 'end' : 'start', class: 'w-pin-label', text: n }, g);
      g.addEventListener('click', () => { pick(k); read.innerHTML = `<b class="h">${n}（${COAST[k].n}）</b>${d}`; });
      return { g, k };
    });
    function pick(k) {
      lines.forEach((n) => n.classList.toggle('dim', !!k && n.dataset.c !== k));
      pins.forEach((p) => p.g.classList.toggle('dim', !!k && p.k !== k));
      body.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('active', b.dataset.c === k));
      const c = COAST[k];
      fig.innerHTML = c ? c.svg : '';
      read.innerHTML = c ? `<b class="h">${c.n}：${c.where}</b>成因：${c.why}<br>特色：${c.feat}`
        : '<b class="h">口訣</b>北岬灣、西沙岸、東斷層、南珊瑚。<br><span class="w-hint">海岸線分段為示意，點選看各種海岸的成因與特色。</span>';
    }
    body.querySelectorAll('.w-leg').forEach((b) => b.addEventListener('click', () => pick(b.classList.contains('active') ? null : b.dataset.c)));
    pick(null);
  };

  // =====================================================================
  // 4-1 差異侵蝕：岬角與海灣
  // =====================================================================
  W['diff-erosion'] = function (host) {
    const body = frame(host, '🌊 差異侵蝕：岬角和海灣怎麼來的？', '拖曳時間或按播放，看海浪侵蝕軟、硬岩層');
    body.innerHTML = `
      <div class="w-time-head"><button class="chip" data-k="play">▶ 播放</button><input type="range" min="0" max="100" value="0" data-k="t"><span class="w-small-label" data-k="lab"></span></div>
      <div class="w-map w-map-mid"><svg viewBox="0 0 640 300"></svg></div>
      <div class="w-read"></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    const BANDS = [1, 0, 1, 0, 1, 0, 1, 0].map((hard, i) => ({ hard, x0: i * 80, x1: i * 80 + 80 }));
    BANDS.forEach((b) => el('rect', { x: b.x0, y: 0, width: 80, height: 300, class: b.hard ? 'w-rock-hard' : 'w-rock-soft' }, svg));
    const sea = el('path', { class: 'w-water w-sea-cut' }, svg);
    const labs = el('g', {}, svg);
    for (let i = 0; i < 6; i++) el('text', { x: 50 + i * 100, y: 26, 'text-anchor': 'middle', class: 'w-wave', text: '〰〰' }, svg);
    el('text', { x: 620, y: 290, 'text-anchor': 'end', class: 'w-small', text: '深色＝硬岩　淺色＝軟岩（俯視圖）' }, svg);
    function render() {
      const t = +$('t').value / 100;
      const pts = [];
      BANDS.forEach((b) => {
        const y = 50 + t * (b.hard ? 30 : 170);
        pts.push([b.x0 + 14, y], [b.x1 - 14, y]);
      });
      // 海在上、陸在下：沿海岸線反向走回起點，組成封閉的海域
      sea.setAttribute('d', `M0,0 L640,0 L640,${pts[pts.length - 1][1]} L` + d3.line().curve(d3.curveBasis)([[640, pts[pts.length - 1][1]], ...pts.slice().reverse(), [0, pts[0][1]]]).slice(1) + ' L0,0 Z');
      labs.innerHTML = '';
      if (t > 0.35) BANDS.forEach((b) => el('text', { x: (b.x0 + b.x1) / 2, y: 50 + t * (b.hard ? 30 : 170) + 22, 'text-anchor': 'middle', class: 'w-label', text: b.hard ? '岬角' : '海灣' }, labs));
      $('lab').textContent = t < 0.05 ? '一開始：海岸平直' : t < 0.95 ? '海浪持續侵蝕…' : '很久以後';
      read.innerHTML = t < 0.35
        ? '<b class="h">一開始</b>海岸線是平直的，岩層軟硬相間。海浪不斷拍打海岸。'
        : '<b class="h">差異侵蝕</b><b>軟岩</b>容易被侵蝕而凹入，形成<b>海灣</b>；<b>硬岩</b>較耐侵蝕而突出，形成<b>岬角</b>。<br>→ 臺灣北部的<b>岬灣海岸</b>就是這樣形成的。';
    }
    let anim = null;
    $('t').addEventListener('input', render);
    $('play').addEventListener('click', () => {
      cancelAnimationFrame(anim);
      if (+$('t').value >= 100) $('t').value = 0;
      const step = () => { $('t').value = Math.min(100, +$('t').value + 0.7); render(); if (+$('t').value < 100 && svg.isConnected) anim = requestAnimationFrame(step); };
      anim = requestAnimationFrame(step);
    });
    render();
  };

  // =====================================================================
  // 4-1 沙洲與潟湖的形成
  // =====================================================================
  W['lagoon-stages'] = function (host) {
    const body = frame(host, '🏝️ 沙洲與潟湖的形成', '點選步驟，看西部沙岸的變化（俯視示意）');
    const ST = [
      ['① 泥沙入海', '河川把上游侵蝕下來的大量泥沙帶到海邊。'],
      ['② 沙洲出現', '海浪和沿岸流把泥沙堆積在離岸不遠處，形成狹長的<b>沙洲</b>。'],
      ['③ 形成潟湖', '沙洲愈來愈長，把一部分海水圍起來，成為<b>潟湖</b>，適合發展<b>養殖漁業</b>（牡蠣、虱目魚）。'],
      ['④ 潟湖陸化', '泥沙持續堆積，潟湖逐漸被填平變成陸地（<b>陸化</b>），海岸線向海推進。']
    ];
    body.innerHTML = `
      <div class="w-tabs">${ST.map((s, i) => `<button class="chip" data-s="${i}">${s[0]}</button>`).join('')}</div>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 520 300"></svg></div>
        <div class="w-side"><div class="w-read w-read-lg"></div></div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    el('rect', { x: 0, y: 0, width: 520, height: 300, class: 'w-water' }, svg);
    const land = el('path', { class: 'w-land' }, svg);
    const river = el('path', { d: 'M300,300 C290,260 250,240 240,205', class: 'w-river' }, svg);
    const plume = el('g', {}, svg);
    for (let i = 0; i < 26; i++) el('circle', { cx: 240 + Math.cos(i * 1.7) * (10 + i * 3), cy: 200 - Math.abs(Math.sin(i * 2.3)) * (6 + i * 2.2), r: 2.2, class: 'w-sed' }, plume);
    const bar = el('path', { class: 'w-sandbar' }, svg);
    const lagoon = el('path', { class: 'w-lagoon' }, svg);
    const tLag = el('text', { x: 250, y: 168, 'text-anchor': 'middle', class: 'w-label', text: '潟湖' }, svg);
    const tBar = el('text', { x: 250, y: 108, 'text-anchor': 'middle', class: 'w-label', text: '沙洲' }, svg);
    el('text', { x: 20, y: 30, class: 'w-label-sea', text: '海' }, svg);
    el('text', { x: 20, y: 285, class: 'w-label', text: '陸地' }, svg);
    function show(s) {
      body.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('active', +b.dataset.s === s));
      land.setAttribute('d', s === 3 ? 'M0,300 L0,130 C150,125 350,125 520,132 L520,300 Z' : 'M0,300 L0,200 C150,205 350,205 520,200 L520,300 Z');
      river.style.display = s === 3 ? 'none' : '';
      plume.style.display = s <= 1 ? '' : 'none';
      bar.setAttribute('d', s === 1 ? 'M170,120 C220,112 290,112 330,122 L328,130 C290,121 220,121 172,128 Z' : 'M40,118 C150,100 350,100 480,120 L478,130 C350,112 150,112 42,128 Z');
      bar.style.display = s >= 1 && s <= 2 ? '' : 'none';
      lagoon.setAttribute('d', 'M60,135 C150,122 350,122 460,135 L470,196 C350,200 150,200 50,196 Z');
      lagoon.style.display = s === 2 ? '' : 'none';
      tLag.style.display = s === 2 ? '' : 'none';
      tBar.style.display = s >= 1 && s <= 2 ? '' : 'none';
      read.innerHTML = `<b class="h">${ST[s][0]}</b>${ST[s][1]}`;
    }
    body.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => show(+b.dataset.s)));
    show(0);
  };

  // =====================================================================
  // 4-2 海岸侵退模擬
  // =====================================================================
  W['coast-retreat'] = function (host) {
    const body = frame(host, '📉 為什麼沙灘愈來愈小？', '勾選人為活動、拖曳年數，看海岸線的變化（示意）');
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 520 300"></svg></div>
        <div class="w-side">
          <div class="w-toggles">
            <label><input type="checkbox" data-k="dam"> 上游興建水庫、攔沙壩</label>
            <label><input type="checkbox" data-k="mine"> 河川砂石被大量採取</label>
            <label><input type="checkbox" data-k="jetty"> 興建港口、突堤擋住沿岸流</label>
          </div>
          <label class="w-slider">經過 <input type="range" min="0" max="50" value="0" data-k="y"><output data-k="yo"></output></label>
          <div class="w-bar"><span data-k="bar"></span></div>
          <div class="w-read"></div>
        </div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    el('rect', { x: 0, y: 0, width: 520, height: 300, class: 'w-water' }, svg);
    const beach = el('path', { class: 'w-beach' }, svg);
    el('rect', { x: 0, y: 220, width: 520, height: 80, class: 'w-land' }, svg);
    el('path', { d: 'M0,215 L520,215', class: 'w-road' }, svg);
    const houses = el('g', {}, svg);
    [80, 200, 330, 440].forEach((x) => { el('rect', { x, y: 238, width: 34, height: 26, class: 'w-block' }, houses); el('path', { d: `M${x - 4},240 L${x + 17},224 L${x + 38},240 Z`, class: 'w-roof' }, houses); });
    el('path', { d: 'M500,300 C490,270 470,250 455,220', class: 'w-river' }, svg);
    el('text', { x: 20, y: 30, class: 'w-label-sea', text: '海' }, svg);
    const shoreT = el('text', { x: 20, y: 0, class: 'w-small' }, svg);
    function render() {
      const sup = 100 - ($('dam').checked ? 45 : 0) - ($('mine').checked ? 25 : 0) - ($('jetty').checked ? 15 : 0);
      const yrs = +$('y').value;
      $('yo').textContent = yrs + ' 年';
      $('bar').style.width = sup + '%';
      const change = (sup - 75) * yrs * 0.045; // 正：前進，負：後退（像素）
      const shore = Math.max(60, Math.min(205, 120 - change));
      beach.setAttribute('d', `M0,${shore} C130,${shore - 6} 390,${shore + 6} 520,${shore} L520,220 L0,220 Z`);
      shoreT.setAttribute('y', shore - 6); shoreT.textContent = '海岸線';
      const m = Math.round(Math.abs(change) * 2);
      read.innerHTML = `<b class="h">河川帶到海岸的泥沙：${sup}%</b>${yrs === 0 ? '拖曳年數看看海岸線的變化。'
        : change < -1 ? `${yrs} 年後，沙灘<b class="w-bad">後退約 ${m} 公尺</b>（示意）。${shore <= 60 ? '' : ''}${shore > 190 ? '<br>海水快要逼近房屋了！' : ''}`
          : change > 1 ? `${yrs} 年後，沙灘<b class="w-ok">向海前進約 ${m} 公尺</b>（示意）。` : '泥沙的供應與海浪侵蝕大致平衡，海岸線變化不大。'}
        <br><span class="w-hint">泥沙來源減少、沿岸流被阻擋 → 海浪侵蝕大於堆積 → 海岸後退。</span>`;
    }
    body.querySelectorAll('input').forEach((i) => i.addEventListener('input', render));
    render();
  };

  // =====================================================================
  // 4-3 島嶼地圖與分類
  // =====================================================================
  const ISL = { basalt: ['玄武岩', '#5a6270'], granite: ['花崗岩', '#c9a26b'], volcanic: ['火山島', '#d63031'], coral: ['珊瑚礁', '#e8608a'] };
  W['islands-map'] = (host) => U.pointMap(host, {
    title: '🏝️ 臺灣的島嶼', desc: '依岩石類型篩選；按「找找看」練習位置',
    bbox: [118.1, 21.85, 122.15, 26.4], width: 460, cats: ISL,
    items: [
      { n: '澎湖群島', c: 'basalt', lon: 119.58, lat: 23.57, d: '臺灣海峽中約 90 座島嶼，<b>玄武岩</b>方山與柱狀玄武岩；冬季東北季風強、雨量少。' },
      { n: '金門', c: 'granite', lon: 118.35, lat: 24.44, d: '位於福建廈門外海，以<b>花崗岩</b>為主；戰地文化、閩南建築、風獅爺。' },
      { n: '馬祖', c: 'granite', lon: 119.95, lat: 26.16, d: '位於閩江口外，<b>花崗岩</b>島嶼，多山少平地；閩東石頭屋、藍眼淚。' },
      { n: '龜山島', c: 'volcanic', lon: 121.95, lat: 24.84, d: '宜蘭外海的<b>火山島</b>，外形像海龜。' },
      { n: '綠島', c: 'volcanic', lon: 121.49, lat: 22.66, d: '臺東外海的<b>火山島</b>，周圍有珊瑚礁，有海底溫泉。' },
      { n: '蘭嶼', c: 'volcanic', lon: 121.55, lat: 22.05, d: '臺東外海的<b>火山島</b>，達悟族的家園，拼板舟、飛魚文化。' },
      { n: '小琉球', c: 'coral', lon: 120.37, lat: 22.34, d: '屏東外海由<b>隆起珊瑚礁</b>構成的島嶼，以花瓶岩、海龜聞名。', left: true }
    ],
    intro: '<b class="h">提示</b>點選圓點看島嶼特色。<br><span class="w-hint">東沙群島（環礁）與南沙群島（太平島）同屬珊瑚礁，距離太遠未畫在圖上。</span>'
  });
  W['island-sort'] = (host) => U.makeSorter(host, {
    title: '🪨 島嶼的岩石分類', desc: '判斷每座島嶼主要的成因或岩石',
    cats: ['玄武岩', '花崗岩', '火山島', '珊瑚礁'],
    hint: '口訣：澎湖玄武、金馬花崗、龜綠蘭火山、琉球東南沙珊瑚。',
    items: [
      ['澎湖群島', '玄武岩', '玄武岩熔岩流形成方山與柱狀玄武岩。'], ['金門', '花崗岩', '位於福建沿海，以花崗岩為主。'],
      ['馬祖', '花崗岩', '位於閩江口外，以花崗岩為主。'], ['龜山島', '火山島', '宜蘭外海的火山島。'],
      ['綠島', '火山島', '臺東外海的火山島。'], ['蘭嶼', '火山島', '臺東外海的火山島。'],
      ['小琉球', '珊瑚礁', '由隆起珊瑚礁構成。'], ['東沙島', '珊瑚礁', '東沙環礁的一部分。'], ['太平島', '珊瑚礁', '南沙群島中最大的珊瑚礁島。']
    ]
  });
  W['coast-sort'] = (host) => U.makeSorter(host, {
    title: '🧭 這是哪一種海岸？', desc: '依地形或特色判斷海岸類型',
    cats: ['岬灣', '沙岸', '斷層', '珊瑚礁'],
    items: [
      ['野柳女王頭（蕈狀岩）', '岬灣', '北部岬灣海岸的海蝕地形。'], ['和平島的豆腐岩', '岬灣', '北部岬灣海岸的海蝕地形。'],
      ['外傘頂洲', '沙岸', '西部沙岸的沙洲。'], ['七股潟湖', '沙岸', '西部沙岸的潟湖。'],
      ['海岸平直、多沙洲和潮間帶，港口多為人工港', '沙岸', '西部沙岸泥沙多、坡度緩。'],
      ['清水斷崖', '斷層', '東部斷層海岸的代表。'], ['山地緊鄰深海，海岸平原狹窄', '斷層', '東部斷層海岸的特色。'],
      ['墾丁的裙礁', '珊瑚礁', '恆春半島的珊瑚礁海岸。']
    ]
  });
})();
