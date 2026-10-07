// 看地圖猜國家：地圖找國家、看標示選國名、輪廓猜國家、國旗、首都、弱點國家
(function () {
  'use strict';
  const app = document.getElementById('app');
  const topo = window.WORLD_TOPO;
  const CONT = window.CONTINENTS;
  const W = 1000, H = 560;

  // ---------- 小工具 ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const store = {
    get(k, f) { try { const v = localStorage.getItem('wq:' + k); return v === null ? f : JSON.parse(v); } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem('wq:' + k, JSON.stringify(v)); } catch (e) { /* 略過 */ } }
  };
  const flag = (c, cls) => `<img class="${cls || 'flag'}" src="flags/${c.iso.toLowerCase()}.svg" alt="" loading="lazy">`;
  // 每次開新一輪或換頁就作廢舊的計時器，避免舊回合的延遲動作蓋掉新畫面
  let runToken = 0;
  const newRun = () => { const t = ++runToken; return () => t === runToken; };
  const later = (alive, fn, ms) => setTimeout(() => { if (alive()) fn(); }, ms);
  const fmtTime = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON_CHEVRON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  // ---------- 深淺色 ----------
  try { const t = localStorage.getItem('home:theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) { /* 略過 */ }
  document.getElementById('themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('home:theme', next); } catch (e) { /* 略過 */ }
  });

  // ---------- 國家資料 ----------
  const merge = window.COUNTRY_MERGE || {};
  const groups = {};
  topo.objects.countries.geometries.forEach((g) => {
    const n = merge[g.properties.name] || g.properties.name;
    (groups[n] = groups[n] || []).push(g);
  });
  const COUNTRIES = window.COUNTRY_ROWS.map((r) => {
    const c = { key: r[0], zh: r[1], en: r[2], cap: r[3], cont: r[4], iso: r[5], tier: r[6], alias: r[7] || '' };
    c.feature = { type: 'Feature', properties: { key: c.key }, geometry: topojson.merge(topo, groups[c.key]) };
    return c;
  });
  const BY = Object.fromEntries(COUNTRIES.map((c) => [c.key, c]));
  const TERRITORIES = Object.keys(groups).filter((n) => !BY[n]).map((n) => ({ type: 'Feature', properties: { name: n }, geometry: topojson.merge(topo, groups[n]) }));

  // 主要部分：去掉遠離本土的小島（例如法屬圭亞那、夏威夷），用於取景、輪廓與距離計算
  function polyArea(p) { const a = d3.geoArea(p); return a > 2 * Math.PI ? 4 * Math.PI - a : a; }
  function gapDeg(a, b) {
    let [a0, a1] = [a[0][0], a[1][0]], [b0, b1] = [b[0][0], b[1][0]];
    if (a1 < a0) a1 += 360; if (b1 < b0) b1 += 360;
    let lon = Infinity;
    for (const s of [-360, 0, 360]) lon = Math.min(lon, Math.max(0, Math.max(a0, b0 + s) - Math.min(a1, b1 + s)));
    const lat = Math.max(0, Math.max(a[0][1], b[0][1]) - Math.min(a[1][1], b[1][1]));
    return Math.max(lon * Math.cos(((a[0][1] + a[1][1]) / 2) * Math.PI / 180), lat);
  }
  function mainPart(c) {
    if (c._main) return c._main;
    const g = c.feature.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    const info = polys.map((coords) => { const p = { type: 'Polygon', coordinates: coords }; return { coords, area: polyArea(p), b: d3.geoBounds(p) }; });
    const big = info.reduce((m, x) => (x.area > m.area ? x : m), info[0]);
    const kept = new Set([big]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const x of info) {
        if (kept.has(x)) continue;
        if (x.area >= big.area * 0.25 || [...kept].some((k) => gapDeg(k.b, x.b) <= 4)) { kept.add(x); grew = true; }
      }
    }
    const trim = (window.COUNTRY_TRIM || {})[c.key];
    const inTrim = (x) => {
      if (!trim) return true;
      const [lon, lat] = d3.geoCentroid({ type: 'Polygon', coordinates: x.coords });
      return lon >= trim[0][0] && lon <= trim[1][0] && lat >= trim[0][1] && lat <= trim[1][1];
    };
    c._main = { type: 'Feature', properties: { key: c.key }, geometry: { type: 'MultiPolygon', coordinates: info.filter((x) => kept.has(x) && inTrim(x)).map((x) => x.coords) } };
    return c._main;
  }
  const center = (c) => (c._center = c._center || d3.geoCentroid(mainPart(c)));
  const distKm = (a, b) => d3.geoDistance(center(a), center(b)) * 6371;
  function bearing(a, b) {
    const [l1, p1] = center(a).map((v) => v * Math.PI / 180), [l2, p2] = center(b).map((v) => v * Math.PI / 180);
    const y = Math.sin(l2 - l1) * Math.cos(p2), x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(l2 - l1);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  const ARROWS = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
  const arrow = (deg) => ARROWS[Math.round(deg / 45) % 8];
  const DIRS = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
  const dirWord = (deg) => DIRS[Math.round(deg / 45) % 8];
  const dirSvg = (deg) => `<svg class="dir" viewBox="0 0 24 24" role="img" aria-label="往${dirWord(deg)}方" style="transform:rotate(${Math.round(deg)}deg)"><path d="M12 20V4M12 4l-6 6M12 4l6 6"/></svg>`;

  // ---------- 設定（範圍、難度、題數） ----------
  const REGIONS = [['ALL', '全世界'], ['AS', '亞洲'], ['EU', '歐洲'], ['AF', '非洲'], ['NA', '北美洲'], ['SA', '南美洲'], ['OC', '大洋洲']];
  const LEVELS = [[1, '簡單'], [2, '普通'], [3, '困難']];
  const COUNTS = [[10, '10 題'], [20, '20 題'], [0, '全部']];
  const NAME = { region: Object.fromEntries(REGIONS), level: Object.fromEntries(LEVELS), count: Object.fromEntries(COUNTS) };
  const settings = Object.assign({ region: 'ALL', level: 1, count: 10 }, store.get('settings', {}));
  function pool(s) {
    s = s || settings;
    const inRegion = COUNTRIES.filter((c) => s.region === 'ALL' || c.cont === s.region);
    const p = inRegion.filter((c) => c.tier <= s.level);
    return p.length >= 4 ? p : inRegion;
  }
  const settingsKey = () => `${settings.region}-${settings.level}-${settings.count}`;
  let settingsOpen = false, setSeq = 0;
  // 遊戲中設定收成一顆摘要按鈕；已經開始作答時，改設定前先確認，避免誤觸清空整輪
  function settingsBar(onChange, opts) {
    opts = opts || {};
    const id = 'setp' + (++setSeq);
    const el = document.createElement('div');
    el.className = 'settings-wrap';
    const n = pool().length;
    const widened = pool().some((c) => c.tier > settings.level);
    const summary = `${NAME.region[settings.region]}・${NAME.level[settings.level]}${opts.noCount ? '' : '・' + NAME.count[settings.count]}`;
    const row = (lbl, list, k) => `<div class="grp" role="group" aria-label="${lbl}"><span class="lbl">${lbl}</span>${list.map(([v, t]) => `<button type="button" class="chip${settings[k] === v ? ' active' : ''}" aria-pressed="${settings[k] === v}" data-k="${k}" data-v="${v}">${t}</button>`).join('')}</div>`;
    el.innerHTML = `<div class="set-bar"><button type="button" class="set-toggle" aria-expanded="${settingsOpen}" aria-controls="${id}"><span class="muted">範圍</span><b>${summary}</b>${ICON_CHEVRON}</button>
        <span class="info">題庫 ${n} 國${widened ? '（國家較少，已含所有難度）' : ''}</span></div>
      <div class="settings" id="${id}"${settingsOpen ? '' : ' hidden'}>${row('範圍', REGIONS, 'region')}${row('難度', LEVELS, 'level')}${opts.noCount ? '' : row('題數', COUNTS, 'count')}
        <div class="set-confirm" role="alert" hidden></div></div>`;
    const panel = el.querySelector('.settings'), toggle = el.querySelector('.set-toggle'), confirmEl = el.querySelector('.set-confirm');
    toggle.addEventListener('click', () => { settingsOpen = panel.hidden; panel.hidden = !settingsOpen; toggle.setAttribute('aria-expanded', String(settingsOpen)); });
    const apply = (k, v) => { settings[k] = v; store.set('settings', settings); onChange(); };
    el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.k, v = k === 'region' ? b.dataset.v : +b.dataset.v;
      if (settings[k] === v) return;
      const done = opts.inProgress ? opts.inProgress() : 0;
      if (!done) return apply(k, v);
      confirmEl.hidden = false;
      confirmEl.innerHTML = `<span>改成「${NAME[k][v]}」會重新開始這一輪，已作答的 ${done} 題不會保留。</span>
        <button type="button" class="btn small primary" data-c="yes">重新開始</button><button type="button" class="btn small" data-c="no">繼續目前這一輪</button>`;
      confirmEl.querySelector('[data-c="yes"]').addEventListener('click', () => apply(k, v));
      confirmEl.querySelector('[data-c="no"]').addEventListener('click', () => { confirmEl.hidden = true; });
      confirmEl.querySelector('[data-c="no"]').focus();
    }));
    return el;
  }

  // ---------- 紀錄 ----------
  function logResult(key, ok) {
    const s = store.get('perf', {});
    const r = s[key] || [0, 0];
    r[0]++; if (!ok) r[1]++;
    s[key] = r; store.set('perf', s);
  }
  // 我的世界地圖：答對過 1 次＝認識；答對 3 次以上且正確率 ≥ 75%＝熟悉
  function knownMap() {
    const out = new Map();
    for (const [k, v] of Object.entries(store.get('perf', {}))) {
      const right = v[0] - v[1];
      if (BY[k] && right >= 1) out.set(k, right >= 3 && right / v[0] >= 0.75 ? 2 : 1);
    }
    return out;
  }
  const newlyKnown = (before) => [...knownMap().keys()].filter((k) => !before.has(k)).map((k) => BY[k]);
  // 弱點國家：答錯過、而且還沒熟悉的國家，錯得越多越前面
  function weakList() {
    const known = knownMap();
    return Object.entries(store.get('perf', {}))
      .filter(([k, v]) => BY[k] && v[1] > 0 && known.get(k) !== 2)
      .sort((a, b) => (b[1][1] / b[1][0]) - (a[1][1] / a[1][0]) || b[1][1] - a[1][1])
      .map(([k]) => BY[k]);
  }
  let pendingPool = null;
  function goWeak(list) {
    pendingPool = list && list.length ? list : null;
    if (location.hash === '#weak') route(); else location.hash = '#weak';
  }
  let stampSeq = 0;
  function stamp(o) {
    const id = 'st' + (++stampSeq);
    const bigSize = String(o.big).length > 5 ? 26 : 32;
    return `<svg class="stamp${o.record ? ' record' : ''}" viewBox="0 0 200 200" role="img" aria-label="${esc(o.top)}：${esc(o.big)}">
      <defs>
        <path id="${id}a" d="M 30 100 A 70 70 0 0 1 170 100"/><path id="${id}b" d="M 22 100 A 78 78 0 0 0 178 100"/>
        <filter id="${id}f"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${stampSeq % 7}"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter>
      </defs>
      <g filter="url(#${id}f)">
        <circle cx="100" cy="100" r="92" class="st-ring"/><circle cx="100" cy="100" r="85" class="st-ring thin"/><circle cx="100" cy="100" r="57" class="st-ring thin"/>
        <text class="st-arc"><textPath href="#${id}a" startOffset="50%" text-anchor="middle">${esc(o.top)}</textPath></text>
        <text class="st-arc"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${esc(o.bottom)}</textPath></text>
        <text x="100" y="100" class="st-big" font-size="${bigSize}" text-anchor="middle" dominant-baseline="central">${esc(o.big)}</text>
        <text x="100" y="134" class="st-small" text-anchor="middle">${esc(o.small)}</text>
      </g></svg>`;
  }
  function saveBest(mode, score, extra) {
    const all = store.get('best', {}), k = mode + ':' + settingsKey(), prev = all[k];
    const better = !prev || score > prev.score || (score === prev.score && extra && prev.time && extra.time < prev.time);
    if (better) { all[k] = Object.assign({ score, at: Date.now() }, extra); store.set('best', all); }
    return { prev, better };
  }

  // ---------- 互動地圖 ----------
  const VIEWS = {
    AS: [[26, -11], [146, 55]], EU: [[-25, 34], [45, 71]], AF: [[-26, -36], [58, 38]],
    NA: [[-168, 7], [-52, 72]], SA: [[-82, -56], [-34, 13]], OC: [[112, -48], [192, 12]]
  };
  // opts: region, active（題庫國家）, clickable, onPick(key, point), tall（手機上加高地圖）, scrollFriendly（單指可捲動頁面）, keyboard（方向鍵選國家）
  function makeMap(host, opts) {
    opts = opts || {};
    const region = opts.region || 'ALL';
    const narrow = (host.clientWidth || 1000) < 640;
    const Hm = narrow && opts.tall ? Math.round(W * 0.92) : H;
    const proj = d3.geoNaturalEarth1();
    if (region === 'ALL') {
      if (narrow && opts.tall) { const h = Hm - 12; proj.rotate([-10, 0]).fitExtent([[W / 2 - h * 0.98, 6], [W / 2 + h * 0.98, Hm - 6]], { type: 'Sphere' }); }
      else proj.rotate([-10, 0]).fitExtent([[6, 6], [W - 6, Hm - 6]], { type: 'Sphere' });
    } else {
      const [[x0, y0], [x1, y1]] = VIEWS[region];
      proj.rotate([-(x0 + x1) / 2, 0]).fitExtent([[16, 16], [W - 16, Hm - 16]], { type: 'MultiPoint', coordinates: [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]] });
    }
    const path = d3.geoPath(proj);
    const touch = matchMedia('(pointer: coarse)').matches;
    const hint = opts.scrollFriendly ? (touch ? '雙指縮放與移動地圖' : '按住 Ctrl＋滾輪縮放、拖曳移動') : (touch ? '雙指縮放、拖曳移動' : '滾輪縮放、拖曳移動') + (opts.keyboard ? '・鍵盤：方向鍵選國家、Enter 作答' : '');
    host.innerHTML = `<div class="map-box${opts.clickable ? ' clickable' : ''}"><svg viewBox="0 0 ${W} ${Hm}" role="${opts.keyboard ? 'application' : 'img'}" aria-label="${esc(opts.label || '世界地圖')}"></svg>
      <div class="map-tools"><button type="button" data-z="in" aria-label="放大地圖" title="放大">＋</button><button type="button" data-z="out" aria-label="縮小地圖" title="縮小">－</button><button type="button" data-z="reset" aria-label="重設地圖視野" title="重設">⟲</button></div>
      <div class="map-hint">${hint}</div></div>`;
    const box = host.querySelector('.map-box'), svg = d3.select(box.querySelector('svg'));
    const g = svg.append('g');
    g.append('path').attr('class', 'sphere').attr('d', path({ type: 'Sphere' }));
    g.append('g').selectAll('path').data(TERRITORIES).join('path').attr('class', 'ter').attr('d', path);
    const active = new Set((opts.active || COUNTRIES).map((c) => c.key));
    const paths = {}, marks = {};
    g.append('g').selectAll('path').data(COUNTRIES).join('path')
      .attr('class', (c) => 'c' + (active.has(c.key) ? '' : ' off')).attr('d', (c) => path(c.feature))
      .each(function (c) { paths[c.key] = this; });
    // 太小的國家加上圓圈，方便看見與點選
    const small = COUNTRIES.filter((c) => { const b = path.bounds(mainPart(c)); return Math.max(b[1][0] - b[0][0], b[1][1] - b[0][1]) < 7; });
    const R = narrow ? 9 : 6;
    const mk = g.append('g').selectAll('circle').data(small).join('circle')
      .attr('class', (c) => 'mk' + (active.has(c.key) ? '' : ' off'))
      .attr('cx', (c) => path.centroid(mainPart(c))[0]).attr('cy', (c) => path.centroid(mainPart(c))[1]).attr('r', R)
      .each(function (c) { marks[c.key] = this; });
    const fx = g.append('g');
    const sb = path.bounds({ type: 'Sphere' });
    const minK = Math.min(1, (W - 12) / (sb[1][0] - sb[0][0]));
    let k = 1;
    const zoom = d3.zoom().scaleExtent([minK, 40])
      .translateExtent([[Math.min(sb[0][0], 0) - W * 0.15, -Hm * 0.2], [Math.max(sb[1][0], W) + W * 0.15, Hm * 1.2]])
      .on('zoom', (e) => {
        k = e.transform.k; g.attr('transform', e.transform); mk.attr('r', R / k); fx.selectAll('.ring').attr('r', 14 / k);
        fx.selectAll('.pin').attr('transform', function () { return `translate(${this.__xy[0]},${this.__xy[1]}) scale(${1 / k})`; });
      });
    // 首頁地圖：單指與一般滾輪交給頁面捲動，避免卡住
    if (opts.scrollFriendly) zoom.filter((e) => (e.type === 'wheel' ? e.ctrlKey : e.touches ? e.touches.length > 1 : !e.button));
    svg.call(zoom).on('dblclick.zoom', null);
    if (opts.scrollFriendly) svg.style('touch-action', 'pan-x pan-y');
    const home = (ms) => svg.transition().duration(calm() ? 0 : ms || 450).call(zoom.transform, d3.zoomIdentity);
    box.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
      const z = b.dataset.z;
      if (z === 'reset') home(400);
      else svg.transition().duration(250).call(zoom.scaleBy, z === 'in' ? 1.6 : 1 / 1.6);
    }));
    // 點擊（拖曳時不算點擊）
    if (opts.onPick) {
      let down = null;
      svg.on('pointerdown.pick', (e) => { down = [e.clientX, e.clientY]; });
      svg.on('click.pick', (e) => {
        if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
        const el = e.target.closest('.c, .mk');
        if (!el) return;
        opts.onPick(d3.select(el).datum().key, { x: e.clientX, y: e.clientY });
      });
    }
    const pointOf = (key) => {
      const el = paths[key], m = marks[key];
      const r = (m && m.getBoundingClientRect().width > 0 ? m : el).getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    // 鍵盤：方向鍵在國家之間移動游標（依地圖上的位置），Enter 作答
    if (opts.keyboard && opts.onPick) {
      const node = svg.node();
      node.setAttribute('tabindex', '0');
      const cands = COUNTRIES.filter((c) => active.has(c.key)).map((c) => ({ c, p: path.centroid(mainPart(c)) })).filter((x) => isFinite(x.p[0]));
      let cur = null;
      const show = (x) => {
        if (cur) api.cls(cur.c.key, 'kcur', false);
        cur = x; api.cls(x.c.key, 'kcur');
        const t = d3.zoomTransform(node), sx = t.applyX(x.p[0]), sy = t.applyY(x.p[1]);
        if (sx < 40 || sx > W - 40 || sy < 40 || sy > Hm - 40) svg.transition().duration(calm() ? 0 : 300).call(zoom.translateTo, x.p[0], x.p[1]);
      };
      node.addEventListener('focus', () => {
        if (cur) return;
        const t = d3.zoomTransform(node), cx = t.invertX(W / 2), cy = t.invertY(Hm / 2);
        show(cands.reduce((m, x) => (Math.hypot(x.p[0] - cx, x.p[1] - cy) < Math.hypot(m.p[0] - cx, m.p[1] - cy) ? x : m), cands[0]));
      });
      node.addEventListener('blur', () => { if (cur) { api.cls(cur.c.key, 'kcur', false); cur = null; } });
      node.addEventListener('keydown', (e) => {
        const dirs = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (dirs[e.key] && cur) {
          e.preventDefault();
          const [dx, dy] = dirs[e.key];
          let best = null, bestScore = Infinity;
          for (const x of cands) {
            if (x === cur) continue;
            const vx = x.p[0] - cur.p[0], vy = x.p[1] - cur.p[1], d = Math.hypot(vx, vy);
            const along = (vx * dx + vy * dy) / (d || 1);
            if (along < 0.5) continue;
            const score = d * (2 - along);
            if (score < bestScore) { bestScore = score; best = x; }
          }
          if (best) show(best);
        } else if ((e.key === 'Enter' || e.key === ' ') && cur) {
          e.preventDefault();
          opts.onPick(cur.c.key, pointOf(cur.c.key));
        } else if (e.key === '+' || e.key === '=') svg.transition().duration(200).call(zoom.scaleBy, 1.5);
        else if (e.key === '-') svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.5);
      });
    }
    const api = {
      box, proj, path, home, pointOf,
      cls(key, name, on) { if (paths[key]) paths[key].classList.toggle(name, on !== false); if (marks[key]) marks[key].classList.toggle(name, on !== false); },
      clear(name) { box.querySelectorAll('.' + name).forEach((el) => el.classList.remove(name)); },
      ring(key) { fx.selectAll('.ring').remove(); if (!key) return; const [x, y] = path.centroid(mainPart(BY[key])); fx.append('circle').attr('class', 'ring').attr('cx', x).attr('cy', y).attr('r', 14 / k); },
      focus(key, span) {
        const b = path.bounds(mainPart(BY[key]));
        const dx = Math.max(b[1][0] - b[0][0], 1), dy = Math.max(b[1][1] - b[0][1], 1);
        const s = Math.max(1, Math.min(span || 8, 0.4 / Math.max(dx / W, dy / Hm)));
        const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
        svg.transition().duration(calm() ? 0 : 650).call(zoom.transform, d3.zoomIdentity.translate(W / 2, Hm / 2).scale(s).translate(-cx, -cy));
      },
      el(key) { return paths[key]; },
      // 依熟悉程度上色（我的世界地圖）
      paint(levels) {
        COUNTRIES.forEach((c) => { const lv = levels.get(c.key) || 0; this.cls(c.key, 'm1', lv === 1); this.cls(c.key, 'm2', lv === 2); });
      },
      // 在國家上插一面小旗子標籤
      pin(key, ms) {
        const c = BY[key], [x, y] = path.centroid(mainPart(c));
        const gp = fx.append('g').attr('class', 'pin').attr('transform', `translate(${x},${y}) scale(${1 / k})`);
        gp.node().__xy = [x, y];
        const inner = gp.append('g').attr('class', 'pin-in');
        inner.append('circle').attr('class', 'pin-dot').attr('r', 4);
        const lab = inner.append('g');
        const bg = lab.append('rect').attr('class', 'pin-bg').attr('rx', 8).attr('height', 26).attr('y', -40);
        lab.append('image').attr('href', `flags/${c.iso.toLowerCase()}.svg`).attr('x', 9).attr('y', -33.5).attr('width', 17).attr('height', 12.75).attr('preserveAspectRatio', 'none');
        const t = lab.append('text').attr('class', 'pin-tx').attr('x', 32).attr('y', -22.5).text(c.zh);
        const w = 32 + t.node().getComputedTextLength() + 10;
        bg.attr('width', w); lab.attr('transform', `translate(${-w / 2},0)`);
        lab.append('path').attr('class', 'pin-bg').attr('d', 'M -5 -14.5 L 0 -8 L 5 -14.5 Z').attr('transform', `translate(${w / 2},0)`);
        setTimeout(() => { gp.classed('out', true); setTimeout(() => gp.remove(), 300); }, ms || 1300);
      },
      tip(text, pt) {
        let t = box.querySelector('.tip');
        if (!t) { t = document.createElement('div'); t.className = 'tip'; t.setAttribute('aria-hidden', 'true'); box.appendChild(t); }
        const r = box.getBoundingClientRect();
        t.style.left = Math.min(Math.max(pt.x - r.left, 60), r.width - 60) + 'px';
        t.style.top = Math.min(Math.max(pt.y - r.top, 44), r.height - 8) + 'px';
        t.textContent = text; t.style.display = '';
        clearTimeout(t._h); t._h = setTimeout(() => { t.style.display = 'none'; }, 1400);
      }
    };
    return api;
  }

  // ---------- 自動完成輸入（輪廓猜國家用） ----------
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/台/g, '臺').replace(/[\s.'’\-(),]/g, '');
  const SEARCH = COUNTRIES.map((c) => ({ c, keys: [c.zh, c.en, c.key].concat(c.alias.split(/\s+/)).filter(Boolean).map(norm) }));
  function suggest(q, exclude) {
    q = norm(q);
    if (!q) return [];
    return SEARCH.filter((s) => !exclude.has(s.c.key) && s.keys.some((k) => k.includes(q)))
      .sort((a, b) => (b.keys.some((k) => k.startsWith(q)) - a.keys.some((k) => k.startsWith(q))) || a.c.zh.length - b.c.zh.length)
      .slice(0, 8).map((s) => s.c);
  }
  let acSeq = 0;
  function makeAutocomplete(host, o) {
    const id = 'ac' + (++acSeq);
    host.innerHTML = `<div class="guess-box"><input type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}" placeholder="${esc(o.placeholder)}" autocomplete="off" spellcheck="false" aria-label="${esc(o.label)}">
      <button type="button" class="btn primary">${esc(o.button)}</button><ul class="suggest" id="${id}" role="listbox" aria-label="符合的國家" hidden></ul></div>`;
    const input = host.querySelector('input'), btn = host.querySelector('button'), list = host.querySelector('ul');
    let opts = [], sel = 0;
    const exclude = () => new Set(o.exclude ? o.exclude() : []);
    function render() {
      list.innerHTML = opts.map((c, i) => `<li role="option" id="${id}-${i}" aria-selected="${i === sel}" class="${i === sel ? 'on' : ''}" data-i="${i}">${flag(c)} ${esc(c.zh)} <small>${esc(c.en)}</small></li>`).join('');
      list.hidden = !opts.length;
      input.setAttribute('aria-expanded', String(!!opts.length));
      if (opts.length) input.setAttribute('aria-activedescendant', `${id}-${sel}`); else input.removeAttribute('aria-activedescendant');
      list.querySelectorAll('li').forEach((li) => li.addEventListener('mousedown', (e) => { e.preventDefault(); choose(opts[+li.dataset.i]); }));
    }
    function close() { opts = []; render(); }
    function choose(c) { if (!c) return; input.value = ''; close(); o.onPick(c); }
    input.addEventListener('input', () => { opts = suggest(input.value, exclude()); sel = 0; render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, opts.length - 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); render(); e.preventDefault(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (opts[sel]) choose(opts[sel]); }
      else if (e.key === 'Escape') close();
    });
    input.addEventListener('blur', () => setTimeout(close, 100));
    btn.addEventListener('click', () => {
      if (opts[sel]) return choose(opts[sel]);
      opts = suggest(input.value, exclude()); sel = 0;
      if (opts.length === 1) choose(opts[0]); else { render(); input.focus(); }
    });
    return { input, focus: () => input.focus({ preventScroll: true }), disable(v) { input.disabled = v; btn.disabled = v; } };
  }

  // ---------- 遊戲畫面骨架 ----------
  // 狀態列＋規則／回饋列（aria-live，讀屏會念出作答結果）
  function hudShell(rule) {
    const hud = document.createElement('div'); hud.className = 'hud';
    const toast = document.createElement('p'); toast.className = 'toast rule'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
    toast.textContent = rule;
    const say = (cls, html) => { toast.className = 'toast ' + cls; toast.innerHTML = html; };
    return { hud, toast, say };
  }
  const statsHtml = (items) => `<div class="stats">${items.map(([lbl, val, cls]) => `<span class="stat${cls ? ' ' + cls : ''}">${lbl} <b>${val}</b></span>`).join('')}</div>`;

  // ---------- 結算畫面 ----------
  function showResult(host, o) {
    const fresh = o.fresh || [], missed = o.missed || [];
    const total = knownMap().size;
    const badge = o.record ? '<p class="res-badge rec">刷新個人紀錄</p>' : o.first ? '<p class="res-badge">第一次完成這個範圍，紀錄已建立</p>' : '';
    host.innerHTML = `<div class="panel result">
      ${stamp({ top: o.title, bottom: today().replace(/-/g, '.'), big: o.big, small: o.small || '', record: o.record })}
      <p class="res-score">${o.line}</p>${badge}
      ${fresh.length ? `<div class="res-block good"><h3>這一輪新認識了 ${fresh.length} 個國家</h3><div class="review">${fresh.map((c) => `<span class="fresh">${flag(c)} ${esc(c.zh)}</span>`).join('')}</div>
        <p class="muted">已在你的世界地圖上著色，目前一共認識 ${total} / ${COUNTRIES.length} 國。</p></div>` : ''}
      ${missed.length ? `<div class="res-block"><h3>還不熟的 ${missed.length} 個國家</h3><div class="review">${missed.map((c) => `<span>${flag(c)} ${esc(c.zh)}</span>`).join('')}</div>
        <button type="button" class="btn" data-a="drill">只練這 ${missed.length} 國</button></div>` : '<p class="res-block muted">這一輪一題都沒錯。</p>'}
      <div class="actions"><button type="button" class="btn primary" data-a="again">再玩一次</button><a class="btn" href="#home">看我的世界地圖</a></div></div>`;
    host.querySelector('[data-a="again"]').addEventListener('click', o.again);
    const d = host.querySelector('[data-a="drill"]'); if (d) d.addEventListener('click', () => goWeak(missed));
    host.querySelector('[data-a="again"]').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' });
  }

  // ---------- 模式：地圖找國家 ----------
  function modeFind() {
    let timer = null;
    function start() {
      clearInterval(timer);
      const alive = newRun();
      const list = shuffle(pool());
      const qs = settings.count ? list.slice(0, settings.count) : list;
      let i = 0, tries = 0, firstRight = 0, busy = false, streak = 0;
      const missed = [], t0 = Date.now(), before = knownMap();
      app.innerHTML = '';
      app.appendChild(settingsBar(start, { inProgress: () => i }));
      const { hud, toast, say } = hudShell('每題有 3 次機會。點錯會告訴你點到哪一國，第二次點錯會給方向提示。');
      app.appendChild(hud); app.appendChild(toast);
      const mapHost = document.createElement('div'); app.appendChild(mapHost);
      const map = makeMap(mapHost, { region: settings.region, active: pool(), clickable: true, onPick, tall: true, keyboard: true, label: '世界地圖：找出題目指定的國家' });
      function draw() {
        const c = qs[i];
        hud.innerHTML = `<div class="prompt">請點選：${esc(c.zh)}<small>${esc(c.en)}</small></div>
          ${statsHtml([['第', `${i + 1}<small> / ${qs.length}</small>`], ['一次答對', firstRight], ['連對', streak, streak >= 3 ? 'hot' : ''], ['用時', `<span class="tm">${fmtTime(Date.now() - t0)}</span>`]])}
          <button type="button" class="chip" data-a="skip">跳過這題</button>`;
        hud.querySelector('[data-a="skip"]').addEventListener('click', () => { if (!busy) fail(); });
      }
      timer = setInterval(() => { const el = hud.querySelector('.tm'); if (el) el.textContent = fmtTime(Date.now() - t0); }, 1000);
      function next(reset) {
        busy = false; tries = 0; i++;
        if (i >= qs.length) return finish();
        if (reset) map.home();
        draw();
      }
      function fail() {
        const c = qs[i];
        busy = true; missed.push(c); logResult(c.key, false); streak = 0;
        map.cls(c.key, 'fail'); map.cls(c.key, 'blink'); map.ring(c.key); map.focus(c.key, 5);
        say('bad', `答案在這裡：${esc(c.zh)}（${CONT[c.cont]}）`);
        later(alive, () => { map.cls(c.key, 'blink', false); map.ring(null); next(true); }, 2400);
      }
      function onPick(key, pt) {
        if (busy) return;
        const c = qs[i];
        if (key === c.key) {
          busy = true;
          map.cls(key, ['ok1', 'ok2', 'ok3'][tries]);
          map.pin(key, 1500);
          if (tries === 0) { firstRight++; streak++; } else { missed.push(c); streak = 0; }
          logResult(key, tries === 0);
          say('ok', `✔ ${esc(c.zh)}` + (tries ? `（第 ${tries + 1} 次才找到）` : streak >= 3 ? `　連續 ${streak} 題一次就找到` : ''));
          later(alive, () => next(false), 1200);
          return;
        }
        tries++;
        const w = BY[key];
        map.cls(key, 'wrongflash'); setTimeout(() => map.cls(key, 'wrongflash', false), 600);
        map.tip(`這是 ${w.zh}`, pt);
        // 第二次點錯：給一個真正的地理提示，而不只是「錯」
        say('bad', tries === 2
          ? `提示：${esc(c.zh)} 在 ${esc(w.zh)} 的${dirWord(bearing(w, c))}方，約 ${(Math.round(distKm(w, c) / 100) * 100).toLocaleString()} 公里。最後一次機會`
          : `✘ 這是 ${esc(w.zh)}，還有 ${3 - tries} 次機會`);
        if (tries >= 3) fail();
      }
      function finish() {
        clearInterval(timer);
        const ms = Date.now() - t0, pct = Math.round(firstRight / qs.length * 100);
        const r = saveBest('find', pct, { time: ms });
        showResult(app, { title: '地圖找國家', big: pct + '%', small: fmtTime(ms), line: `一次答對 ${firstRight} / ${qs.length} 題・用時 ${fmtTime(ms)}`, record: r.better && r.prev, first: !r.prev, missed: [...new Set(missed)], fresh: newlyKnown(before), again: start });
      }
      draw();
    }
    start();
    return () => clearInterval(timer);
  }

  // ---------- 選擇題共用（看標示、國旗、首都、弱點國家） ----------
  function distractors(c, n, field) {
    const seen = new Set([field ? c[field] : c.key]);
    // 先用同一洲、難度相近的國家當干擾選項，不夠再放寬
    const near = (x) => x.tier <= Math.max(settings.level, c.tier) + 1;
    const same = shuffle(COUNTRIES.filter((x) => x.cont === c.cont && x !== c));
    const other = shuffle(COUNTRIES.filter((x) => x.cont !== c.cont));
    const order = same.filter(near).concat(other.filter(near), same.filter((x) => !near(x)), other.filter((x) => !near(x)));
    const out = [];
    for (const x of order) {
      const v = field ? x[field] : x.key;
      if (seen.has(v)) continue;
      seen.add(v); out.push(x);
      if (out.length === n) break;
    }
    return out;
  }
  function choiceMode(cfg) {
    return function () {
      const fixed = cfg.poolFn ? cfg.poolFn() : null;
      let onKey = null;
      function start() {
        const alive = newRun();
        app.innerHTML = '';
        if (fixed && !fixed.length) { app.innerHTML = cfg.empty; return; }
        const qs = fixed ? shuffle(fixed) : (settings.count ? shuffle(pool()).slice(0, settings.count) : shuffle(pool()));
        let i = 0, right = 0, streak = 0;
        const missed = [], before = knownMap();
        if (fixed) app.insertAdjacentHTML('beforeend', cfg.header(fixed.length));
        else app.appendChild(settingsBar(start, { inProgress: () => i }));
        const { hud, toast, say } = hudShell(cfg.rule);
        app.appendChild(hud);
        // 題目（地圖／國旗）在左、選項與回饋在右；窄螢幕時選項接在題目正下方
        const grid = document.createElement('div'); grid.className = 'qa-grid';
        const stage = document.createElement('div'); stage.className = 'qa-stage';
        const side = document.createElement('div'); side.className = 'qa-side';
        const optsEl = document.createElement('div'); optsEl.className = 'opts'; optsEl.setAttribute('role', 'group'); optsEl.setAttribute('aria-label', '選項');
        side.append(optsEl, toast); grid.append(stage, side); app.appendChild(grid);
        const ctx = cfg.setup ? cfg.setup(stage, fixed || pool()) : {};
        function ask() {
          const c = qs[i];
          hud.innerHTML = `<div class="prompt">${cfg.prompt(c)}</div>
            ${statsHtml([['第', `${i + 1}<small> / ${qs.length}</small>`], ['答對', right], ['連對', streak, streak >= 3 ? 'hot' : '']])}`;
          cfg.show(c, stage, ctx);
          const opts = shuffle([c].concat(distractors(c, 3, cfg.field)));
          optsEl.innerHTML = opts.map((o, j) => `<button type="button" class="opt" data-k="${esc(o.key)}"><span class="key" aria-hidden="true">${j + 1}</span>${cfg.label(o)}</button>`).join('');
          optsEl.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => answer(b)));
          optsEl.querySelector('.opt').focus({ preventScroll: true });
        }
        function answer(btn) {
          if (btn.disabled) return;
          const c = qs[i], ok = btn.dataset.k === c.key;
          optsEl.querySelectorAll('.opt').forEach((b) => { b.disabled = true; if (b.dataset.k === c.key) b.classList.add('right'); });
          if (!ok) { btn.classList.add('wrong'); missed.push(c); streak = 0; } else { right++; streak++; }
          logResult(c.key, ok);
          if (cfg.after) cfg.after(c, ok, ctx);
          say(ok ? 'ok' : 'bad', (ok ? (streak >= 3 ? `✔ 連對 ${streak} 題！` : '✔ 答對了！') : '✘ 正確答案：') + ` ${flag(c)} ${esc(c.zh)} ${esc(c.en)}　<span class="muted">首都：${esc(c.cap)}・${CONT[c.cont]}</span>`);
          later(alive, () => { i++; if (i >= qs.length) finish(); else ask(); }, ok ? 1200 : 2400);
        }
        // 鍵盤 1–4 作答
        if (onKey) document.removeEventListener('keydown', onKey);
        onKey = (e) => {
          if (e.target.closest && e.target.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
          const n = '1234'.indexOf(e.key);
          const b = n >= 0 && optsEl.querySelectorAll('.opt')[n];
          if (b && optsEl.isConnected) { e.preventDefault(); b.focus(); answer(b); }
        };
        document.addEventListener('keydown', onKey);
        function finish() {
          const pct = Math.round(right / qs.length * 100);
          const r = cfg.noBest ? {} : saveBest(cfg.id, pct);
          showResult(app, { title: cfg.title, big: `${right}/${qs.length}`, small: `答對率 ${pct}%`, line: `答對 ${right} / ${qs.length} 題・答對率 ${pct}%`, record: r.better && r.prev, first: !cfg.noBest && !r.prev, missed, fresh: newlyKnown(before), again: start });
        }
        ask();
      }
      start();
      return () => { if (onKey) document.removeEventListener('keydown', onKey); };
    };
  }
  const mapQuestion = {
    prompt: () => '地圖上標示的是哪一個國家？',
    label: (o) => `${esc(o.zh)} <small>${esc(o.en)}</small>`,
    show(c, stage, ctx) { ctx.map.clear('target'); ctx.map.cls(c.key, 'target'); ctx.map.ring(c.key); ctx.map.focus(c.key, 6); },
    after(c, ok, ctx) { ctx.map.ring(null); ctx.map.pin(c.key, ok ? 1100 : 2200); }
  };
  const modeName = choiceMode(Object.assign({
    id: 'name', title: '看標示選國名', field: null,
    rule: '從四個選項中選出亮起來的國家，也可以按鍵盤 1–4 作答。',
    setup(stage, list) { return { map: makeMap(stage, { region: settings.region, active: list, label: '世界地圖：標示出題目的國家' }) }; }
  }, mapQuestion));
  const modeWeak = choiceMode(Object.assign({
    id: 'weak', title: '弱點國家', field: null, noBest: true,
    rule: '這些是你答錯過、還不熟的國家。答對 3 次以上就會從弱點清單畢業。',
    poolFn() { const p = pendingPool; pendingPool = null; return (p || weakList()).slice(0, 20); },
    header: (n) => `<section class="mode-head"><h1>我的弱點國家</h1><p class="muted">從你答錯過的國家出題，這一輪共 ${n} 國。</p></section>`,
    empty: `<section class="mode-head"><h1>我的弱點國家</h1><p class="muted">目前沒有答錯的國家。先玩一輪其他模式，答錯的國家會自動收集到這裡。</p>
      <div class="actions" style="justify-content:flex-start"><a class="btn primary" href="#name">玩看標示選國名</a><a class="btn" href="#find">玩地圖找國家</a></div></section>`,
    setup(stage, list) { return { map: makeMap(stage, { region: 'ALL', active: list, label: '世界地圖：標示出題目的國家' }) }; }
  }, mapQuestion));
  const modeFlag = choiceMode({
    id: 'flag', title: '國旗猜國家', field: null,
    rule: '看國旗選出國家，也可以按鍵盤 1–4 作答。',
    prompt: () => '這是哪一個國家的國旗？',
    show(c, stage) { stage.innerHTML = `<div class="q-center">${flag(c, 'big-flag')}</div>`; },
    label: (o) => `${esc(o.zh)} <small>${esc(o.en)}</small>`
  });
  const modeCapital = choiceMode({
    id: 'capital', title: '首都', field: 'cap',
    rule: '選出這個國家的首都，也可以按鍵盤 1–4 作答。',
    prompt: () => '這個國家的首都是？',
    show(c, stage) { stage.innerHTML = `<div class="q-center">${flag(c, 'big-flag')}<h2>${esc(c.zh)} <small class="muted">${esc(c.en)}</small></h2></div>`; },
    label: (o) => esc(o.cap)
  });

  // ---------- 模式：輪廓猜國家 ----------
  const MAX_GUESS = 6;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function dailyCountry(dateStr) {
    const list = COUNTRIES.filter((c) => c.tier <= 2).sort((a, b) => (a.key < b.key ? -1 : 1));
    const [y, m, d] = dateStr.split('-').map(Number);
    const day = Math.floor(Date.UTC(y, m - 1, d) / 864e5);
    return list[(day * 7919) % list.length];
  }
  function silhouetteSvg(c, size) {
    const m = mainPart(c), ctr = d3.geoCentroid(m);
    const proj = d3.geoAzimuthalEqualArea().rotate([-ctr[0], -ctr[1]]).fitExtent([[14, 14], [size - 14, size - 14]], m);
    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="題目的國家輪廓"><path d="${d3.geoPath(proj)(m)}"/></svg>`;
  }
  function modeShape() {
    let mode = store.get('shapeMode', 'daily');
    function start() {
      const alive = newRun();
      const date = today();
      const daily = mode === 'daily';
      const target = daily ? dailyCountry(date) : pick(pool());
      const saved = daily ? store.get('daily:' + date, null) : null;
      const guesses = saved ? saved.guesses.map((k) => BY[k]).filter(Boolean) : [];
      let over = false;
      app.innerHTML = '';
      const top = document.createElement('div');
      top.className = 'set-bar';
      top.innerHTML = `<div class="grp" role="group" aria-label="玩法"><button type="button" class="chip${daily ? ' active' : ''}" aria-pressed="${daily}" data-m="daily">每日挑戰</button><button type="button" class="chip${daily ? '' : ' active'}" aria-pressed="${!daily}" data-m="practice">練習</button></div>
        <span class="info">${daily ? `今天（${date}）的題目，每天一題，大家都一樣` : '從設定的範圍隨機出題，可以一直玩'}</span>`;
      top.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.m === mode) return; mode = b.dataset.m; store.set('shapeMode', mode); start(); }));
      app.appendChild(top);
      if (!daily) app.appendChild(settingsBar(start, { noCount: true, inProgress: () => (over ? 0 : guesses.length) }));
      const grid = document.createElement('div');
      grid.className = 'shape-grid';
      grid.innerHTML = `<div class="silhouette">${silhouetteSvg(target, 420)}</div>
        <div><div class="ac"></div>
        <p class="rule-line">猜一個國家後，會顯示它到答案的距離、方向和接近度（100% 就是猜中）。共 ${MAX_GUESS} 次機會。</p>
        <div class="guesses" role="table" aria-label="猜測紀錄"></div><p class="hintline" role="status" aria-live="polite"></p>
        <button type="button" class="linkish" data-a="giveup">放棄，看答案</button><div class="shape-end"></div></div>`;
      app.appendChild(grid);
      const gEl = grid.querySelector('.guesses'), endEl = grid.querySelector('.shape-end'), hint = grid.querySelector('.hintline'), giveup = grid.querySelector('[data-a="giveup"]');
      const ac = makeAutocomplete(grid.querySelector('.ac'), { placeholder: '輸入國名（中文或英文）', label: '輸入你猜的國名', button: '猜！', exclude: () => guesses.map((g) => g.key), onPick: guess });
      const won = () => guesses.some((g) => g === target);
      function rows() {
        const r = [`<div class="guess head" role="row"><span role="columnheader">猜測</span><span role="columnheader">距離</span><span role="columnheader">方向</span><span role="columnheader">接近度</span></div>`];
        guesses.forEach((g) => {
          if (g === target) { r.push(`<div class="guess win" role="row"><span role="cell">${flag(g)} ${esc(g.zh)}</span><span role="cell">0 km</span><span role="cell">✔</span><span role="cell">100%</span></div>`); return; }
          const d = distKm(g, target), p = Math.round(Math.max(0, 20000 - d) / 20000 * 100);
          r.push(`<div class="guess" role="row"><span role="cell" title="${esc(g.en)}">${flag(g)} ${esc(g.zh)}</span><span role="cell">${Math.round(d).toLocaleString()} km</span><span role="cell">${dirSvg(bearing(g, target))}</span><span role="cell">${p}%</span></div>`);
        });
        for (let i = guesses.length; i < MAX_GUESS; i++) r.push('<div class="guess empty" aria-hidden="true"><span></span><span></span><span></span><span></span></div>');
        gEl.innerHTML = r.join('');
        const last = guesses[guesses.length - 1];
        hint.innerHTML = !won() && last && !over
          ? `${esc(last.zh)}：距離 ${Math.round(distKm(last, target)).toLocaleString()} 公里，答案在它的${dirWord(bearing(last, target))}方。` + (guesses.length >= 3 ? `　提示：這個國家位於 <b>${CONT[target.cont]}</b>。` : '')
          : '';
      }
      function save() { if (daily) store.set('daily:' + date, { guesses: guesses.map((g) => g.key), done: over }); }
      function fly(svgEl, mini, key, land) {
        endEl.querySelector('.panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        later(alive, () => {
          const tEl = mini.el(key), tr = tEl.getBoundingClientRect();
          const pathEl = svgEl.querySelector('path'), sr = svgEl.getBoundingClientRect(), pr = pathEl.getBoundingClientRect();
          if (tr.width < 2 || pr.width < 2 || tr.bottom < 0 || tr.top > innerHeight) return land();
          const s = (tr.width / pr.width + tr.height / pr.height) / 2;
          const tx = tr.left - sr.left - (pr.left - sr.left) * s, ty = tr.top - sr.top - (pr.top - sr.top) * s;
          const clone = svgEl.cloneNode(true);
          clone.classList.add('flyer');
          clone.setAttribute('aria-hidden', 'true');
          Object.assign(clone.style, { left: sr.left + 'px', top: sr.top + 'px', width: sr.width + 'px', height: sr.height + 'px' });
          document.body.appendChild(clone);
          svgEl.classList.add('left-behind');
          requestAnimationFrame(() => clone.classList.add('go'));
          const anim = clone.animate([{ transform: 'translate(0, 0) scale(1)' }, { transform: `translate(${tx}px, ${ty}px) scale(${s})` }],
            { duration: 950, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
          anim.onfinish = () => {
            land();
            clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).onfinish = () => clone.remove();
          };
        }, 900);
      }
      function end(live) {
        over = true; ac.disable(true); giveup.hidden = true; hint.innerHTML = '';
        const win = won();
        if (daily && !(saved && saved.done)) {
          const st = store.get('dailyStats', { played: 0, wins: 0, streak: 0, best: 0, last: '', dist: [0, 0, 0, 0, 0, 0] });
          st.played++;
          if (win) { st.wins++; st.dist[guesses.length - 1]++; }
          const y = new Date(); y.setDate(y.getDate() - 1);
          const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
          st.streak = win ? (st.last === yStr ? st.streak + 1 : 1) : 0;
          st.best = Math.max(st.best, st.streak); st.last = win ? date : st.last;
          store.set('dailyStats', st);
        }
        if (!daily || !(saved && saved.done)) logResult(target.key, win);
        save();
        endEl.innerHTML = `<div class="panel shape-result${win ? ' win' : ''}" role="status"><h3>${win ? `第 ${guesses.length} 次就猜中` : guesses.length < MAX_GUESS ? '這題先放棄了' : '六次都沒猜中'}</h3>
          <div>答案是 ${flag(target)} <b>${esc(target.zh)}</b> ${esc(target.en)}・首都 ${esc(target.cap)}・${CONT[target.cont]}</div>
          <div class="mini"></div>
          <div class="actions" style="justify-content:flex-start">${daily ? '<button type="button" class="btn" data-a="share">複製結果</button><button type="button" class="btn primary" data-a="practice">繼續練習</button>' : '<button type="button" class="btn primary" data-a="again">下一題</button>'}</div></div>`;
        const mini = makeMap(endEl.querySelector('.mini'), { region: 'ALL', scrollFriendly: true, label: `世界地圖：${target.zh}的位置` });
        setTimeout(() => mini.focus(target.key, 4), 150);
        const land = () => { mini.cls(target.key, 'target'); mini.ring(target.key); };
        // 猜中的當下：輪廓從左邊飛進世界地圖上它真正的位置
        if (live && win && !calm()) fly(grid.querySelector('.silhouette svg'), mini, target.key, land);
        else land();
        const a = endEl.querySelector('[data-a="again"]'); if (a) { a.addEventListener('click', start); if (live) a.focus({ preventScroll: true }); }
        const p = endEl.querySelector('[data-a="practice"]'); if (p) p.addEventListener('click', () => { mode = 'practice'; store.set('shapeMode', mode); start(); });
        const sh = endEl.querySelector('[data-a="share"]');
        if (sh) sh.addEventListener('click', () => {
          const lines = guesses.map((g) => {
            if (g === target) return '🟩🟩🟩🟩🟩 🎉';
            const pct = Math.max(0, 20000 - distKm(g, target)) / 20000 * 100, full = Math.floor(pct / 20);
            return '🟩'.repeat(full) + (pct - full * 20 >= 10 ? '🟨' : '') + '⬜'.repeat(5 - full - (pct - full * 20 >= 10 ? 1 : 0)) + ' ' + arrow(bearing(g, target));
          });
          const text = `🗺️ 看地圖猜國家 ${date} ${win ? guesses.length : 'X'}/${MAX_GUESS}\n${lines.join('\n')}`;
          const done = () => { sh.textContent = '✔ 已複製'; };
          try { navigator.clipboard.writeText(text).then(done, () => { prompt('複製以下結果：', text); }); } catch (e) { prompt('複製以下結果：', text); }
        });
      }
      function guess(c) {
        if (over || !c || guesses.includes(c)) return;
        guesses.push(c); rows(); save();
        if (c === target || guesses.length >= MAX_GUESS) end(true); else ac.focus();
      }
      giveup.addEventListener('click', () => { if (!over) { rows(); end(true); } });
      rows();
      if (saved && saved.done) { over = true; end(false); } else if (won() || guesses.length >= MAX_GUESS) end(false);
      else setTimeout(() => ac.focus(), 0);
    }
    start();
  }

  // ---------- 首頁：我的世界地圖 ----------
  const MODES = [
    ['name', '看標示選國名', '地圖上亮起一個國家，從四個選項選出它的名字。', '入門'],
    ['find', '地圖找國家', '給你國名，在地圖上點出它。三次機會，答錯會給方向提示。'],
    ['shape', '輪廓猜國家', '只看形狀猜國名，猜錯會告訴你距離和方向。每天有一題每日挑戰。', '進階'],
    ['flag', '國旗', '看國旗選國家。'],
    ['capital', '首都', '看國家選出它的首都。']
  ];
  function modeHome() {
    const st = store.get('dailyStats', null), todayDone = store.get('daily:' + today(), null);
    const known = knownMap(), n = known.size, fam = [...known.values()].filter((v) => v === 2).length;
    const weak = weakList();
    const firstRun = !Object.keys(store.get('perf', {})).length;
    const conts = Object.keys(CONT).map((k) => {
      const all = COUNTRIES.filter((c) => c.cont === k), got = all.filter((c) => known.has(c.key)).length;
      return `<div class="cont-row"><span>${CONT[k]}</span><span class="bar"><i style="transform:scaleX(${got / all.length})"></i></span><b>${got}<small>/${all.length}</small></b></div>`;
    }).join('');
    const starter = `<section class="first-run"><div><h2>第一次玩？從這裡開始</h2><p>看標示選國名・歐洲・簡單，10 題，大約兩分鐘。答對的國家會出現在下面的世界地圖上。</p></div>
      <button type="button" class="btn primary" data-a="starter">開始第一輪</button></section>`;
    const daily = `<section class="daily-strip"><div><h2>今日挑戰・${today()}</h2><p>${todayDone && todayDone.done ? '今天的輪廓已經猜過了，明天會換一個國家。' : '一個國家的輪廓，六次機會。每個人今天的題目都一樣。'}${st && st.streak ? `　目前連勝 ${st.streak} 天` : ''}</p></div>
      <a class="btn${firstRun ? '' : ' primary'}" href="#shape" data-daily>${todayDone && todayDone.done ? '看今天的結果' : '開始今日挑戰'}</a></section>`;
    app.innerHTML = `<section class="hero"><h1>我的世界地圖</h1>
      <p class="muted">${COUNTRIES.length} 個國家。在任何一種玩法答對一國，它就會在這張地圖上著色。</p></section>
      ${firstRun ? starter : ''}
      <section class="atlas">
        <div class="atlas-map"></div>
        <aside class="atlas-side">
          <div class="atlas-count"><b>${n}</b><span>/ ${COUNTRIES.length} 國</span></div>
          <p class="muted atlas-sub">${n ? `已認識 ${n} 國，其中 ${fam} 國已經很熟悉。` : '還沒有上色的國家。玩完第一輪，答對的國家就會出現在這裡。'}</p>
          <div class="legend"><span><i class="sw m1"></i>認識（答對過）</span><span><i class="sw m2"></i>熟悉（答對 3 次以上）</span></div>
          <div class="conts">${conts}</div>
          <div class="atlas-info" aria-live="polite"><span class="muted">點地圖上的國家（或用 Tab 到地圖後按方向鍵、Enter），看看你對它的紀錄。</span></div>
        </aside>
      </section>
      ${firstRun ? '' : daily}
      ${weak.length ? `<section class="weak-strip"><div><h2>我的弱點國家・${weak.length} 國</h2><p>${weak.slice(0, 6).map((c) => `${flag(c)} ${esc(c.zh)}`).join('　')}${weak.length > 6 ? '　…' : ''}</p></div><button type="button" class="btn" data-a="weak">練習弱點國家</button></section>` : ''}
      <h2 class="sec">玩法</h2>
      <div class="mode-list">${MODES.map(([k, t, d, tag]) => `<a href="#${k}"><b>${t}${tag ? `<em>${tag}</em>` : ''}</b><span>${d}</span></a>`).join('')}
        <a href="#stats"><b>我的紀錄</b><span>各模式最佳成績、每日挑戰統計，以及最常答錯的國家。</span></a></div>
      ${firstRun ? daily : ''}`;
    const dl = app.querySelector('[data-daily]'); if (dl) dl.addEventListener('click', () => store.set('shapeMode', 'daily'));
    const sb = app.querySelector('[data-a="starter"]');
    if (sb) sb.addEventListener('click', () => { Object.assign(settings, { region: 'EU', level: 1, count: 10 }); store.set('settings', settings); location.hash = '#name'; });
    const wb = app.querySelector('[data-a="weak"]'); if (wb) wb.addEventListener('click', () => goWeak(null));
    const info = app.querySelector('.atlas-info');
    const map = makeMap(app.querySelector('.atlas-map'), {
      region: 'ALL', clickable: true, scrollFriendly: true, keyboard: true, label: '我的世界地圖',
      onPick(key) {
        const c = BY[key], p = store.get('perf', {})[key], lv = known.get(key) || 0;
        map.clear('hl'); map.cls(key, 'hl');
        info.innerHTML = `<div class="info-head">${flag(c, 'info-flag')}<div><b>${esc(c.zh)}</b><small>${esc(c.en)}</small></div></div>
          <dl><dt>首都</dt><dd>${esc(c.cap)}</dd><dt>位置</dt><dd>${CONT[c.cont]}</dd>
          <dt>你的紀錄</dt><dd>${p ? `答對 ${p[0] - p[1]} 次・答錯 ${p[1]} 次${lv === 2 ? '・熟悉' : lv === 1 ? '・認識' : ''}` : '還沒在遊戲中遇過'}</dd></dl>`;
      }
    });
    map.paint(known);
  }

  // ---------- 紀錄 ----------
  const MODE_NAMES = { find: '地圖找國家', name: '看標示選國名', flag: '國旗', capital: '首都' };
  function modeStats() {
    const best = store.get('best', {}), perf = store.get('perf', {}), st = store.get('dailyStats', null);
    const rows = Object.entries(best).sort().map(([k, v]) => {
      const [m, s] = k.split(':'), [r, l, n] = s.split('-');
      return `<tr><td>${MODE_NAMES[m] || m}</td><td>${NAME.region[r]}・${NAME.level[l]}・${n === '0' ? '全部' : n + ' 題'}</td><td><b>${v.score}%</b>${v.time ? `　${fmtTime(v.time)}` : ''}</td><td class="muted">${new Date(v.at).toLocaleDateString()}</td></tr>`;
    });
    const weak = Object.entries(perf).filter(([k, v]) => BY[k] && v[1] > 0).sort((a, b) => b[1][1] - a[1][1] || (b[1][1] / b[1][0]) - (a[1][1] / a[1][0])).slice(0, 24);
    const maxD = st ? Math.max(1, ...st.dist) : 1;
    app.innerHTML = `<section class="hero"><h1>我的紀錄</h1><p class="muted">紀錄只存在這台電腦的瀏覽器中。</p></section>
      <h2 class="sec">每日挑戰</h2>
      <div class="panel">${st ? `<p>挑戰 <b>${st.played}</b> 次・猜中 <b>${st.wins}</b> 次（${Math.round(st.wins / st.played * 100)}%）・目前連勝 <b>${st.streak}</b> 天・最佳連勝 <b>${st.best}</b> 天</p>
        <div class="dist">${st.dist.map((n, i) => `<div><span style="width:1.5em">${i + 1}</span><i style="width:${Math.max(4, n / maxD * 100)}%">${n}</i></div>`).join('')}</div>` : '<p class="muted">還沒有玩過每日挑戰。</p>'}</div>
      <h2 class="sec">各模式最佳成績</h2>
      <div class="panel">${rows.length ? `<table class="st"><tr><th>模式</th><th>範圍</th><th>最佳</th><th>日期</th></tr>${rows.join('')}</table>` : '<p class="muted">還沒有完成任何一輪。</p>'}</div>
      <h2 class="sec">最常答錯的國家</h2>
      <div class="panel">${weak.length ? `<div class="review" style="justify-content:flex-start">${weak.map(([k, v]) => `<span>${flag(BY[k])} ${esc(BY[k].zh)}　<b>${v[1]}</b>/${v[0]}</span>`).join('')}</div>
        <button type="button" class="btn" data-a="weak">練習弱點國家</button>` : '<p class="muted">目前沒有答錯的紀錄。</p>'}</div>
      <div class="actions"><button type="button" class="btn" data-a="reset">清除所有紀錄</button></div>`;
    const wb = app.querySelector('[data-a="weak"]'); if (wb) wb.addEventListener('click', () => goWeak(null));
    app.querySelector('[data-a="reset"]').addEventListener('click', () => {
      if (!confirm('確定要清除所有紀錄嗎？世界地圖的顏色、最佳成績與每日挑戰統計都會歸零。')) return;
      ['best', 'perf', 'dailyStats'].forEach((k) => store.set(k, k === 'dailyStats' ? null : {}));
      modeStats();
    });
  }

  // ---------- 路由 ----------
  const ROUTES = { home: modeHome, find: modeFind, name: modeName, shape: modeShape, flag: modeFlag, capital: modeCapital, stats: modeStats, weak: modeWeak };
  const nav = document.getElementById('modes');
  const navMore = () => nav.classList.toggle('more', nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4);
  nav.addEventListener('scroll', navMore, { passive: true });
  window.addEventListener('resize', navMore);
  let cleanup = null;
  function route() {
    const id = location.hash.slice(1) || 'home';
    const fn = ROUTES[id] || modeHome;
    if (cleanup) { cleanup(); cleanup = null; }
    runToken++;
    nav.querySelectorAll('a').forEach((a) => {
      const on = a.dataset.m === (ROUTES[id] ? id : 'home');
      a.classList.toggle('active', on);
      if (on) { a.setAttribute('aria-current', 'page'); nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2 }); } else a.removeAttribute('aria-current');
    });
    navMore();
    window.scrollTo(0, 0);
    cleanup = fn() || null;
  }
  window.addEventListener('hashchange', route);
  route();
})();
