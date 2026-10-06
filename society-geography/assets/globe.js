// 可拖曳旋轉的地球儀（d3 正射投影）。在任何含 [data-globe] 的元素上呼叫 mountGlobe(el)。
(function () {
  'use strict';

  const TAIWAN = [121, 23.7];
  const SPECIAL = [
    { name: '赤道 0°', key: 'equator', coords: lat(0), color: '--g-equator', width: 2.4 },
    { name: '北迴歸線 23.5°N', key: 'tropic', coords: lat(23.5), color: '--g-tropic', width: 1.8, dash: [6, 4] },
    { name: '南迴歸線 23.5°S', key: 'tropic', coords: lat(-23.5), color: '--g-tropic', width: 1.8, dash: [6, 4] },
    { name: '北極圈 66.5°N', key: 'polar', coords: lat(66.5), color: '--g-polar', width: 1.6, dash: [3, 4] },
    { name: '南極圈 66.5°S', key: 'polar', coords: lat(-66.5), color: '--g-polar', width: 1.6, dash: [3, 4] },
    { name: '本初經線 0°', key: 'meridian', coords: lon(0), color: '--g-prime', width: 2.4 },
    { name: '180° 經線（國際換日線附近）', key: 'meridian', coords: lon(180), color: '--g-dateline', width: 2, dash: [8, 4] }
  ];

  function lat(y) {
    const pts = [];
    for (let x = -180; x <= 180; x += 2) pts.push([x, y]);
    return { type: 'LineString', coordinates: pts };
  }
  function lon(x) {
    const pts = [];
    for (let y = -90; y <= 90; y += 2) pts.push([x, y]);
    return { type: 'LineString', coordinates: pts };
  }
  function wrap(n) { return ((n % 360) + 540) % 360 - 180; }
  function fmt(p) {
    const [x, y] = p;
    const la = Math.abs(y) < 0.5 ? '0°（赤道）' : (y > 0 ? '北緯 ' : '南緯 ') + Math.abs(y).toFixed(0) + '°';
    const lo = Math.abs(x) < 0.5 ? '0°（本初經線）' : Math.abs(Math.abs(x) - 180) < 0.5 ? '180°' :
      (x > 0 ? '東經 ' : '西經 ') + Math.abs(x).toFixed(0) + '°';
    const hemi = (y >= 0 ? '北半球' : '南半球') + '、' + (x >= 0 ? '東半球' : '西半球');
    return `${la}，${lo}<span class="g-hemi">（${hemi}）</span>`;
  }

  window.mountGlobe = function (host) {
    if (!window.d3 || !window.topojson || !window.LAND_TOPO) {
      host.innerHTML = '<p class="g-fallback">地球儀載入失敗（缺少 d3 或地圖資料）。</p>';
      return;
    }
    const land = topojson.feature(LAND_TOPO, LAND_TOPO.objects.land);
    const graticule = d3.geoGraticule().step([15, 15])();

    host.innerHTML = `
      <div class="g-stage"><canvas aria-label="可旋轉的地球儀，拖曳即可轉動"></canvas></div>
      <div class="g-side">
        <div class="g-readout" aria-live="polite"></div>
        <div class="g-btns">
          <button class="btn" data-act="spin">⏸ 停止自轉</button>
          <button class="btn primary" data-act="taiwan">📍 轉到臺灣</button>
          <button class="btn" data-act="north">北極上空</button>
          <button class="btn" data-act="south">南極上空</button>
          <button class="btn" data-act="prime">看本初經線</button>
          <button class="btn" data-act="reset" title="回到一開始的角度、重新自轉，並顯示所有線條">↺ 重設</button>
        </div>
        <div class="g-toggles">
          <label><input type="checkbox" data-show="grid" checked> 經緯網格（每 15°）</label>
          <label><input type="checkbox" data-show="equator" checked> <i style="--c:var(--g-equator)"></i>赤道</label>
          <label><input type="checkbox" data-show="tropic" checked> <i class="dash" style="--c:var(--g-tropic)"></i>南、北迴歸線</label>
          <label><input type="checkbox" data-show="polar" checked> <i class="dot" style="--c:var(--g-polar)"></i>南、北極圈</label>
          <label><input type="checkbox" data-show="meridian" checked> <i style="--c:var(--g-prime)"></i>本初經線／<i class="dash" style="--c:var(--g-dateline)"></i>180° 經線</label>
        </div>
        <p class="g-hint">✋ 按住拖曳轉動地球；把滑鼠移到地球上，就能看到該點的經緯度。</p>
      </div>`;

    const canvas = host.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const readout = host.querySelector('.g-readout');
    const show = { grid: true, equator: true, tropic: true, polar: true, meridian: true };
    const projection = d3.geoOrthographic().clipAngle(90).precision(0.4);
    const path = d3.geoPath(projection, ctx);

    const START = [-TAIWAN[0], -TAIWAN[1] + 8];
    let rotate = [START[0], START[1], 0];
    let spinAfterTarget = false; // 重設後轉回起始角度再恢復自轉
    let spinning = true;
    let dragging = null;
    let hover = null;
    let target = null; // 平滑轉向的目標
    let size = 0;

    function resize() {
      const w = Math.min(host.querySelector('.g-stage').clientWidth, 560);
      if (w <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      size = w;
      canvas.style.width = canvas.style.height = w + 'px';
      canvas.width = canvas.height = Math.round(w * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      projection.scale(w / 2 - 6).translate([w / 2, w / 2]);
    }

    function draw() {
      const css = getComputedStyle(host);
      const v = (name) => css.getPropertyValue(name).trim();
      projection.rotate(rotate);
      ctx.clearRect(0, 0, size, size);

      // 海洋
      ctx.beginPath(); path({ type: 'Sphere' });
      const r = projection.scale(), [cx, cy] = projection.translate();
      const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      grad.addColorStop(0, v('--g-ocean-hi')); grad.addColorStop(1, v('--g-ocean'));
      ctx.fillStyle = grad; ctx.fill();

      // 陸地
      ctx.beginPath(); path(land);
      ctx.fillStyle = v('--g-land'); ctx.fill();
      ctx.lineWidth = 0.6; ctx.strokeStyle = v('--g-coast'); ctx.stroke();

      // 經緯網格
      if (show.grid) {
        ctx.beginPath(); path(graticule);
        ctx.lineWidth = 0.6; ctx.strokeStyle = v('--g-grid'); ctx.stroke();
      }

      // 特殊經緯線
      SPECIAL.forEach((s) => {
        if (!show[s.key]) return;
        ctx.beginPath(); path(s.coords);
        ctx.setLineDash(s.dash || []);
        ctx.lineWidth = s.width; ctx.strokeStyle = v(s.color); ctx.stroke();
      });
      ctx.setLineDash([]);

      // 臺灣
      if (d3.geoDistance(TAIWAN, [-rotate[0], -rotate[1]]) < Math.PI / 2) {
        const [x, y] = projection(TAIWAN);
        ctx.beginPath(); ctx.arc(x, y, 9, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(214,48,49,.25)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#d63031'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#fff'; ctx.stroke();
        label('臺灣', x + 10, y - 8, v);
      }

      // 游標位置
      if (hover) {
        const [x, y] = projection(hover);
        ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.lineWidth = 2; ctx.strokeStyle = v('--text'); ctx.stroke();
      }

      // 外框
      ctx.beginPath(); path({ type: 'Sphere' });
      ctx.lineWidth = 1.2; ctx.strokeStyle = v('--border'); ctx.stroke();
    }

    function label(text, x, y, v) {
      ctx.font = 'bold 14px "Noto Sans TC","Microsoft JhengHei",sans-serif';
      ctx.lineWidth = 3; ctx.strokeStyle = v('--g-label-bg'); ctx.strokeText(text, x, y);
      ctx.fillStyle = '#d63031'; ctx.fillText(text, x, y);
    }

    function updateReadout() {
      readout.innerHTML = hover
        ? `<b>游標位置</b>${fmt(hover)}`
        : `<b>畫面中心</b>${fmt([wrap(-rotate[0]), -rotate[1]])}`;
    }

    function pointerPos(e) {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }
    function invertVisible(p) {
      const g = projection.invert(p);
      if (!g || d3.geoDistance(g, [-rotate[0], -rotate[1]]) > Math.PI / 2 - 0.01) return null;
      return g;
    }

    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      dragging = { p: pointerPos(e), r: rotate.slice() };
      target = null;
      spinAfterTarget = false;
      hover = invertVisible(pointerPos(e));
      updateReadout();
    });
    canvas.addEventListener('pointermove', (e) => {
      const p = pointerPos(e);
      if (dragging) {
        const k = 90 / projection.scale();
        rotate = [
          dragging.r[0] + (p[0] - dragging.p[0]) * k,
          Math.max(-90, Math.min(90, dragging.r[1] - (p[1] - dragging.p[1]) * k)),
          0
        ];
        hover = null;
      } else {
        hover = invertVisible(p);
      }
      updateReadout();
    });
    const endDrag = () => { dragging = null; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', () => { if (!dragging) { hover = null; updateReadout(); } });

    const spinBtn = host.querySelector('[data-act="spin"]');
    function setSpin(on) {
      spinning = on;
      spinBtn.textContent = on ? '⏸ 停止自轉' : '▶ 開始自轉';
    }
    host.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'spin') return setSpin(!spinning);
      setSpin(false);
      spinAfterTarget = false;
      if (act === 'reset') {
        host.querySelectorAll('[data-show]').forEach((cb) => { cb.checked = true; show[cb.dataset.show] = true; });
        hover = null;
        spinAfterTarget = true;
        target = START.slice();
        return;
      }
      target = { taiwan: [-TAIWAN[0], -TAIWAN[1]], north: [rotate[0], -90], south: [rotate[0], 90], prime: [0, 0] }[act];
    }));
    host.querySelectorAll('[data-show]').forEach((cb) => cb.addEventListener('change', () => { show[cb.dataset.show] = cb.checked; }));

    function tick() {
      if (!canvas.isConnected) return; // 被移除後自動停止
      if (!host.getClientRects().length) { requestAnimationFrame(tick); return; } // 視窗關閉時不繪製
      if (target) {
        // 經度取最短方向
        const d0 = wrap(target[0] - rotate[0]);
        const d1 = target[1] - rotate[1];
        if (Math.abs(d0) < 0.3 && Math.abs(d1) < 0.3) { rotate = [target[0], target[1], 0]; target = null; if (spinAfterTarget) { spinAfterTarget = false; setSpin(true); } }
        else rotate = [rotate[0] + d0 * 0.12, rotate[1] + d1 * 0.12, 0];
        updateReadout();
      } else if (spinning && !dragging) {
        rotate = [rotate[0] + 0.25, rotate[1], 0];
        if (!hover) updateReadout();
      }
      draw();
      requestAnimationFrame(tick);
    }

    resize();
    new ResizeObserver(resize).observe(host.querySelector('.g-stage'));
    updateReadout();
    tick();
  };

  // ---------- 可拖曳的浮動地球儀視窗 ----------
  let win = null;

  function buildWindow() {
    win = document.createElement('div');
    win.className = 'gwin';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', '互動地球儀');
    win.innerHTML = `
      <div class="gwin-head" title="按住標題列可以移動視窗">
        <span class="gwin-title">🌏 互動地球儀</span>
        <button class="gwin-close" aria-label="關閉地球儀">✕</button>
      </div>
      <div class="gwin-body"><div class="globe stacked"></div></div>`;
    document.body.appendChild(win);
    window.mountGlobe(win.querySelector('.globe'));

    const head = win.querySelector('.gwin-head');
    win.querySelector('.gwin-close').addEventListener('click', closeGlobe);
    let drag = null;
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.gwin-close')) return;
      const r = win.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      head.setPointerCapture(e.pointerId);
      win.classList.add('dragging');
    });
    head.addEventListener('pointermove', (e) => {
      if (!drag) return;
      place(e.clientX - drag.dx, e.clientY - drag.dy);
    });
    const end = () => { drag = null; win.classList.remove('dragging'); };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
    window.addEventListener('resize', () => { if (!win.hidden) { const r = win.getBoundingClientRect(); place(r.left, r.top); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !win.hidden) closeGlobe(); });
  }

  // 放到指定位置，並限制在可視範圍內（標題列一定看得到）
  function place(x, y) {
    const r = win.getBoundingClientRect();
    const maxX = window.innerWidth - Math.min(r.width, 120);
    const maxY = window.innerHeight - 44;
    win.style.left = Math.max(Math.min(x, maxX), Math.min(0, -r.width + 120)) + 'px';
    win.style.top = Math.max(Math.min(y, maxY), 0) + 'px';
  }

  function openGlobe() {
    const first = !win;
    if (first) buildWindow();
    win.hidden = false;
    if (first) {
      const r = win.getBoundingClientRect();
      place(window.innerWidth - r.width - 24, 72);
    }
    win.querySelector('.gwin-close').focus({ preventScroll: true });
  }
  function closeGlobe() { if (win) win.hidden = true; }

  window.openGlobe = openGlobe;
  window.toggleGlobe = () => (win && !win.hidden ? closeGlobe() : openGlobe());
})();
