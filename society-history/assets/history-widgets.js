// 歷史課程互動圖（使用 widgets-core.js 的 WUtil）
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U) return;
  const { el, frame, mercator, ready, makeSorter, pointMap, shuffle } = U;

  // ---------- 通用：互動時間軸（含排序挑戰） ----------
  function makeTimeline(host, cfg) {
    const body = frame(host, cfg.title, cfg.desc);
    const [Y0, Y1] = [cfg.start, cfg.end];
    const Wd = 900, x = (y) => 30 + (y - Y0) / (Y1 - Y0) * (Wd - 60);
    body.innerHTML = `
      <div class="w-tabs"><button class="chip" data-m="see">探索時間軸</button><button class="chip" data-m="order">🧩 排序挑戰</button></div>
      <div class="w-map w-map-wide"><svg viewBox="0 0 ${Wd} 220"></svg></div>
      <div class="w-order" hidden></div>
      <div class="w-read"></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read'), orderBox = body.querySelector('.w-order');
    (cfg.periods || []).forEach((p) => {
      const g = el('g', { class: 'w-period', tabindex: 0 }, svg);
      el('rect', { x: x(p.from), y: 40, width: Math.max(2, x(Math.min(p.to, Y1)) - x(p.from)), height: 34, rx: 4, fill: p.col }, g);
      el('text', { x: (x(p.from) + x(Math.min(p.to, Y1))) / 2, y: 62, 'text-anchor': 'middle', class: 'w-period-label', text: p.n }, g);
      g.addEventListener('click', () => { read.innerHTML = `<b class="h">${p.n}（${p.from}～${p.to >= Y1 && p.open ? '' : p.to}）</b>${p.d || ''}`; });
    });
    el('line', { x1: 30, x2: Wd - 30, y1: 100, y2: 100, class: 'w-axis' }, svg);
    for (let y = Math.ceil(Y0 / cfg.tick) * cfg.tick; y <= Y1; y += cfg.tick) {
      el('line', { x1: x(y), x2: x(y), y1: 96, y2: 104, class: 'w-axis' }, svg);
      el('text', { x: x(y), y: 30, 'text-anchor': 'middle', class: 'w-small', text: y }, svg);
    }
    const evs = cfg.events.map((e, i) => {
      const g = el('g', { class: 'w-ev', tabindex: 0 }, svg);
      const row = i % 3, ly = 130 + row * 30;
      el('line', { x1: x(e.y), x2: x(e.y), y1: 100, y2: ly - 12, class: 'w-ev-stem' }, g);
      el('circle', { cx: x(e.y), cy: 100, r: 6 }, g);
      el('text', { x: x(e.y), y: ly, 'text-anchor': 'middle', class: 'w-ev-label', text: `${e.y} ${e.n}` }, g);
      const show = () => { evs.forEach((o) => o.g.classList.toggle('on', o.g === g)); read.innerHTML = `<b class="h">${e.y} 年：${e.n}</b>${e.d}`; };
      g.addEventListener('click', show); g.addEventListener('focus', show);
      return { g, e };
    });
    function order() {
      const pick = shuffle(cfg.events).slice(0, 4);
      const sorted = pick.slice().sort((a, b) => a.y - b.y);
      let step = 0;
      orderBox.innerHTML = `<div class="w-order-q">請由<b>早到晚</b>依序點選：</div><div class="w-chips">${shuffle(pick).map((e) => `<button class="chip" data-n="${e.n}">${e.n}</button>`).join('')}</div><button class="chip" data-k="again">換一組</button>`;
      read.innerHTML = '<b class="h">排序挑戰</b>先想想看哪一件事最早發生。';
      orderBox.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        const e = sorted[step];
        if (b.dataset.n === e.n) {
          b.disabled = true; b.classList.add('ok'); b.textContent = `${step + 1}. ${e.n}（${e.y}）`; step++;
          if (step === sorted.length) read.innerHTML = `<b class="h">✔ 全部答對！</b>${sorted.map((s) => `${s.y} ${s.n}`).join(' → ')}`;
        } else {
          b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 600);
          read.innerHTML = `<b class="h">✘ 還不是它</b>提示：下一件事發生在 ${Math.floor(e.y / 100) + 1} 世紀。`;
        }
      }));
      orderBox.querySelector('[data-k="again"]').addEventListener('click', order);
    }
    function setMode(m) {
      body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('active', b.dataset.m === m));
      orderBox.hidden = m !== 'order';
      evs.forEach((o) => o.g.style.display = m === 'order' ? 'none' : '');
      if (m === 'order') order(); else read.innerHTML = '<b class="h">提示</b>點選時間軸上的色塊或事件看說明。';
    }
    body.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.m)));
    setMode('see');
  }
  U.makeTimeline = makeTimeline;

  // =====================================================================
  // 第 1 章
  // =====================================================================
  const PERIODS = [
    { from: 1500, to: 1624, n: '史前時代', col: '#c8b28e', d: '沒有文字記錄，靠考古了解（實際上距今數萬年前就開始，這裡只畫出最後一段）。' },
    { from: 1624, to: 1662, n: '荷西', col: '#e1a33b', d: '荷蘭（1624～1662）與西班牙（1626～1642）統治時期，又稱大航海時代。' },
    { from: 1662, to: 1683, n: '鄭氏', col: '#d9534f', d: '鄭成功驅逐荷蘭後建立，臺灣史上第一個漢人政權。' },
    { from: 1683, to: 1895, n: '清帝國時期', col: '#5b8def', d: '統治 212 年，大量漢人移民來臺開墾。' },
    { from: 1895, to: 1945, n: '日治', col: '#8e5bd6', d: '馬關條約後由日本統治 50 年。' },
    { from: 1945, to: 2030, n: '中華民國', col: '#2f9e6e', d: '第二次世界大戰結束後至今。', open: true }
  ];
  W['periods-timeline'] = (host) => makeTimeline(host, {
    title: '🕰️ 臺灣史分期時間軸', desc: '點選色塊看各時期；切換「排序挑戰」練習先後順序',
    start: 1500, end: 2030, tick: 50, periods: PERIODS,
    events: [
      { y: 1624, n: '荷蘭據大員', d: '荷蘭人來到今臺南安平，興建熱蘭遮城。' },
      { y: 1626, n: '西班牙據雞籠', d: '西班牙人佔領今基隆和平島。' },
      { y: 1662, n: '荷蘭投降', d: '鄭成功驅逐荷蘭人。' },
      { y: 1684, n: '設臺灣府', d: '臺灣納入清帝國版圖，隸屬福建省。' },
      { y: 1860, n: '開港通商', d: '北京條約後，臺灣開放通商口岸。' },
      { y: 1885, n: '臺灣建省', d: '劉銘傳為首任巡撫。' },
      { y: 1895, n: '馬關條約', d: '臺灣、澎湖割讓給日本。' },
      { y: 1945, n: '二戰結束', d: '日本戰敗，臺灣由中華民國政府接收。' }
    ]
  });

  W['time-converter'] = function (host) {
    const body = frame(host, '🔢 時間換算器', '輸入西元或民國年，自動換算；也可以挑戰世紀小測驗');
    body.innerHTML = `
      <div class="w-calc-row">
        <span>西元</span><input type="number" value="1624" data-k="ad" style="width:6em"><span>年</span>
        <span>民國</span><input type="number" value="" data-k="roc" style="width:6em"><span>年</span>
      </div>
      <div class="w-read" data-k="out"></div>
      <div class="w-calc">
        <div class="w-calc-title">🎯 世紀小測驗 <span class="w-small-label" data-k="score"></span></div>
        <div data-k="q"></div>
      </div>`;
    const $ = (k) => body.querySelector(`[data-k="${k}"]`);
    const periodOf = (y) => y < 1624 ? '史前時代（臺灣尚無文字記錄）' : y < 1662 ? '荷西時期（大航海時代）' : y < 1683 ? '鄭氏時期' : y < 1895 ? '清帝國時期' : y < 1945 ? '日本統治時期' : '中華民國時期';
    function show(y) {
      if (!y) { $('out').innerHTML = '請輸入年份'; return; }
      const cent = Math.ceil(y / 100), dec = Math.floor(y / 10) * 10;
      const roc = y >= 1912 ? `民國 ${y - 1911} 年` : `民國前 ${1912 - y} 年`;
      $('out').innerHTML = `<b class="h">西元 ${y} 年</b>
        民國紀年：<b>${roc}</b>（${y >= 1912 ? `${y} − 1911` : `1912 − ${y}`}）<br>
        世紀：${y} ÷ 100 = ${(y / 100).toFixed(2)}${y % 100 ? '，有餘數進位' : '，剛好整除'} → <b>${cent} 世紀</b><br>
        年代：<b>${dec} 年代</b>（${dec}～${dec + 9} 年）<br>
        在臺灣屬於：<b>${periodOf(y)}</b>`;
    }
    $('ad').addEventListener('input', () => { const y = +$('ad').value; $('roc').value = y >= 1912 ? y - 1911 : ''; show(y); });
    $('roc').addEventListener('input', () => { const r = +$('roc').value; if (r > 0) { $('ad').value = r + 1911; show(r + 1911); } });
    let score = [0, 0];
    function quiz() {
      const y = [1624, 1662, 1683, 1700, 1786, 1800, 1860, 1895, 1900, 1945, 2000, 2024, 1501, 1912][Math.floor(Math.random() * 14)];
      const ans = Math.ceil(y / 100);
      const opts = shuffle([ans, ans - 1, ans + 1, ans + 2]);
      $('q').innerHTML = `<div>西元 <b>${y}</b> 年屬於第幾世紀？</div><div class="w-chips">${opts.map((o) => `<button class="chip" data-o="${o}">${o} 世紀</button>`).join('')}</div><div class="w-sort-ex"></div>`;
      $('q').querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
        if ($('q').dataset.done === '1') return;
        $('q').dataset.done = '1';
        const ok = +b.dataset.o === ans; score[1]++; if (ok) score[0]++;
        $('q').querySelectorAll('[data-o]').forEach((x) => { x.disabled = true; if (+x.dataset.o === ans) x.classList.add('ok'); else if (x === b) x.classList.add('bad'); });
        $('q').querySelector('.w-sort-ex').innerHTML = `<span class="${ok ? 'w-ok' : 'w-bad'}">${ok ? '✔' : '✘'}</span> ${y} ÷ 100 = ${(y / 100).toFixed(2)}${y % 100 ? '，有餘數進位' : '，剛好整除'} → ${ans} 世紀　<button class="chip" data-k="next">下一題</button>`;
        $('q').querySelector('[data-k="next"]').addEventListener('click', quiz);
        $('score').textContent = `答對 ${score[0]} / ${score[1]}`;
      }));
      $('q').dataset.done = '0';
    }
    $('ad').dispatchEvent(new Event('input'));
    quiz();
  };

  W['source-sort'] = (host) => makeSorter(host, {
    title: '📚 文字史料還是非文字史料？', desc: '判斷每一項屬於哪一種史料',
    cats: ['文字史料', '非文字史料'],
    items: [
      ['清代的土地契約（地契）', '文字史料', '以文字書寫的契約。'], ['日治時期的報紙', '文字史料', '報紙是文字記錄。'],
      ['官員寫給皇帝的奏摺', '文字史料', '官方文書。'], ['地方志（如《臺灣府志》）', '文字史料', '記載地方歷史的書籍。'],
      ['廟宇裡的石碑碑文', '文字史料', '碑上刻的是文字。'], ['卑南遺址出土的玉器', '非文字史料', '考古出土的器物。'],
      ['安平古堡的城牆遺跡', '非文字史料', '古蹟建築。'], ['阿公年輕時的老照片', '非文字史料', '圖像資料。'],
      ['訪問耆老的錄音紀錄', '非文字史料', '口述訪談屬於非文字史料。'], ['古代的地圖', '非文字史料', '以圖像呈現的資料。']
    ]
  });

  // =====================================================================
  // 第 2 章
  // =====================================================================
  W['prehistory-map'] = (host) => pointMap(host, {
    title: '🏺 臺灣史前遺址地圖', desc: '依時代篩選；按「找找看」練習位置',
    bbox: [119.9, 21.85, 122.1, 25.35], width: 420,
    cats: { paleo: ['舊石器時代', '#8a6a45'], neo: ['新石器時代', '#2f7d5b'], metal: ['金屬器時代', '#5b6cd9'] },
    items: [
      { n: '長濱文化', c: 'paleo', lon: 121.47, lat: 23.39, d: '臺東八仙洞，<b>舊石器時代</b>，臺灣已知最早的史前文化；使用打製石器，住在海邊洞穴。' },
      { n: '大坌坑文化', c: 'neo', lon: 121.41, lat: 25.15, d: '新北八里，<b>新石器時代早期</b>，以粗繩紋陶為特色。', left: true },
      { n: '圓山文化', c: 'neo', lon: 121.52, lat: 25.08, d: '臺北圓山，<b>新石器時代</b>，留下大量<b>貝塚</b>。' },
      { n: '牛罵頭文化', c: 'neo', lon: 120.58, lat: 24.27, d: '臺中清水，<b>新石器時代</b>中期的遺址。', left: true },
      { n: '鳳鼻頭文化', c: 'neo', lon: 120.38, lat: 22.53, d: '高雄林園，<b>新石器時代</b>的遺址。', left: true },
      { n: '南關里遺址', c: 'neo', lon: 120.28, lat: 23.1, d: '臺南（南部科學園區一帶），<b>新石器時代</b>的遺址。', left: true },
      { n: '卑南文化', c: 'neo', lon: 121.11, lat: 22.79, d: '臺東卑南，<b>新石器時代</b>晚期，有大量<b>石板棺</b>與精美<b>玉器</b>。' },
      { n: '十三行文化', c: 'metal', lon: 121.39, lat: 25.17, d: '新北八里，<b>金屬器時代</b>，有<b>煉鐵</b>遺跡，出土外來的錢幣、玻璃等，表示與外地交易。', left: true },
      { n: '蔦松文化', c: 'metal', lon: 120.25, lat: 23.03, d: '臺南一帶，<b>金屬器時代</b>的文化。', left: true },
      { n: '靜浦文化', c: 'metal', lon: 121.5, lat: 23.47, d: '花東海岸，<b>金屬器時代</b>的文化。' }
    ],
    intro: '<b class="h">提示</b>點選圓點看遺址說明，或用上方按鈕只看某一時代。'
  });
  W['era-sort'] = (host) => makeSorter(host, {
    title: '🪨 屬於哪一個時代？', desc: '判斷每項特色或遺址屬於史前的哪一個時代',
    cats: ['舊石器', '新石器', '金屬器'],
    items: [
      ['長濱文化', '舊石器', '臺東八仙洞，臺灣已知最早的史前文化。'], ['使用打製石器', '舊石器', '舊石器時代的工具特色。'],
      ['住在洞穴，以採集、狩獵為生', '舊石器', '尚未發展農業。'], ['大坌坑文化的繩紋陶', '新石器', '新石器時代早期。'],
      ['圓山文化的貝塚', '新石器', '新石器時代。'], ['卑南文化的石板棺與玉器', '新石器', '新石器時代晚期。'],
      ['使用磨製石器與陶器', '新石器', '新石器時代的工具特色。'], ['開始農耕、定居形成聚落', '新石器', '新石器時代的生活方式。'],
      ['十三行文化', '金屬器', '金屬器時代，有煉鐵遺跡。'], ['會煉鐵、與外地交易', '金屬器', '金屬器時代的特色。']
    ]
  });
  W['tribes-map'] = (host) => pointMap(host, {
    title: '🧑‍🤝‍🧑 臺灣原住民族 16 族（分布示意）', desc: '依地區篩選；點選看各族特色',
    bbox: [119.9, 21.85, 122.1, 25.35], width: 420,
    cats: { n: ['北部', '#0a6fc2'], c: ['中部', '#2f7d5b'], s: ['南部', '#e17f0e'], e: ['東部', '#d63031'], i: ['離島', '#8e5bd6'] },
    items: [
      { n: '泰雅族', c: 'n', lon: 121.35, lat: 24.6, d: '分布北部山區，以<b>紋面</b>與織布聞名。' },
      { n: '賽夏族', c: 'n', lon: 120.98, lat: 24.62, d: '新竹、苗栗山區，重要祭典為<b>矮靈祭</b>。', left: true },
      { n: '賽德克族', c: 'c', lon: 121.15, lat: 24.05, d: '南投、花蓮山區；1930 年霧社事件即與賽德克族有關。' },
      { n: '邵族', c: 'c', lon: 120.92, lat: 23.85, d: '居住在<b>日月潭</b>一帶，人數較少。', left: true },
      { n: '布農族', c: 'c', lon: 121.05, lat: 23.3, d: '中央山脈山區，重要祭典<b>射耳祭</b>；以<b>八部合音</b>聞名。' },
      { n: '鄒族', c: 'c', lon: 120.72, lat: 23.48, d: '阿里山一帶，重要祭典<b>戰祭（瑪雅斯比）</b>，有男子會所（庫巴）。', left: true },
      { n: '卡那卡那富族', c: 's', lon: 120.68, lat: 23.25, d: '高雄那瑪夏一帶，2014 年正名，有<b>米貢祭</b>。', left: true },
      { n: '拉阿魯哇族', c: 's', lon: 120.78, lat: 23.13, d: '高雄桃源一帶，2014 年正名，有<b>聖貝祭</b>。' },
      { n: '魯凱族', c: 's', lon: 120.72, lat: 22.8, d: '分貴族與平民的<b>階級社會</b>，崇敬<b>百步蛇</b>，住石板屋。', left: true },
      { n: '排灣族', c: 's', lon: 120.72, lat: 22.45, d: '<b>階級社會</b>，以<b>百步蛇</b>圖騰、<b>琉璃珠</b>、五年祭聞名。', left: true },
      { n: '太魯閣族', c: 'e', lon: 121.5, lat: 24.15, d: '分布花蓮山區，有紋面文化。' },
      { n: '撒奇萊雅族', c: 'e', lon: 121.62, lat: 23.98, d: '花蓮平原一帶，2007 年正名，有火神祭。' },
      { n: '噶瑪蘭族', c: 'e', lon: 121.53, lat: 23.72, d: '原居<b>宜蘭</b>平原，後來多遷到花蓮沿海。' },
      { n: '阿美族', c: 'e', lon: 121.4, lat: 23.45, d: '人口<b>最多</b>的原住民族，<b>母系社會</b>，重要祭典為<b>豐年祭</b>。' },
      { n: '卑南族', c: 'e', lon: 121.08, lat: 22.78, d: '臺東一帶，<b>母系社會</b>，有少年會所。', left: true },
      { n: '雅美族（達悟族）', c: 'i', lon: 121.55, lat: 22.04, d: '居住在<b>蘭嶼</b>，有<b>拼板舟</b>、地下屋與<b>飛魚祭</b>。', left: true }
    ],
    intro: '<b class="h">提示</b>圓點位置為大致的分布地區（示意），點選看各族特色。'
  });
  W['festival-sort'] = (host) => makeSorter(host, {
    title: '🎉 哪一族的文化？', desc: '把祭典或文化特色配對到正確的族群',
    cats: ['阿美', '賽夏', '達悟', '布農', '鄒'],
    items: [
      ['豐年祭', '阿美', '阿美族最重要的祭典。'], ['母系社會、人口最多的原住民族', '阿美', '阿美族。'],
      ['矮靈祭（巴斯達隘）', '賽夏', '賽夏族的祭典。'], ['飛魚祭', '達悟', '配合飛魚季節的祭典。'],
      ['拼板舟與地下屋', '達悟', '蘭嶼達悟族的文化。'], ['射耳祭', '布農', '布農族的祭典。'],
      ['八部合音（祈禱小米豐收歌）', '布農', '布農族的多聲部合唱。'], ['戰祭（瑪雅斯比）', '鄒', '鄒族的祭典。'],
      ['男子會所「庫巴」', '鄒', '鄒族部落的男子聚會所。']
    ]
  });

  // =====================================================================
  // 第 3 章
  // =====================================================================
  W['voyage-map'] = function (host) {
    if (!ready() || !window.EASTASIA || !window.TW_TOPO) return;
    const body = frame(host, '🗺️ 大航海時代的東亞', '拖曳年份，看各國在東亞與臺灣的據點');
    const m = mercator([100, -8, 145, 40], 520, 4);
    const tm = mercator([119.2, 21.85, 122.5, 25.6], 240, 8);
    body.innerHTML = `
      <label class="w-slider">年份 <input type="range" min="1620" max="1665" value="1630"><output></output></label>
      <div class="w-split">
        <div class="w-map"><svg viewBox="0 0 ${m.width} ${m.height}" data-k="map"></svg></div>
        <div class="w-side">
          <div class="w-tw-inset"><svg viewBox="0 0 ${tm.width} ${tm.height}" data-k="tw"></svg></div>
          <div class="w-legend-row"><i class="w-dot" style="background:#e17f0e"></i>荷蘭 <i class="w-dot" style="background:#8e5bd6"></i>西班牙 <i class="w-dot" style="background:#0a6fc2"></i>葡萄牙 <i class="w-dot" style="background:#d63031"></i>鄭氏</div>
          <div class="w-read"></div>
        </div>
      </div>`;
    const svg = body.querySelector('[data-k="map"]'), tw = body.querySelector('[data-k="tw"]'), read = body.querySelector('.w-read'), input = body.querySelector('input');
    const arO = U.arrowMarker(svg, 'w-ah-or');
    el('rect', { width: m.width, height: m.height, class: 'w-sea' }, svg);
    el('path', { d: m.path(EASTASIA), class: 'w-land' }, svg);
    el('path', { d: m.path(topojson.feature(TW_TOPO, TW_TOPO.objects.nation)), class: 'w-taiwan-soft' }, svg);
    const routes = el('g', {}, svg);
    const BASES = [
      ['巴達維亞', 106.8, -6.2, '#e17f0e', 1619, 9999, '荷蘭東印度公司的亞洲總部'],
      ['馬尼拉', 120.98, 14.6, '#8e5bd6', 1571, 9999, '西班牙在亞洲的據點'],
      ['澳門', 113.55, 22.2, '#0a6fc2', 1557, 9999, '葡萄牙的據點'],
      ['長崎', 129.87, 32.75, '#888', 0, 9999, '日本對外貿易港'],
      ['廈門', 118.1, 24.48, '#d63031', 1650, 1680, '鄭氏的根據地之一']
    ];
    const baseG = el('g', {}, svg);
    el('path', { d: tm.path(topojson.feature(TW_TOPO, TW_TOPO.objects.nation)), class: 'w-county' }, tw);
    const TWB = [
      ['大員', 120.16, 23.0, (y) => (y >= 1662 ? '#d63031' : y >= 1624 ? '#e17f0e' : null), (y) => (y >= 1662 ? '鄭氏' : '荷蘭')],
      ['雞籠', 121.76, 25.16, (y) => (y >= 1642 ? '#e17f0e' : y >= 1626 ? '#8e5bd6' : null), (y) => (y >= 1642 ? '荷蘭' : '西班牙')],
      ['淡水', 121.43, 25.17, (y) => (y >= 1642 ? '#e17f0e' : y >= 1628 ? '#8e5bd6' : null), (y) => (y >= 1642 ? '荷蘭' : '西班牙')],
      ['澎湖', 119.58, 23.57, (y) => (y >= 1622 && y < 1624 ? '#e17f0e' : null), () => '荷蘭（1622～1624）']
    ];
    const twG = el('g', {}, tw);
    const EV = [[1622, '荷蘭人佔領澎湖'], [1624, '荷蘭人被明朝逐出澎湖，轉往大員'], [1626, '西班牙人佔領雞籠'], [1628, '西班牙人在淡水築城'], [1642, '荷蘭人驅逐西班牙人'], [1652, '郭懷一事件'], [1661, '鄭成功從鹿耳門登陸'], [1662, '荷蘭人投降，鄭氏政權建立']];
    function line(a, b, cls) { const p = m.proj(...a), q = m.proj(...b); const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 - 20; el('path', { d: `M${p[0]},${p[1]} Q${mx},${my} ${q[0]},${q[1]}`, class: cls, 'marker-end': arO }, routes); }
    function render() {
      const y = +input.value;
      body.querySelector('output').textContent = y + ' 年';
      baseG.innerHTML = ''; routes.innerHTML = ''; twG.innerHTML = '';
      BASES.forEach(([n, lon, lat, col, a, b, d]) => {
        if (y < a || y > b) return;
        const [px, py] = m.proj(lon, lat);
        el('circle', { cx: px, cy: py, r: 5, fill: col, class: 'w-base' }, baseG);
        el('text', { x: px + 7, y: py + 4, class: 'w-pin-label', text: n }, baseG);
      });
      const tp = [120.16, 23.0];
      if (y >= 1624 && y < 1662) { line([106.8, -6.2], tp, 'w-route-or'); line(tp, [129.87, 32.75], 'w-route-or'); line([118.1, 24.48], tp, 'w-route-or'); }
      if (y >= 1626 && y < 1642) line([120.98, 14.6], [121.76, 25.16], 'w-route-pu');
      TWB.forEach(([n, lon, lat, colF, whoF]) => {
        const col = colF(y); if (!col) return;
        const [px, py] = tm.proj(lon, lat);
        el('circle', { cx: px, cy: py, r: 6, fill: col, class: 'w-base' }, twG);
        const left = n === '淡水' || n === '澎湖';
        el('text', { x: px + (left ? -8 : 8), y: py + (n === '淡水' ? -6 : n === '雞籠' ? 12 : 4), 'text-anchor': left ? 'end' : 'start', class: 'w-pin-label', text: `${n}（${whoF(y)}）` }, twG);
      });
      const past = EV.filter((e) => e[0] <= y);
      const last = past[past.length - 1];
      read.innerHTML = `<b class="h">${y} 年</b>${last ? `最近的大事：<b>${last[0]} ${last[1]}</b>` : '歐洲人已來到東亞，臺灣尚未被佔領。'}<br><span class="w-hint">橘色虛線：荷蘭的貿易航線；紫色虛線：西班牙的航線。</span>`;
    }
    input.addEventListener('input', render);
    render();
  };

  W['trade-flow'] = function (host) {
    const body = frame(host, '🔄 荷蘭的轉口貿易', '點選箭頭，看商品從哪裡運到哪裡');
    const N = { cn: ['中國', 130, 90], tw: ['臺灣（大員）', 330, 200], jp: ['日本', 560, 70], ba: ['巴達維亞→歐洲', 560, 320] };
    const F = [
      ['cn', 'tw', '生絲、瓷器', '中國商人把生絲、瓷器運到大員，賣給荷蘭人。'],
      ['tw', 'jp', '生絲、鹿皮、蔗糖', '荷蘭把中國生絲與臺灣的<b>鹿皮</b>、<b>蔗糖</b>運到日本販賣。'],
      ['jp', 'tw', '白銀', '日本用<b>白銀</b>支付，荷蘭再拿白銀到中國購買商品。'],
      ['tw', 'ba', '瓷器、生絲、蔗糖', '部分商品經巴達維亞運回<b>歐洲</b>，賺取高額利潤。'],
      ['ba', 'tw', '香料、銀', '荷蘭從東南亞與歐洲帶來香料與銀。']
    ];
    body.innerHTML = `<div class="w-split"><div class="w-map"><svg viewBox="0 0 680 380"></svg></div><div class="w-side"><div class="w-read w-read-lg"></div></div></div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    const ar = U.arrowMarker(svg, 'w-ah-or');
    el('rect', { width: 680, height: 380, class: 'w-sea' }, svg);
    const fl = F.map(([a, b, goods, d], i) => {
      const [, x1, y1] = N[a], [, x2, y2] = N[b];
      const off = (a < b ? 1 : -1) * 18, mx = (x1 + x2) / 2 + off, my = (y1 + y2) / 2 - off;
      const g = el('g', { class: 'w-flow', tabindex: 0 }, svg);
      el('path', { d: `M${x1},${y1} Q${mx},${my} ${x2},${y2}`, class: 'w-flow-line', 'marker-end': ar }, g);
      el('text', { x: mx, y: my - 6, 'text-anchor': 'middle', class: 'w-flow-label', text: goods }, g);
      g.addEventListener('click', () => { fl.forEach((o) => o.classList.toggle('on', o === g)); read.innerHTML = `<b class="h">${N[a][0]} → ${N[b][0]}：${goods}</b>${d}`; });
      void i;
      return g;
    });
    Object.values(N).forEach(([n, x, y]) => {
      el('circle', { cx: x, cy: y, r: n.includes('臺灣') ? 34 : 28, class: n.includes('臺灣') ? 'w-node tw' : 'w-node' }, svg);
      el('text', { x, y: y + 5, 'text-anchor': 'middle', class: 'w-label', text: n }, svg);
    });
    read.innerHTML = '<b class="h">轉口貿易</b>荷蘭以<b>臺灣</b>為中繼站：把中國商品轉賣到日本、歐洲，賺取差價。<br><span class="w-hint">點選箭頭看每條航線運送的商品。</span>';
  };

  W['dutch-spain-sort'] = (host) => makeSorter(host, {
    title: '🇳🇱 荷蘭還是西班牙？', desc: '判斷每一項屬於哪一個國家在臺灣的作為',
    cats: ['荷蘭', '西班牙'],
    items: [
      ['以大員為統治中心', '荷蘭', '今臺南安平。'], ['興建熱蘭遮城', '荷蘭', '今安平古堡。'], ['興建普羅民遮城', '荷蘭', '今赤崁樓。'],
      ['傳播基督新教，留下新港文書', '荷蘭', '以羅馬拼音書寫西拉雅語。'], ['實施贌社與王田', '荷蘭', '荷蘭的經濟與統治制度。'],
      ['佔領雞籠（今和平島）', '西班牙', '1626 年。'], ['興建聖薩爾瓦多城', '西班牙', '位於雞籠。'], ['在淡水興建聖多明哥城', '西班牙', '紅毛城的前身。'],
      ['傳播天主教', '西班牙', '西班牙是天主教國家。'], ['以菲律賓馬尼拉為亞洲據點', '西班牙', '西班牙在亞洲的根據地。']
    ]
  });

  // =====================================================================
  // 第 4 章
  // =====================================================================
  W['camp-map'] = (host) => pointMap(host, {
    title: '⛺ 地名裡的鄭氏時期', desc: '鄭氏屯田留下許多與軍隊有關的地名（臺灣西南部）',
    bbox: [120.0, 22.5, 120.7, 23.42], width: 440,
    cats: { camp: ['屯田地名', '#d63031'], gov: ['政治文教', '#0a6fc2'], ev: ['重要事件', '#e17f0e'] },
    items: [
      { n: '新營', c: 'camp', lon: 120.316, lat: 23.31, d: '臺南新營，與鄭氏軍隊屯田的營盤有關的地名。' },
      { n: '柳營', c: 'camp', lon: 120.311, lat: 23.278, d: '臺南柳營，屯田地名。' },
      { n: '林鳳營', c: 'camp', lon: 120.33, lat: 23.24, d: '臺南六甲的林鳳營，屯田地名。' },
      { n: '下營', c: 'camp', lon: 120.264, lat: 23.236, d: '臺南下營，屯田地名。', left: true },
      { n: '左營', c: 'camp', lon: 120.294, lat: 22.685, d: '高雄左營，屯田地名。', left: true },
      { n: '後勁', c: 'camp', lon: 120.315, lat: 22.72, d: '高雄楠梓的後勁，與軍隊編制有關的地名。' },
      { n: '前鎮', c: 'camp', lon: 120.315, lat: 22.593, d: '高雄前鎮，與軍隊編制有關的地名。' },
      { n: '承天府', c: 'gov', lon: 120.2, lat: 22.997, d: '鄭氏在臺灣設立的最高行政機構，位於今臺南。', left: true },
      { n: '臺南孔廟', c: 'gov', lon: 120.204, lat: 22.99, d: '陳永華建議興建，有「全臺首學」之稱。' },
      { n: '鹿耳門', c: 'ev', lon: 120.12, lat: 23.05, d: '1661 年鄭成功軍隊從這裡登陸。', left: true }
    ],
    intro: '<b class="h">地名會說話</b>「營」「鎮」「勁」等地名，多和鄭氏軍隊<b>屯田</b>（寓兵於農）有關。點選紅點看看！'
  });
  W['regime-sort'] = (host) => makeSorter(host, {
    title: '⚖️ 荷蘭、鄭氏還是清？', desc: '判斷每一項政策屬於哪一個政權',
    cats: ['荷蘭', '鄭氏', '清'],
    items: [
      ['王田：土地屬於東印度公司', '荷蘭', '荷蘭時期的土地制度。'], ['贌社制度', '荷蘭', '商人競標與原住民交易的權利。'],
      ['新港文書', '荷蘭', '荷蘭傳教士帶來的羅馬拼音。'], ['設承天府、天興縣、萬年縣', '鄭氏', '鄭氏的行政區劃。'],
      ['屯田制度，寓兵於農', '鄭氏', '解決軍糧問題。'], ['陳永華建孔廟、推廣教育', '鄭氏', '鄭經時期的文教建設。'],
      ['設臺灣府，一府三縣', '清', '1684 年。'], ['渡臺禁令', '清', '限制人民來臺。'], ['劃定番界，限制漢人入山', '清', '清代前期的政策。']
    ]
  });

  // =====================================================================
  // 第 5 章
  // =====================================================================
  W['admin-steps'] = function (host) {
    if (!ready() || !window.TW_TOPO) return;
    const body = frame(host, '🗂️ 清代行政區的變化', '點選年份，看治理範圍如何擴大');
    const m = mercator([119.3, 21.85, 122.1, 25.35], 380, 10);
    const S = [
      { y: 1684, t: '一府三縣', d: '設<b>臺灣府</b>（隸屬福建省），下轄臺灣縣、鳳山縣、諸羅縣。治理範圍主要在西南部。',
        pins: [['臺灣府・臺灣縣', 120.2, 23.0, 'f'], ['鳳山縣', 120.3, 22.67, 'x'], ['諸羅縣', 120.45, 23.48, 'x']] },
      { y: 1727, t: '一府四縣二廳', d: '朱一貴事件後，1723 年增設<b>彰化縣</b>與<b>淡水廳</b>；1727 年再設<b>澎湖廳</b>。',
        pins: [['臺灣府・臺灣縣', 120.2, 23.0, 'f'], ['鳳山縣', 120.3, 22.67, 'x'], ['諸羅縣', 120.45, 23.48, 'x'], ['彰化縣', 120.54, 24.08, 'n'], ['淡水廳', 120.97, 24.8, 'n'], ['澎湖廳', 119.58, 23.57, 'n']] },
      { y: 1812, t: '一府四縣三廳', d: '因漢原衝突加上海盜入侵，增設<b>噶瑪蘭廳</b>；林爽文事件後諸羅已改名<b>嘉義</b>。',
        pins: [['臺灣府', 120.2, 23.0, 'f'], ['鳳山縣', 120.3, 22.67, 'x'], ['嘉義縣', 120.45, 23.48, 'x'], ['彰化縣', 120.54, 24.08, 'x'], ['淡水廳', 120.97, 24.8, 'x'], ['噶瑪蘭廳', 121.75, 24.75, 'n'], ['澎湖廳', 119.58, 23.57, 'x']] },
      { y: 1875, t: '二府八縣四廳', d: '牡丹社事件後，<b>沈葆楨</b>奏請增設<b>臺北府</b>，並增設恆春縣、卑南廳等。治理範圍擴及東部。',
        pins: [['臺北府', 121.51, 25.04, 'f'], ['臺灣府', 120.2, 23.0, 'f'], ['恆春縣', 120.75, 22.0, 'n'], ['卑南廳', 121.15, 22.76, 'n'], ['埔里社廳', 120.97, 23.97, 'n'], ['宜蘭縣', 121.75, 24.75, 'x'], ['新竹縣', 120.97, 24.8, 'x'], ['澎湖廳', 119.58, 23.57, 'x']] },
      { y: 1887, t: '三府十一縣三廳一直隸州', d: '1885 年<b>臺灣建省</b>，劉銘傳為首任巡撫；之後調整為臺北府、臺灣府（中部）、臺南府與<b>臺東直隸州</b>。',
        pins: [['臺北府', 121.51, 25.04, 'f'], ['臺灣府（臺中）', 120.68, 24.14, 'f'], ['臺南府', 120.2, 23.0, 'f'], ['臺東直隸州', 121.15, 22.76, 'f']] }
    ];
    body.innerHTML = `
      <div class="w-tabs">${S.map((s, i) => `<button class="chip" data-s="${i}">${s.y}</button>`).join('')}</div>
      <div class="w-split">
        <div class="w-map w-map-xs"><svg viewBox="0 0 ${m.width} ${m.height}"></svg></div>
        <div class="w-side"><div class="w-read w-read-lg"></div><div class="w-legend-row"><i class="w-dot" style="background:#a2482b"></i>府　<i class="w-dot" style="background:#5b8def"></i>縣・廳　<i class="w-dot" style="background:#2f9e6e"></i>本次新增</div></div>
      </div>`;
    const svg = body.querySelector('svg'), read = body.querySelector('.w-read');
    el('rect', { width: m.width, height: m.height, class: 'w-sea' }, svg);
    U.counties().forEach((f) => el('path', { d: m.path(f), class: 'w-county' }, svg));
    const pins = el('g', {}, svg);
    function show(i) {
      const s = S[i];
      body.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('active', +b.dataset.s === i));
      pins.innerHTML = '';
      s.pins.forEach(([n, lon, lat, k]) => {
        const [x, y] = m.proj(lon, lat);
        el('circle', { cx: x, cy: y, r: k === 'f' ? 7 : 5.5, fill: k === 'f' ? '#a2482b' : k === 'n' ? '#2f9e6e' : '#5b8def', class: 'w-base' }, pins);
        const left = lon < 120.6;
        el('text', { x: x + (left ? -9 : 9), y: y + 4, 'text-anchor': left ? 'end' : 'start', class: 'w-pin-label', text: n }, pins);
      });
      read.innerHTML = `<b class="h">${s.y} 年：${s.t}</b>${s.d}`;
    }
    body.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => show(+b.dataset.s)));
    show(0);
  };

  const QING_EVENTS = [
    { y: 1683, n: '施琅攻臺', d: '鄭克塽投降，鄭氏政權結束。' },
    { y: 1684, n: '設臺灣府', d: '一府三縣，隸屬福建省。' },
    { y: 1721, n: '朱一貴事件', d: '清代三大民變之一。' },
    { y: 1723, n: '增設彰化縣', d: '並增設淡水廳。' },
    { y: 1786, n: '林爽文事件', d: '三大民變之一；事後諸羅改名嘉義。' },
    { y: 1812, n: '設噶瑪蘭廳', d: '漢人開墾宜蘭平原。' },
    { y: 1862, n: '戴潮春事件', d: '三大民變之一。' }
  ];
  W['qing-timeline'] = (host) => makeTimeline(host, {
    title: '📅 清帝國前中期大事', desc: '點選事件；或用排序挑戰練習先後順序',
    start: 1680, end: 1870, tick: 20, events: QING_EVENTS,
    periods: [{ from: 1683, to: 1870, n: '清帝國時期（前、中期）', col: '#5b8def', d: '消極治臺、移民開墾、民變與械鬥頻繁。' }]
  });
  W['ports-map'] = (host) => pointMap(host, {
    title: '⚓ 港口與四大水圳', desc: '清代的重要港市與水利設施',
    bbox: [119.9, 21.85, 122.1, 25.35], width: 420,
    cats: { port: ['港市', '#a2482b'], canal: ['水圳', '#0a6fc2'] },
    items: [
      { n: '一府：臺灣府城', c: 'port', lon: 120.2, lat: 23.0, d: '今臺南，清代臺灣的政治、經濟中心。', left: true },
      { n: '二鹿：鹿港', c: 'port', lon: 120.43, lat: 24.06, d: '今彰化鹿港，中部的貿易大港，與泉州對渡。', left: true },
      { n: '三艋舺', c: 'port', lon: 121.5, lat: 25.04, d: '今臺北萬華，北部的貿易中心，位於淡水河畔。' },
      { n: '八堡圳', c: 'canal', lon: 120.6, lat: 23.9, d: '<b>施世榜</b>興建，引濁水溪水灌溉<b>彰化平原</b>。' },
      { n: '貓霧捒圳', c: 'canal', lon: 120.68, lat: 24.18, d: '<b>臺中</b>地區的重要水圳。' },
      { n: '曹公圳', c: 'canal', lon: 120.36, lat: 22.64, d: '<b>高雄</b>地區的重要水圳。' },
      { n: '鹿耳門（正港）', c: 'port', lon: 120.11, lat: 23.06, d: '清領初期<b>唯一合法</b>的對渡港口（正港），與福建廈門對渡。', left: true },
      { n: '瑠公圳', c: 'canal', lon: 121.56, lat: 24.98, d: '<b>郭錫瑠</b>興建，引新店溪水灌溉<b>臺北</b>地區。' }
    ],
    intro: '<b class="h">一府二鹿三艋舺</b>依照繁榮程度排序的三大港市，反映開發由南往北的過程。'
  });
  W['deity-sort'] = (host) => makeSorter(host, {
    title: '🛕 移民帶來的守護神', desc: '判斷各神明主要是哪一個祖籍移民的信仰',
    cats: ['漳州人', '泉州人', '客家人'],
    hint: '媽祖是航海守護神，各族群普遍信仰。',
    items: [
      ['開漳聖王', '漳州人', '開發漳州的陳元光，漳州人的守護神。'], ['保生大帝', '泉州人', '泉州同安人的信仰。'],
      ['清水祖師', '泉州人', '泉州安溪人的信仰。'], ['廣澤尊王', '泉州人', '泉州南安人的信仰。'],
      ['三山國王', '客家人', '粵東客家人的守護神。'], ['義民爺', '客家人', '紀念協助守衛家園而犧牲的義民，客家人的信仰。']
    ]
  });

  // =====================================================================
  // 第 6 章
  // =====================================================================
  W['treaty-map'] = (host) => pointMap(host, {
    title: '🚢 開港通商與物產', desc: '依類別篩選：通商口岸、茶、樟腦、糖、傳教',
    bbox: [119.9, 21.85, 122.1, 25.35], width: 420,
    cats: { port: ['通商口岸', '#a2482b'], tea: ['茶', '#2f7d5b'], camphor: ['樟腦', '#8a6a45'], sugar: ['糖', '#e1a33b'], mission: ['傳教', '#8e5bd6'], town: ['新興城鎮', '#0a6fc2'] },
    items: [
      { n: '淡水', c: 'port', lon: 121.44, lat: 25.17, d: '最早開放的口岸之一，北部茶、樟腦由此出口。', left: true },
      { n: '雞籠', c: 'port', lon: 121.74, lat: 25.13, d: '後來增開的口岸（今基隆）。' },
      { n: '安平', c: 'port', lon: 120.16, lat: 23.0, d: '最早開放的口岸之一，南部糖由此出口。', left: true },
      { n: '打狗', c: 'port', lon: 120.27, lat: 22.61, d: '後來增開的口岸（今高雄）。', left: true },
      { n: '大稻埕', c: 'tea', lon: 121.51, lat: 25.06, d: '茶行、洋行集中，開港後快速繁榮。' },
      { n: '北部丘陵茶區', c: 'tea', lon: 121.3, lat: 24.85, d: '北部丘陵廣植茶樹，烏龍茶外銷歐美。', left: true },
      { n: '中北部山區', c: 'camphor', lon: 121.0, lat: 24.4, d: '樟樹多分布在山區，<b>樟腦</b>可製造賽璐珞與無煙火藥。' },
      { n: '南部平原', c: 'sugar', lon: 120.35, lat: 23.2, d: '甘蔗主要產於南部，糖從安平、打狗出口。', left: true },
      { n: '大溪', c: 'town', lon: 121.29, lat: 24.88, d: '開港後因<b>茶葉、樟腦</b>的盛產而興起的中北部城鎮。', left: true },
      { n: '深坑', c: 'town', lon: 121.62, lat: 25, d: '開港後因<b>茶葉、樟腦</b>的盛產而興起的中北部城鎮。' },
      { n: '關西', c: 'town', lon: 121.18, lat: 24.79, d: '開港後因<b>茶葉、樟腦</b>的盛產而興起的中北部城鎮。', left: true },
      { n: '大湖', c: 'town', lon: 120.86, lat: 24.42, d: '開港後因<b>茶葉、樟腦</b>的盛產而興起的中北部城鎮。' },
      { n: '東勢', c: 'town', lon: 120.83, lat: 24.26, d: '開港後因<b>茶葉、樟腦</b>的盛產而興起的中北部城鎮。' },
      { n: '集集', c: 'town', lon: 120.78, lat: 23.83, d: '開港後因<b>茶葉、樟腦</b>的盛產而興起的中北部城鎮。', left: true },
      { n: '馬偕（淡水）', c: 'mission', lon: 121.45, lat: 25.2, d: '加拿大長老教會牧師，在淡水傳教、行醫（偕醫館）、辦學（牛津學堂）。' },
      { n: '馬雅各（臺南）', c: 'mission', lon: 120.22, lat: 23.04, d: '英國長老教會醫師，在南部以醫療傳教。' }
    ],
    intro: '<b class="h">北茶、南糖、山區樟腦</b>開港後茶與樟腦出口大增，使經濟重心<b>北移</b>。'
  });
  W['reform-sort'] = (host) => makeSorter(host, {
    title: '🏗️ 沈葆楨還是劉銘傳？', desc: '判斷每項建設是誰推動的',
    cats: ['沈葆楨', '劉銘傳'],
    items: [
      ['開山撫番，開闢通往東部的道路', '沈葆楨', '牡丹社事件後推動。'], ['解除渡臺禁令', '沈葆楨', '1875 年解除。'],
      ['奏請增設臺北府', '沈葆楨', '1875 年增設。'], ['在安平興建億載金城', '沈葆楨', '加強海防的砲臺。'],
      ['臺灣建省後擔任首任巡撫', '劉銘傳', '1885 年建省。'], ['興建基隆到臺北的鐵路', '劉銘傳', '後來延伸到新竹。'],
      ['架設電報、鋪設海底電纜', '劉銘傳', '改善通訊。'], ['創辦新式郵政', '劉銘傳', '發行郵票。'],
      ['清賦：清查土地、增加稅收', '劉銘傳', '整頓財政。'], ['設立西學堂', '劉銘傳', '培養新式人才。']
    ]
  });
  W['lateqing-timeline'] = (host) => makeTimeline(host, {
    title: '📅 清末大事', desc: '從開港到割讓臺灣；試試排序挑戰',
    start: 1855, end: 1898, tick: 5,
    periods: [{ from: 1858, to: 1874, n: '開港通商', col: '#e1a33b', d: '條約開港，茶、糖、樟腦出口大增。' }, { from: 1874, to: 1895, n: '積極治臺', col: '#5b8def', d: '牡丹社事件後，沈葆楨、劉銘傳推動建設。' }],
    events: [
      { y: 1858, n: '天津條約', d: '英法聯軍之役後簽訂，臺灣將開港。' },
      { y: 1860, n: '北京條約', d: '臺灣正式開港通商。' },
      { y: 1872, n: '馬偕來臺', d: '在淡水傳教、行醫、辦學。' },
      { y: 1874, n: '牡丹社事件', d: '日本出兵臺灣，清廷改採積極治臺，派沈葆楨來臺。' },
      { y: 1875, n: '增設臺北府', d: '沈葆楨奏請設立。' },
      { y: 1884, n: '清法戰爭', d: '法軍進攻基隆、淡水、澎湖。' },
      { y: 1885, n: '臺灣建省', d: '劉銘傳為首任巡撫。' },
      { y: 1891, n: '鐵路通車', d: '基隆至臺北段完成。' },
      { y: 1895, n: '馬關條約', d: '甲午戰敗，割讓臺灣、澎湖給日本。' }
    ]
  });

  // =====================================================================
  // 依講義章節新增的互動圖
  // =====================================================================
  W['plain-mountain-sort'] = (host) => makeSorter(host, {
    title: '🏞️ 平埔族群還是高山各族？', desc: '判斷每一項描述屬於哪一類',
    cats: ['平埔族群', '高山各族'],
    items: [
      ['分布在臺灣西部及東北部的平原、丘陵', '平埔族群', '平埔族群的分布。'], ['與漢人接觸早，已融入漢人社會', '平埔族群', '平埔族群的文化特色。'],
      ['凱達格蘭族、西拉雅族', '平埔族群', '北部凱達格蘭、南部西拉雅。'], ['清帝國時期稱為「熟番」', '平埔族群', '清代稱呼。'],
      ['日治時期稱為「平埔族」', '平埔族群', '日治稱呼。'], ['分布在臺灣山區與東部地區', '高山各族', '高山各族的分布。'],
      ['與漢人接觸較晚，保有原有文化', '高山各族', '高山各族的文化特色。'], ['清帝國時期稱為「生番」', '高山各族', '清代稱呼。'],
      ['日治時期稱為「高砂族」', '高山各族', '日治稱呼。'], ['中華民國時期一度稱為「山地同胞」', '高山各族', '高山族後改稱山地同胞。']
    ]
  });

  W['voyage-timeline'] = (host) => makeTimeline(host, {
    title: '📅 大航海時代到鄭氏時期大事', desc: '點選事件看說明；試試排序挑戰',
    start: 1600, end: 1690, tick: 10,
    periods: [
      { from: 1624, to: 1662, n: '荷蘭（南部）', col: '#e1a33b', d: '荷蘭佔領臺灣南部，以大員為中心。' },
      { from: 1662, to: 1683, n: '鄭氏', col: '#d9534f', d: '鄭氏政權，臺灣第一個漢人政權。' }
    ],
    events: [
      { y: 1624, n: '荷蘭據大員', d: '荷蘭人在大員建熱蘭遮城。' },
      { y: 1626, n: '西班牙據雞籠', d: '西班牙人佔領北部雞籠。' },
      { y: 1635, n: '麻豆社之役', d: '荷蘭聯合新港社出兵麻豆社，奠定南臺灣的統治。' },
      { y: 1642, n: '荷蘭擊退西班牙', d: '荷蘭獨佔臺灣。' },
      { y: 1652, n: '郭懷一事件', d: '漢人反抗荷蘭的剝削。' },
      { y: 1661, n: '鄭成功攻臺', d: '從鹿耳門登陸，作為反清復明的基地。' },
      { y: 1662, n: '荷蘭投降', d: '鄭氏政權建立。' },
      { y: 1683, n: '鄭克塽降清', d: '清廷派施琅攻臺。' }
    ]
  });

  W['power-sort'] = (host) => makeSorter(host, {
    title: '🧭 是哪一方的勢力？', desc: '判斷每一項屬於葡萄牙、西班牙、荷蘭還是鄭氏',
    cats: ['葡萄牙', '西班牙', '荷蘭', '鄭氏'],
    items: [
      ['以澳門為貿易據點', '葡萄牙', '葡萄牙據澳門。'], ['傳說稱臺灣為「Formosa」', '葡萄牙', '傳說是葡萄牙水手的稱讚。'],
      ['以馬尼拉為據點，佔領雞籠、淡水、蛤仔難', '西班牙', '西班牙在臺灣北部的據點。'], ['日本限制貿易對象後，對日貿易受挫', '西班牙', '講義：西班牙的貿易。'],
      ['成立聯合東印度公司，佔領大員', '荷蘭', '荷蘭佔領臺灣南部。'], ['佔領澎湖，被沈有容逼退', '荷蘭', '荷蘭佔領臺灣前的事件。'],
      ['與日本貿易衝突，日本頒布鎖國政策', '荷蘭', '荷日貿易衝突。'], ['以軍屯最為重要的拓墾事業', '鄭氏', '寓兵於農。'],
      ['與英國東印度公司、日本進行轉口貿易', '鄭氏', '取得反清的軍用物資。']
    ]
  });

  W['contact-map'] = (host) => pointMap(host, {
    title: '🗺️ 與外來政權接觸的原住民', desc: '依外來政權篩選；點選看說明',
    bbox: [119.9, 21.85, 122.1, 25.35], width: 420,
    cats: { dutch: ['荷蘭', '#e17f0e'], spain: ['西班牙', '#8e5bd6'], zheng: ['鄭氏', '#d63031'] },
    items: [
      { n: '大員（熱蘭遮城）', c: 'dutch', lon: 120.16, lat: 23.0, d: '荷蘭的統治中心。', left: true },
      { n: '麻豆社', c: 'dutch', lon: 120.25, lat: 23.18, d: '今臺南麻豆區，臺南<b>西拉雅族規模最大</b>的部落。<b>1635 年</b>荷蘭聯合新港社出兵麻豆社，奠定荷蘭在南臺灣的統治。', left: true },
      { n: '新港社', c: 'dutch', lon: 120.3, lat: 23.07, d: '今臺南新市區，<b>荷蘭人的盟友</b>，曾協助荷蘭人進攻其他部落，郭懷一事件時協助對付漢人。' },
      { n: '雞籠（馬賽人）', c: 'spain', lon: 121.74, lat: 25.13, d: '西班牙的據點。<b>馬賽人</b>是凱達格蘭族支系，擅長操舟航行、學習不同語言，以從事貿易。' },
      { n: '淡水', c: 'spain', lon: 121.44, lat: 25.17, d: '西班牙建聖多明哥城，傳播天主教。', left: true },
      { n: '蛤仔難（宜蘭）', c: 'spain', lon: 121.75, lat: 24.75, d: '西班牙勢力曾到達的地方。' },
      { n: '大肚王', c: 'zheng', lon: 120.62, lat: 24.12, d: '位於今臺中市、彰化縣、南投縣的一部分。荷蘭與鄭氏在臺期間都曾領導部落反抗，<b>鄭氏時期遭強力鎮壓，勢力衰微</b>。', left: true },
      { n: '承天府', c: 'zheng', lon: 120.22, lat: 22.94, d: '鄭氏的統治中心；漢人積極拓墾，壓縮原住民生活空間。', left: true }
    ],
    intro: '<b class="h">提示</b>荷蘭與歸順的社<b>結盟</b>、西班牙以<b>武力安撫</b>、鄭氏時期漢人<b>拓墾</b>擴大。點選圓點看說明。'
  });

  W['contact-sort'] = (host) => makeSorter(host, {
    title: '🤝 誰與原住民這樣相處？', desc: '判斷每一項屬於荷蘭、西班牙還是鄭氏時期',
    cats: ['荷蘭', '西班牙', '鄭氏'],
    items: [
      ['與歸順的社結盟，聯合新港社出兵麻豆社', '荷蘭', '1635 年麻豆社之役。'], ['以地方會議間接統治原住民', '荷蘭', '荷蘭的治理方式。'],
      ['教西拉雅族用羅馬字母拼寫語言（新港文書）', '荷蘭', '荷蘭傳教士的成果。'], ['鹿皮成為重要貿易商品', '荷蘭', '鹿皮大量輸往日本。'],
      ['以武力降服、安撫，但未能確立統治', '西班牙', '西班牙的治理方式。'], ['傳播天主教，部分原住民能說西班牙語', '西班牙', '西班牙的傳教活動。'],
      ['漢人積極拓墾，壓縮原住民生活空間', '鄭氏', '族群衝突的原因。'], ['大肚王遭強力鎮壓而勢力衰微', '鄭氏', '鄭氏時期的實例。'],
      ['原住民逐漸以耕種為務，接觸儒家文化', '鄭氏', '原住民生活型態的變遷。']
    ]
  });

  // ---------- 因果鏈填空 ----------
  W['cause-chain'] = function (host) {
    const body = frame(host, '🔗 因果鏈填空', '選一條因果鏈，從下方選項依序填入空格');
    const CH = [
      { n: '渡臺禁令', nodes: ['渡臺禁令（不准攜眷）', '?來臺多為單身男子', '?男女比例失衡', '羅漢腳多，民變頻繁'], extra: ['人口快速減少', '原住民遷往山區'] },
      { n: '牡丹社事件', nodes: ['琉球漂民在臺遇害', '?日本出兵牡丹社（1874）', '?清廷治臺政策轉變', '沈葆楨來臺、增設臺北府'], extra: ['臺灣建省', '開港通商'] },
      { n: '清法戰爭', nodes: ['法國進攻清藩屬越南', '?清法戰爭（1884）', '?臺灣建省（1885）', '劉銘傳任首任巡撫，推動現代化建設'], extra: ['馬關條約', '日本吞併琉球'] },
      { n: '開港通商', nodes: ['英法聯軍之役', '?天津條約、北京條約', '?臺灣開港，茶與樟腦大量出口', '經濟、政治重心北移'], extra: ['渡臺禁令', '鹿耳門成為正港'] },
      { n: '明朝海禁', nodes: ['明朝實施海禁', '?海商以走私貿易經營', '?海商帶領漢人移入臺灣', '臺灣成為東亞貿易的一環'], extra: ['荷蘭成立東印度公司', '日本頒布鎖國'] }
    ];
    body.innerHTML = '<div class="w-tabs">' + CH.map((c, i) => '<button class="chip" data-c="' + i + '">' + c.n + '</button>').join('') + '</div><div class="w-chain"></div><div class="w-chips w-chain-opts"></div><div class="w-read"></div>';
    const box = body.querySelector('.w-chain'), opts = body.querySelector('.w-chain-opts'), read = body.querySelector('.w-read');
    function show(i) {
      const c = CH[i];
      body.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('active', +b.dataset.c === i));
      const blanks = c.nodes.map((t, k) => (t[0] === '?' ? k : -1)).filter((k) => k >= 0);
      let step = 0;
      box.innerHTML = c.nodes.map((t, k) => '<div class="w-chain-node' + (t[0] === '?' ? ' blank' : '') + '" data-k="' + k + '">' + (t[0] === '?' ? '？' : t) + '</div>').join('<div class="w-chain-arrow">⬇</div>');
      const choices = shuffle(blanks.map((k) => c.nodes[k].slice(1)).concat(c.extra));
      opts.innerHTML = choices.map((t) => '<button class="chip" data-t="' + t + '">' + t + '</button>').join('');
      read.innerHTML = '<b class="h">提示</b>依序填入空格：先填第一個「？」。';
      opts.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
        if (step >= blanks.length || b.disabled) return;
        const k = blanks[step], ans = c.nodes[k].slice(1);
        if (b.dataset.t === ans) {
          const n = box.querySelector('[data-k="' + k + '"]');
          n.textContent = ans; n.classList.remove('blank'); n.classList.add('ok');
          b.disabled = true; b.classList.add('ok'); step++;
          read.innerHTML = step === blanks.length ? '<b class="h">✔ 因果鏈完成！</b>' + c.nodes.map((t) => t.replace('?', '')).join(' → ') : '<b class="h">✔ 正確</b>繼續填下一個空格。';
        } else {
          b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 500);
          read.innerHTML = '<b class="h">✘ 不是這個</b>想想看前一格造成了什麼結果。';
        }
      }));
    }
    body.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => show(+b.dataset.c)));
    show(0);
  };

  W['policy-timeline'] = (host) => makeTimeline(host, {
    title: '📅 清帝國統治臺灣大事', desc: '從消極治臺到積極治臺；試試排序挑戰',
    start: 1680, end: 1900, tick: 20,
    periods: [
      { from: 1683, to: 1874, n: '消極治臺（為防臺而治臺）', col: '#5b8def', d: '渡臺禁令、劃界封山；行政區因應民變調整。' },
      { from: 1874, to: 1895, n: '積極治臺', col: '#e1a33b', d: '牡丹社事件後，沈葆楨、劉銘傳推動建設。' }
    ],
    events: [
      { y: 1684, n: '設臺灣府', d: '一府三縣，隸屬福建省。' },
      { y: 1721, n: '朱一貴事件', d: '事後增設彰化縣、淡水廳。' },
      { y: 1786, n: '林爽文事件', d: '事後諸羅改名嘉義。' },
      { y: 1812, n: '設噶瑪蘭廳', d: '因漢原衝突加上海盜入侵。' },
      { y: 1860, n: '開港通商', d: '北京條約後臺灣開港。' },
      { y: 1874, n: '牡丹社事件', d: '日本出兵，沈葆楨來臺。' },
      { y: 1884, n: '清法戰爭', d: '法國進攻清藩屬越南，戰火延燒臺灣。' },
      { y: 1885, n: '臺灣建省', d: '劉銘傳為首任巡撫。' },
      { y: 1895, n: '馬關條約', d: '割讓臺灣、澎湖給日本。' }
    ]
  });

  W['jiao-sort'] = (host) => makeSorter(host, {
    title: '🏪 郊是怎麼分類的？', desc: '判斷每個郊是依「貿易區域」還是「貿易商品」劃分',
    cats: ['依貿易區域', '依貿易商品'],
    items: [
      ['泉郊', '依貿易區域', '與泉州貿易的商人。'], ['廈郊', '依貿易區域', '與廈門貿易的商人。'],
      ['北郊', '依貿易區域', '與華北、上海一帶貿易的商人。'], ['糖郊', '依貿易商品', '經營糖的商人。'],
      ['布郊', '依貿易商品', '經營布匹的商人。'], ['米郊', '依貿易商品', '經營稻米的商人。']
    ]
  });

  W['trade-sort'] = (host) => makeSorter(host, {
    title: '🚢 開港後的貿易商品', desc: '判斷每一項描述屬於哪一類',
    cats: ['進口', '茶', '糖', '樟腦'],
    items: [
      ['鴉片', '進口', '開港後主要的進口商品。'], ['紡織品', '進口', '開港後主要的進口商品。'],
      ['產地在臺灣北部丘陵', '茶', '茶產於北部。'], ['茶行集中在大稻埕，英商陶德推廣外銷', '茶', '茶的出口。'],
      ['產地在臺灣南部，從安平、打狗出口', '糖', '糖產於南部。'], ['產地在臺灣中、北部山區', '樟腦', '樟腦產於中北部山區。'],
      ['可製造賽璐珞與無煙火藥', '樟腦', '樟腦的用途。'], ['帶動大溪、東勢、集集等山區城鎮興起', '樟腦', '樟腦產於山區。']
    ]
  });
})();
