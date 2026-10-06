// 生物互動圖（一）：第 1～3 章，並提供 WUtil.makeDiagram / WUtil.makeOrder
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U) return;
  const { el, frame, makeSorter, shuffle } = U;

  // ---------- 通用：可點選的構造圖（含找找看） ----------
  // cfg: { title, desc, variants: [{ k, n, view, svg, parts: { key: [名稱, 說明] } }], side(body) }
  function makeDiagram(host, cfg) {
    const body = frame(host, cfg.title, cfg.desc);
    const V = cfg.variants;
    body.innerHTML = `
      <div class="w-tabs">
        ${V.length > 1 ? V.map((v) => `<button class="chip" data-v="${v.k}">${v.n}</button>`).join('') : ''}
        <span class="w-tab-sep"></span><button class="chip" data-k="quiz">🎯 找找看</button>
      </div>
      <div class="w-split">
        <div class="w-map w-map-diagram"><svg></svg></div>
        <div class="w-side"><div class="w-read w-read-lg"></div><div class="w-quiz-foot" hidden><span class="w-score"></span><button class="chip" data-k="next">下一題 →</button></div><div class="w-extra"></div></div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read'), foot = body.querySelector('.w-quiz-foot');
    let cur = V[0], quiz = null, score = [0, 0];
    const intro = () => `<b class="h">提示</b>${cfg.intro || '點選圖上的構造看名稱與功能。'}`;
    function load(v) {
      cur = v;
      body.querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('active', b.dataset.v === v.k));
      svg.setAttribute('viewBox', v.view);
      svg.innerHTML = v.svg;
      svg.querySelectorAll('[data-p]').forEach((n) => {
        n.classList.add('w-part');
        n.setAttribute('tabindex', 0);
        const pick = (e) => { e.stopPropagation(); choose(n.dataset.p); };
        n.addEventListener('click', pick);
        n.addEventListener('keydown', (e) => { if (e.key === 'Enter') pick(e); });
      });
      if (quiz) ask(); else read.innerHTML = intro();
      if (cfg.onLoad) cfg.onLoad(v, svg, body);
    }
    function mark(key, cls) { svg.querySelectorAll(`[data-p="${key}"]`).forEach((n) => n.classList.add(cls)); }
    function clear() { svg.querySelectorAll('.w-part').forEach((n) => n.classList.remove('on', 'ok', 'bad')); }
    function choose(key) {
      const info = cur.parts[key];
      if (!info) return;
      if (!quiz) { clear(); mark(key, 'on'); read.innerHTML = `<b class="h">${info[0]}</b>${info[1]}`; return; }
      if (quiz.done) return;
      quiz.done = true;
      const ok = key === quiz.key; score[1]++; if (ok) score[0]++;
      mark(quiz.key, 'ok'); if (!ok) mark(key, 'bad');
      read.innerHTML = `<b class="h">${ok ? '✔ 答對了！' : '✘ 這是「' + info[0] + '」'}</b><b>${cur.parts[quiz.key][0]}</b>：${cur.parts[quiz.key][1]}`;
      foot.querySelector('.w-score').textContent = `答對 ${score[0]} / ${score[1]}`;
    }
    function ask() {
      clear();
      const keys = Object.keys(cur.parts);
      const key = keys[Math.floor(Math.random() * keys.length)];
      quiz = { key, done: false };
      read.innerHTML = `<b class="h">找找看（${score[1] + 1}）</b>請點出「<b>${cur.parts[key][0]}</b>」在哪裡。`;
      foot.querySelector('.w-score').textContent = `答對 ${score[0]} / ${score[1]}`;
    }
    body.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => load(V.find((v) => v.k === b.dataset.v))));
    body.querySelector('[data-k="quiz"]').addEventListener('click', (e) => {
      const on = !quiz;
      e.currentTarget.classList.toggle('active', on);
      foot.hidden = !on;
      if (on) ask(); else { quiz = null; clear(); read.innerHTML = intro(); }
    });
    body.querySelector('[data-k="next"]').addEventListener('click', ask);
    if (cfg.side) cfg.side(body.querySelector('.w-extra'), body);
    load(V[0]);
    return body;
  }

  // ---------- 通用：依序點選（排順序） ----------
  // cfg: { title, desc, sets: [{ k, n, steps: [[名稱, 說明]] }], prompt }
  function makeOrder(host, cfg) {
    const body = frame(host, cfg.title, cfg.desc);
    body.innerHTML = `<div class="w-tabs">${cfg.sets.length > 1 ? cfg.sets.map((s) => `<button class="chip" data-s="${s.k}">${s.n}</button>`).join('') : ''}<span class="w-tab-sep"></span><button class="chip" data-k="again">重新開始</button></div>
      <div class="w-order-q"></div><div class="w-order-track"></div><div class="w-chips w-order-pool"></div><div class="w-read"></div>`;
    const q = body.querySelector('.w-order-q'), track = body.querySelector('.w-order-track'), pool = body.querySelector('.w-order-pool'), read = body.querySelector('.w-read');
    let set = cfg.sets[0];
    function start() {
      body.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('active', b.dataset.s === set.k));
      let step = 0;
      q.innerHTML = cfg.prompt || '請依照正確的順序點選：';
      track.innerHTML = set.steps.map((_, i) => `<span class="w-slot">${i + 1}</span>`).join('<i>→</i>');
      pool.innerHTML = shuffle(set.steps.map((s, i) => [s, i])).map(([s, i]) => `<button class="chip" data-i="${i}">${s[0]}</button>`).join('');
      read.innerHTML = '<b class="h">提示</b>想一想，哪一個應該排第一？';
      const mySet = set;
      pool.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
        const i = +b.dataset.i;
        if (!b.isConnected || mySet !== set || step >= set.steps.length) return;
        if (i === step) {
          const slot = track.querySelectorAll('.w-slot')[step];
          slot.textContent = set.steps[i][0]; slot.classList.add('ok');
          b.remove();
          read.innerHTML = `<b class="h">✔ ${set.steps[i][0]}</b>${set.steps[i][1]}`;
          step++;
          if (step === set.steps.length) read.innerHTML += '<br><b class="w-ok">🎉 全部排對了！</b>';
        } else {
          b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 500);
          read.innerHTML = `<b class="h">✘ 還不是「${set.steps[i][0]}」</b>再想想第 ${step + 1} 個是什麼。`;
        }
      }));
    }
    body.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { set = cfg.sets.find((s) => s.k === b.dataset.s); start(); }));
    body.querySelector('[data-k="again"]').addEventListener('click', start);
    start();
  }
  Object.assign(U, { makeDiagram, makeOrder });

  // =====================================================================
  // 第 1 章
  // =====================================================================
  W['life-sort'] = (host) => makeSorter(host, {
    title: '🌱 這是哪一種生命現象？', desc: '判斷每個例子表現的生命現象',
    cats: ['生長', '感應', '繁殖', '代謝'],
    items: [
      ['種子發芽，長成一株豆苗', '生長', '體型變大、構造改變。'], ['蝌蚪變成青蛙', '生長', '生長與發育。'],
      ['含羞草被碰觸後葉片閉合', '感應', '對刺激產生反應。'], ['手碰到燙的東西立刻縮回', '感應', '對刺激產生反應。'],
      ['向日葵的花盤朝向太陽', '感應', '對光的刺激產生反應。'], ['母雞下蛋孵出小雞', '繁殖', '產生新個體。'],
      ['草莓長出走莖產生新植株', '繁殖', '無性繁殖也是繁殖。'], ['人體消化食物、取得能量', '代謝', '體內的化學反應。'],
      ['細胞進行呼吸作用，排出二氧化碳', '代謝', '呼吸作用是代謝的一部分。']
    ]
  });
  W['method-order'] = (host) => makeOrder(host, {
    title: '🧪 科學方法的步驟', desc: '把科學方法的步驟依序排好',
    prompt: '小明發現窗邊的豆苗長得比較好。請依照<b>科學方法</b>的順序點選：',
    sets: [{ k: 'm', n: '科學方法', steps: [
      ['觀察', '發現「窗邊的豆苗長得比較好」。'], ['提出問題', '「光照會影響豆苗生長嗎？」'],
      ['形成假設', '「有照光的豆苗長得比較高。」'], ['設計實驗', '一組照光、一組不照光，其他條件相同。'],
      ['紀錄分析', '每天測量高度，畫成圖表。'], ['得到結論', '判斷假設是否成立。']] }]
  });
  W['variable-sort'] = (host) => makeSorter(host, {
    title: '🎛️ 這是哪一種變因？', desc: '實驗：探討「光照對豆苗生長的影響」',
    cats: ['操縱變因', '控制變因', '應變變因'],
    hint: '操縱變因＝刻意改變的；控制變因＝保持相同的；應變變因＝測量到的結果。',
    items: [
      ['有沒有照光', '操縱變因', '這是實驗要比較的條件。'], ['每天澆的水量', '控制變因', '兩組要相同。'],
      ['豆子的品種', '控制變因', '兩組要相同。'], ['盆栽的土壤', '控制變因', '兩組要相同。'],
      ['環境溫度', '控制變因', '兩組要相同。'], ['豆苗的高度', '應變變因', '測量的結果。'], ['葉子的顏色', '應變變因', '觀察到的結果。']
    ]
  });

  const SCOPE = `
    <rect x="0" y="0" width="360" height="420" class="w-bg"/>
    <rect x="80" y="372" width="210" height="32" rx="8" class="w-metal" data-p="base"/>
    <path d="M232,372 L232,140 Q232,104 200,98 L196,122 Q208,124 208,140 L208,372 Z" class="w-metal" data-p="arm"/>
    <rect x="146" y="64" width="46" height="96" rx="4" class="w-metal-l" data-p="tube"/>
    <rect x="154" y="22" width="30" height="46" rx="4" class="w-metal-d" data-p="eye"/>
    <ellipse cx="169" cy="170" rx="44" ry="13" class="w-metal-d" data-p="nose"/>
    <rect x="134" y="180" width="14" height="38" rx="3" class="w-obj" data-p="obj"/>
    <rect x="162" y="182" width="14" height="46" rx="3" class="w-obj" data-p="obj"/>
    <rect x="190" y="180" width="14" height="34" rx="3" class="w-obj" data-p="obj"/>
    <rect x="86" y="246" width="150" height="12" rx="3" class="w-metal-d" data-p="stage"/>
    <rect x="130" y="240" width="80" height="6" class="w-slide"/>
    <rect x="148" y="262" width="44" height="9" rx="2" class="w-metal-l" data-p="iris"/>
    <circle cx="170" cy="338" r="17" class="w-lamp" data-p="light"/>
    <circle cx="238" cy="292" r="22" class="w-knob" data-p="coarse"/>
    <circle cx="238" cy="292" r="10" class="w-knob2" data-p="fine"/>
    <text x="300" y="45" class="w-small">目鏡</text><text x="300" y="296" class="w-small">調節輪</text>`;
  W['microscope'] = (host) => makeDiagram(host, {
    title: '🔬 複式顯微鏡的構造', desc: '點選各部位看功能；或按「找找看」',
    variants: [{ k: 's', n: '複式顯微鏡', view: '0 0 360 420', svg: SCOPE, parts: {
      eye: ['目鏡', '眼睛觀察的鏡頭，常見 10×。'], obj: ['物鏡', '靠近玻片的鏡頭，有低倍、中倍、高倍（如 4×、10×、40×）。'],
      nose: ['旋轉盤', '轉動它可以更換不同倍率的物鏡。'], tube: ['鏡筒', '連接目鏡與物鏡。'],
      stage: ['載物臺', '放置玻片標本的平臺。'], iris: ['光圈', '調節進入的光量；換高倍時要調大。'],
      light: ['光源（反光鏡）', '提供光線，讓光穿過標本。'], coarse: ['粗調節輪', '大幅移動、粗略對焦，<b>低倍時</b>使用。'],
      fine: ['細調節輪', '微調焦距；<b>高倍時只能用細調節輪</b>。'], arm: ['鏡臂', '拿取顯微鏡時一手握住鏡臂。'], base: ['鏡座', '另一手托住鏡座，保持穩定。']
    } }],
    intro: '拿顯微鏡時「一手握鏡臂、一手托鏡座」。點選各部位看功能。'
  });

  W['scope-view'] = function (host) {
    const body = frame(host, '👁️ 顯微鏡下的世界', '換物鏡看倍率變化；按方向鍵移動玻片');
    body.innerHTML = `
      <div class="w-tabs"><span class="w-small-label">目鏡 10× ＋ 物鏡</span><button class="chip" data-o="4">4×</button><button class="chip" data-o="10">10×</button><button class="chip" data-o="40">40×</button></div>
      <div class="w-split">
        <div class="w-scope-wrap"><svg viewBox="0 0 300 300" class="w-scope-view"><defs><clipPath id="sv-clip"><circle cx="150" cy="150" r="140"/></clipPath></defs><g clip-path="url(#sv-clip)"><rect width="300" height="300" class="w-scope-bg"/><g data-k="spec"></g><rect width="300" height="300" data-k="dark" fill="#000"/></g><circle cx="150" cy="150" r="140" class="w-scope-ring"/></svg>
          <div class="w-pad"><button class="chip" data-m="0,-1">▲</button><div><button class="chip" data-m="-1,0">◀</button><button class="chip" data-m="1,0">▶</button></div><button class="chip" data-m="0,1">▼</button><div class="w-small-txt">移動<b>玻片</b></div></div>
        </div>
        <div class="w-side"><div class="w-read w-read-lg"></div></div>
      </div>`;
    const spec = body.querySelector('[data-k="spec"]'), dark = body.querySelector('[data-k="dark"]'), read = body.querySelector('.w-read');
    let obj = 4, off = [0, 0], last = '';
    function render() {
      body.querySelectorAll('[data-o]').forEach((b) => b.classList.toggle('active', +b.dataset.o === obj));
      const mag = obj * 10, s = 22 * (obj / 4); // 細胞寬度（像素）
      spec.innerHTML = '';
      // 影像上下左右顛倒：玻片往右，影像往左
      const ox = 150 - off[0] * 8 * (obj / 4), oy = 150 - off[1] * 8 * (obj / 4);
      const n = Math.ceil(300 / s) + 4;
      for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const x = ox + i * s * 1.6 + (j % 2 ? s * 0.8 : 0), y = oy + j * s;
        if (x < -s * 2 || x > 300 + s || y < -s || y > 300 + s) continue;
        el('rect', { x, y, width: s * 1.6, height: s, class: 'w-onion' }, spec);
        el('ellipse', { cx: x + s * 0.5, cy: y + s * 0.5, rx: s * 0.16, ry: s * 0.14, class: 'w-onion-n' }, spec);
      }
      // 玻片上的「F」字（影像顛倒）
      const fx = ox + 60 * (obj / 4), fy = oy + 50 * (obj / 4), k = obj / 4;
      el('text', { x: fx, y: fy, class: 'w-letter', 'font-size': 40 * k, transform: `rotate(180 ${fx} ${fy})`, text: 'F' }, spec);
      dark.setAttribute('opacity', { 4: 0, 10: 0.15, 40: 0.35 }[obj]);
      const count = { 4: '很多', 10: '較少', 40: '最少' }[obj];
      read.innerHTML = `<b class="h">放大 ${mag} 倍（10 × ${obj}）</b>
        視野範圍：${obj === 4 ? '最大' : obj === 10 ? '中' : '最小'}；亮度：${obj === 4 ? '最亮' : obj === 10 ? '較暗' : '最暗'}<br>
        看到的細胞：數目<b>${count}</b>、每個細胞<b>${obj === 40 ? '最大' : obj === 10 ? '較大' : '較小'}</b>
        ${last ? `<br><span class="w-hint">${last}</span>` : '<br><span class="w-hint">玻片上寫的是「F」，從目鏡看是上下左右顛倒的。</span>'}`;
    }
    body.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => { obj = +b.dataset.o; render(); }));
    const DIR = { '1,0': ['右', '左'], '-1,0': ['左', '右'], '0,1': ['下', '上'], '0,-1': ['上', '下'] };
    body.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      const [dx, dy] = b.dataset.m.split(',').map(Number);
      off = [off[0] + dx, off[1] + dy];
      const [a, z] = DIR[b.dataset.m];
      last = `玻片往<b>${a}</b>移，影像往<b>${z}</b>移（方向相反）。所以影像偏哪邊，玻片就往哪邊移，才能移回中央。`;
      render();
    }));
    render();
  };

  // =====================================================================
  // 第 2 章
  // =====================================================================
  const ANIMAL = `
    <rect width="420" height="320" class="w-bg"/>
    <ellipse cx="210" cy="160" rx="182" ry="130" class="w-cyto-a" data-p="cyto"/>
    <ellipse cx="210" cy="160" rx="182" ry="130" class="w-mem" data-p="mem"/>
    <circle cx="200" cy="150" r="46" class="w-nuc" data-p="nuc"/><circle cx="212" cy="140" r="12" class="w-nucleolus" data-p="nuc"/>
    <g data-p="mito"><ellipse cx="110" cy="110" rx="26" ry="12" class="w-mito"/><path d="M90,110 q6,-8 12,0 t12,0 t12,0" class="w-mito-in"/></g>
    <g data-p="mito"><ellipse cx="300" cy="200" rx="26" ry="12" class="w-mito" transform="rotate(-25 300 200)"/></g>
    <g data-p="mito"><ellipse cx="140" cy="225" rx="24" ry="11" class="w-mito" transform="rotate(20 140 225)"/></g>
    <circle cx="300" cy="105" r="13" class="w-vac-s" data-p="vac"/><circle cx="255" cy="235" r="9" class="w-vac-s" data-p="vac"/>`;
  const PLANT = `
    <rect width="420" height="320" class="w-bg"/>
    <rect x="16" y="16" width="388" height="288" rx="16" class="w-wall" data-p="wall"/>
    <rect x="32" y="32" width="356" height="256" rx="10" class="w-cyto-p" data-p="cyto"/>
    <rect x="32" y="32" width="356" height="256" rx="10" class="w-mem" data-p="mem"/>
    <rect x="120" y="70" width="230" height="180" rx="40" class="w-vac" data-p="vac"/>
    <circle cx="76" cy="95" r="30" class="w-nuc" data-p="nuc"/><circle cx="82" cy="88" r="8" class="w-nucleolus" data-p="nuc"/>
    ${[[70, 200], [95, 255], [200, 50], [290, 50], [370, 120], [370, 210], [250, 270], [150, 268]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="9" class="w-chloro" transform="rotate(${i * 37} ${x} ${y})" data-p="chloro"/>`).join('')}
    <g data-p="mito"><ellipse cx="70" cy="150" rx="18" ry="8" class="w-mito"/></g>`;
  const CELL_PARTS = {
    mem: ['細胞膜', '包住細胞的薄膜，<b>控制物質進出</b>。'], nuc: ['細胞核', '含<b>遺傳物質（DNA）</b>，控制細胞的生命活動。'],
    cyto: ['細胞質', '細胞膜內、細胞核外的部分，進行許多化學反應。'], mito: ['粒線體', '進行<b>呼吸作用</b>，產生能量。'],
    vac: ['液胞', '儲存水分、養分與廢物。']
  };
  W['cell-explorer'] = (host) => makeDiagram(host, {
    title: '🦠 動物細胞與植物細胞', desc: '切換細胞種類，點選構造；按「找找看」練習',
    variants: [
      { k: 'a', n: '🐾 動物細胞', view: '0 0 420 320', svg: ANIMAL, parts: Object.assign({}, CELL_PARTS, { vac: ['液胞', '動物細胞的液胞<b>很小或沒有</b>。'] }) },
      { k: 'p', n: '🌿 植物細胞', view: '0 0 420 320', svg: PLANT, parts: Object.assign({}, CELL_PARTS, {
        vac: ['液胞', '植物細胞有<b>很大的液胞</b>，儲存水分、養分。'], wall: ['細胞壁', '植物細胞特有，位於細胞膜外，<b>支持、保護</b>細胞。'],
        chloro: ['葉綠體', '植物綠色部位細胞特有，進行<b>光合作用</b>。'] }) }
    ],
    intro: '比較兩種細胞：植物細胞特有<b>細胞壁、葉綠體、大液胞</b>。'
  });

  W['osmosis'] = function (host) {
    const body = frame(host, '💧 擴散與滲透', '看分子怎麼移動；把細胞放進不同溶液');
    body.innerHTML = `
      <div class="w-tabs"><button class="chip" data-t="diff">擴散</button><button class="chip" data-t="osm">滲透</button></div>
      <div data-k="diff">
        <div class="w-split"><div class="w-map"><svg viewBox="0 0 420 220" data-k="box"></svg></div>
        <div class="w-side"><button class="chip" data-k="reset">重新開始</button><div class="w-read w-read-lg" data-k="dr"></div></div></div>
      </div>
      <div data-k="osm" hidden>
        <div class="w-tabs"><span class="w-small-label">細胞</span><button class="chip" data-c="rbc">紅血球</button><button class="chip" data-c="plant">植物細胞</button>
          <span class="w-small-label">溶液</span><button class="chip" data-s="water">清水</button><button class="chip" data-s="iso">等濃度</button><button class="chip" data-s="salt">濃鹽水</button></div>
        <div class="w-split"><div class="w-map"><svg viewBox="0 0 420 240" data-k="cell"></svg></div><div class="w-side"><div class="w-read w-read-lg" data-k="or"></div></div></div>
      </div>`;
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    // 擴散動畫
    const box = $('box');
    let parts = [], raf = null;
    function resetDiff() {
      box.innerHTML = '<rect x="10" y="10" width="400" height="200" rx="8" class="w-beaker"/><line x1="210" y1="10" x2="210" y2="210" class="w-divider"/>';
      parts = Array.from({ length: 60 }, () => ({ x: 20 + Math.random() * 180, y: 20 + Math.random() * 180, n: null }));
      parts.forEach((p) => { p.n = el('circle', { r: 5, class: 'w-mol' }, box); });
    }
    function step() {
      if (!box.isConnected) return;
      let left = 0;
      parts.forEach((p) => {
        p.x = Math.min(402, Math.max(18, p.x + (Math.random() - 0.5) * 9));
        p.y = Math.min(202, Math.max(18, p.y + (Math.random() - 0.5) * 9));
        p.n.setAttribute('cx', p.x); p.n.setAttribute('cy', p.y);
        if (p.x < 210) left++;
      });
      $('dr').innerHTML = `<b class="h">左邊 ${left} 個 ／ 右邊 ${60 - left} 個</b>分子不斷亂動，整體由<b>高濃度往低濃度</b>移動，最後兩邊濃度變得差不多。<br><span class="w-hint">例：香水味擴散到整個房間；氧氣由肺泡進入血液。</span>`;
      raf = requestAnimationFrame(step);
    }
    resetDiff();
    $('reset').addEventListener('click', resetDiff);
    // 滲透
    let cell = 'rbc', sol = 'water';
    const R = {
      rbc: { water: [1.35, 'in', '紅血球吸水<b>脹大，甚至破裂</b>（沒有細胞壁保護）。'], iso: [1, '', '內外濃度相同，水進出平衡，<b>大小不變</b>。'], salt: [0.7, 'out', '紅血球失水<b>皺縮</b>。'] },
      plant: { water: [1.08, 'in', '植物細胞吸水膨脹，但有<b>細胞壁</b>保護，不會破裂（菜變挺）。'], iso: [1, '', '水進出平衡，大小不變。'], salt: [0.72, 'out', '植物細胞失水，<b>細胞膜與細胞壁分離</b>（醃菜出水變軟）。'] }
    };
    function renderOsm() {
      body.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('active', b.dataset.c === cell));
      body.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('active', b.dataset.s === sol));
      const [k, dir, txt] = R[cell][sol];
      const svg = $('cell');
      const salt = sol === 'salt' ? 40 : sol === 'iso' ? 16 : 0;
      svg.innerHTML = `<rect width="420" height="240" class="${sol === 'water' ? 'w-sol-water' : sol === 'iso' ? 'w-sol-iso' : 'w-sol-salt'}"/>`;
      for (let i = 0; i < salt; i++) el('circle', { cx: 15 + (i * 97) % 395, cy: 15 + (i * 53) % 215, r: 3, class: 'w-salt-dot' }, svg);
      if (cell === 'rbc') {
        el('ellipse', { cx: 210, cy: 120, rx: 70 * k, ry: 70 * k * (sol === 'salt' ? 0.8 : 0.9), class: 'w-rbc' + (sol === 'salt' ? ' shrink' : '') }, svg);
        if (sol === 'water') el('text', { x: 210, y: 30, 'text-anchor': 'middle', class: 'w-label-red', text: '可能破裂！' }, svg);
      } else {
        el('rect', { x: 130, y: 45, width: 160, height: 150, rx: 6, class: 'w-wall' }, svg);
        const w = 150 * k, h = 140 * k;
        el('rect', { x: 210 - w / 2, y: 120 - h / 2, width: w, height: h, rx: 14, class: 'w-cyto-p w-mem' }, svg);
      }
      if (dir) for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + 0.6, r1 = 115, r2 = 85, [o, t] = dir === 'in' ? [r1, r2] : [r2, r1];
        el('line', { x1: 210 + Math.cos(a) * o, y1: 120 + Math.sin(a) * o * 0.8, x2: 210 + Math.cos(a) * t, y2: 120 + Math.sin(a) * t * 0.8, class: 'w-water-arrow' }, svg);
      }
      $('or').innerHTML = `<b class="h">${cell === 'rbc' ? '紅血球' : '植物細胞'} + ${sol === 'water' ? '清水' : sol === 'iso' ? '等濃度溶液' : '濃鹽水'}</b>${txt}<br><span class="w-hint">水分子會從<b>水多</b>（濃度低）的一側，往<b>水少</b>（濃度高）的一側移動。藍色箭頭是水移動的方向。</span>`;
    }
    body.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { cell = b.dataset.c; renderOsm(); }));
    body.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { sol = b.dataset.s; renderOsm(); }));
    function tab(t) {
      body.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('active', b.dataset.t === t));
      $('diff').hidden = t !== 'diff'; $('osm').hidden = t !== 'osm';
      cancelAnimationFrame(raf);
      if (t === 'diff') raf = requestAnimationFrame(step); else renderOsm();
    }
    body.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => tab(b.dataset.t)));
    tab('diff');
  };

  W['levels-order'] = (host) => makeOrder(host, {
    title: '🧩 生物體的組成層次', desc: '由小到大排出組成層次',
    prompt: '請由<b>小到大</b>依序點選：',
    sets: [
      { k: 'a', n: '🐾 動物（人）', steps: [['細胞（心肌細胞）', '構造與功能的基本單位。'], ['組織（心肌組織）', '形態相似、功能相同的細胞群。'], ['器官（心臟）', '由多種組織組成。'], ['器官系統（循環系統）', '多個器官合作：心臟、血管、血液。'], ['個體（人）', '由多個器官系統組成。']] },
      { k: 'p', n: '🌿 植物（向日葵）', steps: [['細胞（葉肉細胞）', '基本單位。'], ['組織（葉肉組織）', '功能相同的細胞群。'], ['器官（葉）', '根、莖、葉、花、果實、種子都是器官。'], ['個體（向日葵）', '植物<b>沒有器官系統</b>。']] }
    ]
  });

  // =====================================================================
  // 第 3 章
  // =====================================================================
  W['nutrient-lab'] = function (host) {
    const body = frame(host, '🧪 養分檢驗實驗室', '選擇樣品與檢驗方法，看看結果');
    const S = { mantou: ['饅頭', { starch: 1 }], potato: ['馬鈴薯', { starch: 1 }], glucose: ['葡萄糖水', { glucose: 1 }], oil: ['沙拉油', { lipid: 1 }], water: ['清水', {}] };
    const T = { iodine: '滴碘液', benedict: '本氏液＋隔水加熱', paper: '塗在紙上' };
    body.innerHTML = `
      <div class="w-tabs"><span class="w-small-label">樣品</span>${Object.entries(S).map(([k, v]) => `<button class="chip" data-s="${k}">${v[0]}</button>`).join('')}</div>
      <div class="w-tabs"><span class="w-small-label">方法</span>${Object.entries(T).map(([k, v]) => `<button class="chip" data-t="${k}">${v}</button>`).join('')}</div>
      <div class="w-split"><div class="w-map w-map-sm"><svg viewBox="0 0 300 260"></svg></div>
      <div class="w-side"><div class="w-read w-read-lg"></div><table class="w-lab-table"><tr><th>樣品</th><th>碘液</th><th>本氏液</th><th>紙</th></tr>${Object.entries(S).map(([k, v]) => `<tr data-r="${k}"><td>${v[0]}</td><td data-c="iodine"></td><td data-c="benedict"></td><td data-c="paper"></td></tr>`).join('')}</table></div></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    let s = 'mantou', t = 'iodine', timer = null;
    function tube(color, label, heat) {
      svg.innerHTML = `<rect width="300" height="260" class="w-bg"/>
        ${heat ? '<rect x="70" y="150" width="160" height="90" rx="10" class="w-hotwater"/><text x="150" y="232" text-anchor="middle" class="w-small">熱水浴</text>' : ''}
        <path d="M125,30 L125,190 Q125,215 150,215 Q175,215 175,190 L175,30" class="w-tube"/>
        <path d="M127,110 L127,190 Q127,212 150,212 Q173,212 173,190 L173,110 Z" fill="${color}" class="w-liquid"/>
        <text x="150" y="22" text-anchor="middle" class="w-label">${label}</text>`;
    }
    function run() {
      clearTimeout(timer);
      body.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('active', b.dataset.s === s));
      body.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('active', b.dataset.t === t));
      const [name, has] = S[s];
      let res, color;
      if (t === 'iodine') {
        color = has.starch ? '#1f2a5a' : '#c98a2e';
        res = has.starch ? '變成<b>藍黑色</b> → 含有<b>澱粉</b>' : '維持碘液的<b>黃褐色</b> → 沒有澱粉';
        tube(color, `${name} + 碘液`);
      } else if (t === 'benedict') {
        tube('#3d7fd6', `${name} + 本氏液`);
        color = has.glucose ? '#d9622b' : '#3d7fd6';
        res = has.glucose ? '加熱後由藍色變成<b>橙紅色</b> → 含有<b>葡萄糖</b>' : '加熱後仍是<b>藍色</b> → 沒有葡萄糖';
        read.innerHTML = '<b class="h">隔水加熱中…</b>';
        timer = setTimeout(() => { tube(color, `${name} + 本氏液（加熱後）`, true); read.innerHTML = `<b class="h">結果</b>${res}`; }, 1200);
      } else {
        svg.innerHTML = `<rect width="300" height="260" class="w-bg"/><rect x="50" y="40" width="200" height="180" rx="4" class="w-paper-sheet"/>
          ${has.lipid ? '<ellipse cx="150" cy="130" rx="55" ry="40" class="w-oil-spot"/>' : '<ellipse cx="150" cy="130" rx="55" ry="40" class="w-wet-spot"/>'}
          <text x="150" y="30" text-anchor="middle" class="w-label">${name} 塗在紙上（晾乾後）</text>`;
        res = has.lipid ? '留下<b>半透明的油漬</b> → 含有<b>脂質</b>' : '乾了以後<b>沒有留下痕跡</b> → 沒有脂質';
      }
      if (t !== 'benedict') read.innerHTML = `<b class="h">結果</b>${res}`;
      const cellTxt = t === 'iodine' ? (has.starch ? '藍黑' : '—') : t === 'benedict' ? (has.glucose ? '橙紅' : '—') : (has.lipid ? '油漬' : '—');
      const td = body.querySelector(`[data-r="${s}"] [data-c="${t}"]`);
      td.textContent = cellTxt; td.className = cellTxt === '—' ? '' : 'pos';
    }
    body.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { s = b.dataset.s; run(); }));
    body.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { t = b.dataset.t; run(); }));
    run();
  };

  W['enzyme-temp'] = function (host) {
    const body = frame(host, '🌡️ 溫度與酵素活性', '設定溫度，按「開始反應」：唾液澱粉酶分解澱粉，碘液顏色會變淡');
    body.innerHTML = `
      <label class="w-slider">溫度 <input type="range" min="0" max="80" value="37"><output></output></label>
      <div class="w-chips"><button class="chip" data-k="go">▶ 開始反應</button><button class="chip" data-k="new">換新的酵素</button></div>
      <div class="w-split"><div class="w-map"><svg viewBox="0 0 420 230" data-k="chart"></svg></div>
      <div class="w-side"><svg viewBox="0 0 120 160" class="w-mini-tube" data-k="tube"></svg><div class="w-read"></div></div></div>`;
    const input = body.querySelector('input'), chart = body.querySelector('[data-k="chart"]'), tubeS = body.querySelector('[data-k="tube"]'), read = body.querySelector('.w-read');
    const act = (t) => t <= 37 ? Math.max(0.03, Math.exp(-((t - 37) ** 2) / (2 * 14 * 14))) : Math.max(0, Math.exp(-((t - 37) ** 2) / (2 * 8 * 8)));
    let denatured = false, prog = 0, raf = null;
    const X = (t) => 40 + t / 80 * 360, Y = (a) => 200 - a * 170;
    function drawChart() {
      const t = +input.value;
      chart.innerHTML = '';
      el('line', { x1: 40, x2: 400, y1: 200, y2: 200, class: 'w-axis-l' }, chart);
      el('line', { x1: 40, x2: 40, y1: 20, y2: 200, class: 'w-axis-l' }, chart);
      el('path', { d: d3.line()(d3.range(0, 81).map((v) => [X(v), Y(act(v))])), class: 'w-curve' }, chart);
      [0, 20, 37, 60, 80].forEach((v) => el('text', { x: X(v), y: 218, 'text-anchor': 'middle', class: 'w-small', text: v + '°C' }, chart));
      el('text', { x: 46, y: 18, class: 'w-small', text: '活性' }, chart);
      const a = denatured ? 0 : act(t);
      el('circle', { cx: X(t), cy: Y(a), r: 7, class: 'w-dot-red' }, chart);
      el('line', { x1: X(37), x2: X(37), y1: 20, y2: 200, class: 'w-opt' }, chart);
      el('text', { x: X(37) + 4, y: 34, class: 'w-small', text: '最適溫度約 37°C' }, chart);
      return a;
    }
    function drawTube() {
      const c = d3.interpolateRgb('#1f2a5a', '#c98a2e')(prog);
      tubeS.innerHTML = `<path d="M40,10 L40,130 Q40,150 60,150 Q80,150 80,130 L80,10" class="w-tube"/><path d="M42,60 L42,130 Q42,148 60,148 Q78,148 78,130 L78,60 Z" fill="${c}"/>`;
    }
    function status() {
      const t = +input.value;
      body.querySelector('output').textContent = t + '°C';
      if (t >= 60) denatured = true;
      const a = drawChart();
      read.innerHTML = denatured
        ? `<b class="h">酵素已變性！</b>溫度太高（≥ 60°C）使酵素<b>變性、失去活性</b>，即使降回 37°C 也<b>無法恢復</b>。按「換新的酵素」重來。`
        : `<b class="h">${t}°C：活性 ${Math.round(a * 100)}%</b>${t < 20 ? '溫度低，活性<b>降低</b>（回溫後可以恢復）。' : t <= 45 ? '接近體溫，酵素作用良好。' : '溫度偏高，活性快速下降。'}`;
      return a;
    }
    input.addEventListener('input', () => { cancelAnimationFrame(raf); status(); });
    body.querySelector('[data-k="new"]').addEventListener('click', () => { denatured = false; prog = 0; input.value = 37; drawTube(); status(); });
    body.querySelector('[data-k="go"]').addEventListener('click', () => {
      cancelAnimationFrame(raf); prog = 0;
      const a = status(), t0 = performance.now();
      const stepF = (now) => {
        prog = Math.min(1, a * (now - t0) / 4000); drawTube();
        if ((now - t0) < 6000 && prog < 1 && tubeS.isConnected) raf = requestAnimationFrame(stepF);
        else read.innerHTML += `<br>${prog > 0.9 ? '✔ 澱粉幾乎完全被分解，碘液不再變藍黑。' : prog > 0.3 ? '澱粉只有部分被分解。' : '✘ 澱粉幾乎沒有被分解，仍呈藍黑色。'}`;
      };
      raf = requestAnimationFrame(stepF);
    });
    drawTube(); status();
  };

  W['photosynthesis'] = function (host) {
    const body = frame(host, '🌿 水蘊草的光合作用', '調整光照與二氧化碳，看氣泡（氧氣）產生的速度');
    body.innerHTML = `
      <label class="w-slider">光照強度 <input type="range" min="0" max="100" value="60" data-k="light"><output data-k="lo"></output></label>
      <div class="w-tabs"><span class="w-small-label">二氧化碳</span><button class="chip" data-c="0.3">少</button><button class="chip" data-c="0.7">一般</button><button class="chip" data-c="1">多（加小蘇打）</button></div>
      <div class="w-split"><div class="w-map w-map-sm"><svg viewBox="0 0 300 300" data-k="tank"></svg></div>
      <div class="w-side"><div class="w-eq">水 ＋ 二氧化碳 <span>──光、葉綠體──▶</span> 葡萄糖 ＋ <b>氧氣</b></div><div class="w-bar"><span data-k="bar"></span></div><div class="w-read"></div></div></div>`;
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    const tank = $('tank'), read = body.querySelector('.w-read');
    let co2 = 0.7, bubbles = [], raf = null, acc = 0, last = performance.now();
    tank.innerHTML = `<rect width="300" height="300" class="w-bg"/><circle cx="40" cy="40" r="22" class="w-sun" data-k="sun"/>
      <path d="M70,60 L70,270 Q70,285 85,285 L215,285 Q230,285 230,270 L230,60" class="w-glass"/><rect x="72" y="90" width="156" height="193" class="w-tank-water"/>
      <path d="M150,280 C150,230 140,200 150,150 C158,120 150,110 152,100" class="w-stem"/>
      ${[[150, 240, -1], [150, 210, 1], [148, 180, -1], [152, 150, 1], [151, 125, -1]].map(([x, y, s]) => `<ellipse cx="${x + s * 16}" cy="${y}" rx="16" ry="5" transform="rotate(${s * -25} ${x + s * 16} ${y})" class="w-leaf"/>`).join('')}`;
    const bubG = el('g', {}, tank);
    function rate() { const L = +$('light').value / 100; return Math.min(L, co2) ; }
    function render() {
      const L = +$('light').value;
      $('lo').textContent = L === 0 ? '黑暗' : L + '%';
      body.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('active', +b.dataset.c === co2));
      tank.querySelector('[data-k="sun"]').setAttribute('opacity', 0.15 + L / 100 * 0.85);
      const r = rate();
      $('bar').style.width = Math.round(r * 100) + '%';
      const lim = L === 0 ? '<b>沒有光</b> → 不能行光合作用，沒有氣泡。' : (L / 100 < co2 ? '目前限制速率的是<b>光照</b>：再調亮會更快。' : '目前限制速率的是<b>二氧化碳</b>：光再強也不會更快，試著增加二氧化碳。');
      read.innerHTML = `<b class="h">光合作用速率 ${Math.round(r * 100)}%</b>${lim}<br><span class="w-hint">氣泡是光合作用產生的<b>氧氣</b>；可以用「每分鐘氣泡數」比較速率。</span>`;
    }
    function anim(now) {
      if (!tank.isConnected) return;
      const dt = (now - last) / 1000; last = now;
      acc += rate() * 6 * dt;
      while (acc > 1) { acc -= 1; bubbles.push({ x: 140 + Math.random() * 25, y: 140 + Math.random() * 100, n: el('circle', { r: 3 + Math.random() * 2, class: 'w-bubble' }, bubG) }); }
      bubbles = bubbles.filter((b) => { b.y -= 40 * dt; b.n.setAttribute('cx', b.x); b.n.setAttribute('cy', b.y); if (b.y < 92) { b.n.remove(); return false; } return true; });
      raf = requestAnimationFrame(anim);
    }
    $('light').addEventListener('input', render);
    body.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { co2 = +b.dataset.c; render(); }));
    render(); raf = requestAnimationFrame(anim);
  };

  const DIGEST = `
    <rect width="360" height="470" class="w-bg"/>
    <path d="M110,95 C60,110 50,200 60,300 C70,400 120,450 180,455 C240,450 290,400 300,300 C310,200 300,110 250,95 Z" class="w-torso"/>
    <ellipse cx="180" cy="45" rx="48" ry="34" class="w-head"/>
    <ellipse cx="180" cy="58" rx="22" ry="9" class="w-mouth" data-p="mouth"/>
    <circle cx="140" cy="62" r="8" class="w-gland" data-p="saliva"/><circle cx="220" cy="62" r="8" class="w-gland" data-p="saliva"/>
    <path d="M180,70 L180,165" class="w-eso" data-p="eso"/>
    <path d="M178,160 C210,145 255,150 258,185 C262,225 215,235 196,215 C185,205 200,190 190,185" class="w-stomach" data-p="stomach"/>
    <path d="M85,150 C110,135 170,140 182,160 C175,195 120,205 92,195 C78,185 76,165 85,150 Z" class="w-liver" data-p="liver"/>
    <ellipse cx="160" cy="203" rx="10" ry="7" class="w-gall" data-p="liver"/>
    <path d="M168,232 C200,226 240,224 262,232 C250,242 205,244 172,242 Z" class="w-pancreas" data-p="pancreas"/>
    <path d="M110,265 L110,400 L250,400 L250,265 C250,255 110,255 110,265" class="w-large" data-p="large"/>
    <path d="M130,280 C170,270 225,275 230,295 C235,315 135,305 130,325 C125,345 230,335 230,355 C230,375 140,370 140,385" class="w-small-int" data-p="small"/>
    <path d="M180,400 L180,440" class="w-eso" data-p="anus"/>`;
  W['digestion'] = (host) => {
    const body = makeDiagram(host, {
      title: '🍽️ 人體消化系統', desc: '點選器官看功能；按「食物旅行」跟著食物走一趟',
      variants: [{ k: 'd', n: '消化系統', view: '0 0 360 470', svg: DIGEST, parts: {
        mouth: ['口腔', '牙齒咀嚼、舌頭攪拌；<b>唾液澱粉酶</b>把澱粉初步分解。'], saliva: ['唾腺', '分泌唾液，含唾液澱粉酶。'],
        eso: ['食道', '肌肉蠕動把食物送到胃，<b>沒有消化作用</b>。'], stomach: ['胃', '分泌胃液（含<b>胃酸</b>），初步分解<b>蛋白質</b>，胃酸可殺菌。'],
        liver: ['肝臟（與膽囊）', '肝臟製造<b>膽汁</b>，儲存在膽囊；膽汁不含酵素，可<b>乳化脂肪</b>。'], pancreas: ['胰臟', '分泌<b>胰液</b>，含多種酵素，送到小腸。'],
        small: ['小腸', '<b>最主要的消化與吸收場所</b>；內壁有絨毛增加表面積。'], large: ['大腸', '主要吸收<b>水分</b>，形成糞便。'], anus: ['肛門', '排出糞便。']
      } }],
      intro: '<b>消化道</b>：口腔 → 咽 → 食道 → 胃 → 小腸 → 大腸 → 肛門；<b>消化腺</b>：唾腺、胃腺、肝臟、胰臟、腸腺。',
      side: (box) => { box.innerHTML = '<button class="chip" data-k="trip">🍙 食物旅行</button>'; }
    });
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const TRIP = [['mouth', 180, 58, '口腔：澱粉開始被分解。'], ['eso', 180, 115, '食道：蠕動往下送。'], ['stomach', 225, 185, '胃：蛋白質開始被分解。'], ['small', 180, 320, '小腸：澱粉→葡萄糖、蛋白質→胺基酸、脂質→脂肪酸＋甘油，並被吸收。'], ['large', 245, 330, '大腸：吸收水分。'], ['anus', 180, 435, '肛門：排出糞便。']];
    body.querySelector('[data-k="trip"]').addEventListener('click', () => {
      let i = 0;
      const ball = el('circle', { r: 9, class: 'w-food' }, svg);
      const go = () => {
        if (!svg.isConnected) return;
        if (i >= TRIP.length) { ball.remove(); return; }
        const [k, x, y, t] = TRIP[i];
        ball.setAttribute('cx', x); ball.setAttribute('cy', y);
        svg.querySelectorAll('.w-part').forEach((n) => n.classList.toggle('on', n.dataset.p === k));
        read.innerHTML = `<b class="h">第 ${i + 1} 站</b>${t}`;
        i++; setTimeout(go, 1600);
      };
      go();
    });
  };
})();
