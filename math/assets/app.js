(function () {
  'use strict';

  const chapters = window.CHAPTERS.sort((a, b) => a.no - b.no);
  const chLabel = (c) => c.label || `第 ${c.no} 章`;
  const chMark = (c) => (c.mark != null ? c.mark : c.no);
  const COURSE = Object.assign({ key: 'geo7a', icon: '🌏', title: '國一地理（上冊）總整理', source: '依翰林版七年級上學期章節編排' }, window.COURSE);
  const app = document.getElementById('app');
  const LETTERS = ['A', 'B', 'C', 'D'];

  // ---------- 本機儲存（失敗時靜默略過） ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(COURSE.key + ':' + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(COURSE.key + ':' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    }
  };

  // ---------- 深淺色 ----------
  const themeBtn = document.getElementById('themeBtn');
  const savedTheme = store.get('theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  themeBtn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('theme', next);
  });

  // ---------- 地球儀視窗 ----------
  const globeBtn = document.getElementById('globeBtn');
  if (globeBtn) globeBtn.addEventListener('click', () => window.toggleGlobe && window.toggleGlobe());
  app.addEventListener('click', (e) => { if (e.target.closest('[data-open-globe]') && window.openGlobe) window.openGlobe(); });

  // ---------- 手機選單 ----------
  document.getElementById('menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.getElementById('scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));

  // ---------- 工具 ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // 打亂選項，同時更新正解位置
  function shuffleOptions(q) {
    const order = shuffle(q.o.map((_, i) => i));
    return Object.assign({}, q, { o: order.map((i) => q.o[i]), a: order.indexOf(q.a) });
  }
  const best = (id) => store.get('best:' + id, null);

  // ---------- 側欄 ----------
  function renderNav() {
    document.getElementById('chapterNav').innerHTML = chapters.map((c) => {
      const b = best(c.id);
      return `<a class="nav-item" href="#${c.id}" data-id="${c.id}">
        <span class="nav-no">${chMark(c)}</span><span>${esc(c.title)}</span>
        ${b ? `<span class="nav-score">${b.score}/${b.total}</span>` : ''}
      </a>`;
    }).join('');
  }
  function markNav(id) {
    document.querySelectorAll('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.id === id));
  }

  // ---------- 首頁 ----------
  function renderHome() {
    const totalQ = chapters.reduce((n, c) => n + c.quiz.length, 0);
    const totalCards = chapters.reduce((n, c) => n + c.cards.length, 0);
    app.innerHTML = `
      <section class="hero">
        <h1>${COURSE.icon} ${COURSE.title}</h1>
        <p>${COURSE.source}：共 ${chapters.length} 章、${totalCards} 張名詞卡、${totalQ} 題練習題。</p>
      </section>
      <div class="ch-grid">
        ${chapters.map((c) => {
          const b = best(c.id);
          const good = b && b.score / b.total >= 0.8;
          return `<a class="ch-card" href="#${c.id}">
            <div class="icon">${c.icon}</div>
            <h3>${chLabel(c)}　${esc(c.title)}</h3>
            <p>${esc(c.summary)}</p>
            <div class="meta"><span>${c.cards.length} 張卡・${c.quiz.length} 題</span>
              <span class="badge ${good ? 'good' : ''}">${b ? '最佳 ' + b.score + '/' + b.total : '尚未測驗'}</span></div>
          </a>`;
        }).join('')}
        <a class="ch-card" href="#exam">
          <div class="icon">⭐</div>
          <h3>綜合測驗</h3>
          <p>從全冊題庫隨機抽 20 題，模擬段考、檢查自己哪一章最需要加強。</p>
          <div class="meta"><span>隨機 20 題</span>
            <span class="badge">${best('exam') ? '最佳 ' + best('exam').score + '/20' : '尚未測驗'}</span></div>
        </a>
      </div>
      <section class="howto notes">
        <h2>建議讀書流程</h2>
        <ol>
          <li><b>重點整理</b>：先讀一遍，注意黃底的「考試重點」與藍底的「記憶口訣」。</li>
          <li><b>名詞卡</b>：看到名詞先自己講出意思，再點卡片翻面確認。</li>
          <li><b>練習題</b>：點選答案後立即看到解析；錯的題目回頭對照重點整理。</li>
          <li><b>綜合測驗</b>：每章都達 8 成以上後，用綜合測驗做總複習。</li>
        </ol>
        <p class="no-print" style="color:var(--muted);font-size:14px">※ 測驗最佳成績只存在這台電腦的瀏覽器中。重點整理頁可直接列印（Ctrl+P），只會印出筆記內容。</p>
      </section>`;
  }

  // ---------- 章節頁 ----------
  const TABS = [['notes', '📘 重點整理'], ['cards', '🃏 名詞卡'], ['quiz', '✍️ 練習題']];

  function renderChapter(c, tab) {
    app.innerHTML = `
      <header class="ch-head">
        <div class="ch-kicker">${c.icon} ${chLabel(c)}</div>
        <h1>${esc(c.title)}</h1>
        <p>${esc(c.summary)}</p>
      </header>
      <div class="tabs" role="tablist">
        ${TABS.map(([k, label]) => `<button class="tab ${k === tab ? 'active' : ''}" data-tab="${k}" role="tab">${label}</button>`).join('')}
      </div>
      <div id="pane"></div>
      <div class="no-print" style="display:flex;justify-content:space-between;margin-top:28px;gap:8px">
        ${prevNext(c)}
      </div>`;
    app.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { location.hash = c.id + '/' + b.dataset.tab; }));
    const pane = document.getElementById('pane');
    if (tab === 'cards') renderCards(pane, c.cards);
    else if (tab === 'quiz') renderQuiz(pane, c.quiz.map((q) => Object.assign({}, q)), c.id);
    else {
      pane.innerHTML = `<article class="notes">${c.notes}</article>`;
      pane.querySelectorAll('[data-widget]').forEach((el) => {
        const fn = window.WIDGETS && window.WIDGETS[el.dataset.widget];
        if (fn) { try { fn(el); } catch (err) { el.textContent = '互動圖載入失敗'; console.error(err); } }
      });
    }
  }

  function prevNext(c) {
    const i = chapters.indexOf(c);
    const prev = chapters[i - 1], next = chapters[i + 1];
    return `<span>${prev ? `<a class="btn" href="#${prev.id}">← ${chLabel(prev)} ${esc(prev.title)}</a>` : ''}</span>
            <span>${next ? `<a class="btn" href="#${next.id}">${chLabel(next)} ${esc(next.title)} →</a>` : `<a class="btn primary" href="#exam">前往綜合測驗 →</a>`}</span>`;
  }

  // ---------- 名詞卡 ----------
  function renderCards(pane, cards) {
    let list = cards.slice();
    function draw() {
      pane.innerHTML = `
        <div class="toolbar">
          <button class="btn" id="flipAll">全部翻面</button>
          <button class="btn" id="shuffleCards">打亂順序</button>
          <span class="hint">點卡片看解釋，先在心裡說出答案再翻！</span>
        </div>
        <div class="cards">
          ${list.map(([term, def]) => `
            <div class="card" tabindex="0" role="button" aria-label="${esc(term)}">
              <div class="card-inner">
                <div class="card-face card-front">${esc(term)}</div>
                <div class="card-face card-back">${esc(def)}</div>
              </div>
            </div>`).join('')}
        </div>`;
      pane.querySelectorAll('.card').forEach((el) => {
        el.addEventListener('click', () => el.classList.toggle('flipped'));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.classList.toggle('flipped'); } });
      });
      document.getElementById('flipAll').addEventListener('click', () => {
        const els = pane.querySelectorAll('.card');
        const anyFront = [...els].some((el) => !el.classList.contains('flipped'));
        els.forEach((el) => el.classList.toggle('flipped', anyFront));
      });
      document.getElementById('shuffleCards').addEventListener('click', () => { list = shuffle(list); draw(); });
    }
    draw();
  }

  // ---------- 測驗 ----------
  function renderQuiz(pane, questions, storeKey, showTag) {
    const qs = questions.map(shuffleOptions);
    const answers = new Array(qs.length).fill(null);

    pane.innerHTML = `
      <div class="score-bar no-print">
        <span class="stat">已作答 <b id="done">0</b> / ${qs.length}</span>
        <span class="stat">答對 <b id="right">0</b></span>
        <div class="progress"><span id="bar" style="width:0%"></span></div>
        <button class="btn" id="restart">重新作答（打亂）</button>
      </div>
      <div id="qs">
        ${qs.map((q, i) => `
          <div class="q" data-i="${i}">
            <div class="q-title"><span class="q-no">${i + 1}.</span>${esc(q.q)}${showTag && q.tag ? `<span class="q-tag">${esc(q.tag)}</span>` : ''}${q.src ? `<span class="q-tag src">${esc(q.src)}</span>` : ''}</div>
            <div class="opts">
              ${q.o.map((o, j) => `<button class="opt" data-j="${j}">(${LETTERS[j]}) ${esc(o)}</button>`).join('')}
            </div>
            <div class="explain-slot"></div>
          </div>`).join('')}
      </div>
      <div id="result"></div>`;

    pane.querySelectorAll('.q').forEach((box) => {
      const i = +box.dataset.i;
      box.querySelectorAll('.opt').forEach((btn) => btn.addEventListener('click', () => {
        if (answers[i] !== null) return;
        const j = +btn.dataset.j;
        answers[i] = j;
        const q = qs[i];
        const ok = j === q.a;
        box.querySelectorAll('.opt').forEach((b, k) => {
          b.disabled = true;
          if (k === q.a) b.classList.add('correct');
          else if (k === j) b.classList.add('wrong');
        });
        box.querySelector('.explain-slot').innerHTML = `
          <div class="explain"><span class="verdict ${ok ? 'ok' : 'no'}">${ok ? '✔ 答對了！' : '✘ 答錯了，正確答案是 (' + LETTERS[q.a] + ')'}</span>
          <div>${esc(q.e)}</div></div>`;
        update();
      }));
    });
    document.getElementById('restart').addEventListener('click', () => {
      renderQuiz(pane, shuffle(questions), storeKey, showTag);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function update() {
      const done = answers.filter((a) => a !== null).length;
      const right = answers.filter((a, i) => a === qs[i].a).length;
      document.getElementById('done').textContent = done;
      document.getElementById('right').textContent = right;
      document.getElementById('bar').style.width = (done / qs.length * 100) + '%';
      if (done === qs.length) finish(right);
    }

    function finish(right) {
      const prev = best(storeKey);
      const isBest = !prev || right > prev.score;
      if (isBest) store.set('best:' + storeKey, { score: right, total: qs.length });
      renderNav(); markNav(storeKey);
      const pct = right / qs.length;
      const msg = pct === 1 ? '滿分！太厲害了 🎉' : pct >= 0.8 ? '很不錯！把錯的題目再看一次就更穩了。' :
        pct >= 0.6 ? '及格了，建議回到重點整理加強錯題觀念。' : '再加油！先讀重點整理、背名詞卡，再挑戰一次。';
      let weak = '';
      if (storeKey === 'exam') {
        const miss = {};
        qs.forEach((q, i) => { if (answers[i] !== q.a) miss[q.tag] = (miss[q.tag] || 0) + 1; });
        const list = Object.entries(miss).sort((a, b) => b[1] - a[1]);
        if (list.length) weak = `<p>錯題分布：${list.map(([t, n]) => esc(t) + ' ' + n + ' 題').join('、')}</p>`;
      }
      document.getElementById('result').innerHTML = `
        <div class="result">
          <div class="big">${right} / ${qs.length}</div>
          <p>${msg}${isBest && prev ? '（新紀錄！）' : ''}</p>
          ${weak}
          <button class="btn primary" id="again">再做一次</button>
        </div>`;
      document.getElementById('again').addEventListener('click', () => document.getElementById('restart').click());
    }
  }

  // ---------- 綜合測驗 ----------
  function renderExam() {
    const pool = [];
    chapters.forEach((c) => c.quiz.forEach((q) => pool.push(Object.assign({ tag: chLabel(c).replace(/ /g, '') + ' ' + c.title }, q))));
    app.innerHTML = `
      <header class="ch-head">
        <div class="ch-kicker">⭐ 總複習</div>
        <h1>綜合測驗</h1>
        <p>從全冊 ${pool.length} 題中隨機抽出 20 題；每題標示出處章節，做完會統計錯題分布。</p>
      </header>
      <div id="pane" style="margin-top:18px"></div>`;
    const pane = document.getElementById('pane');
    // 每次重新作答都重新抽題
    const draw = () => shuffle(pool).slice(0, 20);
    renderQuiz(pane, draw(), 'exam', true);
    pane.addEventListener('click', (e) => {
      if (e.target.id === 'restart') {
        e.stopImmediatePropagation();
        renderQuiz(pane, draw(), 'exam', true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, true);
  }

  // ---------- 路由 ----------
  function route() {
    const [id, tab] = (location.hash.slice(1) || 'home').split('/');
    document.body.classList.remove('nav-open');
    const c = chapters.find((x) => x.id === id);
    if (c) { renderChapter(c, TABS.some(([k]) => k === tab) ? tab : 'notes'); markNav(c.id); }
    else if (id === 'exam') { renderExam(); markNav('exam'); }
    else { renderHome(); markNav('home'); }
    window.scrollTo(0, 0);
  }

  renderNav();
  window.addEventListener('hashchange', route);
  route();
})();
