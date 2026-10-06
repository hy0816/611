// 生物互動圖（二）：第 4～6 章
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U || !U.makeDiagram) return;
  const { el, frame, makeSorter, makeDiagram } = U;

  // =====================================================================
  // 第 4 章
  // =====================================================================
  function stemSvg(type) {
    let s = '<rect width="360" height="360" class="w-bg"/><circle cx="180" cy="180" r="160" class="w-stem-x" data-p="ground"/><circle cx="180" cy="180" r="160" class="w-epi" data-p="epi"/>';
    const bundle = (x, y, a, r) => {
      return `<g transform="translate(${x},${y}) rotate(${a * 180 / Math.PI})">
        <ellipse cx="${-r * 0.45}" cy="0" rx="${r * 0.55}" ry="${r * 0.62}" class="w-xylem" data-p="xylem"/>
        <ellipse cx="${r * 0.55}" cy="0" rx="${r * 0.45}" ry="${r * 0.6}" class="w-phloem" data-p="phloem"/></g>`.replace(/\s+/g, ' ');
    };
    if (type === 'dicot') {
      s += '<circle cx="180" cy="180" r="104" class="w-cambium" data-p="cambium"/>';
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; s += bundle(180 + Math.cos(a) * 104, 180 + Math.sin(a) * 104, a, 22); }
    } else {
      const P = [[180, 180], [120, 120], [240, 120], [120, 240], [240, 240], [180, 90], [180, 270], [90, 180], [270, 180], [140, 160], [220, 200], [150, 215], [215, 145], [100, 140], [260, 220], [130, 285], [235, 75], [80, 220], [285, 150], [175, 130], [190, 235]];
      P.forEach(([x, y], i) => { s += bundle(x, y, Math.atan2(y - 180, x - 180) || i, 12); });
    }
    return s;
  }
  const STEM_PARTS = {
    xylem: ['木質部', '含<b>導管</b>，運送<b>水分與礦物質</b>，由下往上。位在維管束<b>內側</b>（靠近中心）。'],
    phloem: ['韌皮部', '含<b>篩管</b>，運送<b>養分</b>（葉製造的醣類），可上可下。位在維管束<b>外側</b>。'],
    epi: ['表皮', '保護莖的內部。'], ground: ['基本組織（髓與皮層）', '儲存養分、支持。']
  };
  W['stem-section'] = (host) => {
    const body = makeDiagram(host, {
      title: '🌾 莖的橫切面', desc: '比較雙子葉與單子葉植物的維管束排列',
      variants: [
        { k: 'dicot', n: '雙子葉（向日葵）', view: '0 0 360 360', svg: stemSvg('dicot'), parts: Object.assign({}, STEM_PARTS, { cambium: ['形成層', '雙子葉植物才有，細胞會分裂使莖<b>加粗</b>；木本植物因此形成<b>年輪</b>。'] }) },
        { k: 'mono', n: '單子葉（玉米）', view: '0 0 360 360', svg: stemSvg('mono'), parts: STEM_PARTS }
      ],
      intro: '雙子葉：維管束<b>排成環狀</b>、有形成層；單子葉：維管束<b>散生</b>、沒有形成層。',
      side: (box) => {
        box.innerHTML = `<div class="w-calc-title" style="margin-top:12px">🪓 環狀剝皮實驗</div><label class="w-slider">經過 <input type="range" min="0" max="8" value="0"><output></output></label><svg viewBox="0 0 220 200" class="w-ring-svg"></svg><div class="w-small-txt"></div>`;
        const inp = box.querySelector('input'), sv = box.querySelector('svg'), tx = box.querySelector('.w-small-txt');
        const draw = () => {
          const w = +inp.value, bulge = w * 3;
          box.querySelector('output').textContent = w + ' 週';
          sv.innerHTML = `<rect width="220" height="200" class="w-bg"/>
            <path d="M85,0 L135,0 L135,${85 - bulge} Q${135 + bulge},${95} 135,100 L85,100 Q${85 - bulge},95 85,${85 - bulge} Z" class="w-bark"/>
            <rect x="92" y="100" width="36" height="30" class="w-wood"/><path d="M85,130 L135,130 L135,200 L85,200 Z" class="w-bark"/>
            <text x="140" y="117" class="w-small">剝去樹皮</text><path d="M110,10 L110,${80 - bulge / 2}" class="w-sugar-arrow"/>`;
          tx.innerHTML = w === 0 ? '把樹幹剝去一圈樹皮（含<b>韌皮部</b>），保留木質部。' : '葉製造的養分往下運送時，在切口被擋住 → 堆積在<b>切口上方</b>，使上方<b>腫大</b>。水分由木質部運送，不受影響。';
        };
        inp.addEventListener('input', draw); draw();
      }
    });
    void body;
  };

  W['transpiration'] = function (host) {
    const body = frame(host, '💨 蒸散作用', '調整環境條件，看蒸散速率與水分上升的速度');
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map w-map-sm"><svg viewBox="0 0 300 320"></svg></div>
        <div class="w-side">
          <label class="w-slider">光照 <input type="range" min="0" max="100" value="60" data-k="l"></label>
          <label class="w-slider">溫度 <input type="range" min="0" max="100" value="50" data-k="t"></label>
          <label class="w-slider">風 <input type="range" min="0" max="100" value="30" data-k="w"></label>
          <label class="w-slider">溼度 <input type="range" min="0" max="100" value="50" data-k="h"></label>
          <div class="w-bar"><span data-k="bar"></span></div>
          <div class="w-read"></div>
        </div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const $ = (k) => +body.querySelector(`[data-k="${k}"]`).value;
    svg.innerHTML = `<rect width="300" height="320" class="w-bg"/><rect x="0" y="270" width="300" height="50" class="w-soil"/>
      <path d="M150,270 L150,90" class="w-stem-l"/><path d="M150,270 L130,310 M150,270 L170,312 M150,280 L150,316" class="w-root"/>
      <path d="M150,120 C110,100 80,110 70,130 C100,140 130,135 150,120 Z" class="w-leaf"/><path d="M150,160 C190,140 220,150 230,170 C200,180 170,175 150,160 Z" class="w-leaf"/>
      <path d="M150,95 C130,70 110,65 100,75 C115,95 135,100 150,95 Z" class="w-leaf"/>
      <g data-k="drops"></g><g data-k="vapor"></g>`;
    const dropsG = svg.querySelector('[data-k="drops"]'), vapG = svg.querySelector('[data-k="vapor"]');
    let rate = 0.5, drops = [], vap = [], last = performance.now(), acc = 0;
    function calc() {
      rate = Math.max(0, Math.min(1, 0.15 + $('l') / 100 * 0.35 + $('t') / 100 * 0.25 + $('w') / 100 * 0.2 - $('h') / 100 * 0.35 + 0.1));
      if ($('l') < 5) rate *= 0.25; // 黑暗時氣孔多關閉
      body.querySelector('[data-k="bar"]').style.width = Math.round(rate * 100) + '%';
      read.innerHTML = `<b class="h">蒸散速率 ${Math.round(rate * 100)}%</b>${$('l') < 5 ? '黑暗中<b>氣孔大多關閉</b>，蒸散很慢。<br>' : ''}光照強、溫度高、風大、溼度低 → 蒸散<b>快</b>。<br><span class="w-hint">葉片散失水分產生的<b>拉力</b>，把水從根經<b>木質部</b>往上拉（藍點）。</span>`;
    }
    function anim(now) {
      if (!svg.isConnected) return;
      const dt = (now - last) / 1000; last = now;
      acc += rate * 5 * dt;
      while (acc > 1) { acc -= 1; drops.push({ y: 300, n: el('circle', { cx: 150, r: 3, class: 'w-h2o' }, dropsG) }); vap.push({ x: 80 + Math.random() * 150, y: 130, n: el('circle', { r: 4, class: 'w-vapor' }, vapG) }); }
      drops = drops.filter((d) => { d.y -= 60 * dt * (0.5 + rate); d.n.setAttribute('cy', d.y); if (d.y < 100) { d.n.remove(); return false; } return true; });
      vap = vap.filter((v) => { v.y -= 30 * dt; v.x += (Math.random() - 0.3) * 20 * dt * (1 + $('w') / 50); v.n.setAttribute('cx', v.x); v.n.setAttribute('cy', v.y); v.n.setAttribute('opacity', Math.max(0, (v.y - 20) / 110)); if (v.y < 20) { v.n.remove(); return false; } return true; });
      requestAnimationFrame(anim);
    }
    body.querySelectorAll('input').forEach((i) => i.addEventListener('input', calc));
    calc(); requestAnimationFrame(anim);
  };

  W['heart'] = function (host) {
    const body = frame(host, '❤️ 心臟與血液循環', '切換循環路徑，點選心臟腔室或血管');
    body.innerHTML = `
      <div class="w-tabs"><button class="chip" data-c="all">全部</button><button class="chip" data-c="pul">肺循環</button><button class="chip" data-c="sys">體循環</button><span class="w-tab-sep"></span><button class="chip" data-k="quiz">🎯 找找看</button></div>
      <div class="w-split"><div class="w-map w-map-diagram"><svg viewBox="0 0 400 440"></svg></div><div class="w-side"><div class="w-read w-read-lg"></div><div class="w-legend-row"><i class="w-dot" style="background:#d63031"></i>充氧血　<i class="w-dot" style="background:#4f6fd6"></i>缺氧血</div></div></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    svg.innerHTML = `<rect width="400" height="440" class="w-bg"/>
      <rect x="110" y="20" width="180" height="60" rx="14" class="w-organ-box" data-p="lung"/><text x="200" y="56" text-anchor="middle" class="w-label">肺部微血管</text>
      <rect x="110" y="360" width="180" height="60" rx="14" class="w-organ-box" data-p="body"/><text x="200" y="396" text-anchor="middle" class="w-label">全身微血管</text>
      <path id="hp1" d="M150,250 L60,250 L60,50 L110,50" class="w-ves blue pul" data-p="pa"/>
      <path id="hp2" d="M290,50 L340,50 L340,150 L255,150" class="w-ves red pul" data-p="pv"/>
      <path id="hp3" d="M255,250 L370,250 L370,390 L290,390" class="w-ves red sys" data-p="ao"/>
      <path id="hp4" d="M110,390 L30,390 L30,150 L145,150" class="w-ves blue sys" data-p="vc"/>
      <rect x="145" y="120" width="55" height="60" rx="10" class="w-ch blue" data-p="ra"/><rect x="200" y="120" width="55" height="60" rx="10" class="w-ch red" data-p="la"/>
      <rect x="145" y="185" width="55" height="90" rx="12" class="w-ch blue" data-p="rv"/><rect x="200" y="185" width="55" height="90" rx="12" class="w-ch red thick" data-p="lv"/>
      <text x="172" y="155" text-anchor="middle" class="w-ch-t">右心房</text><text x="228" y="155" text-anchor="middle" class="w-ch-t">左心房</text>
      <text x="172" y="235" text-anchor="middle" class="w-ch-t">右心室</text><text x="228" y="235" text-anchor="middle" class="w-ch-t">左心室</text>
      <text x="64" y="240" class="w-small" transform="rotate(-90 64 240)">肺動脈</text><text x="346" y="110" class="w-small">肺靜脈</text>
      <text x="374" y="330" class="w-small" transform="rotate(90 374 330)">主動脈</text><text x="22" y="300" class="w-small" transform="rotate(-90 22 300)">大靜脈</text>
      <text x="200" y="300" text-anchor="middle" class="w-small">（以面對人的方向看：右心在左）</text>
      <g data-k="dots"></g>`;
    const P = {
      ra: ['右心房', '接收從全身回來的<b>缺氧血</b>（經大靜脈）。'], rv: ['右心室', '把缺氧血送到肺（經<b>肺動脈</b>），是<b>肺循環</b>的起點。'],
      la: ['左心房', '接收從肺回來的<b>充氧血</b>（經肺靜脈）。'], lv: ['左心室', '肌肉壁<b>最厚</b>，把充氧血送到全身（經<b>主動脈</b>），是<b>體循環</b>的起點。'],
      pa: ['肺動脈', '由右心室送往肺，流的是<b>缺氧血</b>（唯一流缺氧血的動脈）。'], pv: ['肺靜脈', '由肺送回左心房，流的是<b>充氧血</b>。'],
      ao: ['主動脈', '由左心室送往全身，最粗的動脈。'], vc: ['大靜脈', '把全身的缺氧血送回右心房。'],
      lung: ['肺部微血管', '排出<b>二氧化碳</b>、取得<b>氧氣</b>，缺氧血變成充氧血。'], body: ['全身微血管', '把氧氣與養分交給組織細胞，收回二氧化碳與廢物。']
    };
    const dotsG = svg.querySelector('[data-k="dots"]');
    svg.querySelectorAll('[data-p]').forEach((n) => { n.classList.add('w-part'); n.addEventListener('click', () => pick(n.dataset.p)); });
    let mode = 'all', quiz = null, score = [0, 0];
    function pick(k) {
      if (quiz) {
        if (quiz.done) return; quiz.done = true;
        const ok = k === quiz.k; score[1]++; if (ok) score[0]++;
        svg.querySelectorAll(`[data-p="${quiz.k}"]`).forEach((n) => n.classList.add('ok'));
        read.innerHTML = `<b class="h">${ok ? '✔ 答對了！' : '✘ 這是「' + P[k][0] + '」'}（${score[0]}/${score[1]}）</b>${P[quiz.k][0]}：${P[quiz.k][1]}<br><button class="chip" data-k="nq">下一題</button>`;
        read.querySelector('[data-k="nq"]').addEventListener('click', ask);
        return;
      }
      svg.querySelectorAll('.w-part').forEach((n) => n.classList.toggle('on', n.dataset.p === k));
      read.innerHTML = `<b class="h">${P[k][0]}</b>${P[k][1]}`;
    }
    function ask() {
      svg.querySelectorAll('.w-part').forEach((n) => n.classList.remove('on', 'ok'));
      const ks = Object.keys(P); quiz = { k: ks[Math.floor(Math.random() * ks.length)], done: false };
      read.innerHTML = `<b class="h">找找看</b>請點出「<b>${P[quiz.k][0]}</b>」。`;
    }
    const routes = { pul: ['hp1', 'hp2'], sys: ['hp3', 'hp4'] };
    function setMode(m) {
      mode = m;
      body.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('active', b.dataset.c === m));
      svg.querySelectorAll('.w-ves').forEach((n) => n.classList.toggle('dim', m !== 'all' && !n.classList.contains(m)));
      dotsG.innerHTML = '';
      const ids = m === 'all' ? routes.pul.concat(routes.sys) : routes[m];
      ids.forEach((id) => {
        const red = ['hp2', 'hp3'].includes(id);
        for (let i = 0; i < 3; i++) {
          const c = el('circle', { r: 5, class: red ? 'w-cell-red' : 'w-cell-blue' }, dotsG);
          const am = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
          am.setAttribute('dur', '3s'); am.setAttribute('repeatCount', 'indefinite'); am.setAttribute('begin', `-${i}s`);
          const mp = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
          mp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + id); mp.setAttribute('href', '#' + id);
          am.appendChild(mp); c.appendChild(am);
        }
      });
      if (!quiz) read.innerHTML = m === 'pul'
        ? '<b class="h">肺循環</b>右心室 → 肺動脈 → 肺部微血管（換成充氧血）→ 肺靜脈 → 左心房'
        : m === 'sys' ? '<b class="h">體循環</b>左心室 → 主動脈 → 全身微血管（把氧氣給細胞）→ 大靜脈 → 右心房'
          : '<b class="h">提示</b>紅色是充氧血、藍色是缺氧血。點選腔室或血管看說明。';
    }
    body.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.c)));
    body.querySelector('[data-k="quiz"]').addEventListener('click', (e) => {
      const on = !quiz; e.currentTarget.classList.toggle('active', on);
      if (on) ask(); else { quiz = null; setMode(mode); }
    });
    setMode('all');
  };

  W['blood-sort'] = (host) => makeSorter(host, {
    title: '🩸 血液成分的功能', desc: '判斷每項描述是哪一種血液成分',
    cats: ['紅血球', '白血球', '血小板', '血漿'],
    items: [
      ['含有血紅素，可以運送氧氣', '紅血球', '血紅素與氧結合。'], ['成熟後沒有細胞核', '紅血球', '人類成熟的紅血球無細胞核。'],
      ['可以吞噬病菌，抵抗疾病', '白血球', '白血球負責防禦。'], ['有細胞核，數量比紅血球少很多', '白血球', '白血球有細胞核。'],
      ['受傷時幫助血液凝固', '血小板', '血小板參與凝血。'], ['淡黃色液體，運送養分、廢物與激素', '血漿', '血漿是血液的液體部分。'],
      ['約占血液體積的一半以上', '血漿', '血漿占血液體積約 55%。']
    ]
  });

  // =====================================================================
  // 第 5 章
  // =====================================================================
  const BRAIN = `
    <rect width="420" height="330" class="w-bg"/>
    <path d="M70,170 C50,90 130,30 220,35 C310,40 370,95 360,170 C352,215 300,225 255,215 C220,208 180,215 150,220 C110,225 80,210 70,170 Z" class="w-cerebrum" data-p="cere"/>
    <path d="M110,110 C140,90 170,120 200,95 M150,160 C180,140 220,165 250,140 M260,90 C285,110 300,95 330,120 M100,170 C130,150 150,180 180,165" class="w-gyri"/>
    <path d="M255,218 C290,215 330,220 335,250 C338,280 300,292 272,285 C250,280 240,250 255,218 Z" class="w-cerebellum" data-p="cbl"/>
    <path d="M262,228 C285,232 310,236 325,248 M258,245 C285,250 310,256 328,265 M262,262 C285,268 305,272 322,280" class="w-gyri"/>
    <path d="M205,212 C230,212 245,220 248,240 L245,300 L215,300 L212,240 C205,230 200,220 205,212 Z" class="w-stemb" data-p="stem"/>
    <rect x="215" y="300" width="30" height="30" class="w-cord" data-p="cord"/>
    <circle cx="190" cy="205" r="7" class="w-pit" data-p="pit"/>`;
  W['brain'] = (host) => makeDiagram(host, {
    title: '🧠 腦的構造與分工', desc: '點選各部位；按「找找看」練習',
    variants: [{ k: 'b', n: '腦', view: '0 0 420 330', svg: BRAIN, parts: {
      cere: ['大腦', '思考、記憶、學習、產生<b>感覺</b>、控制<b>隨意運動</b>；意識行為的中樞。'],
      cbl: ['小腦', '維持身體<b>平衡</b>、協調肌肉動作。'],
      stem: ['腦幹', '控制<b>呼吸、心跳、血壓</b>等維持生命的活動（生命中樞）。'],
      cord: ['脊髓', '連接腦與周圍神經，傳遞訊息；也是許多<b>反射</b>的中樞。'],
      pit: ['腦垂腺', '內分泌腺，分泌生長激素，並調控其他內分泌腺。']
    } }],
    intro: '腦分為<b>大腦、小腦、腦幹</b>；腦與脊髓合稱<b>中樞神經</b>。'
  });
  W['brain-sort'] = (host) => makeSorter(host, {
    title: '🧩 這是誰負責的？', desc: '判斷每項功能由哪一部分負責',
    cats: ['大腦', '小腦', '腦幹', '脊髓'],
    items: [
      ['背誦英文單字', '大腦', '學習、記憶。'], ['看到紅燈決定停下', '大腦', '需要思考判斷的意識行為。'], ['感覺到手很痛', '大腦', '感覺在大腦產生。'],
      ['走平衡木不跌倒', '小腦', '平衡與協調。'], ['騎腳踏車維持平衡', '小腦', '平衡與協調。'],
      ['睡覺時仍持續呼吸', '腦幹', '呼吸中樞。'], ['心跳的調節', '腦幹', '生命中樞。'],
      ['手碰到燙的東西立刻縮回', '脊髓', '縮手反射由脊髓處理。'], ['膝跳反射', '脊髓', '脊髓反射。']
    ]
  });

  W['reflex-arc'] = function (host) {
    const body = frame(host, '⚡ 反射與意識行為', '按按鈕，看訊息傳遞的路徑');
    body.innerHTML = `
      <div class="w-tabs"><button class="chip" data-m="reflex">反射：手碰燙水縮回</button><button class="chip" data-m="mind">意識：看到熱水決定不碰</button></div>
      <div class="w-split"><div class="w-map"><svg viewBox="0 0 520 330"></svg></div><div class="w-side"><ol class="w-steps"></ol><div class="w-read"></div></div></div>`;
    const svg = body.querySelector('svg'), steps = body.querySelector('.w-steps'), read = body.querySelector('.w-read');
    svg.innerHTML = `<rect width="520" height="330" class="w-bg"/>
      <path d="M200,40 C170,40 160,80 185,95 C200,105 250,105 265,95 C290,80 280,40 250,40 Z" class="w-cerebrum"/><text x="225" y="78" text-anchor="middle" class="w-small">大腦</text>
      <rect x="215" y="100" width="20" height="200" rx="8" class="w-cord"/><text x="240" y="300" class="w-small">脊髓</text>
      <path d="M40,230 L120,230 L150,215 L150,245 L120,240 L40,240 Z" class="w-arm"/><text x="45" y="265" class="w-small">手（皮膚的受器）</text>
      <path d="M150,180 L180,180 L180,200 L150,200 Z" class="w-muscle"/><text x="120" y="172" class="w-small">肌肉（動器）</text>
      <path id="ra-s" d="M70,228 C120,200 180,200 225,200" class="w-nerve sens"/>
      <path id="ra-m" d="M225,205 C200,195 190,192 175,190" class="w-nerve mot"/>
      <path id="ra-up" d="M225,200 L225,100" class="w-nerve up"/><path id="ra-dn" d="M225,100 L225,205" class="w-nerve up"/>
      <text x="110" y="205" class="w-small">感覺神經</text><text x="160" y="186" class="w-small">運動神經</text>
      <circle r="8" class="w-signal" data-k="sig" cx="70" cy="228"/>`;
    const sig = svg.querySelector('[data-k="sig"]');
    const R = {
      reflex: { path: ['ra-s', 'ra-m'], st: ['受器（皮膚）感受到燙', '感覺神經傳入', '脊髓（中樞）立刻處理', '運動神經傳出', '動器（肌肉）收縮，手縮回'], txt: '<b>不經過大腦</b>，路徑短、反應快，可保護身體。之後訊息才傳到大腦，你才「感覺」到燙。' },
      mind: { path: ['ra-s', 'ra-up', 'ra-dn', 'ra-m'], st: ['受器接收刺激', '感覺神經傳入', '經脊髓傳到大腦', '大腦思考、判斷', '經脊髓、運動神經傳出', '肌肉做出動作'], txt: '需要<b>大腦判斷</b>，路徑較長，反應比反射慢。' }
    };
    let token = 0;
    function play(m) {
      body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('active', b.dataset.m === m));
      const r = R[m], my = ++token;
      steps.innerHTML = r.st.map((s) => `<li>${s}</li>`).join('');
      read.innerHTML = r.txt;
      svg.querySelectorAll('.w-nerve').forEach((n) => n.classList.toggle('on', r.path.includes(n.id)));
      const lens = r.path.map((id) => svg.getElementById(id).getTotalLength());
      const total = lens.reduce((a, b) => a + b, 0), dur = m === 'reflex' ? 1500 : 3200, t0 = performance.now();
      const lis = steps.querySelectorAll('li');
      const tick = (now) => {
        if (my !== token || !svg.isConnected) return;
        const f = Math.min(1, (now - t0) / dur);
        let d = f * total, i = 0;
        while (i < lens.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
        const p = svg.getElementById(r.path[i]).getPointAtLength(Math.min(d, lens[i]));
        sig.setAttribute('cx', p.x); sig.setAttribute('cy', p.y);
        const si = Math.min(lis.length - 1, Math.floor(f * lis.length));
        lis.forEach((li, k) => li.classList.toggle('on', k <= si));
        if (f < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    body.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => play(b.dataset.m)));
    play('reflex');
  };

  W['reaction-game'] = function (host) {
    const body = frame(host, '⏱️ 反應時間挑戰', '畫面變綠時立刻點擊！共測 5 次');
    body.innerHTML = `<div class="w-react" tabindex="0">點這裡開始</div><div class="w-read"></div>`;
    const pad = body.querySelector('.w-react'), read = body.querySelector('.w-read');
    let state = 'idle', t0 = 0, timer = null, times = [];
    read.innerHTML = '<b class="h">怎麼玩</b>點一下灰色區域開始，等它變成<b>綠色</b>時立刻點擊。';
    function set(s, txt) { state = s; pad.className = 'w-react ' + s; pad.textContent = txt; }
    function hit() {
      if (state === 'idle' || state === 'done') { if (state === 'done') times = []; set('wait', '等待變綠…'); timer = setTimeout(() => { t0 = performance.now(); set('go', '點！'); }, 1200 + Math.random() * 2500); }
      else if (state === 'wait') { clearTimeout(timer); set('idle', '太早了！點這裡重來'); read.innerHTML = '<b class="h">太早了</b>要等變綠再點喔。'; }
      else if (state === 'go') {
        const ms = Math.round(performance.now() - t0); times.push(ms);
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        if (times.length >= 5) {
          set('done', `平均 ${avg} 毫秒，點這裡再玩`);
          read.innerHTML = `<b class="h">5 次平均：${avg} 毫秒（${(avg / 1000).toFixed(2)} 秒）</b>${times.join('、')} 毫秒<br><span class="w-hint">「看到變綠 → 決定點擊」需要經過<b>大腦</b>判斷，是<b>意識行為</b>；國中生大約 200～350 毫秒。反射（如縮手）不經大腦，通常更快。</span>`;
        } else { set('idle', `${ms} 毫秒！點這裡繼續（${times.length}/5）`); read.innerHTML = `<b class="h">第 ${times.length} 次：${ms} 毫秒</b>`; }
      }
    }
    pad.addEventListener('mousedown', hit);
    pad.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hit(); } });
  };

  const BODY = `
    <rect width="300" height="460" class="w-bg"/>
    <circle cx="150" cy="60" r="44" class="w-skin"/>
    <rect x="135" y="100" width="30" height="25" class="w-skin"/>
    <path d="M85,125 L215,125 C235,125 240,145 238,170 L230,330 C228,350 215,360 200,360 L100,360 C85,360 72,350 70,330 L62,170 C60,145 65,125 85,125 Z" class="w-skin"/>
    <circle cx="150" cy="62" r="7" class="w-gland2" data-p="pit"/>
    <path d="M132,112 C140,104 148,110 150,116 C152,110 160,104 168,112 C168,124 156,124 150,118 C144,124 132,124 132,112 Z" class="w-gland2" data-p="thy"/>
    <ellipse cx="118" cy="250" rx="16" ry="24" class="w-kidney"/><ellipse cx="182" cy="250" rx="16" ry="24" class="w-kidney"/>
    <path d="M106,228 Q118,214 130,228 Z" class="w-gland2" data-p="adr"/><path d="M170,228 Q182,214 194,228 Z" class="w-gland2" data-p="adr"/>
    <path d="M115,205 C140,195 185,195 200,205 C185,215 140,215 115,205 Z" class="w-gland2" data-p="pan"/>
    <circle cx="125" cy="320" r="9" class="w-gland2" data-p="gon"/><circle cx="175" cy="320" r="9" class="w-gland2" data-p="gon"/>`;
  W['endocrine'] = (host) => makeDiagram(host, {
    title: '🧪 人體的內分泌腺', desc: '點選腺體看分泌的激素與功能',
    variants: [{ k: 'e', n: '內分泌腺', view: '0 0 300 460', svg: BODY, parts: {
      pit: ['腦垂腺', '分泌<b>生長激素</b>等，促進生長，並調控其他內分泌腺。'],
      thy: ['甲狀腺', '分泌<b>甲狀腺素</b>，調節代謝速率；缺<b>碘</b>可能導致甲狀腺腫大。'],
      adr: ['腎上腺', '分泌<b>腎上腺素</b>，緊急時使心跳加快、血糖上升。'],
      pan: ['胰臟中的胰島', '分泌<b>胰島素</b>（降血糖）與<b>升糖素</b>（升血糖）。'],
      gon: ['卵巢／睪丸', '分泌<b>動情素</b>／<b>睪固酮</b>，促進第二性徵發育。']
    } }],
    intro: '內分泌腺把<b>激素</b>直接分泌到<b>血液</b>中，運送到全身。'
  });

  W['tropism'] = function (host) {
    const body = frame(host, '🌻 植物的感應', '移動光源看莖彎曲；碰碰含羞草');
    body.innerHTML = `
      <div class="w-split">
        <div class="w-map w-map-sm"><svg viewBox="0 0 320 300" data-k="p"></svg><label class="w-slider">光源位置 <input type="range" min="-100" max="100" value="-80"></label></div>
        <div class="w-side"><svg viewBox="0 0 260 180" data-k="m" class="w-mimosa"></svg><button class="chip" data-k="touch">👆 碰一下含羞草</button><div class="w-read"></div></div>
      </div>`;
    const ps = body.querySelector('[data-k="p"]'), ms = body.querySelector('[data-k="m"]'), read = body.querySelector('.w-read'), input = body.querySelector('input');
    function plant() {
      const L = +input.value / 100;
      const lx = 160 + L * 140, bend = L * 70;
      ps.innerHTML = `<rect width="320" height="300" class="w-bg"/><circle cx="${lx}" cy="40" r="20" class="w-sun"/>
        ${[0, 1, 2].map((i) => `<line x1="${lx}" y1="40" x2="${lx + (160 - lx) * 0.4 + (i - 1) * 25}" y2="120" class="w-ray"/>`).join('')}
        <path d="M100,230 L220,230 L205,290 L115,290 Z" class="w-pot"/>
        <path d="M160,230 C160,190 ${160 + bend * 0.3},150 ${160 + bend},110" class="w-stem-l"/>
        <ellipse cx="${160 + bend}" cy="104" rx="18" ry="8" class="w-leaf"/>
        <path d="M160,232 L150,270 M160,232 L170,275 M160,235 L160,285" class="w-root"/>`;
      read.innerHTML = `<b class="h">向光性</b>莖<b>向著光</b>彎曲生長（背光那一側長得比較快）。根則向下生長（<b>向地性</b>）。`;
    }
    let folded = false;
    function mimosa() {
      ms.innerHTML = `<rect width="260" height="180" class="w-bg"/><path d="M20,100 L240,100" class="w-stem-l"/>` +
        Array.from({ length: 9 }, (_, i) => { const x = 40 + i * 22, a = folded ? 8 : 55; return `<ellipse cx="${x}" cy="${100 - a * 0.5}" rx="5" ry="${a * 0.5}" class="w-leaf"/><ellipse cx="${x}" cy="${100 + a * 0.5}" rx="5" ry="${a * 0.5}" class="w-leaf"/>`; }).join('');
    }
    body.querySelector('[data-k="touch"]').addEventListener('click', () => {
      folded = true; mimosa();
      read.innerHTML = '<b class="h">觸發運動</b>含羞草被碰觸後，小葉很快<b>閉合</b>下垂，過一段時間才慢慢張開。';
      setTimeout(() => { folded = false; if (ms.isConnected) mimosa(); }, 2500);
    });
    input.addEventListener('input', plant);
    plant(); mimosa();
  };

  // =====================================================================
  // 第 6 章
  // =====================================================================
  W['breathing'] = function (host) {
    const body = frame(host, '🫁 呼吸運動', '按吸氣、呼氣或自動播放，觀察胸腔的變化');
    body.innerHTML = `
      <div class="w-tabs"><button class="chip" data-s="in">吸氣</button><button class="chip" data-s="out">呼氣</button><button class="chip" data-k="auto">▶ 自動</button><label class="w-inline"><input type="checkbox" data-k="run"> 正在運動</label></div>
      <div class="w-split"><div class="w-map w-map-sm"><svg viewBox="0 0 320 340"></svg></div><div class="w-side"><div class="w-read w-read-lg"></div></div></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    let phase = 0, auto = null; // 0 = 呼氣完、1 = 吸飽
    function draw(f) {
      const ribA = -6 * f, dia = 270 + 22 * f, lungS = 0.86 + 0.16 * f;
      svg.innerHTML = `<rect width="320" height="340" class="w-bg"/>
        <path d="M160,20 L160,95" class="w-airway"/><path d="M160,95 L125,120 M160,95 L195,120" class="w-airway"/>
        <g transform="translate(160,170) scale(${lungS}) translate(-160,-170)">
          <path d="M150,105 C110,100 80,140 82,200 C84,250 120,${dia - 10} 150,${dia - 15} Z" class="w-lung"/>
          <path d="M170,105 C210,100 240,140 238,200 C236,250 200,${dia - 10} 170,${dia - 15} Z" class="w-lung"/></g>
        ${[0, 1, 2, 3, 4].map((i) => `<path d="M70,${120 + i * 30} Q160,${105 + i * 30} 250,${120 + i * 30}" class="w-rib" transform="rotate(${ribA} 70 ${120 + i * 30})"/>`).join('')}
        <path d="M50,${dia} Q160,${dia - 40 + 30 * f} 270,${dia}" class="w-diaphragm"/>
        <text x="275" y="${dia + 4}" class="w-small">橫膈</text>
        <text x="160" y="14" text-anchor="middle" class="w-label-red">${f > 0.5 ? '空氣進入 ↓' : '空氣排出 ↑'}</text>`;
    }
    function show(s) {
      body.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('active', b.dataset.s === s));
      const target = s === 'in' ? 1 : 0, from = phase, t0 = performance.now(), dur = 900;
      const step = (now) => { const f = Math.min(1, (now - t0) / dur); phase = from + (target - from) * f; draw(phase); if (f < 1 && svg.isConnected) requestAnimationFrame(step); };
      requestAnimationFrame(step);
      read.innerHTML = s === 'in'
        ? '<b class="h">吸氣</b>肋骨<b>上舉</b>、橫膈<b>收縮下降</b> → 胸腔<b>變大</b> → 肺內氣壓變小 → 空氣<b>進入</b>肺。'
        : '<b class="h">呼氣</b>肋骨<b>下降</b>、橫膈<b>舒張上升</b> → 胸腔<b>變小</b> → 肺內氣壓變大 → 空氣<b>排出</b>。';
      if (body.querySelector('[data-k="run"]').checked) read.innerHTML += '<br><span class="w-hint">運動時血液中<b>二氧化碳</b>增加，<b>腦幹</b>使呼吸變快、變深。</span>';
    }
    body.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { clearInterval(auto); auto = null; show(b.dataset.s); }));
    body.querySelector('[data-k="auto"]').addEventListener('click', () => {
      clearInterval(auto);
      let s = 'in'; show(s);
      const period = () => (body.querySelector('[data-k="run"]').checked ? 1000 : 2000);
      const loop = () => { if (!svg.isConnected) return; s = s === 'in' ? 'out' : 'in'; show(s); auto = setTimeout(loop, period()); };
      auto = setTimeout(loop, period());
    });
    draw(0); show('out');
  };

  W['thermo'] = function (host) {
    const body = frame(host, '🌡️ 體溫的恆定', '拖曳環境溫度，比較人（恆溫）與蜥蜴（變溫）');
    body.innerHTML = `
      <label class="w-slider">環境溫度 <input type="range" min="0" max="40" value="22"><output></output></label>
      <div class="w-split"><div class="w-map w-map-sm"><svg viewBox="0 0 340 260"></svg></div><div class="w-side"><div class="w-read w-read-lg"></div></div></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read'), input = body.querySelector('input');
    function render() {
      const t = +input.value;
      body.querySelector('output').textContent = t + '°C';
      const hot = t >= 30, cold = t <= 12;
      const skin = hot ? '#f1a08a' : cold ? '#e7d3c8' : '#f3c9a8';
      svg.innerHTML = `<rect width="340" height="260" class="${hot ? 'w-env-hot' : cold ? 'w-env-cold' : 'w-bg'}"/>
        <g class="${cold ? 'w-shiver' : ''}"><circle cx="90" cy="60" r="28" fill="${skin}"/><rect x="62" y="92" width="56" height="90" rx="20" fill="${skin}"/>
        <rect x="66" y="182" width="20" height="60" rx="8" fill="${skin}"/><rect x="94" y="182" width="20" height="60" rx="8" fill="${skin}"/></g>
        ${hot ? '<text x="125" y="70" class="w-drip">💧</text><text x="55" y="120" class="w-drip">💧</text>' : ''}
        <text x="90" y="255" text-anchor="middle" class="w-label">人：37°C</text>
        <text x="250" y="150" text-anchor="middle" class="w-icon-lg">🦎</text>
        <text x="250" y="200" text-anchor="middle" class="w-label">蜥蜴：約 ${t}°C</text>`;
      const R = hot ? ['流汗（水分蒸發帶走熱量）', '皮膚血管<b>擴張</b>，臉變紅，增加散熱']
        : cold ? ['皮膚血管<b>收縮</b>，臉色變白，減少散熱', '<b>發抖</b>：肌肉收縮產生熱量', '起雞皮疙瘩']
          : ['體溫穩定，不需要特別調節'];
      read.innerHTML = `<b class="h">${hot ? '天氣熱' : cold ? '天氣冷' : '溫度適中'}：人的體溫仍維持約 37°C</b><ul class="w-ul">${R.map((r) => `<li>${r}</li>`).join('')}</ul>
        <span class="w-hint">蜥蜴是<b>變溫動物</b>，體溫隨環境改變；天冷時活動力下降，會曬太陽取暖。</span>`;
    }
    input.addEventListener('input', render);
    render();
  };

  W['glucose'] = function (host) {
    const body = frame(host, '🍬 血糖的恆定', '按「吃飯」「運動」，看 8 小時內血糖與激素的變化（示意）');
    body.innerHTML = `
      <div class="w-tabs"><button class="chip" data-k="meal">🍚 吃飯</button><button class="chip" data-k="ex">🏃 運動</button><button class="chip" data-k="reset">↺ 重來</button>
        <label class="w-inline"><input type="checkbox" data-k="dm"> 模擬糖尿病（胰島素作用不良）</label></div>
      <div class="w-map w-map-mid"><svg viewBox="0 0 600 260"></svg></div>
      <div class="w-read"></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    const N = 48; // 每格 10 分鐘
    let g, gut, ex, t, hist, timer;
    const X = (i) => 50 + i / N * 530, Y = (v) => 230 - (v - 40) / 220 * 200;
    function reset() { g = 90; gut = 0; ex = 0; t = 0; hist = [{ g, ins: 0, glu: 0 }]; clearInterval(timer); timer = setInterval(step, 350); draw(); }
    function step() {
      if (!svg.isConnected) return clearInterval(timer);
      if (t >= N) { clearInterval(timer); read.innerHTML += '<br><span class="w-hint">8 小時模擬結束，按「重來」再試一次。</span>'; return; }
      const dm = $('dm').checked;
      const absorb = 0.22 * gut; gut -= absorb;
      const ins = Math.max(0, g - 100) * (dm ? 0.025 : 0.14);
      const glu = Math.max(0, 85 - g) * 0.18;
      const use = 1.2 + (ex > 0 ? 3 : 0); if (ex > 0) ex--;
      g = Math.max(45, g + absorb - ins + glu - use + 1.2);
      t++; hist.push({ g, ins, glu }); draw();
    }
    function draw() {
      svg.innerHTML = '';
      el('rect', { x: 50, y: Y(140), width: 530, height: Y(70) - Y(140), class: 'w-normal-band' }, svg);
      el('text', { x: 54, y: Y(140) + 12, class: 'w-small', text: '正常範圍（約 70～140）' }, svg);
      [60, 100, 140, 180, 220, 260].forEach((v) => { el('line', { x1: 50, x2: 580, y1: Y(v), y2: Y(v), class: 'w-pgrid' }, svg); el('text', { x: 44, y: Y(v) + 4, 'text-anchor': 'end', class: 'w-small', text: v }, svg); });
      for (let h = 0; h <= 8; h += 2) el('text', { x: X(h * 6), y: 250, 'text-anchor': 'middle', class: 'w-small', text: h + ' 小時' }, svg);
      el('path', { d: d3.line().x((d, i) => X(i)).y((d) => Y(d.g))(hist), class: 'w-glu-line' }, svg);
      hist.forEach((d, i) => { if (d.ins > 0.5) el('rect', { x: X(i) - 3, y: 18, width: 6, height: Math.min(14, d.ins * 1.2), class: 'w-ins-bar' }, svg); if (d.glu > 0.5) el('rect', { x: X(i) - 3, y: 18, width: 6, height: Math.min(14, d.glu * 2), class: 'w-gcg-bar' }, svg); });
      el('text', { x: 50, y: 12, class: 'w-small', text: '■ 胰島素　　■ 升糖素' }, svg);
      const last = hist[hist.length - 1];
      const st = last.ins > 1 ? '血糖偏高 → 胰島分泌<b>胰島素</b>，使血糖下降（葡萄糖轉成肝醣）。' : last.glu > 0.5 ? '血糖偏低 → 胰島分泌<b>升糖素</b>，使血糖上升（肝醣分解）。' : '血糖在正常範圍內。';
      read.innerHTML = `<b class="h">血糖 ${Math.round(last.g)} mg/dL</b>${st}${$('dm').checked && last.g > 160 ? '<br><span class="w-bad">胰島素作用不良，血糖降不下來 → 糖尿病。</span>' : ''}`;
    }
    $('meal').addEventListener('click', () => { gut += 75; });
    $('ex').addEventListener('click', () => { ex = 6; });
    $('reset').addEventListener('click', reset);
    reset();
  };

  W['urinary'] = function (host) {
    const body = makeDiagram(host, {
      title: '🚽 泌尿系統與水分恆定', desc: '點選器官；在右側調整喝水量與流汗量',
      variants: [{ k: 'u', n: '泌尿系統', view: '0 0 300 360', svg: `
        <rect width="300" height="360" class="w-bg"/>
        <path d="M150,20 L150,330" class="w-aorta"/><text x="156" y="40" class="w-small">血管</text>
        <path d="M95,90 C60,90 55,160 95,165 C110,165 115,145 108,128 C115,110 112,90 95,90 Z" class="w-kidney" data-p="kid"/>
        <path d="M205,90 C240,90 245,160 205,165 C190,165 185,145 192,128 C185,110 188,90 205,90 Z" class="w-kidney" data-p="kid"/>
        <path d="M105,140 C120,180 125,220 135,250" class="w-ureter" data-p="ure"/><path d="M195,140 C180,180 175,220 165,250" class="w-ureter" data-p="ure"/>
        <path d="M120,250 C120,230 180,230 180,250 C185,290 115,290 120,250 Z" class="w-bladder" data-p="bla"/>
        <path d="M150,283 L150,330" class="w-ureter" data-p="urt"/>` , parts: {
        kid: ['腎臟', '<b>過濾血液</b>，把尿素等廢物與多餘的水分形成<b>尿液</b>；並調節體內水分。'],
        ure: ['輸尿管', '把尿液從腎臟送到膀胱。'], bla: ['膀胱', '<b>暫時儲存</b>尿液。'], urt: ['尿道', '把尿液排出體外。']
      } }],
      intro: '尿液路徑：<b>腎臟 → 輸尿管 → 膀胱 → 尿道</b>。',
      side: (box) => {
        box.innerHTML = `<div class="w-calc-title" style="margin-top:12px">💧 水分平衡</div>
          <label class="w-slider">喝水量 <input type="range" min="0" max="100" value="50" data-k="drink"></label>
          <label class="w-slider">流汗量 <input type="range" min="0" max="100" value="20" data-k="sweat"></label>
          <div class="w-urine"><div class="w-cup"><div class="w-cup-fill"></div></div><div class="w-small-txt"></div></div>`;
        const d = box.querySelector('[data-k="drink"]'), s = box.querySelector('[data-k="sweat"]'), fill = box.querySelector('.w-cup-fill'), tx = box.querySelector('.w-small-txt');
        const upd = () => {
          const v = Math.max(8, Math.min(100, 30 + +d.value * 0.8 - +s.value * 0.6));
          fill.style.height = v + '%';
          fill.style.background = d3.interpolateRgb('#fff6b8', '#d99a1e')(1 - v / 100);
          tx.innerHTML = v > 65 ? '尿量<b>多</b>、顏色<b>淡</b>：喝水多，腎臟排出多餘水分。' : v < 35 ? '尿量<b>少</b>、顏色<b>深</b>：水分不足（流汗多或喝水少），腎臟回收較多水分。' : '尿量與顏色正常。';
        };
        d.addEventListener('input', upd); s.addEventListener('input', upd); upd();
      }
    });
    void body;
  };
})();
