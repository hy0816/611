// 數學互動工具與題目產生器
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil, M = window.MathCore;
  if (!U || !M) return;
  const { el, frame, svgPoint, shuffle, makeSorter } = U;
  const { F, gcd, lcm, steps, makePractice, rnd, rndNZ, pick, paren, fmtInt, primeFactors, isPrime, factorHTML, linear } = M;
  const stepsHTML = (expr) => {
    const r = steps(expr);
    return r.steps.map((s) => `<div class="st-row">${s.before}<span class="st-lab">${s.label}</span></div>`).join('') + `<div class="st-row st-final">= ${r.final}</div>`;
  };
  const exprHTML = (expr) => M.show(M.parse(expr));

  // =====================================================================
  // 1-1 數線
  // =====================================================================
  W['number-line'] = function (host) {
    const body = frame(host, '📏 數線上的點', '拖曳 A、B 兩點，看座標、相反數、絕對值與距離');
    body.innerHTML = `<div class="w-map w-map-mid"><svg viewBox="0 0 760 170"></svg></div>
      <label class="w-inline"><input type="checkbox" data-k="opp"> 顯示 A 的相反數</label>
      <div class="w-read"></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const X = (v) => 380 + v * 34, V = (x) => Math.max(-10, Math.min(10, Math.round(((x - 380) / 34) * 2) / 2));
    el('line', { x1: 20, x2: 740, y1: 90, y2: 90, class: 'nl-axis' }, svg);
    el('path', { d: 'M740,90 l-12,-7 v14 z', class: 'nl-arrow' }, svg);
    for (let v = -10; v <= 10; v++) {
      el('line', { x1: X(v), x2: X(v), y1: v % 5 ? 84 : 80, y2: v % 5 ? 96 : 100, class: 'nl-tick' }, svg);
      el('text', { x: X(v), y: 118, 'text-anchor': 'middle', class: v === 0 ? 'w-label' : 'w-small', text: fmtInt(v) }, svg);
    }
    el('text', { x: X(0), y: 140, 'text-anchor': 'middle', class: 'w-small', text: '原點' }, svg);
    const seg = el('line', { y1: 60, y2: 60, class: 'nl-seg' }, svg);
    const segT = el('text', { y: 52, 'text-anchor': 'middle', class: 'w-label-red' }, svg);
    const ghost = el('g', { class: 'nl-ghost' }, svg);
    const P = { A: { v: -3, col: 'nl-a' }, B: { v: 4, col: 'nl-b' } };
    Object.entries(P).forEach(([k, p]) => {
      p.g = el('g', { class: 'nl-pt ' + p.col, tabindex: 0 }, svg);
      el('circle', { r: 11, cy: 90 }, p.g);
      el('text', { y: 75, 'text-anchor': 'middle', class: 'w-label', text: k }, p.g);
    });
    function render() {
      const a = P.A.v, b = P.B.v;
      Object.values(P).forEach((p) => p.g.setAttribute('transform', `translate(${X(p.v)},0)`));
      seg.setAttribute('x1', X(a)); seg.setAttribute('x2', X(b));
      segT.setAttribute('x', (X(a) + X(b)) / 2); segT.textContent = `距離 ${Math.abs(a - b)}`;
      ghost.innerHTML = '';
      if (body.querySelector('[data-k="opp"]').checked) {
        el('circle', { cx: X(-a), cy: 90, r: 9 }, ghost);
        el('text', { x: X(-a), y: 150, 'text-anchor': 'middle', class: 'w-small', text: `−A = ${fmtInt(-a)}` }, ghost);
      }
      const cmp = a > b ? '>' : a < b ? '<' : '=';
      read.innerHTML = `<b class="h">A = ${fmtInt(a)}，B = ${fmtInt(b)}</b>
        A 的相反數：${fmtInt(-a)}　｜A｜ = ${Math.abs(a)}（A 到原點的距離）<br>
        A、B 兩點的距離 = ｜${fmtInt(a)} − ${paren(b)}｜ = <b>${Math.abs(a - b)}</b><br>
        比較大小：${fmtInt(a)} <b>${cmp}</b> ${fmtInt(b)}　<span class="w-hint">（數線上愈右邊的數愈大）</span>`;
    }
    let drag = null;
    Object.values(P).forEach((p) => p.g.addEventListener('pointerdown', (e) => { drag = p; svg.setPointerCapture(e.pointerId); e.preventDefault(); }));
    svg.addEventListener('pointermove', (e) => { if (!drag) return; drag.v = V(svgPoint(svg, e).x); render(); });
    const end = () => { drag = null; };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    Object.values(P).forEach((p) => p.g.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { p.v = Math.min(10, p.v + 0.5); render(); } if (e.key === 'ArrowLeft') { p.v = Math.max(-10, p.v - 0.5); render(); } }));
    body.querySelector('[data-k="opp"]').addEventListener('change', render);
    render();
  };

  W['gen-u1'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：正負數與絕對值', desc: '無限出題，答完立刻對答案',
    gen(lv) {
      const t = pick(lv === 0 ? ['abs', 'opp', 'cmp'] : lv === 1 ? ['abs', 'cmp', 'dist', 'absop'] : ['dist', 'absop', 'cmp2', 'count']);
      const a = rndNZ(-15, 15), b = rndNZ(-15, 15);
      if (t === 'abs') return { q: `求 ｜${fmtInt(a)}｜ = ?`, ans: Math.abs(a), sol: `絕對值是到原點的距離，${fmtInt(a)} 到原點的距離是 ${Math.abs(a)}。` };
      if (t === 'opp') return { q: `${fmtInt(a)} 的相反數是多少？`, ans: -a, sol: `相反數只改變正負號：${fmtInt(a)} 的相反數是 ${fmtInt(-a)}。` };
      if (t === 'cmp' || t === 'cmp2') {
        let x = a, y = b;
        if (t === 'cmp2') { x = -Math.abs(a); y = -Math.abs(b); if (x === y) y -= 1; }
        const ans = x > y ? 0 : x < y ? 1 : 2;
        return { q: `比較大小：${fmtInt(x)} ___ ${fmtInt(y)}`, type: 'choice', options: ['＞', '＜', '＝'], ans, sol: x < 0 && y < 0 ? `兩個負數比較：絕對值大的反而小。｜${fmtInt(x)}｜=${-x}，｜${fmtInt(y)}｜=${-y}。` : '數線上愈右邊的數愈大；正數 ＞ 0 ＞ 負數。' };
      }
      if (t === 'dist') return { q: `數線上 A(${fmtInt(a)})、B(${fmtInt(b)}) 兩點的距離是多少？`, ans: Math.abs(a - b), sol: `距離 = ｜${fmtInt(a)} − ${paren(b)}｜ = ｜${fmtInt(a - b)}｜ = ${Math.abs(a - b)}` };
      if (t === 'absop') return { q: `計算 ｜${fmtInt(a)}｜ − ｜${fmtInt(b)}｜ = ?`, ans: Math.abs(a) - Math.abs(b), sol: `${Math.abs(a)} − ${Math.abs(b)} = ${fmtInt(Math.abs(a) - Math.abs(b))}` };
      const n = rnd(2, 9);
      return { q: `絕對值小於 ${n} 的整數共有幾個？`, ans: 2 * n - 1, sol: `−${n - 1} 到 ${n - 1} 的整數（含 0），共 ${n - 1} × 2 + 1 = ${2 * n - 1} 個。` };
    }
  });

  // =====================================================================
  // 1-2 整數加減：數線走步與正負片
  // =====================================================================
  W['int-add'] = function (host) {
    const body = frame(host, '➕ 整數加減的兩種模型', '設定算式，看數線走步或正負片抵銷');
    body.innerHTML = `
      <div class="w-calc-row"><input type="number" value="-3" data-k="a" style="width:5em"><select data-k="op"><option value="+">＋</option><option value="-">－</option></select><input type="number" value="5" data-k="b" style="width:5em"><button class="chip" data-k="go">▶ 顯示</button></div>
      <div class="w-tabs"><button class="chip" data-v="walk">數線走步</button><button class="chip" data-v="chip">正負片</button></div>
      <div class="w-map w-map-mid"><svg viewBox="0 0 760 200"></svg></div>
      <div class="w-read"></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    let view = 'walk';
    const clamp = (v) => Math.max(-12, Math.min(12, Math.round(+v || 0)));
    function draw() {
      body.querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('active', b.dataset.v === view));
      const a = clamp($('a').value), b0 = clamp($('b').value), op = $('op').value, b = op === '+' ? b0 : -b0, r = a + b;
      svg.innerHTML = '';
      const conv = op === '-' ? `${fmtInt(a)} − ${paren(b0)} = ${fmtInt(a)} + ${paren(-b0)}（減去一個數＝加上它的相反數）<br>` : '';
      if (view === 'walk') {
        const lo = Math.min(-12, a, r) , X = (v) => 380 + v * 28;
        void lo;
        el('line', { x1: 20, x2: 740, y1: 150, y2: 150, class: 'nl-axis' }, svg);
        for (let v = -12; v <= 12; v++) { el('line', { x1: X(v), x2: X(v), y1: 145, y2: 155, class: 'nl-tick' }, svg); el('text', { x: X(v), y: 175, 'text-anchor': 'middle', class: v === 0 ? 'w-label' : 'w-small', text: fmtInt(v) }, svg); }
        const ar = U.arrowMarker(svg, 'w-arrowhead-blue'), ar2 = U.arrowMarker(svg, 'w-arrowhead-red');
        el('line', { x1: X(0), x2: X(a), y1: 110, y2: 110, class: 'w-arrow', 'marker-end': ar }, svg);
        el('text', { x: (X(0) + X(a)) / 2, y: 100, 'text-anchor': 'middle', class: 'w-label-sea', text: `從 0 走到 ${fmtInt(a)}` }, svg);
        el('line', { x1: X(a), x2: X(r), y1: 70, y2: 70, class: 'w-arrow-red', 'marker-end': ar2 }, svg);
        el('text', { x: (X(a) + X(r)) / 2, y: 60, 'text-anchor': 'middle', class: 'w-label-red', text: b >= 0 ? `再往右走 ${b} 格` : `再往左走 ${-b} 格` }, svg);
        el('circle', { cx: X(r), cy: 150, r: 8, class: 'nl-res' }, svg);
        read.innerHTML = `<b class="h">${fmtInt(a)} ${op === '+' ? '+' : '−'} ${paren(b0)} = ${fmtInt(r)}</b>${conv}加正數往<b>右</b>走、加負數往<b>左</b>走，停在 <b>${fmtInt(r)}</b>。`;
      } else {
        const items = [];
        for (let i = 0; i < Math.abs(a); i++) items.push(a > 0 ? 1 : -1);
        for (let i = 0; i < Math.abs(b); i++) items.push(b > 0 ? 1 : -1);
        const pos = items.filter((v) => v > 0).length, neg = items.length - pos, pairs = Math.min(pos, neg);
        let pi = 0, ni = 0;
        items.forEach((v, i) => {
          const x = 40 + (i % 24) * 29, y = 50 + Math.floor(i / 24) * 40;
          const cancelled = v > 0 ? pi++ < pairs : ni++ < pairs;
          const g = el('g', { class: 'chip-tok ' + (v > 0 ? 'pos' : 'neg') + (cancelled ? ' gone' : '') }, svg);
          el('circle', { cx: x, cy: y, r: 12 }, g);
          el('text', { x, y: y + 5, 'text-anchor': 'middle', text: v > 0 ? '+' : '−' }, g);
        });
        el('text', { x: 40, y: 185, class: 'w-small', text: `前 ${Math.abs(a)} 片代表 ${fmtInt(a)}，後 ${Math.abs(b)} 片代表 ${fmtInt(b)}；一個 + 和一個 − 互相抵銷（變淡）` }, svg);
        read.innerHTML = `<b class="h">${fmtInt(a)} ${op === '+' ? '+' : '−'} ${paren(b0)} = ${fmtInt(r)}</b>${conv}正片 ${pos} 個、負片 ${neg} 個，抵銷 ${pairs} 對後剩下 <b>${Math.abs(r)} 個${r > 0 ? '正片' : r < 0 ? '負片' : '（剛好抵銷完）'}</b> → ${fmtInt(r)}。`;
      }
    }
    $('go').addEventListener('click', draw);
    ['a', 'b', 'op'].forEach((k) => $(k).addEventListener('change', draw));
    body.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.v; draw(); }));
    draw();
  };

  function exprGen(lv, opsByLevel) {
    // 產生整數算式字串（顯示用與計算用）
    const n = lv === 0 ? 2 : lv === 1 ? 3 : 4;
    let s = String(rnd(-20, 20));
    for (let i = 1; i < n; i++) { const op = pick(opsByLevel); const v = rndNZ(-15, 15); s += ` ${op} ${v < 0 ? `(${v})` : v}`; }
    return s;
  }
  W['gen-u2'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：整數加減', desc: '簡單 2 項、普通 3 項、挑戰含括號',
    gen(lv) {
      let e = exprGen(lv, ['+', '-']);
      if (lv === 2) e = `${rnd(-20, 20)} − (${exprGen(0, ['+', '-'])}) + ${paren(rndNZ(-15, 15))}`.replace(/−/g, '-');
      const r = steps(e).result;
      return { q: `計算：${exprHTML(e)} = ?`, ans: r, sol: stepsHTML(e) };
    }
  });

  // =====================================================================
  // 1-3 乘除與四則
  // =====================================================================
  W['sign-rule'] = function (host) {
    const body = frame(host, '✖️ 乘除的正負號', '選擇負數的個數，看乘積的正負');
    body.innerHTML = `<div class="w-tabs"><span class="w-small-label">負數的個數</span>${[0, 1, 2, 3, 4, 5].map((n) => `<button class="chip" data-n="${n}">${n} 個</button>`).join('')}</div><div class="sr-row"></div><div class="w-read"></div>`;
    const row = body.querySelector('.sr-row'), read = body.querySelector('.w-read');
    function show(n) {
      body.querySelectorAll('[data-n]').forEach((b) => b.classList.toggle('active', +b.dataset.n === n));
      const nums = [2, 3, 1, 5, 2].map((v, i) => (i < n ? -v : v));
      const prod = nums.reduce((a, b) => a * b, 1);
      row.innerHTML = nums.map((v) => `<span class="sr-num ${v < 0 ? 'neg' : 'pos'}">${paren(v)}</span>`).join('<span class="sr-op">×</span>') + `<span class="sr-op">=</span><span class="sr-num ${prod < 0 ? 'neg' : 'pos'}">${fmtInt(prod)}</span>`;
      read.innerHTML = `<b class="h">負數有 ${n} 個 → ${n % 2 ? '奇數個 → 積為負' : '偶數個 → 積為正'}</b>同號相乘得正、異號相乘得負；除法的正負號規則與乘法相同。<br><span class="w-hint">任何數乘以 0 都得 0；0 不能當除數。</span>`;
    }
    body.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => show(+b.dataset.n)));
    show(1);
  };

  W['step-calc'] = function (host) {
    const body = frame(host, '🧮 四則運算逐步計算器', '輸入算式，看每一步該先算哪裡（黃底是正在算的部分）');
    const P = ['-3+(-5)×2', '12÷(-3)×2', '3-(4-10)÷2', '-2^2+(-2)^2', '(-6)×[3-(-2)]'.replace(/\[|\]/g, (c) => (c === '[' ? '(' : ')')), '1/2-2/3×(-3/4)'];
    body.innerHTML = `<div class="w-calc-row"><input type="text" data-k="e" value="${P[0]}" style="width:min(100%,22em)"><button class="chip" data-k="go">計算</button></div>
      <div class="w-chips">${P.map((p) => `<button class="chip" data-p="${p}">${p}</button>`).join('')}</div>
      <div class="sc-out"></div><p class="w-hint">可用 + − × ÷ ^ 與括號；分數寫 3/4；乘號可以用 * 或 ×，除號用 ÷。</p>`;
    const out = body.querySelector('.sc-out'), inp = body.querySelector('[data-k="e"]');
    function run() {
      try {
        const r = steps(inp.value);
        out.innerHTML = `<div class="st-row">${exprHTML(inp.value)}</div>` + r.steps.map((s, i) => `<div class="st-row"><span class="st-no">${i + 1}</span>${s.before}<span class="st-lab">先算${s.label}</span></div>`).join('') + `<div class="st-row st-final">= ${r.final}</div>`;
      } catch (e) { out.innerHTML = `<div class="w-read"><span class="w-bad">⚠ ${e.message}</span></div>`; }
    }
    body.querySelector('[data-k="go"]').addEventListener('click', run);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    body.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { inp.value = b.dataset.p; run(); }));
    run();
  };

  W['gen-u3'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：整數乘除與四則運算', desc: '簡單：兩數乘除；普通：連乘除；挑戰：四則混合',
    gen(lv) {
      let e;
      if (lv === 0) { const a = rndNZ(-12, 12), b = rndNZ(-9, 9); e = pick([`${a}×${paren(b)}`, `${a * b}÷${paren(b)}`]); }
      else if (lv === 1) { const a = rndNZ(-9, 9), b = rndNZ(-6, 6), c = rndNZ(-5, 5); e = pick([`${a}×${paren(b)}×${paren(c)}`, `${a * b * c}÷${paren(b)}÷${paren(c)}`, `${a * b}÷${paren(b)}×${paren(c)}`]); }
      else { const a = rnd(-20, 20), b = rndNZ(-9, 9), c = rndNZ(-6, 6), d = rndNZ(-9, 9); e = pick([`${a}-${paren(b)}×${paren(c)}`, `(${a}+${paren(b)})×${paren(c)}`, `${b * c}÷${paren(c)}-${paren(d)}×2`, `${a}+${paren(b)}×(${c}-${paren(d)})`]); }
      e = e.replace(/^\((-?\d+)\)/, '$1');
      return { q: `計算：${exprHTML(e)} = ?`, ans: steps(e).result, sol: stepsHTML(e) };
    }
  });

  // =====================================================================
  // 1-4 指數與科學記號
  // =====================================================================
  W['power-view'] = function (host) {
    const body = frame(host, '🔢 指數記法', '調整底數與指數，看展開式與結果');
    body.innerHTML = `<label class="w-slider">底數 <input type="range" min="-5" max="10" value="-2" data-k="b"><output data-k="bo"></output></label>
      <label class="w-slider">指數 <input type="range" min="1" max="8" value="3" data-k="n"><output data-k="no"></output></label>
      <div class="pw-out"></div><div class="w-read"></div>`;
    const $ = (k) => body.querySelector(`[data-k="${k}"]`), out = body.querySelector('.pw-out'), read = body.querySelector('.w-read');
    function render() {
      let b = +$('b').value; if (b === 0) b = 1;
      const n = +$('n').value, v = b ** n;
      $('bo').textContent = b; $('no').textContent = n;
      const base = b < 0 ? `(${fmtInt(b)})` : b;
      out.innerHTML = `<div class="pw-big">${base}<sup>${n}</sup> = ${Array(n).fill(base).join(' × ')} = <b>${fmtInt(v)}</b></div>` +
        (b < 0 ? `<div class="pw-big muted">−${-b}<sup>${n}</sup> = −(${Array(n).fill(-b).join(' × ')}) = <b>${fmtInt(-((-b) ** n))}</b></div>` : '');
      read.innerHTML = `<b class="h">${base}<sup>${n}</sup>：底數 ${base}，指數 ${n}（${n} 個 ${base} 相乘）</b>` +
        (b < 0 ? `負數的<b>${n % 2 ? '奇數' : '偶數'}次方</b>為<b>${n % 2 ? '負' : '正'}</b>。注意 (${fmtInt(b)})<sup>${n}</sup> 與 −${-b}<sup>${n}</sup> 不一樣：後者是先算 ${-b}<sup>${n}</sup> 再加負號。` : '正數的任何次方都是正數。');
    }
    ['b', 'n'].forEach((k) => $(k).addEventListener('input', render));
    render();
  };

  W['sci-convert'] = function (host) {
    const body = frame(host, '🔬 科學記號轉換器', '輸入一個數，看小數點怎麼移動');
    const P = ['150000000', '6000000000', '384400', '0.00012', '0.0000075', '299792'];
    body.innerHTML = `<div class="w-calc-row"><input type="text" data-k="v" value="${P[0]}" style="width:12em"><button class="chip" data-k="go">轉換</button></div>
      <div class="w-chips">${P.map((p) => `<button class="chip" data-p="${p}">${p}</button>`).join('')}</div>
      <div class="sci-digits"></div><div class="w-read"></div>`;
    const inp = body.querySelector('[data-k="v"]'), dig = body.querySelector('.sci-digits'), read = body.querySelector('.w-read');
    function run() {
      const s = inp.value.replace(/,/g, '').trim();
      const x = Number(s);
      if (!s || !isFinite(x) || x <= 0) { read.innerHTML = '<span class="w-bad">請輸入一個正數</span>'; return; }
      const n = Math.floor(Math.log10(x) + 1e-12);
      const a = +(x / 10 ** n).toPrecision(10);
      const digits = s.replace('.', '').replace(/^0+/, '') || '0';
      dig.innerHTML = `<div class="sci-line">${digits.split('').map((d, i) => `<span class="sci-d${i === 0 ? ' first' : ''}">${d}</span>${i === 0 ? '<span class="sci-dot">.</span>' : ''}`).join('')}</div>`;
      read.innerHTML = `<b class="h">${s} = ${a} × 10<sup>${n}</sup></b>小數點${n >= 0 ? '向<b>左</b>' : '向<b>右</b>'}移動 <b>${Math.abs(n)}</b> 位，使前面的數 a 滿足 <b>1 ≤ a ＜ 10</b>，所以指數是 ${n}。<br><span class="w-hint">${n >= 0 ? '大於 10 的數，指數是正的。' : '小於 1 的正數，指數是負的。'}</span>`;
    }
    body.querySelector('[data-k="go"]').addEventListener('click', run);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    body.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { inp.value = b.dataset.p; run(); }));
    run();
  };

  function sciCheck(input, x) {
    const m = String(input).replace(/\s/g, '').replace(/[x*]/g, '×').replace(/[−–]/g, '-').match(/^(\d+(?:\.\d+)?)×10\^?\(?(-?\d+)\)?$/);
    if (!m) return false;
    const a = parseFloat(m[1]), n = parseInt(m[2], 10);
    return a >= 1 && a < 10 && Math.abs(a * 10 ** n - x) < 1e-9 * Math.max(1, x);
  }
  W['gen-u4'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：指數與科學記號', desc: '簡單：計算乘方；普通：科學記號；挑戰：含乘方的四則運算',
    tip: '科學記號請寫成 1.5×10^8 或 1.5x10^8；負指數寫 10^-4。',
    gen(lv) {
      if (lv === 0) {
        const b = rndNZ(-5, 5), n = rnd(2, 4), form = pick(['p', 'n']);
        const e = form === 'p' || b > 0 ? `(${b})^${n}` : `-${-b}^${n}`;
        const shown = form === 'p' || b > 0 ? `${paren(b)}<sup>${n}</sup>` : `−${-b}<sup>${n}</sup>`;
        return { q: `計算：${shown} = ?`, ans: steps(e).result, sol: form === 'p' || b > 0 ? `${paren(b)} 連乘 ${n} 次 = ${fmtInt((b) ** n)}` : `先算 ${-b}<sup>${n}</sup> = ${(-b) ** n}，再加負號 → ${fmtInt(-((-b) ** n))}` };
      }
      if (lv === 1) {
        const big = Math.random() < 0.6;
        const a = rnd(11, 99) / 10, n = big ? rnd(3, 9) : -rnd(2, 6);
        const x = +(a * 10 ** n).toPrecision(6);
        const s = big ? x.toLocaleString('en-US', { useGrouping: false }) : x.toFixed(-n + 1).replace(/0+$/, '');
        return { q: `把 <b>${s}</b> 寫成科學記號`, ans: `${a}×10^${n}`, ansHTML: `${a} × 10<sup>${n}</sup>`, check: (inp) => sciCheck(inp, x), placeholder: '例如 1.5×10^8', sol: `小數點${n > 0 ? '向左' : '向右'}移 ${Math.abs(n)} 位：${s} = ${a} × 10<sup>${n}</sup>（1 ≤ ${a} ＜ 10）` };
      }
      const e = pick([`(-2)^3-3^2`, `-2^4+(-1)^5×3`, `(-3)^2×2-(-2)^3`, `5-(-1)^7×4^2`, `(-2)^2×(-3)-10`, `-3^2÷(-1)^3`]);
      return { q: `計算：${exprHTML(e)} = ?`, ans: steps(e).result, sol: stepsHTML(e) };
    }
  });

  // =====================================================================
  // 2-1 質數與質因數分解
  // =====================================================================
  W['sieve'] = function (host) {
    const body = frame(host, '🧺 埃拉托斯特尼篩法', '依序刪去 2、3、5、7 的倍數，剩下的就是質數');
    body.innerHTML = `<div class="w-tabs">${[2, 3, 5, 7].map((p) => `<button class="chip" data-p="${p}">刪去 ${p} 的倍數</button>`).join('')}<button class="chip" data-k="reset">重來</button></div>
      <div class="sv-grid"></div><div class="w-read"></div>`;
    const grid = body.querySelector('.sv-grid'), read = body.querySelector('.w-read');
    let gone;
    function reset() {
      gone = new Set([1]);
      grid.innerHTML = Array.from({ length: 100 }, (_, i) => `<span class="sv-c" data-n="${i + 1}">${i + 1}</span>`).join('');
      grid.querySelector('[data-n="1"]').classList.add('one');
      read.innerHTML = '<b class="h">1 不是質數也不是合數</b>從 2 開始，按上方按鈕刪去倍數（保留它自己）。';
      body.querySelectorAll('[data-p]').forEach((b) => { b.disabled = false; b.classList.remove('active'); });
    }
    body.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const p = +b.dataset.p;
      let k = 0;
      for (let m = p * 2; m <= 100; m += p) {
        if (!gone.has(m)) { gone.add(m); const c = grid.querySelector(`[data-n="${m}"]`); setTimeout(() => c.classList.add('gone', 'p' + p), (k++) * 25); }
      }
      grid.querySelector(`[data-n="${p}"]`).classList.add('prime');
      b.disabled = true; b.classList.add('active');
      const left = 100 - gone.size;
      const all = [2, 3, 5, 7].every((q) => body.querySelector(`[data-p="${q}"]`).disabled);
      if (all) grid.querySelectorAll('.sv-c').forEach((c) => { if (!gone.has(+c.dataset.n)) c.classList.add('prime'); });
      read.innerHTML = all
        ? `<b class="h">完成！100 以內共有 25 個質數</b>剩下沒被刪去的數都是質數。因為 11 × 11 ＞ 100，只要刪到 7 的倍數就夠了。`
        : `<b class="h">刪去 ${p} 的倍數（共刪去 ${k} 個）</b>目前還剩 ${left} 個數。`;
    }));
    body.querySelector('[data-k="reset"]').addEventListener('click', reset);
    reset();
  };

  W['factor-tree'] = function (host) {
    const body = frame(host, '🌳 質因數分解：短除法', '輸入一個數，看短除法與標準分解式');
    body.innerHTML = `<div class="w-calc-row"><input type="number" data-k="n" value="360" min="2" max="99999" style="width:7em"><button class="chip" data-k="go">分解</button><button class="chip" data-k="rnd">隨機</button></div>
      <div class="w-split"><div class="fd-ladder"></div><div class="w-side"><div class="w-read w-read-lg"></div></div></div>`;
    const inp = body.querySelector('[data-k="n"]'), lad = body.querySelector('.fd-ladder'), read = body.querySelector('.w-read');
    function run() {
      let n = Math.floor(+inp.value);
      if (!(n >= 2 && n <= 99999)) { read.innerHTML = '<span class="w-bad">請輸入 2～99999 的整數</span>'; return; }
      const orig = n, rows = [];
      for (let d = 2; n > 1;) { if (n % d === 0) { rows.push([d, n]); n /= d; } else d++; if (d * d > n && n > 1 && n % d) { rows.push([n, n]); n = 1; } }
      lad.innerHTML = rows.map(([d, v]) => `<div class="fd-row"><span class="fd-d">${d}</span><span class="fd-v">${v}</span></div>`).join('') + '<div class="fd-row"><span class="fd-d"></span><span class="fd-v last">1</span></div>';
      const f = primeFactors(orig);
      read.innerHTML = isPrime(orig) ? `<b class="h">${orig} 是質數</b>它的因數只有 1 和 ${orig}。`
        : `<b class="h">${orig} = ${factorHTML(f)}</b>這是 ${orig} 的<b>標準分解式</b>：質因數由小到大排列，相同的質因數用指數表示。<br>質因數有：${Object.keys(f).join('、')}。`;
    }
    body.querySelector('[data-k="go"]').addEventListener('click', run);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    body.querySelector('[data-k="rnd"]').addEventListener('click', () => { inp.value = pick([12, 36, 60, 72, 84, 90, 96, 120, 126, 150, 180, 210, 252, 300, 360, 420, 504, 540, 600, 720, 1000]); run(); });
    run();
  };

  function factCheck(input, n) {
    const parts = String(input).replace(/\s/g, '').replace(/[x*·]/g, '×').split('×').filter(Boolean);
    if (!parts.length) return false;
    let prod = 1;
    for (const p of parts) {
      const m = p.match(/^(\d+)(?:\^(\d+))?$/) || p.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/, (s) => '^' + s.split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('')).match(/^(\d+)\^(\d+)$/);
      if (!m) return false;
      const b = +m[1], e = m[2] ? +m[2] : 1;
      if (!isPrime(b)) return false;
      prod *= b ** e;
    }
    return prod === n;
  }
  W['gen-u5'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：質數與質因數分解', desc: '簡單：判斷質數、倍數；普通、挑戰：寫出質因數分解',
    tip: '質因數分解請寫成 2^3×3^2 或 2×2×2×3×3（× 可用 x 代替）。',
    gen(lv) {
      if (lv === 0) {
        if (Math.random() < 0.5) {
          const n = pick([2, 9, 15, 17, 21, 23, 27, 29, 31, 33, 37, 39, 41, 49, 51, 53, 57, 59, 61, 63, 67, 71, 77, 79, 81, 87, 89, 91, 97]);
          return { q: `${n} 是質數嗎？`, type: 'choice', options: ['是質數', '不是質數'], ans: isPrime(n) ? 0 : 1, sol: isPrime(n) ? `${n} 的因數只有 1 和 ${n}，是質數。` : `${n} = ${factorHTML(primeFactors(n))}，有其他因數，是合數。` };
        }
        const d = pick([2, 3, 4, 5, 9, 11]), n = pick([rnd(100, 999), d * rnd(12, 111)]);
        const rule = { 2: '個位數是偶數', 3: '各位數字和是 3 的倍數', 4: '末兩位是 4 的倍數', 5: '個位數是 0 或 5', 9: '各位數字和是 9 的倍數', 11: '奇數位數字和與偶數位數字和的差是 11 的倍數' }[d];
        return { q: `${n} 是 ${d} 的倍數嗎？`, type: 'choice', options: ['是', '不是'], ans: n % d === 0 ? 0 : 1, sol: `${d} 的倍數判別法：${rule}。${n} ÷ ${d} ${n % d === 0 ? '= ' + n / d + '，整除' : '有餘數'}。` };
      }
      const n = lv === 1 ? pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 54, 56, 60, 63, 72, 75, 80, 84, 90, 96, 98, 100]) : pick([120, 126, 144, 168, 180, 196, 210, 225, 240, 252, 270, 288, 300, 315, 324, 336, 360, 378, 400, 420, 450, 480, 504, 540, 600, 720, 756, 900, 1008]);
      const f = primeFactors(n);
      return { q: `寫出 ${n} 的標準分解式`, ans: factorHTML(f), ansHTML: factorHTML(f), check: (inp) => factCheck(inp, n), placeholder: '例如 2^3×3^2', sol: `短除法依序除以最小的質數：${n} = ${factorHTML(f)}` };
    }
  });

  // =====================================================================
  // 2-2 最大公因數與最小公倍數
  // =====================================================================
  W['gcd-venn'] = function (host) {
    const body = frame(host, '⭕ 用質因數求 (a, b) 與 [a, b]', '輸入兩個數，看共同的質因數');
    body.innerHTML = `<div class="w-calc-row"><span>a</span><input type="number" data-k="a" value="36" style="width:6em"><span>b</span><input type="number" data-k="b" value="60" style="width:6em"><button class="chip" data-k="go">計算</button></div>
      <div class="w-split"><div class="w-map w-map-sm"><svg viewBox="0 0 420 260"></svg></div><div class="w-side"><div class="w-read w-read-lg"></div></div></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    function list(n) { const f = primeFactors(n), out = []; Object.keys(f).map(Number).sort((x, y) => x - y).forEach((p) => { for (let i = 0; i < f[p]; i++) out.push(p); }); return out; }
    function run() {
      const a = Math.floor(+$('a').value), b = Math.floor(+$('b').value);
      if (!(a >= 2 && b >= 2 && a <= 9999 && b <= 9999)) { read.innerHTML = '<span class="w-bad">請輸入 2～9999 的整數</span>'; return; }
      const la = list(a), lb = list(b), common = [], ra = la.slice(), rb = [];
      lb.forEach((p) => { const i = ra.indexOf(p); if (i >= 0) { common.push(p); ra.splice(i, 1); } else rb.push(p); });
      svg.innerHTML = '';
      el('circle', { cx: 160, cy: 135, r: 105, class: 'vn-a' }, svg);
      el('circle', { cx: 260, cy: 135, r: 105, class: 'vn-b' }, svg);
      el('text', { x: 100, y: 25, class: 'w-label', text: `a = ${a}` }, svg);
      el('text', { x: 270, y: 25, class: 'w-label', text: `b = ${b}` }, svg);
      const put = (arr, cx) => arr.forEach((p, i) => el('text', { x: cx + ((i % 2) * 2 - 1) * 16, y: 95 + Math.floor(i / 2) * 26 + (i % 2) * 6, 'text-anchor': 'middle', class: 'vn-num', text: p }, svg));
      put(ra, 110); put(common, 210); put(rb, 310);
      const g = gcd(a, b), l = lcm(a, b);
      read.innerHTML = `<b class="h">(${a}, ${b}) = ${g}　[${a}, ${b}] = ${l}</b>
        最大公因數：中間<b>共同</b>的質因數相乘 = ${common.length ? common.join(' × ') : '1'} = <b>${g}</b><br>
        最小公倍數：圖中<b>所有</b>質因數相乘 = ${[...ra, ...common, ...rb].join(' × ')} = <b>${l}</b><br>
        ${g === 1 ? `${a} 與 ${b} <b>互質</b>（最大公因數為 1）。<br>` : ''}<span class="w-hint">驗證：(a, b) × [a, b] = ${g} × ${l} = ${g * l} = a × b</span>`;
    }
    $('go').addEventListener('click', run);
    ['a', 'b'].forEach((k) => $(k).addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); }));
    run();
  };

  W['square-cut'] = function (host) {
    const body = frame(host, '🟩 最大公因數與最小公倍數的應用', '切成最大的正方形 vs. 拼成最小的正方形');
    body.innerHTML = `<div class="w-tabs"><button class="chip" data-m="cut">切成正方形（最大公因數）</button><button class="chip" data-m="tile">拼成正方形（最小公倍數）</button></div>
      <div class="w-calc-row"><span>長方形</span><input type="number" data-k="a" value="12" style="width:5em"><span>×</span><input type="number" data-k="b" value="18" style="width:5em"><span>公分</span></div>
      <div class="w-split"><div class="w-map w-map-sm"><svg viewBox="0 0 400 300"></svg></div><div class="w-side"><div class="w-read w-read-lg"></div></div></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    let mode = 'cut';
    function run() {
      body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('active', b.dataset.m === mode));
      const a = Math.max(1, Math.min(60, Math.floor(+$('a').value))), b = Math.max(1, Math.min(60, Math.floor(+$('b').value)));
      svg.innerHTML = '';
      if (mode === 'cut') {
        const g = gcd(a, b), k = Math.min(360 / a, 260 / b);
        for (let i = 0; i < a / g; i++) for (let j = 0; j < b / g; j++) el('rect', { x: 20 + i * g * k, y: 20 + j * g * k, width: g * k, height: g * k, class: 'sq-cell' }, svg);
        el('rect', { x: 20, y: 20, width: a * k, height: b * k, class: 'sq-frame' }, svg);
        read.innerHTML = `<b class="h">正方形邊長最大 = (${a}, ${b}) = ${g} 公分</b>可以切成 ${a / g} × ${b / g} = <b>${(a / g) * (b / g)}</b> 個正方形，沒有剩下。<br><span class="w-hint">邊長要同時整除長與寬 → 公因數；要最大 → 最大公因數。</span>`;
      } else {
        const l = lcm(a, b), k = 260 / l;
        for (let i = 0; i < l / a; i++) for (let j = 0; j < l / b; j++) el('rect', { x: 20 + i * a * k, y: 20 + j * b * k, width: a * k, height: b * k, class: 'sq-tile' }, svg);
        el('rect', { x: 20, y: 20, width: l * k, height: l * k, class: 'sq-frame' }, svg);
        read.innerHTML = `<b class="h">最小正方形邊長 = [${a}, ${b}] = ${l} 公分</b>需要 ${l / a} × ${l / b} = <b>${(l / a) * (l / b)}</b> 塊長方形磁磚。<br><span class="w-hint">邊長要同時是長與寬的倍數 → 公倍數；要最小 → 最小公倍數。</span>`;
      }
    }
    body.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.m; run(); }));
    ['a', 'b'].forEach((k) => $(k).addEventListener('input', run));
    run();
  };

  W['gen-u6'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：最大公因數與最小公倍數', desc: '簡單：(a, b)；普通：[a, b]；挑戰：應用題',
    gen(lv) {
      const g = pick([2, 3, 4, 5, 6, 7, 8, 9, 12]), x = rnd(2, 9);
      let y; do y = rnd(2, 9); while (gcd(x, y) !== 1 || x === y);
      const a = g * x, b = g * y;
      if (lv === 0) return { q: `求 ${a} 與 ${b} 的最大公因數 (${a}, ${b})`, ans: g, sol: `${a} = ${factorHTML(primeFactors(a))}，${b} = ${factorHTML(primeFactors(b))}；共同質因數相乘 = ${g}` };
      if (lv === 1) return { q: `求 ${a} 與 ${b} 的最小公倍數 [${a}, ${b}]`, ans: lcm(a, b), sol: `[${a}, ${b}] = ${a} × ${b} ÷ (${a}, ${b}) = ${a * b} ÷ ${g} = ${lcm(a, b)}` };
      const t = pick(['cut', 'bus', 'group', 'tile']);
      if (t === 'cut') return { q: `一張長 ${a} 公分、寬 ${b} 公分的紙，要剪成大小相同、邊長最大的正方形且沒有剩餘。正方形邊長是幾公分？`, ans: g, sol: `邊長要整除長與寬，且最大 → (${a}, ${b}) = ${g}` };
      if (t === 'group') return { q: `有 ${a} 顆蘋果和 ${b} 顆橘子，要平分給一群學生，每人分到的蘋果數相同、橘子數也相同，都沒有剩下。最多可以分給幾位學生？`, ans: g, sol: `人數要同時整除 ${a} 和 ${b}，且最多 → (${a}, ${b}) = ${g}` };
      if (t === 'bus') return { q: `甲公車每 ${a} 分鐘發一班，乙公車每 ${b} 分鐘發一班。早上 6 點同時發車，至少再過幾分鐘會再同時發車？`, ans: lcm(a, b), sol: `經過的時間要是 ${a} 和 ${b} 的公倍數，且最少 → [${a}, ${b}] = ${lcm(a, b)}` };
      return { q: `用長 ${a} 公分、寬 ${b} 公分的長方形磁磚，拼成一個最小的正方形（不能切割）。正方形邊長是幾公分？`, ans: lcm(a, b), sol: `邊長要是 ${a} 和 ${b} 的公倍數，且最小 → [${a}, ${b}] = ${lcm(a, b)}` };
    }
  });

  // =====================================================================
  // 2-3 分數的運算與指數律
  // =====================================================================
  W['frac-bars'] = function (host) {
    const body = frame(host, '🍫 分數條：通分再相加減', '選兩個分數，看怎麼化成同分母');
    const opts = (v) => Array.from({ length: 12 }, (_, i) => `<option${i + 1 === v ? ' selected' : ''}>${i + 1}</option>`).join('');
    body.innerHTML = `<div class="w-calc-row"><select data-k="a">${opts(1)}</select>/<select data-k="b">${opts(2)}</select>
      <select data-k="op"><option>＋</option><option>－</option></select>
      <select data-k="c">${opts(1)}</select>/<select data-k="d">${opts(3)}</select></div>
      <div class="w-map w-map-mid"><svg viewBox="0 0 640 250"></svg></div><div class="w-read"></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const $ = (k) => +body.querySelector(`[data-k="${k}"]`).value;
    function bar(y, parts, filled, cls, label) {
      const w = 480 / parts;
      for (let i = 0; i < parts; i++) el('rect', { x: 130 + i * w, y, width: w, height: 34, class: i < filled ? cls : 'fb-empty' }, svg);
      el('text', { x: 120, y: y + 23, 'text-anchor': 'end', class: 'w-label', text: label }, svg);
    }
    function run() {
      const a = $('a'), b = $('b'), c = $('c'), d = $('d'), op = body.querySelector('[data-k="op"]').value === '＋' ? '+' : '-';
      const L = lcm(b, d), A = a * (L / b), C = c * (L / d), R = op === '+' ? A + C : A - C;
      svg.innerHTML = '';
      bar(10, b, a, 'fb-a', `${a}/${b}`);
      bar(60, d, c, 'fb-c', `${c}/${d}`);
      el('text', { x: 130, y: 118, class: 'w-small', text: `通分：分母都變成 ${L}（${b} 和 ${d} 的最小公倍數）` }, svg);
      bar(125, L, A, 'fb-a', `${A}/${L}`);
      bar(170, L, C, 'fb-c', `${C}/${L}`);
      const res = new F(R, L);
      if (R >= 0 && R <= L) bar(215, L, R, 'fb-r', `${R}/${L}`);
      read.innerHTML = `<b class="h">${a}/${b} ${op === '+' ? '+' : '−'} ${c}/${d} = ${A}/${L} ${op === '+' ? '+' : '−'} ${C}/${L} = ${R}/${L}${res.d !== L || res.n !== R ? ' = ' + res.toHTML() : ''}</b>
        先<b>通分</b>（分母化成相同），再把分子${op === '+' ? '相加' : '相減'}，最後<b>約分</b>成最簡分數。${R > L ? '<br><span class="w-hint">結果大於 1，分數條畫不下囉！</span>' : R < 0 ? '<br><span class="w-hint">結果是負數。</span>' : ''}`;
    }
    body.querySelectorAll('select').forEach((s) => s.addEventListener('change', run));
    run();
  };

  W['gen-u7a'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：分數的四則運算', desc: '答案請寫成最簡分數，例如 -5/6',
    gen(lv) {
      const fr = () => { const d = rnd(2, 9); let n = rndNZ(-8, 8); if (Math.abs(n) % d === 0) n += 1; return `${n}/${d}`; };
      const P = (f) => (f.startsWith('-') ? `(${f})` : f);
      let e;
      if (lv === 0) e = `${fr()}${pick(['+', '-'])}${P(fr())}`;
      else if (lv === 1) e = `${fr()}${pick(['×', '÷'])}${P(fr())}`;
      else e = pick([`${fr()}+${P(fr())}×${P(fr())}`, `(${fr()}-${P(fr())})÷${P(fr())}`, `${fr()}×${P(fr())}-${P(fr())}`]);
      e = e.replace(/^\((-\d+\/\d+)\)/, '$1');
      let r;
      try { r = steps(e).result; } catch (err) { return this.gen(lv); }
      return { q: `計算：${exprHTML(e)} = ?`, ans: r, sol: stepsHTML(e), check(inp) { const v = M.parseAnswer(inp); return v !== null && v.eq(r); } };
    }
  });

  W['gen-u7b'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：指數律', desc: '用指數律化簡，填入指數或結果',
    tip: '只要填數字（例如指數 7，或 1/8）。',
    gen(lv) {
      const a = pick([2, 3, 5, 10]), m = rnd(2, 6), n = rnd(2, 5);
      const t = pick(lv === 0 ? ['mul', 'pow'] : lv === 1 ? ['mul', 'pow', 'div', 'zero'] : ['div', 'neg', 'mix', 'zero']);
      if (t === 'mul') return { q: `${a}<sup>${m}</sup> × ${a}<sup>${n}</sup> = ${a}<sup>□</sup>，□ = ?`, ans: m + n, sol: `同底數相乘，指數相加：a<sup>m</sup> × a<sup>n</sup> = a<sup>m+n</sup>，${m} + ${n} = ${m + n}` };
      if (t === 'pow') return { q: `(${a}<sup>${m}</sup>)<sup>${n}</sup> = ${a}<sup>□</sup>，□ = ?`, ans: m * n, sol: `乘方的乘方，指數相乘：(a<sup>m</sup>)<sup>n</sup> = a<sup>m×n</sup>，${m} × ${n} = ${m * n}` };
      if (t === 'div') { const big = m + n; return { q: `${a}<sup>${big}</sup> ÷ ${a}<sup>${n}</sup> = ${a}<sup>□</sup>，□ = ?`, ans: m, sol: `同底數相除，指數相減：${big} − ${n} = ${m}` }; }
      if (t === 'zero') return { q: `${pick([7, 13, '(−5)', '2/3'])}<sup>0</sup> = ?`, ans: 1, sol: '任何不為 0 的數，0 次方都等於 1。' };
      if (t === 'neg') { const k = rnd(1, 3), b = pick([2, 3, 10]); return { q: `${b}<sup>−${k}</sup> = ?（寫成分數）`, ans: new F(1, b ** k), sol: `a<sup>−n</sup> = 1 / a<sup>n</sup>：${b}<sup>−${k}</sup> = 1/${b}<sup>${k}</sup> = 1/${b ** k}` }; }
      const p = rnd(2, 4), q = rnd(1, 3);
      return { q: `計算 2<sup>${p + q}</sup> ÷ 2<sup>${q}</sup> × 2<sup>0</sup> = ?`, ans: 2 ** p, sol: `2<sup>${p + q}−${q}</sup> × 1 = 2<sup>${p}</sup> = ${2 ** p}` };
    }
  });

  // =====================================================================
  // 3-1 代數式的化簡
  // =====================================================================
  function linTerms(src) {
    // 把一次式拆成最上層的各項，回傳 [{coef, const}]
    const root = M.parse(src), out = [];
    (function flat(n, sign) {
      if (n.t === 'bin' && (n.op === '+' || n.op === '-')) { flat(n.a, sign); flat(n.b, n.op === '-' ? -sign : sign); return; }
      if (n.t === 'neg') { flat(n.a, -sign); return; }
      const f0 = M.evaluate(n, { x: 0 }), f1 = M.evaluate(n, { x: 1 });
      out.push({ k: f1.sub(f0).mul(sign), c: f0.mul(sign) });
    })(root, 1);
    return out;
  }
  W['algebra-tiles'] = function (host) {
    const body = frame(host, '🧱 代數磚：合併同類項', '輸入一次式，看代數磚怎麼抵銷、合併');
    const P = ['3x+2-x+4', '2x-5+3x+1', '-x+3-2x-4', '2(x+3)-x', '-(2x-1)+4x', '4x-3-(x-5)'];
    body.innerHTML = `<div class="w-calc-row"><input type="text" data-k="e" value="${P[0]}" style="width:14em"><button class="chip" data-k="go">放上代數磚</button><button class="chip" data-k="merge">合併 ✨</button></div>
      <div class="w-chips">${P.map((p) => `<button class="chip" data-p="${p}">${p}</button>`).join('')}</div>
      <div class="at-legend"><span class="at at-x">x</span> 代表 x　<span class="at at-nx">−x</span> 代表 −x　<span class="at at-1">1</span> 代表 1　<span class="at at-n1">−1</span> 代表 −1</div>
      <div class="at-tray"></div><div class="w-read"></div>`;
    const tray = body.querySelector('.at-tray'), read = body.querySelector('.w-read'), inp = body.querySelector('[data-k="e"]');
    let terms = null;
    function place() {
      try { terms = linTerms(inp.value); } catch (e) { read.innerHTML = `<span class="w-bad">⚠ ${e.message}</span>`; return; }
      if (terms.some((t) => !t.k.isInt() || !t.c.isInt() || Math.abs(t.k) > 12 || Math.abs(t.c) > 12)) { read.innerHTML = '<span class="w-bad">為了畫得下，請用整數係數且不超過 12。</span>'; return; }
      tray.innerHTML = terms.map((t) => {
        let h = '';
        for (let i = 0; i < Math.abs(t.k); i++) h += `<span class="at ${t.k > 0 ? 'at-x' : 'at-nx'}">${t.k > 0 ? 'x' : '−x'}</span>`;
        for (let i = 0; i < Math.abs(t.c); i++) h += `<span class="at ${t.c > 0 ? 'at-1' : 'at-n1'}">${t.c > 0 ? '1' : '−1'}</span>`;
        return `<span class="at-group">${h}</span>`;
      }).join('<span class="at-plus">＋</span>');
      read.innerHTML = `<b class="h">${exprHTML(inp.value)}</b>共有 ${terms.length} 組。按「合併」把同類項放在一起、正負抵銷。`;
    }
    function merge() {
      if (!terms) return;
      const K = terms.reduce((s, t) => s.add(t.k), new F(0)), C = terms.reduce((s, t) => s.add(t.c), new F(0));
      const px = terms.reduce((s, t) => s + Math.max(0, +t.k), 0), nx = terms.reduce((s, t) => s + Math.max(0, -t.k), 0);
      const p1 = terms.reduce((s, t) => s + Math.max(0, +t.c), 0), n1 = terms.reduce((s, t) => s + Math.max(0, -t.c), 0);
      const tile = (cls, txt, gone) => `<span class="at ${cls}${gone ? ' gone' : ''}">${txt}</span>`;
      let h = '<span class="at-group">';
      for (let i = 0; i < px; i++) h += tile('at-x', 'x', i < Math.min(px, nx));
      for (let i = 0; i < nx; i++) h += tile('at-nx', '−x', i < Math.min(px, nx));
      h += '</span><span class="at-plus">｜</span><span class="at-group">';
      for (let i = 0; i < p1; i++) h += tile('at-1', '1', i < Math.min(p1, n1));
      for (let i = 0; i < n1; i++) h += tile('at-n1', '−1', i < Math.min(p1, n1));
      tray.innerHTML = h + '</span>';
      read.innerHTML = `<b class="h">${exprHTML(inp.value)} = ${linear(+K, +C)}</b>x 項：${px} 個 x 與 ${nx} 個 −x 抵銷後剩 ${fmtInt(+K)}x；常數項：${p1} 個 1 與 ${n1} 個 −1 抵銷後剩 ${fmtInt(+C)}。<br><span class="w-hint">一個 x 和一個 −x 合起來是 0（變淡的磚塊）。</span>`;
    }
    body.querySelector('[data-k="go"]').addEventListener('click', place);
    body.querySelector('[data-k="merge"]').addEventListener('click', merge);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') place(); });
    body.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { inp.value = b.dataset.p; place(); }));
    place();
  };

  W['gen-u8'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：代數式', desc: '化簡一次式，或代入求值',
    tip: '化簡的答案寫成像 5x-3 的形式；代入求值只要填數字。',
    gen(lv) {
      const a = rndNZ(-6, 6), b = rndNZ(-9, 9), c = rndNZ(-6, 6), d = rndNZ(-9, 9), k = rndNZ(-4, 4);
      const s = (v) => (v < 0 ? ` − ${-v}` : ` + ${v}`);
      const sx = (v) => (v === 1 ? ' + x' : v === -1 ? ' − x' : v < 0 ? ` − ${-v}x` : ` + ${v}x`);
      if (lv === 2 && Math.random() < 0.4) {
        const x = rndNZ(-5, 5);
        return { q: `當 x = ${fmtInt(x)} 時，求 ${linear(a, b)}${sx(c)}${s(d)} 的值`, ans: (a + c) * x + b + d, sol: `先化簡：${linear(a + c, b + d)}，再代入 x = ${fmtInt(x)}：${fmtInt(a + c)} × ${paren(x)} ${s(b + d).trim()} = ${fmtInt((a + c) * x + b + d)}` };
      }
      let q, K, C;
      if (lv === 0) { q = `${linear(a, b)}${sx(c)}`; K = a + c; C = b; }
      else if (lv === 1) { q = `${linear(a, b)}${sx(c)}${s(d)}`; K = a + c; C = b + d; }
      else { q = `${k}(${linear(a, b)})${sx(c)}${s(d)}`.replace(/^1\(/, '(').replace(/^-1\(/, '−('); K = k * a + c; C = k * b + d; }
      const shown = q.replace(/-/g, '−');
      return { q: `化簡：${shown}`, type: 'expr', ans: linear(K, C), ansHTML: linear(K, C), sol: `${lv === 2 ? '先用分配律去括號，' : ''}把 x 項合併：係數 ${fmtInt(K)}；常數項合併：${fmtInt(C)}　→　${linear(K, C)}` };
    }
  });

  // =====================================================================
  // 3-2 一元一次方程式
  // =====================================================================
  W['balance'] = function (host) {
    const body = frame(host, '⚖️ 天平解方程式', '對兩邊做一樣的事，讓 x 單獨留在一邊');
    body.innerHTML = `<div class="w-chips"><button class="chip" data-k="new">🎲 換一題</button><button class="chip" data-k="undo">↶ 上一步</button></div>
      <div class="bl-eq"></div>
      <div class="w-map w-map-mid"><svg viewBox="0 0 640 230"></svg></div>
      <div class="w-calc-row">
        <span>兩邊同時</span><select data-k="op"><option value="add">加上</option><option value="sub">減去</option><option value="mul">乘以</option><option value="div">除以</option></select>
        <input type="text" data-k="v" value="" placeholder="例如 3、2x" style="width:6em"><button class="chip" data-k="do">執行</button>
      </div>
      <ol class="bl-log"></ol><div class="w-read"></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read'), log = body.querySelector('.bl-log'), eqEl = body.querySelector('.bl-eq');
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    let L, R, hist;
    const txt = (s) => linear(+s.k, +s.c).replace(/^$/, '0');
    const lin = (s) => (s.k.isInt() && s.c.isInt() ? txt(s) : `${s.k.eq(0) ? '' : s.k.toHTML() + 'x'}${s.c.eq(0) ? (s.k.eq(0) ? '0' : '') : (s.k.eq(0) ? '' : ' + ') + s.c.toHTML()}`);
    function newEq() {
      const x = rndNZ(-6, 8), a = rnd(2, 5), c = pick([0, 0, 1, -1, 2]), b = rndNZ(-9, 9);
      const d = (a - c) * x + b;
      L = { k: new F(a), c: new F(b) }; R = { k: new F(c), c: new F(d) }; hist = [];
      log.innerHTML = ''; draw();
    }
    function solved() { return (L.k.eq(1) && L.c.eq(0) && R.k.eq(0)) || (R.k.eq(1) && R.c.eq(0) && L.k.eq(0)); }
    function draw() {
      eqEl.innerHTML = `<span>${lin(L)}</span> = <span>${lin(R)}</span>`;
      svg.innerHTML = '';
      el('path', { d: 'M320,215 L300,215 L320,90 L340,215 Z', class: 'bl-stand' }, svg);
      el('line', { x1: 60, x2: 580, y1: 90, y2: 90, class: 'bl-beam' }, svg);
      [[60, 280, L], [360, 580, R]].forEach(([x0, x1, s]) => {
        el('path', { d: `M${x0},170 L${x1},170 L${x1 - 20},190 L${x0 + 20},190 Z`, class: 'bl-pan' }, svg);
        el('line', { x1: x0 + 10, x2: (x0 + x1) / 2, y1: 170, y2: 92, class: 'bl-rope' }, svg);
        el('line', { x1: x1 - 10, x2: (x0 + x1) / 2, y1: 170, y2: 92, class: 'bl-rope' }, svg);
        const items = [];
        if (s.k.isInt() && Math.abs(s.k) <= 8) for (let i = 0; i < Math.abs(s.k); i++) items.push(s.k > 0 ? 'x' : '−x');
        else if (!s.k.eq(0)) items.push(s.k.toString() + 'x');
        if (s.c.isInt() && Math.abs(s.c) <= 12) for (let i = 0; i < Math.abs(s.c); i++) items.push(s.c > 0 ? '1' : '−1');
        else if (!s.c.eq(0)) items.push(s.c.toString());
        items.forEach((t, i) => {
          const big = t.length > 2, w = big ? 54 : t.includes('x') ? 26 : 18, x = x0 + 15 + (i % 9) * 23, y = 145 - Math.floor(i / 9) * 26;
          const cls = t.includes('x') ? (t.startsWith('−') ? 'bl-nx' : 'bl-x') : t.startsWith('−') ? 'bl-n1' : 'bl-1';
          el('rect', { x, y, width: w, height: 22, rx: 4, class: cls }, svg);
          el('text', { x: x + w / 2, y: y + 16, 'text-anchor': 'middle', class: 'bl-t', text: t }, svg);
        });
      });
      read.innerHTML = solved() ? `<b class="h">🎉 解出來了！x = ${(L.k.eq(1) ? R.c : L.c).toHTML()}</b>記得把答案代回原方程式驗算。`
        : '<b class="h">提示</b>先把含 x 的項移到同一邊、常數移到另一邊，最後兩邊同除以 x 的係數。';
    }
    function apply() {
      const op = $('op').value, raw = $('v').value.trim();
      if (!raw) { read.innerHTML = '<span class="w-bad">請輸入要加減乘除的數或式子。</span>'; return; }
      let t;
      try { const f0 = M.evaluate(M.parse(raw), { x: 0 }), f1 = M.evaluate(M.parse(raw), { x: 1 }); t = { k: f1.sub(f0), c: f0 }; } catch (e) { read.innerHTML = `<span class="w-bad">⚠ ${e.message}</span>`; return; }
      if ((op === 'mul' || op === 'div') && !t.k.eq(0)) { read.innerHTML = '<span class="w-bad">乘除只能用數字（不能乘除含 x 的式子）。</span>'; return; }
      if (op === 'div' && t.c.eq(0)) { read.innerHTML = '<span class="w-bad">不能除以 0。</span>'; return; }
      if (op === 'mul' && t.c.eq(0)) { read.innerHTML = '<span class="w-bad">乘以 0 會讓等式失去意義喔！</span>'; return; }
      hist.push([{ ...L }, { ...R }]);
      const f = { add: (s) => ({ k: s.k.add(t.k), c: s.c.add(t.c) }), sub: (s) => ({ k: s.k.sub(t.k), c: s.c.sub(t.c) }), mul: (s) => ({ k: s.k.mul(t.c), c: s.c.mul(t.c) }), div: (s) => ({ k: s.k.div(t.c), c: s.c.div(t.c) }) }[op];
      L = f(L); R = f(R);
      log.insertAdjacentHTML('beforeend', `<li>兩邊同時${$('op').selectedOptions[0].text} ${raw} → <b>${lin(L)} = ${lin(R)}</b></li>`);
      $('v').value = '';
      draw();
    }
    $('do').addEventListener('click', apply);
    $('v').addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); });
    $('new').addEventListener('click', newEq);
    $('undo').addEventListener('click', () => { if (!hist.length) return; [L, R] = hist.pop(); log.lastElementChild && log.lastElementChild.remove(); draw(); });
    newEq();
  };

  W['gen-u9'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：解一元一次方程式', desc: '簡單：ax + b = c；普通：兩邊都有 x；挑戰：含括號或分數',
    tip: '只要填 x 的值，例如 -3 或 5/2。',
    gen(lv) {
      const x = lv === 2 && Math.random() < 0.3 ? new F(rndNZ(-9, 9), 2) : new F(rndNZ(-9, 9));
      let q, sol;
      if (lv === 0) {
        const a = rndNZ(-6, 6) || 2, b = rndNZ(-12, 12), c = x.mul(a).add(b);
        q = `${linear(a, b)} = ${c.toString()}`;
        sol = `移項：${a === 1 ? '' : a === -1 ? '−' : fmtInt(a)}x = ${c.toString()} ${b > 0 ? '−' : '+'} ${Math.abs(b)} = ${c.sub(b).toString()}<br>兩邊同除以 ${fmtInt(a)}：x = ${x.toHTML()}`;
      } else if (lv === 1) {
        let a = rndNZ(-6, 7), c = rndNZ(-6, 6); if (a === c) a += 1;
        const b = rndNZ(-12, 12), d = x.mul(a - c).add(b);
        q = `${linear(a, b)} = ${linear(c, 0)}${d.n === 0 ? '' : (d < 0 ? ' − ' + d.neg().toString() : ' + ' + d.toString())}`;
        sol = `把 x 項移到左邊、常數移到右邊：${fmtInt(a)}x − ${paren(c)}x = ${d.toString()} − ${paren(b)}<br>${fmtInt(a - c)}x = ${d.sub(b).toString()}　→　x = ${x.toHTML()}`;
      } else {
        const k = rnd(2, 4), a = rndNZ(-4, 5), b = rndNZ(-6, 6), c = rndNZ(-5, 5);
        if (k * a === c) return this.gen(lv);
        const rhs = x.mul(c).add(0), lhs0 = x.mul(a).add(b).mul(k), dd = lhs0.sub(rhs);
        q = `${k}(${linear(a, b)}) = ${linear(c, 0)}${dd.n === 0 ? '' : ' + ' + dd.toString()}`.replace(/\+ −/g, '− ').replace(/\+ -/g, '− ');
        sol = `去括號：${linear(k * a, k * b)} = ${linear(c, 0)} + ${dd.toString()}<br>移項：${fmtInt(k * a - c)}x = ${dd.sub(k * b).toString()}　→　x = ${x.toHTML()}`;
      }
      return { q: `解方程式：${q.replace(/-/g, '−')}　x = ?`, ans: x, sol };
    }
  });

  W['gen-u9w'] = (host) => makePractice(host, {
    title: '🎲 練習產生器：一元一次方程式應用題', desc: '先設未知數、列方程式，再求解',
    levels: ['基本', '進階'],
    gen(lv) {
      const t = pick(lv === 0 ? ['age', 'buy', 'num'] : ['age2', 'speed', 'coin', 'share']);
      if (t === 'age') { const s = rnd(8, 15), k = rnd(3, 5), y = rnd(3, 8); return { q: `爸爸今年的年齡是小明的 ${k} 倍，小明今年 ${s} 歲。再過幾年，兩人的年齡和是 ${(k + 1) * s + 2 * y} 歲？`, ans: y, sol: `設再過 x 年：(${s} + x) + (${k * s} + x) = ${(k + 1) * s + 2 * y}<br>${(k + 1) * s} + 2x = ${(k + 1) * s + 2 * y} → 2x = ${2 * y} → x = ${y}` }; }
      if (t === 'buy') { const p = rnd(12, 35), n = rnd(3, 9), m = rnd(100, 500), ch = 1000 - n * p - m; if (ch <= 0) return this.gen(lv); return { q: `小華帶 1000 元，買了 ${n} 本相同的筆記本和一個 ${m} 元的書包，找回 ${ch} 元。每本筆記本多少元？`, ans: p, sol: `設每本 x 元：${n}x + ${m} + ${ch} = 1000 → ${n}x = ${n * p} → x = ${p}` }; }
      if (t === 'num') { const a = rnd(10, 40), d = rnd(2, 12); return { q: `兩數的和是 ${2 * a + d}，大數比小數多 ${d}。小數是多少？`, ans: a, sol: `設小數為 x，大數為 x + ${d}：x + (x + ${d}) = ${2 * a + d} → 2x = ${2 * a} → x = ${a}` }; }
      if (t === 'age2') {
        // 先決定答案 y，再反推母親年齡，保證是正整數
        const c = rnd(5, 12), y = rnd(2, 10), k = rnd(2, 3), f = k * (c + y) - y;
        return { q: `母親今年 ${f} 歲，女兒今年 ${c} 歲。幾年後，母親的年齡是女兒的 ${k} 倍？`, ans: y, sol: `設 x 年後：${f} + x = ${k}(${c} + x) → ${f} + x = ${k * c} + ${k}x → ${f - k * c} = ${k - 1}x → x = ${y}` };
      }
      if (t === 'speed') { const v1 = rnd(3, 6) * 10, v2 = rnd(3, 6) * 10, h = rnd(2, 5); return { q: `甲、乙兩車同時從相距 ${(v1 + v2) * h} 公里的兩地相向而行，甲車時速 ${v1} 公里，乙車時速 ${v2} 公里。幾小時後兩車相遇？`, ans: h, sol: `設 x 小時後相遇：${v1}x + ${v2}x = ${(v1 + v2) * h} → ${v1 + v2}x = ${(v1 + v2) * h} → x = ${h}` }; }
      if (t === 'coin') { const n10 = rnd(5, 20), n5 = rnd(5, 20); return { q: `撲滿裡只有 10 元和 5 元硬幣共 ${n10 + n5} 枚，總金額 ${10 * n10 + 5 * n5} 元。10 元硬幣有幾枚？`, ans: n10, sol: `設 10 元 x 枚，5 元 (${n10 + n5} − x) 枚：10x + 5(${n10 + n5} − x) = ${10 * n10 + 5 * n5} → 5x = ${5 * n10} → x = ${n10}` }; }
      // 每人多 1 顆時，需要多 ppl 顆：缺的數量 = ppl − extra，必須大於 0
      const ppl = rnd(6, 14), per = rnd(3, 6), extra = rnd(2, ppl - 2), short = ppl - extra;
      return { q: `一些糖果分給學生，每人 ${per} 顆會剩下 ${extra} 顆；每人 ${per + 1} 顆則不夠 ${short} 顆。學生有幾人？`, ans: ppl, sol: `設 x 人，糖果總數不變：${per}x + ${extra} = ${per + 1}x − ${short} → ${extra} + ${short} = x → x = ${ppl}` };
    }
  });
})();
