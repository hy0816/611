// 第一章互動圖：在筆記中放 <div data-widget="名稱"></div>，由 app.js 呼叫 WIDGETS[名稱](el)。
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

  // =====================================================================
  // 1-1 經線與緯線比一比
  // =====================================================================
  W['meridian-parallel'] = function (host) {
    if (!ready()) return;
    const body = frame(host, '🌐 經線與緯線比一比', '拖曳滑桿，比較經線和緯線的長度');
    body.innerHTML = `
      <div class="w-pair">
        <div class="w-cell">
          <div class="w-cell-title">經線（指南北）</div>
          <svg viewBox="0 0 300 290" class="w-svg-sm" data-k="mer"></svg>
          <label class="w-slider">經度 <input type="range" min="-180" max="180" step="15" value="120" data-k="lon"><output data-k="lonOut"></output></label>
          <div class="w-read" data-k="merRead"></div>
        </div>
        <div class="w-cell">
          <div class="w-cell-title">緯線（指東西）</div>
          <svg viewBox="0 0 300 290" class="w-svg-sm" data-k="par"></svg>
          <label class="w-slider">緯度 <input type="range" min="-90" max="90" step="0.5" value="23.5" data-k="lat"><output data-k="latOut"></output></label>
          <div class="w-chips">
            <button class="chip" data-lat="0">赤道</button><button class="chip" data-lat="23.5">北迴歸線</button>
            <button class="chip" data-lat="66.5">北極圈</button><button class="chip" data-lat="90">北極點</button>
          </div>
          <div class="w-bar"><span data-k="bar"></span></div>
          <div class="w-read" data-k="parRead"></div>
        </div>
      </div>`;
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    const lonIn = $('lon'), latIn = $('lat');

    function line(fixedLon, fixedLat) {
      const pts = [];
      if (fixedLon != null) for (let y = -90; y <= 90; y += 2) pts.push([fixedLon, y]);
      else for (let x = -180; x <= 180; x += 3) pts.push([x, fixedLat]);
      return { type: 'LineString', coordinates: pts };
    }
    function globe(svg, rotate, draw) {
      svg.innerHTML = '';
      const proj = d3.geoOrthographic().scale(118).translate([150, 140]).rotate(rotate).clipAngle(90);
      const path = d3.geoPath(proj);
      el('path', { d: path({ type: 'Sphere' }), class: 'w-sphere' }, svg);
      draw(path, proj);
      el('path', { d: path({ type: 'Sphere' }), class: 'w-sphere-edge' }, svg);
      const np = proj([0, 90]);
      if (np) { el('circle', { cx: np[0], cy: np[1], r: 3.5, class: 'w-pole' }, svg); el('text', { x: np[0] + 6, y: np[1] - 6, class: 'w-small', text: '北極' }, svg); }
    }
    function lonName(l) {
      if (l === 0) return '本初經線（0°）';
      if (Math.abs(l) === 180) return '180° 經線';
      return (l > 0 ? '東經 ' : '西經 ') + Math.abs(l) + '°';
    }
    function latName(a) {
      const n = { 0: '赤道', 23.5: '北迴歸線', '-23.5': '南迴歸線', 66.5: '北極圈', '-66.5': '南極圈', 90: '北極點', '-90': '南極點' }[a];
      const deg = a === 0 ? '0°' : (a > 0 ? '北緯 ' : '南緯 ') + Math.abs(a) + '°';
      return n ? `${n}（${deg}）` : deg;
    }
    function drawMer() {
      const l = +lonIn.value;
      $('lonOut').textContent = lonName(l);
      globe($('mer'), [-(l - 35), -20], (path) => {
        for (let x = -180; x < 180; x += 30) el('path', { d: path(line(x)), class: 'w-faint' }, $('mer'));
        el('path', { d: path(line(null, 0)), class: 'w-faint-eq' }, $('mer'));
        el('path', { d: path(line(l)), class: 'w-hl-blue' }, $('mer'));
      });
      $('merRead').innerHTML = `<b>${lonName(l)}</b>：從北極連到南極的半圓，長度約 <b>20,004 公里</b>。<br>換成任何一條經線都一樣長 → <b>經線等長</b>。`;
    }
    function drawPar() {
      const a = +latIn.value;
      $('latOut').textContent = latName(a);
      globe($('par'), [-120, -28], (path) => {
        for (let y = -60; y <= 60; y += 30) el('path', { d: path(line(null, y)), class: 'w-faint' }, $('par'));
        if (Math.abs(a) < 90) el('path', { d: path(line(null, a)), class: 'w-hl-red' }, $('par'));
      });
      const len = 40075 * Math.cos(a * Math.PI / 180);
      const pct = Math.round(Math.cos(a * Math.PI / 180) * 100);
      $('bar').style.width = pct + '%';
      $('parRead').innerHTML = Math.abs(a) === 90
        ? `<b>${latName(a)}</b>：緯線縮成一個點，長度為 0。`
        : `<b>${latName(a)}</b>：一圈長約 <b>${Math.round(len).toLocaleString()} 公里</b>，是赤道的 <b>${pct}%</b>。<br>緯度愈高，緯線愈短 → <b>赤道最長</b>。`;
    }
    lonIn.addEventListener('input', drawMer);
    latIn.addEventListener('input', drawPar);
    body.querySelectorAll('[data-lat]').forEach((b) => b.addEventListener('click', () => { latIn.value = b.dataset.lat; drawPar(); }));
    drawMer(); drawPar();
  };

  // =====================================================================
  // 1-2 臺灣的經緯度位置
  // =====================================================================
  W['taiwan-position'] = function (host) {
    if (!ready() || !window.TW_TOPO) return;
    const body = frame(host, '🗺️ 臺灣的經緯度位置', '移動滑鼠看座標；點選極點看說明');
    const m = mercator([119.25, 21.8, 122.2, 25.45], 520, 28);
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 ${m.width} ${m.height}"></svg></div>
        <div class="w-side">
          <div class="w-read w-read-lg">把滑鼠移到地圖上</div>
          <div class="w-toggles">
            <label><input type="checkbox" data-t="grid" checked> 經緯線（每 1°）</label>
            <label><input type="checkbox" data-t="range"> 本島約略範圍（東經 120°～122°、北緯 22°～25°）</label>
            <label><input type="checkbox" data-t="tropic" checked> 北迴歸線（23.5°N）與通過的縣</label>
            <label><input type="checkbox" data-t="points" checked> 本島極點</label>
          </div>
          <p class="w-hint">北迴歸線以北屬<b>副熱帶</b>，以南屬<b>熱帶</b>。</p>
        </div>
      </div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    const g = {};
    ['counties', 'range', 'grid', 'tropic', 'points'].forEach((k) => { g[k] = el('g', { class: 'w-layer-' + k }, svg); });

    counties().forEach((f) => {
      const p = el('path', { d: m.path(f), class: 'w-county', 'data-name': f.name }, g.counties);
      if (f.name === '嘉義縣' || f.name === '花蓮縣') p.classList.add('w-tropic-county');
    });
    // 本島範圍
    const [rx0, ry0] = m.proj(120, 25), [rx1, ry1] = m.proj(122, 22);
    el('rect', { x: rx0, y: ry0, width: rx1 - rx0, height: ry1 - ry0, class: 'w-range' }, g.range);
    // 經緯線
    [120, 121, 122].forEach((lon) => {
      el('path', { d: m.line([[lon, 21.8], [lon, 25.45]]), class: 'w-grid' }, g.grid);
      const [x] = m.proj(lon, 21.8);
      el('text', { x, y: m.height - 8, class: 'w-small', 'text-anchor': 'middle', text: lon + '°E' }, g.grid);
    });
    [22, 23, 24, 25].forEach((lat) => {
      el('path', { d: m.line([[119.25, lat], [122.2, lat]]), class: 'w-grid' }, g.grid);
      const [, y] = m.proj(119.25, lat);
      el('text', { x: 4, y: y - 4, class: 'w-small', text: lat + '°N' }, g.grid);
    });
    // 北迴歸線
    el('path', { d: m.line([[119.25, 23.5], [122.2, 23.5]]), class: 'w-tropic' }, g.tropic);
    const [tx, ty] = m.proj(121.62, 23.5);
    el('text', { x: tx, y: ty - 6, class: 'w-label-red', text: '北迴歸線 23.5°N' }, g.tropic);
    // 極點
    const POINTS = [
      { name: '富貴角', lon: 121.54, lat: 25.30, dir: '極北', dx: -8, anchor: 'end', note: '新北市石門區，臺灣本島最北端。' },
      { name: '三貂角', lon: 122.00, lat: 25.01, dir: '極東', dx: -8, anchor: 'end', note: '新北市貢寮區，臺灣本島最東端，也是最早看到日出的地方之一。' },
      { name: '鵝鑾鼻', lon: 120.85, lat: 21.90, dir: '極南', dx: 8, anchor: 'start', note: '屏東縣恆春鎮，臺灣本島最南端一帶。' }
    ];
    POINTS.forEach((p) => {
      const [x, y] = m.proj(p.lon, p.lat);
      const grp = el('g', { class: 'w-point', tabindex: 0 }, g.points);
      el('circle', { cx: x, cy: y, r: 6 }, grp);
      el('text', { x: x + p.dx, y: y + 4, 'text-anchor': p.anchor, class: 'w-label', text: `${p.dir}・${p.name}` }, grp);
      const show = () => { read.innerHTML = `<b class="h">${p.dir}：${p.name}</b>${latlon(p.lon, p.lat, 2)}<br>${p.note}`; };
      grp.addEventListener('click', show);
      grp.addEventListener('focus', show);
    });

    svg.addEventListener('mousemove', (e) => {
      if (e.target.closest('.w-point')) return;
      const pt = svgPoint(svg, e);
      const [lon, lat] = m.invert(pt.x, pt.y);
      const c = e.target.closest('.w-county');
      const zone = lat > 23.5 ? '北迴歸線以北 → <b>副熱帶</b>' : '北迴歸線以南 → <b>熱帶</b>';
      read.innerHTML = `<b class="h">游標位置${c ? '：' + c.dataset.name : ''}</b>${latlon(lon, lat, 2)}<br>${zone}`;
    });
    body.querySelectorAll('[data-t]').forEach((cb) => {
      const apply = () => {
        g[cb.dataset.t].style.display = cb.checked ? '' : 'none';
        if (cb.dataset.t === 'tropic') svg.classList.toggle('show-tropic', cb.checked);
      };
      cb.addEventListener('change', apply); apply();
    });
  };

  // =====================================================================
  // 1-3 臺灣的相對位置
  // =====================================================================
  W['relative-position'] = function (host) {
    if (!ready() || !window.EASTASIA || !window.TW_TOPO) return;
    const body = frame(host, '🧭 臺灣的相對位置', '點選上方按鈕，切換五種描述方式');
    const m = mercator([100, 0, 145, 42], 640, 4);
    const MODES = [
      ['sea', '海陸位置'], ['near', '四周鄰近'], ['arc', '島弧位置'], ['plate', '板塊位置'], ['route', '交通位置']
    ];
    body.innerHTML = `
      <div class="w-tabs">${MODES.map(([k, t]) => `<button class="chip" data-m="${k}">${t}</button>`).join('')}</div>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 ${m.width} ${m.height}"></svg></div>
        <div class="w-side"><div class="w-read w-read-lg"></div></div>
      </div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    const arrowBlue = arrowMarker(svg, 'w-arrowhead-blue');
    const arrowRed = arrowMarker(svg, 'w-arrowhead-red');

    el('rect', { x: 0, y: 0, width: m.width, height: m.height, class: 'w-sea' }, svg);
    el('path', { d: m.path(EASTASIA), class: 'w-land' }, svg);
    el('path', { d: m.path(topojson.feature(TW_TOPO, TW_TOPO.objects.nation)), class: 'w-taiwan' }, svg);

    const text = (lon, lat, t, cls, parent) => { const [x, y] = m.proj(lon, lat); return el('text', { x, y, class: cls || 'w-label', 'text-anchor': 'middle', text: t }, parent); };
    const arrow = (a, b, parent, red) => { const p = m.proj(...a), q = m.proj(...b); return el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: red ? 'w-arrow-red' : 'w-arrow', 'marker-end': red ? arrowRed : arrowBlue }, parent); };

    const base = el('g', {}, svg);
    text(112, 27, '中國', 'w-label-muted', base);
    text(138.5, 36.8, '日本', 'w-label-muted', base);
    text(127.8, 36.4, '韓國', 'w-label-muted', base);
    text(123.5, 11.5, '菲律賓', 'w-label-muted', base);
    text(106.3, 15.5, '越南', 'w-label-muted', base);
    text(114, 13, '南海', 'w-label-sea', base);
    text(123.6, 23.2, '臺灣', 'w-label-red', base);

    const L = {};
    MODES.forEach(([k]) => { L[k] = el('g', { class: 'w-mode' }, svg); });

    // 海陸位置
    text(108, 34, '亞洲大陸', 'w-label-big', L.sea);
    text(134, 17, '太平洋', 'w-label-big-sea', L.sea);
    arrow([110, 32], [118.6, 24.8], L.sea);
    arrow([132, 18], [122.6, 22.8], L.sea);
    // 四周鄰近
    [[[121.4, 25.6], [122.3, 28.3], '北：東海'], [[122.4, 23.6], [126.5, 23.6], '東：太平洋'],
      [[120.8, 21.8], [120.6, 19.4], '南：巴士海峽'], [[119.9, 23.8], [117.3, 23.8], '西：臺灣海峽']]
      .forEach(([a, b]) => arrow(a, b, L.near, true));
    text(123.6, 29.2, '東海', 'w-label-sea', L.near);
    text(129.5, 24.2, '太平洋', 'w-label-sea', L.near);
    text(120.6, 18.3, '巴士海峽', 'w-label-sea', L.near);
    text(115.4, 22.4, '臺灣海峽', 'w-label-sea', L.near);
    text(117.6, 26.4, '福建', 'w-label-muted', L.near);
    // 島弧
    const arcPts = [[143, 41.5], [140.5, 37], [137, 34.2], [131.5, 31.5], [129, 28.5], [126.5, 25.8], [123.5, 24.3], [121, 23.6], [121.3, 19], [122.5, 15], [124.5, 11], [126, 7]];
    el('path', { d: d3.line().curve(d3.curveCatmullRom)(arcPts.map((p) => m.proj(...p))), class: 'w-arc' }, L.arc);
    text(140.5, 31, '日本群島', 'w-label', L.arc);
    text(132, 26.8, '琉球群島', 'w-label', L.arc);
    text(129.2, 14, '菲律賓群島', 'w-label', L.arc);
    text(132.5, 21, '西太平洋島弧', 'w-label-big-sea', L.arc);
    // 板塊（示意）
    const plate = [[137, 33.5], [132.5, 30.5], [129.5, 27.5], [126.5, 25.2], [123.5, 24.2], [121.6, 24.2], [121.3, 23.2], [121, 22], [120, 20.5], [119.6, 18], [119.8, 15.5], [120.2, 13]];
    el('path', { d: d3.line().curve(d3.curveCatmullRom)(plate.map((p) => m.proj(...p))), class: 'w-plate' }, L.plate);
    text(110, 32, '歐亞板塊', 'w-label-big', L.plate);
    text(131, 19.5, '菲律賓海板塊', 'w-label-big-sea', L.plate);
    arrow([129, 18.5], [125.2, 21.2], L.plate, true);
    text(127.8, 21.6, '向西北推擠', 'w-label-red', L.plate);
    text(126.5, 33.5, '紅色虛線：板塊交界（示意）', 'w-small', L.plate);
    // 交通
    const CITIES = [['東京', 139.7, 35.7], ['首爾', 127, 37.5], ['上海', 121.5, 31.2], ['香港', 114.2, 22.3], ['馬尼拉', 121, 14.6], ['曼谷', 100.5, 13.75], ['新加坡', 103.8, 1.35]];
    const tp = m.proj(121.5, 25.05);
    CITIES.forEach(([n, lon, lat]) => {
      const [x, y] = m.proj(lon, lat);
      el('path', { d: `M${tp[0]},${tp[1]} Q${(tp[0] + x) / 2},${Math.min(tp[1], y) - 25} ${x},${y}`, class: 'w-route' }, L.route);
      el('circle', { cx: x, cy: y, r: 4, class: 'w-city' }, L.route);
      el('text', { x: x + (lon < 105 ? 6 : 0), y: y - 8, class: 'w-label', 'text-anchor': lon < 105 ? 'start' : 'middle', text: n }, L.route);
    });

    const CAP = {
      sea: '臺灣位於<b>亞洲大陸東南方</b>、<b>太平洋西側</b>，處在<b>海陸交界</b>。<br>→ 冬、夏季風交替明顯（季風氣候）。',
      near: '北臨<b>東海</b>、東臨<b>太平洋</b>，南隔<b>巴士海峽</b>與菲律賓相望，西隔<b>臺灣海峽</b>與中國福建相望。',
      arc: '日本、琉球、臺灣、菲律賓排成一串弧形的島嶼，稱為<b>西太平洋島弧</b>，臺灣位在島弧的<b>中段</b>。',
      plate: '臺灣位於<b>歐亞板塊</b>與<b>菲律賓海板塊</b>的交界，菲律賓海板塊向西北推擠。<br>→ 地殼抬升、<b>多高山、多地震</b>。',
      route: '臺灣位在<b>東亞航線的中點</b>，往北到日本、韓國，往南到東南亞，距離都差不多。<br>→ 適合發展<b>海空運輸與轉運</b>。'
    };
    function setMode(k) {
      MODES.forEach(([key]) => { L[key].style.display = key === k ? '' : 'none'; });
      body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('active', b.dataset.m === k));
      read.innerHTML = CAP[k];
    }
    body.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
    setMode('sea');
  };

  // =====================================================================
  // 1-4 經度與時區
  // =====================================================================
  W['timezone'] = function (host) {
    if (!ready() || !window.LAND_TOPO) return;
    const body = frame(host, '🕐 世界時區與晝夜', '拖曳臺灣時間，看看世界各地現在幾點');
    const Wd = 960, k = Wd / 360, LAT0 = 78, LAT1 = -58, H = Math.round((LAT0 - LAT1) * k), TOP = 22, BOT = 26;
    body.innerHTML = `
      <div class="w-time-head">
        <span class="w-clock">臺灣時間 <b data-k="clock"></b></span>
        <input type="range" min="0" max="1425" step="15" value="840" data-k="t" aria-label="臺灣時間">
        <button class="chip" data-k="now">現在時間</button>
      </div>
      <div class="w-map w-map-wide"><svg viewBox="0 0 ${Wd} ${H + TOP + BOT}"></svg></div>
      <p class="w-hint">每一格是一個時區（經度 15°）。灰色區域為黑夜（以春分、秋分時的晝夜示意）。城市時間採標準時間，不含夏令時間。</p>
      <div class="w-calc">
        <div class="w-calc-title">🧮 時差計算機</div>
        <div class="w-calc-row">
          <span>地點 A</span><input type="number" min="0" max="180" value="120" data-k="a"><select data-k="ah"><option value="1">東經</option><option value="-1">西經</option></select>
          <span>地點 B</span><input type="number" min="0" max="180" value="0" data-k="b"><select data-k="bh"><option value="1">東經</option><option value="-1">西經</option></select>
        </div>
        <div class="w-chips">
          <button class="chip" data-p="120,1,0,1">臺北 ↔ 倫敦</button>
          <button class="chip" data-p="120,1,75,-1">臺北 ↔ 紐約</button>
          <button class="chip" data-p="120,1,135,1">臺北 ↔ 東京</button>
          <button class="chip" data-p="60,-1,30,-1">西經 60° ↔ 西經 30°</button>
        </div>
        <div class="w-read" data-k="calc"></div>
      </div>`;
    const $ = (s) => body.querySelector(`[data-k="${s}"]`);
    const svg = body.querySelector('svg');
    const proj = d3.geoEquirectangular().scale(k * 180 / Math.PI).translate([Wd / 2, LAT0 * k + TOP]).clipExtent([[0, TOP], [Wd, TOP + H]]);
    const path = d3.geoPath(proj);
    const X = (lon) => (lon + 180) * k;
    const Y = (lat) => (LAT0 - lat) * k + TOP;

    // 時區帶
    const bands = el('g', {}, svg);
    for (let n = -12; n <= 12; n++) {
      const a = Math.max(-180, n * 15 - 7.5), b = Math.min(180, n * 15 + 7.5);
      el('rect', { x: X(a), y: TOP, width: X(b) - X(a), height: H, class: 'w-band' + (n % 2 ? ' odd' : '') + (n === 8 ? ' tw' : '') }, bands);
      el('text', { x: (X(a) + X(b)) / 2, y: TOP + H + 17, class: 'w-tz' + (n === 8 ? ' tw' : ''), 'text-anchor': 'middle', text: (n > 0 ? '+' : '') + n }, bands);
    }
    el('text', { x: 4, y: TOP + H + 17, class: 'w-small', text: 'UTC' }, bands);
    el('path', { d: path(topojson.feature(LAND_TOPO, LAND_TOPO.objects.land)), class: 'w-land' }, svg);
    const night = el('g', {}, svg);
    // 特殊經線
    [[0, '本初經線 0°', 'w-prime'], [120, '120°E', 'w-tw-line'], [180, '180° 換日線', 'w-dateline']].forEach(([lon, t, cls]) => {
      el('line', { x1: X(lon) - (lon === 180 ? 1 : 0), x2: X(lon) - (lon === 180 ? 1 : 0), y1: TOP, y2: TOP + H, class: cls }, svg);
      el('text', { x: X(lon) + (lon === 180 ? -4 : 4), y: TOP - 6, 'text-anchor': lon === 180 ? 'end' : 'start', class: 'w-small', text: t }, svg);
    });
    const sun = el('text', { y: TOP + 16, class: 'w-sun', 'text-anchor': 'middle', text: '☀' }, svg);

    const CITIES = [
      ['臺北', 121.5, 25.0, 8, -12], ['東京', 139.7, 35.7, 9, -12], ['雪梨', 151.2, -33.9, 10, 18],
      ['杜拜', 55.3, 25.2, 4, -12], ['倫敦', -0.1, 51.5, 0, -12], ['紐約', -74, 40.7, -5, -12],
      ['洛杉磯', -118.2, 34, -8, 18], ['檀香山', -157.8, 21.3, -10, 18, 'start']
    ];
    const cityG = el('g', {}, svg);
    const labels = CITIES.map(([n, lon, lat, , dy, anchor]) => {
      el('circle', { cx: X(lon), cy: Y(lat), r: 4, class: n === '臺北' ? 'w-city tw' : 'w-city' }, cityG);
      return el('text', { x: X(lon) + (anchor ? -6 : 0), y: Y(lat) + dy, class: 'w-city-label', 'text-anchor': anchor || 'middle' }, cityG);
    });

    const pad = (n) => String(n).padStart(2, '0');
    function render() {
      const t = +$('t').value;
      $('clock').textContent = `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
      const utc = t / 60 - 8;
      // 太陽直射經度（正午），以晝夜平分示意
      const sub = ((((12 - utc) * 15) % 360) + 540) % 360 - 180;
      sun.setAttribute('x', X(sub));
      night.innerHTML = '';
      const anti = sub >= 0 ? sub - 180 : sub + 180;
      [[anti - 90, anti + 90]].forEach(([a, b]) => {
        const segs = [];
        if (a < -180) segs.push([a + 360, 180], [-180, b]);
        else if (b > 180) segs.push([a, 180], [-180, b - 360]);
        else segs.push([a, b]);
        segs.forEach(([s, e]) => el('rect', { x: X(s), y: TOP, width: X(e) - X(s), height: H, class: 'w-night' }, night));
      });
      CITIES.forEach(([n, , , off], i) => {
        let local = t + (off - 8) * 60;
        const day = Math.floor(local / 1440);
        local = ((local % 1440) + 1440) % 1440;
        labels[i].textContent = `${n} ${pad(Math.floor(local / 60))}:${pad(local % 60)}${day < 0 ? '（前一天）' : day > 0 ? '（隔天）' : ''}`;
      });
    }
    $('t').addEventListener('input', render);
    $('now').addEventListener('click', () => {
      const d = new Date();
      const twMin = ((d.getUTCHours() + 8) % 24) * 60 + d.getUTCMinutes();
      $('t').value = Math.floor(twMin / 15) * 15;
      render();
    });

    function calc() {
      const a = Math.min(180, Math.max(0, +$('a').value || 0)) * +$('ah').value;
      const b = Math.min(180, Math.max(0, +$('b').value || 0)) * +$('bh').value;
      const name = (v) => v === 0 ? '0°' : (v > 0 ? '東經 ' : '西經 ') + Math.abs(v) + '°';
      const sameSide = a * b >= 0;
      const diff = Math.abs(a - b);
      const hi = Math.max(Math.abs(a), Math.abs(b)), lo = Math.min(Math.abs(a), Math.abs(b));
      const step = sameSide
        ? `兩地同在東經或同在西經 → 經度<b>相減</b>：${hi} − ${lo} = <b>${diff}°</b>`
        : `兩地分在東經、西經 → 經度<b>相加</b>：${Math.abs(a)} + ${Math.abs(b)} = <b>${diff}°</b>`;
      const hrs = diff / 15;
      const hrsText = Number.isInteger(hrs) ? `${hrs} 小時` : `約 ${hrs.toFixed(1)} 小時（${Math.floor(hrs)} 小時 ${Math.round((hrs % 1) * 60)} 分）`;
      let res;
      if (diff === 0) res = '兩地經度相同，時間一樣。';
      else {
        const east = a > b ? 'A' : 'B';
        res = `${step}<br>時差 = ${diff} ÷ 15 = <b>${hrsText}</b><br>地點 ${east} 在東邊 → 地點 ${east} 的時間<b>比較早</b>（東早西晚）。`;
      }
      $('calc').innerHTML = `<b class="h">${name(a)} ↔ ${name(b)}</b>${res}`;
    }
    ['a', 'ah', 'b', 'bh'].forEach((s) => $(s).addEventListener('input', calc));
    body.querySelectorAll('[data-p]').forEach((btn) => btn.addEventListener('click', () => {
      const [a, ah, b, bh] = btn.dataset.p.split(',');
      $('a').value = a; $('ah').value = ah; $('b').value = b; $('bh').value = bh; calc();
    }));
    render(); calc();
  };

  // =====================================================================
  // 1-5 國家領域示意圖
  // =====================================================================
  W['territory'] = function (host) {
    const body = frame(host, '🌊 國家領域示意圖', '點選或指向各區域，看範圍與權利（距離未依比例）');
    body.innerHTML = `<div class="w-map w-map-wide"><svg viewBox="0 0 900 310"></svg></div><div class="w-read w-read-lg"></div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    const ZONES = {
      land: ['領土', '國家主權所及的陸地（包含島嶼）。', '擁有完整主權。'],
      air: ['領空', '領土與領海的上空。', '外國飛機未經許可不得進入。'],
      base: ['基線', '計算領海等範圍的起算線，通常是沿岸的低潮線，或連接海岸突出點的直線。', '領海、鄰接區、專屬經濟海域都從基線往外算。'],
      sea: ['領海', '從基線向外 <b>12 浬</b>（約 22.2 公里）。', '主權與領土相同；外國船隻可「無害通過」。'],
      cont: ['鄰接區', '從基線向外 <b>24 浬</b>（約 44.4 公里）以內、領海以外的海域。', '可執行<b>海關、移民、衛生、財政</b>等管制。'],
      eez: ['專屬經濟海域', '從基線向外 <b>200 浬</b>（約 370.4 公里）以內。', '享有<b>漁業、礦產</b>等海洋資源的探勘與開發權；其他國家的船隻、飛機仍可通行。'],
      high: ['公海', '不屬於任何國家的海域。', '各國都可自由航行、飛越、捕魚（須遵守國際規範）。']
    };
    const xs = { base: 190, sea: 280, cont: 370, eez: 780 };
    const g = el('g', {}, svg);
    el('rect', { x: 0, y: 0, width: 900, height: 150, class: 'w-sky' }, g);
    const zone = (key, attrs, tag) => { const n = el(tag || 'rect', Object.assign({ class: 'w-zone w-z-' + key, 'data-z': key, tabindex: 0 }, attrs), g); return n; };
    zone('air', { x: 0, y: 26, width: xs.sea, height: 112 });
    zone('high', { x: xs.eez, y: 150, width: 900 - xs.eez, height: 120 });
    zone('eez', { x: xs.cont, y: 150, width: xs.eez - xs.cont, height: 120 });
    zone('cont', { x: xs.sea, y: 150, width: xs.cont - xs.sea, height: 120 });
    zone('sea', { x: xs.base, y: 150, width: xs.sea - xs.base, height: 120 });
    zone('land', { d: `M0,270 L0,120 C40,95 80,100 110,118 C140,135 165,140 ${xs.base},150 L${xs.base},270 Z` }, 'path');
    el('line', { x1: xs.base, x2: xs.base, y1: 20, y2: 280, class: 'w-baseline' }, g);
    zone('base', { x: xs.base - 8, y: 150, width: 16, height: 120, class: 'w-zone w-z-base-hit' });
    const T = (x, y, t, cls) => el('text', { x, y, 'text-anchor': 'middle', class: cls || 'w-label', text: t }, g);
    T(xs.sea / 2, 80, '領空', 'w-label-big');
    T(90, 210, '領土', 'w-label-big');
    T((xs.base + xs.sea) / 2, 214, '領海');
    T((xs.sea + xs.cont) / 2, 214, '鄰接區');
    T((xs.cont + xs.eez) / 2, 214, '專屬經濟海域', 'w-label-big-sea');
    T((xs.eez + 900) / 2, 214, '公海');
    T(xs.base, 16, '基線', 'w-small');
    // 刻度尺
    el('line', { x1: xs.base, x2: 900, y1: 290, y2: 290, class: 'w-ruler' }, g);
    [[xs.base, '0'], [xs.sea, '12 浬'], [xs.cont, '24 浬'], [xs.eez, '200 浬']].forEach(([x, t]) => {
      el('line', { x1: x, x2: x, y1: 284, y2: 296, class: 'w-ruler' }, g);
      el('text', { x, y: 307, 'text-anchor': 'middle', class: 'w-small', text: t }, g);
    });
    g.querySelectorAll('.w-zone').forEach((n) => {
      const show = () => {
        const [name, range, right] = ZONES[n.dataset.z];
        g.querySelectorAll('.w-zone').forEach((o) => o.classList.toggle('active', o === n));
        read.innerHTML = `<b class="h">${name}</b>範圍：${range}<br>權利：${right}`;
      };
      n.addEventListener('mouseenter', show); n.addEventListener('click', show); n.addEventListener('focus', show);
    });
    read.innerHTML = '<b class="h">提示</b>把滑鼠移到圖上的領土、領空、領海、鄰接區、專屬經濟海域、公海或基線。';
  };

  // =====================================================================
  // 1-5 行政區地圖
  // =====================================================================
  W['admin-map'] = function (host) {
    if (!ready() || !window.TW_TOPO) return;
    const body = frame(host, '🏙️ 臺灣的行政區', '點選圖例凸顯類別；滑鼠指向縣市看名稱');
    const TYPE = {
      '臺北市': 'city6', '新北市': 'city6', '桃園市': 'city6', '臺中市': 'city6', '臺南市': 'city6', '高雄市': 'city6',
      '基隆市': 'city3', '新竹市': 'city3', '嘉義市': 'city3'
    };
    const ISLAND = ['澎湖縣', '金門縣', '連江縣'];
    const LABEL = { city6: '直轄市', city3: '市（省轄市）', county: '縣' };
    const m = mercator([118.15, 21.85, 122.1, 26.45], 520, 12);
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 ${m.width} ${m.height}"></svg></div>
        <div class="w-side">
          <div class="w-legend">
            <button class="w-leg" data-c="city6"><i class="w-sw city6"></i>直轄市 <b>6</b></button>
            <button class="w-leg" data-c="city3"><i class="w-sw city3"></i>市（省轄市）<b>3</b></button>
            <button class="w-leg" data-c="county"><i class="w-sw county"></i>縣 <b>13</b></button>
            <button class="w-leg" data-c="island"><i class="w-sw island"></i>離島縣 <b>3</b></button>
          </div>
          <div class="w-read w-read-lg">共 <b>22</b> 個縣市。點選左側圖例試試看。</div>
          <p class="w-hint">東沙群島、南沙群島（太平島）距離太遠，未畫在圖上，行政上屬於高雄市旗津區。</p>
        </div>
      </div>`;
    const svg = body.querySelector('svg');
    const read = body.querySelector('.w-read');
    const gMap = el('g', {}, svg), gLab = el('g', { class: 'w-names' }, svg);
    const feats = counties();
    feats.forEach((f) => {
      f.type2 = TYPE[f.name] || 'county';
      f.island = ISLAND.includes(f.name);
      f.node = el('path', { d: m.path(f), class: `w-adm ${f.type2}${f.island ? ' island' : ''}` }, gMap);
      const [cx, cy] = m.path.centroid(f);
      f.label = el('text', { x: cx, y: cy, 'text-anchor': 'middle', class: 'w-adm-label', text: f.name }, gLab);
      f.node.addEventListener('mouseenter', () => {
        read.innerHTML = `<b class="h">${LABEL[f.type2]}${f.island ? '・離島縣' : ''}</b>${f.name}`;
        f.label.classList.add('show');
      });
      f.node.addEventListener('mouseleave', () => { if (!f.label.classList.contains('keep')) f.label.classList.remove('show'); });
    });
    let current = null;
    body.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => {
      current = current === b.dataset.c ? null : b.dataset.c;
      body.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('active', x.dataset.c === current));
      const pick = (f) => current === 'island' ? f.island : f.type2 === current;
      feats.forEach((f) => {
        const on = current && pick(f);
        f.node.classList.toggle('dim', !!current && !on);
        f.label.classList.toggle('show', !!on); f.label.classList.toggle('keep', !!on);
      });
      if (!current) { read.innerHTML = '共 <b>22</b> 個縣市。點選左側圖例試試看。'; return; }
      const names = feats.filter(pick).map((f) => f.name);
      const memo = { city6: '口訣：北北桃中南高', city3: '口訣：基竹嘉', county: '', island: '位在臺灣本島以外的縣' }[current];
      read.innerHTML = `<b class="h">${current === 'island' ? '離島縣' : LABEL[current]}（${names.length}）</b>${names.join('、')}${memo ? '<br>' + memo : ''}`;
    }));
  };
})();
