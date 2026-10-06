// 第五章互動圖（天氣與氣候）
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U || !U.makeSorter) return;
  const { el, frame, mercator, ready } = U;

  // =====================================================================
  // 5-1 天氣還是氣候？
  // =====================================================================
  W['weather-sort'] = (host) => U.makeSorter(host, {
    title: '🌤️ 天氣還是氣候？', desc: '判斷每句話描述的是天氣還是氣候',
    cats: ['天氣', '氣候'],
    hint: '短時間（今天、明天、這幾天）→ 天氣；長時間的平均狀態（通常、每年、冬季多…）→ 氣候。',
    items: [
      ['今天下午臺北下了一場大雨', '天氣', '「今天下午」是短時間的大氣狀況。'],
      ['明天颱風可能從花蓮登陸', '天氣', '描述未來一兩天的狀況。'],
      ['這週末北部氣溫驟降', '天氣', '「這週末」是短時間。'],
      ['現在高雄的氣溫是 33°C', '天氣', '某個時刻的大氣狀況。'],
      ['今晚山區可能有雷陣雨', '天氣', '短時間的天氣預報。'],
      ['屏東冬季通常乾燥少雨', '氣候', '「通常」表示長期的平均狀態。'],
      ['基隆冬季經常下雨，被稱為「雨港」', '氣候', '長期以來的特色。'],
      ['臺灣年平均雨量約 2,500 公釐', '氣候', '年平均值是長期統計。'],
      ['恆春半島全年溫暖', '氣候', '描述全年的長期特色。'],
      ['北部冬季多溼冷', '氣候', '長期的季節特色。']
    ]
  });

  // =====================================================================
  // 5-2 高度與氣溫
  // =====================================================================
  W['altitude-temp'] = function (host) {
    const body = frame(host, '🧗 爬得愈高愈冷', '拖曳高度，看看山上的氣溫（每升高 100 公尺約降 0.6°C）');
    body.innerHTML = `
      <div class="w-tabs">
        <span class="w-small-label">平地氣溫</span><button class="chip" data-b="30">夏天 30°C</button><button class="chip" data-b="16">冬天 16°C</button>
        <span class="w-tab-sep"></span>
        <button class="chip" data-a="0">平地</button><button class="chip" data-a="2216">阿里山</button><button class="chip" data-a="3417">合歡山</button><button class="chip" data-a="3952">玉山</button>
      </div>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 520 320"></svg></div>
        <div class="w-side">
          <label class="w-slider">海拔 <input type="range" min="0" max="3952" step="1" value="0"><output></output></label>
          <div class="w-thermo"><div class="w-thermo-fill"></div></div>
          <div class="w-read w-read-lg"></div>
        </div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read'), input = body.querySelector('input');
    const Y = (h) => 300 - h / 4000 * 270;
    el('rect', { x: 0, y: 0, width: 520, height: 320, class: 'w-sky' }, svg);
    for (let h = 0; h <= 4000; h += 1000) {
      el('line', { x1: 58, x2: 520, y1: Y(h), y2: Y(h), class: 'w-pgrid' }, svg);
      el('text', { x: 54, y: Y(h) + 4, 'text-anchor': 'end', class: 'w-small', text: h.toLocaleString() + ' m' }, svg);
    }
    const ridge = [[58, 0], [140, 300], [210, 1200], [250, 2216], [300, 1900], [350, 3417], [390, 3000], [430, 3952], [470, 2600], [520, 1500]];
    el('path', { d: d3.area().curve(d3.curveMonotoneX).x((p) => p[0]).y0(320).y1((p) => Y(p[1]))(ridge), class: 'w-mountain' }, svg);
    const snow = el('path', { class: 'w-snow' }, svg);
    [[250, 2216, '阿里山'], [350, 3417, '合歡山'], [430, 3952, '玉山 3,952 m']].forEach(([x, h, t]) => el('text', { x, y: Y(h) - 8, 'text-anchor': 'middle', class: 'w-small', text: t }, svg));
    const lineH = el('line', { x1: 58, x2: 520, class: 'w-alt-line' }, svg);
    const who = el('text', { 'text-anchor': 'middle', class: 'w-icon', text: '🧗' }, svg);
    const tag = el('text', { x: 64, class: 'w-label-red' }, svg);
    let base = 30;
    function xAt(h) { // 找出山坡上這個高度的位置（左側上坡）
      for (let i = 0; i < ridge.length - 1; i++) {
        const [x0, h0] = ridge[i], [x1, h1] = ridge[i + 1];
        if (h >= h0 && h <= h1) return x0 + (x1 - x0) * (h - h0) / (h1 - h0 || 1);
      }
      return 430;
    }
    function render() {
      const h = +input.value, t = base - h / 100 * 0.6;
      body.querySelector('output').textContent = h.toLocaleString() + ' 公尺';
      body.querySelectorAll('[data-b]').forEach((b) => b.classList.toggle('active', +b.dataset.b === base));
      lineH.setAttribute('y1', Y(h)); lineH.setAttribute('y2', Y(h));
      who.setAttribute('x', xAt(h)); who.setAttribute('y', Y(h) - 4);
      tag.setAttribute('y', Y(h) - 6); tag.textContent = t.toFixed(1) + '°C';
      const snowLine = base / 0.6 * 100; // 0°C 的高度
      snow.setAttribute('d', snowLine < 3952 ? d3.area().curve(d3.curveMonotoneX).x((p) => p[0]).y0(Y(snowLine)).y1((p) => Y(Math.max(p[1], snowLine)))(ridge) : '');
      body.querySelector('.w-thermo-fill').style.width = Math.max(0, Math.min(100, (t + 10) / 45 * 100)) + '%';
      read.innerHTML = `<b class="h">海拔 ${h.toLocaleString()} 公尺：約 ${t.toFixed(1)}°C</b>
        計算：${base} − ${(h / 100).toFixed(1)} × 0.6 = <b>${t.toFixed(1)}°C</b><br>
        ${t <= 0 ? '❄️ 氣溫在 0°C 以下，冬天<b>可能下雪</b>！' : t < 10 ? '🧥 很冷，要多穿衣服。' : t < 20 ? '🙂 涼爽舒服。' : '☀️ 炎熱。'}
        <br><span class="w-hint">白色區域是氣溫低於 0°C 的高度${snowLine < 3952 ? '（冬天高山可能積雪）' : '（夏天沒有）'}。</span>`;
    }
    input.addEventListener('input', render);
    body.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => { base = +b.dataset.b; render(); }));
    body.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.a; render(); }));
    render();
  };

  // =====================================================================
  // 5-3 季風與洋流
  // =====================================================================
  W['monsoon-map'] = function (host) {
    if (!ready() || !window.EASTASIA || !window.TW_TOPO) return;
    const body = frame(host, '🌬️ 季風與洋流', '切換冬季、夏季，看風向與臺灣各地的雨量變化');
    const m = mercator([108, 12, 134, 36], 520, 4);
    const tm = mercator([119.95, 21.85, 122.1, 25.35], 200, 6);
    body.innerHTML = `
      <div class="w-tabs">
        <button class="chip" data-s="winter">❄️ 冬季（約 10～3 月）</button><button class="chip" data-s="summer">☀️ 夏季（約 5～9 月）</button>
        <label class="w-inline"><input type="checkbox" data-k="cur" checked> 洋流</label>
      </div>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 ${m.width} ${m.height}" data-k="map"></svg></div>
        <div class="w-side">
          <div class="w-tw-inset"><svg viewBox="0 0 ${tm.width} ${tm.height}" data-k="tw"></svg><div class="w-small-txt"><i class="w-sw w-wet"></i> 迎風、雨量多　<i class="w-sw w-dry"></i> 背風、較乾</div></div>
          <div class="w-read"></div>
        </div>
      </div>`;
    const svg = body.querySelector('[data-k="map"]'), tw = body.querySelector('[data-k="tw"]'), read = body.querySelector('.w-read');
    const arBlue = U.arrowMarker(svg, 'w-arrowhead-blue'), arRed = U.arrowMarker(svg, 'w-arrowhead-red');
    el('rect', { x: 0, y: 0, width: m.width, height: m.height, class: 'w-sea' }, svg);
    el('path', { d: m.path(EASTASIA), class: 'w-land' }, svg);
    el('path', { d: m.path(topojson.feature(TW_TOPO, TW_TOPO.objects.nation)), class: 'w-taiwan' }, svg);
    const T = (lon, lat, t, c, g) => { const [x, y] = m.proj(lon, lat); return el('text', { x, y, 'text-anchor': 'middle', class: c || 'w-label', text: t }, g || svg); };
    const wind = el('g', {}, svg), cur = el('g', {}, svg), labs = el('g', {}, svg);
    const arrow = (a, b, g, cls, mk) => { const p = m.proj(...a), q = m.proj(...b); el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: cls, 'marker-end': mk }, g); };
    const flow = (pts, cls, mk, g) => el('path', { d: U.curve(pts, m), class: cls, 'marker-end': mk }, g);
    const counties = U.counties();
    const twPaths = counties.map((f) => ({ f, n: el('path', { d: tm.path(f), class: 'w-county' }, tw) }));
    const WET = { winter: ['基隆市', '臺北市', '新北市', '宜蘭縣'], summer: ['嘉義縣', '嘉義市', '臺南市', '高雄市', '屏東縣'] };
    const DRY = { winter: ['臺中市', '彰化縣', '雲林縣', '嘉義縣', '嘉義市', '臺南市', '高雄市', '屏東縣'], summer: [] };
    let season = 'winter';
    function render() {
      body.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('active', b.dataset.s === season));
      wind.innerHTML = ''; cur.innerHTML = ''; labs.innerHTML = '';
      if (season === 'winter') {
        [[[126, 33], [121.5, 27.2]], [[129, 30], [123, 25.3]], [[124, 35], [119, 29]], [[130, 26], [124.5, 22]], [[121, 20.5], [116.5, 16.5]]].forEach(([a, b]) => arrow(a, b, wind, 'w-wind-cold', arBlue));
        T(114, 33.5, '冷高壓（蒙古、西伯利亞）', 'w-label', labs);
        T(128.5, 31.6, '東北季風', 'w-label-sea', labs);
        flow([[123, 31], [121.3, 28.5], [120, 26], [119, 24], [118.3, 22.8]], 'w-current-cold', arBlue, cur);
        T(117.3, 27.5, '中國沿岸流（寒）', 'w-small', cur);
      } else {
        [[[112, 15], [117.5, 21]], [[115, 13], [120.4, 21.6]], [[118, 14], [124, 20.5]], [[110, 19], [114.5, 23.2]]].forEach(([a, b]) => arrow(a, b, wind, 'w-wind-warm', arRed));
        T(116, 30, '亞洲大陸受熱（低氣壓）', 'w-label', labs);
        T(114, 13.6, '西南季風', 'w-label-red', labs);
      }
      flow([[123.5, 14], [122.4, 19], [122.3, 22.5], [123, 25], [126, 28.5], [130, 31.5]], 'w-current-warm', arRed, cur);
      T(126.8, 23.5, '黑潮（暖）', 'w-small', cur);
      cur.style.display = body.querySelector('[data-k="cur"]').checked ? '' : 'none';
      twPaths.forEach(({ f, n }) => {
        n.classList.toggle('w-wet', WET[season].includes(f.name));
        n.classList.toggle('w-dry', DRY[season].includes(f.name) && !WET[season].includes(f.name));
      });
      read.innerHTML = season === 'winter'
        ? '<b class="h">冬季：東北季風</b>從蒙古、西伯利亞的冷高壓吹來，寒冷；經過海面帶有水氣。<br>→ <b>北部、東北部</b>（基隆、宜蘭）位於迎風面，冬季多雨；<b>中南部</b>位於背風側，進入<b>乾季</b>。'
        : '<b class="h">夏季：西南季風</b>從南方海洋吹向亞洲大陸，溫暖潮溼。<br>→ <b>中南部</b>與山地西南坡位於迎風面，夏季雨量多。';
    }
    body.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { season = b.dataset.s; render(); }));
    body.querySelector('[data-k="cur"]').addEventListener('change', render);
    render();
  };

  // =====================================================================
  // 5-4 四種降雨類型
  // =====================================================================
  W['rain-types'] = function (host) {
    const body = frame(host, '🌧️ 臺灣的四種降雨', '點選降雨類型，看成因動畫與發生月份');
    const drops = (x0, x1, y, n) => Array.from({ length: n }, (_, i) => `<line class="w-drop" x1="${x0 + (x1 - x0) * (i + 0.5) / n}" x2="${x0 + (x1 - x0) * (i + 0.5) / n - 4}" y1="${y}" y2="${y + 14}" style="animation-delay:${(i * 0.37) % 1.2}s"/>`).join('');
    const cloud = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="50" ry="22" class="w-cloud"/><ellipse cx="-30" cy="6" rx="32" ry="18" class="w-cloud"/><ellipse cx="32" cy="6" rx="34" ry="18" class="w-cloud"/></g>`;
    const T = {
      front: { n: '鋒面雨', months: [2, 3, 4, 5], when: '春季、<b>梅雨季（5～6 月）</b>',
        why: '冷、暖氣團相遇形成<b>鋒面</b>，較輕的暖空氣沿著鋒面被抬升，冷卻凝結降雨。',
        feat: '梅雨<b>雨期長</b>，是水庫的重要水源，但也可能造成豪雨。',
        svg: `<rect width="600" height="260" class="w-sky"/><path d="M0,260 L0,150 L330,260 Z" class="w-cold-air"/><path d="M0,150 L330,260 L600,260 L600,40 Z" class="w-warm-air"/>
          <path class="w-flow-up" d="M560,230 C450,200 330,160 200,110"/>${cloud(250, 95, 1.2)}${cloud(150, 80, 0.9)}${drops(150, 300, 125, 12)}
          <text x="70" y="230" class="w-label">冷氣團</text><text x="470" y="160" class="w-label">暖氣團</text><text x="330" y="205" class="w-label-red">鋒面</text>` },
      conv: { n: '對流雨', months: [5, 6, 7, 8], when: '<b>夏季午後</b>',
        why: '地面受太陽強烈加熱，溼熱空氣<b>上升</b>冷卻，形成高聳的積雨雲而降雨。',
        feat: '就是<b>午後雷陣雨</b>：來得快、去得快，常伴隨雷電。',
        svg: `<rect width="600" height="260" class="w-sky"/><circle cx="520" cy="50" r="28" class="w-sun"/><rect y="225" width="600" height="35" class="w-hot-ground"/>
          <path class="w-flow-up" d="M200,220 L200,120"/><path class="w-flow-up" d="M280,220 L280,110"/><path class="w-flow-up" d="M360,220 L360,120"/>
          ${cloud(280, 70, 1.5)}${cloud(280, 40, 1)}${drops(200, 360, 105, 14)}<text x="380" y="70" class="w-bolt">⚡</text>
          <text x="440" y="215" class="w-label">地面受熱</text>` },
      oro: { n: '地形雨', months: [9, 10, 11, 0, 1, 2, 5, 6, 7], when: '全年都有，<b>季風期</b>最明顯',
        why: '溼空氣遇到山地，被迫沿著山坡<b>抬升</b>，冷卻凝結降雨。',
        feat: '<b>迎風坡多雨、背風坡少雨</b>。例：冬季東北季風使基隆、宜蘭多雨。',
        svg: `<rect width="600" height="260" class="w-sky"/><path d="M80,260 L300,70 L520,260 Z" class="w-mountain"/>
          <path class="w-flow-up" d="M10,230 L120,230 C180,200 230,150 280,95"/><path class="w-flow-up" d="M320,95 C380,140 430,190 520,215"/>
          ${cloud(210, 75, 1)}${drops(160, 260, 95, 9)}<text x="120" y="250" class="w-label">迎風坡：多雨</text><text x="380" y="250" class="w-label">背風坡：少雨</text><text x="20" y="215" class="w-small">溼空氣 →</text>` },
      typhoon: { n: '颱風雨', months: [6, 7, 8], when: '<b>7～9 月</b>為主',
        why: '熱帶海洋上形成的<b>強烈低氣壓</b>，北半球呈<b>逆時針</b>旋轉，帶來強風豪雨。',
        feat: '可能造成淹水、山崩、土石流；也是夏季重要的水源。颱風眼內風雨較小。',
        svg: `<rect width="600" height="260" class="w-water"/><g class="w-spin" style="transform-origin:300px 130px">
          <path d="M300,130 m-100,0 a100,100 0 1,0 100,-100" class="w-band-arm"/><path d="M300,130 m100,0 a100,100 0 1,0 -100,100" class="w-band-arm"/>
          <path d="M300,130 m-60,0 a60,60 0 1,0 60,-60" class="w-band-arm"/><path d="M300,130 m60,0 a60,60 0 1,0 -60,60" class="w-band-arm"/></g>
          <circle cx="300" cy="130" r="14" class="w-eye"/><text x="300" y="165" text-anchor="middle" class="w-small">颱風眼</text>
          <text x="470" y="40" class="w-label">↺ 逆時針旋轉</text><text x="20" y="240" class="w-small">（北半球俯視示意）</text>` }
    };
    const MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    body.innerHTML = `
      <div class="w-tabs">${Object.entries(T).map(([k, t]) => `<button class="chip" data-r="${k}">${t.n}</button>`).join('')}</div>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 600 260"></svg></div>
        <div class="w-side">
          <div class="w-months">${MONTHS.map((mo) => `<span>${mo}月</span>`).join('')}</div>
          <div class="w-read w-read-lg"></div>
        </div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    function show(k) {
      const t = T[k];
      body.querySelectorAll('[data-r]').forEach((b) => b.classList.toggle('active', b.dataset.r === k));
      svg.innerHTML = t.svg;
      body.querySelectorAll('.w-months span').forEach((s, i) => s.classList.toggle('on', t.months.includes(i)));
      read.innerHTML = `<b class="h">${t.n}：${t.when}</b>成因：${t.why}<br>特色：${t.feat}`;
    }
    body.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => show(b.dataset.r)));
    show('front');
  };

  // =====================================================================
  // 5-5 氣候圖比較
  // =====================================================================
  W['climate-chart'] = function (host) {
    const body = frame(host, '📊 各地氣候圖', '選一個城市，再選另一個城市比較（數值為約略值，僅供比較趨勢）');
    // 月均溫（°C）、月雨量（mm）：約略值
    const C = {
      基隆: { t: [16, 16, 18, 21, 25, 27, 29, 29, 27, 24, 21, 18], r: [330, 380, 320, 240, 280, 300, 150, 220, 380, 420, 420, 340] },
      臺北: { t: [16, 17, 19, 22, 26, 28, 30, 29, 28, 25, 22, 18], r: [95, 175, 180, 180, 250, 320, 245, 320, 360, 150, 95, 95] },
      臺中: { t: [17, 17, 19, 23, 26, 28, 29, 28, 28, 26, 22, 18], r: [35, 90, 95, 130, 240, 330, 280, 320, 140, 20, 20, 25] },
      高雄: { t: [19, 20, 23, 25, 28, 29, 29, 29, 28, 27, 24, 21], r: [20, 25, 40, 75, 200, 420, 380, 450, 200, 50, 15, 15] },
      花蓮: { t: [18, 18, 20, 23, 25, 27, 29, 28, 27, 25, 22, 19], r: [70, 100, 90, 90, 200, 190, 140, 240, 350, 320, 140, 60] }
    };
    const names = Object.keys(C);
    body.innerHTML = `
      <div class="w-tabs"><span class="w-small-label">城市</span>${names.map((n) => `<button class="chip" data-a="${n}">${n}</button>`).join('')}</div>
      <div class="w-tabs"><span class="w-small-label">比較</span><button class="chip" data-b="">不比較</button>${names.map((n) => `<button class="chip" data-b="${n}">${n}</button>`).join('')}</div>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 600 300"></svg></div>
        <div class="w-side"><div class="w-read w-read-lg"></div></div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    let A = '基隆', B = '高雄';
    const x = (i) => 60 + i * 42, yr = (v) => 260 - v / 500 * 230, yt = (v) => 260 - v / 35 * 230;
    function stats(n) {
      const c = C[n], total = c.r.reduce((a, b) => a + b, 0);
      const winter = [10, 11, 0, 1, 2].reduce((a, i) => a + c.r[i], 0);
      return { total, winterPct: Math.round(winter / total * 100), tmin: Math.min(...c.t), tmax: Math.max(...c.t) };
    }
    function render() {
      body.querySelectorAll('[data-a]').forEach((b) => b.classList.toggle('active', b.dataset.a === A));
      body.querySelectorAll('[data-b]').forEach((b) => b.classList.toggle('active', b.dataset.b === B));
      svg.innerHTML = '';
      el('rect', { x: x(10) - 20, y: 30, width: 84, height: 230, class: 'w-winter' }, svg);
      el('rect', { x: x(0) - 20, y: 30, width: 126, height: 230, class: 'w-winter' }, svg);
      el('text', { x: x(1), y: 44, 'text-anchor': 'middle', class: 'w-small', text: '冬季' }, svg);
      for (let v = 0; v <= 500; v += 100) {
        el('line', { x1: 40, x2: 560, y1: yr(v), y2: yr(v), class: 'w-pgrid' }, svg);
        el('text', { x: 36, y: yr(v) + 4, 'text-anchor': 'end', class: 'w-small', text: v }, svg);
      }
      [0, 10, 20, 30].forEach((v) => el('text', { x: 566, y: yt(v) + 4, class: 'w-small w-temp-axis', text: v + '°' }, svg));
      el('text', { x: 10, y: 20, class: 'w-small', text: '雨量（mm）' }, svg);
      el('text', { x: 590, y: 20, 'text-anchor': 'end', class: 'w-small w-temp-axis', text: '氣溫（°C）' }, svg);
      const bw = B ? 16 : 26;
      C[A].r.forEach((v, i) => el('rect', { x: x(i) - (B ? 17 : 13), y: yr(v), width: bw, height: 260 - yr(v), class: 'w-rain' }, svg));
      if (B) C[B].r.forEach((v, i) => el('rect', { x: x(i) + 1, y: yr(v), width: bw, height: 260 - yr(v), class: 'w-rain2' }, svg));
      const line = d3.line().x((v, i) => x(i)).y((v) => yt(v));
      el('path', { d: line(C[A].t), class: 'w-temp' }, svg);
      if (B) el('path', { d: line(C[B].t), class: 'w-temp2' }, svg);
      C[A].t.forEach((v, i) => el('circle', { cx: x(i), cy: yt(v), r: 3, class: 'w-temp-dot' }, svg));
      for (let i = 0; i < 12; i++) el('text', { x: x(i), y: 278, 'text-anchor': 'middle', class: 'w-small', text: i + 1 + '月' }, svg);
      el('text', { x: 300, y: 296, 'text-anchor': 'middle', class: 'w-small', text: B ? `實心：${A}　空心／虛線：${B}` : `${A}：長條＝雨量，折線＝氣溫` }, svg);
      const s = stats(A), t = B && stats(B);
      const line1 = (n, st) => `<b>${n}</b>：年雨量約 ${st.total.toLocaleString()} mm，冬季（11～3 月）占 <b>${st.winterPct}%</b>；最冷月 ${st.tmin}°C、最熱月 ${st.tmax}°C`;
      read.innerHTML = `<b class="h">${B ? A + ' vs ' + B : A}</b>${line1(A, s)}${t ? '<br>' + line1(B, t) : ''}
        <br><span class="w-hint">${B ? (s.winterPct > t.winterPct ? `${A}冬季雨量比例較高（東北季風迎風面）；${B}冬季較乾。` : `${B}冬季雨量比例較高；${A}冬季較乾。`) : '試試看比較「基隆」和「高雄」：北部全年有雨，南部夏雨冬乾。'}</span>`;
    }
    body.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { A = b.dataset.a; if (B === A) B = ''; render(); }));
    body.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => { B = b.dataset.b === A ? '' : b.dataset.b; render(); }));
    render();
  };
})();
