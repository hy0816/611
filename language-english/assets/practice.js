// 語文／社會共用的練習工具：
//   makePractice  輸入或選擇作答的題目產生器
//   makeBuilder   點選字詞排出正確句子
//   makeSpot      在句子中點出錯字
//   makeOrder     依序點選排出順序
//   makeChoiceSet 情境選擇題（每題附說明）
(function () {
  'use strict';
  const U = window.WUtil;
  if (!U) return;
  const { frame, shuffle } = U;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').replace(/\s*([,.?!])\s*/g, '$1').replace(/[.。!！?？]+$/, '').trim();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const speak = (text) => {
    try {
      if (!('speechSynthesis' in window)) return false;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = 0.9;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  };

  // ---------- 題目產生器 ----------
  // cfg: { title, desc, levels, tip, gen(level) -> { q, ans: 字串或字串陣列, type: 'text'|'choice', options, sol, say } }
  function makePractice(host, cfg) {
    const body = frame(host, cfg.title, cfg.desc);
    const levels = cfg.levels || ['基本', '進階'];
    body.innerHTML = `
      <div class="w-tabs">${levels.length > 1 ? levels.map((l, i) => `<button class="chip" data-l="${i}">${l}</button>`).join('') : ''}<span class="w-tab-sep"></span><span class="pr-score"></span></div>
      <div class="pr-q"></div><div class="pr-input"></div>
      <div class="w-chips"><button class="chip" data-k="check">✔ 檢查</button><button class="chip" data-k="sol">💡 看答案</button><button class="chip" data-k="next">下一題 →</button></div>
      <div class="pr-fb"></div>${cfg.tip ? `<p class="w-hint">${cfg.tip}</p>` : ''}`;
    const $ = (s) => body.querySelector(s);
    let level = 0, cur, done, score = { r: 0, t: 0, s: 0 }, last = '';
    const ansText = () => (Array.isArray(cur.ans) ? cur.ans[0] : cur.ans);
    function newQ() {
      let tries = 0;
      do { cur = cfg.gen(level); tries++; } while (cur.q === last && tries < 8);
      last = cur.q; done = false;
      $('.pr-q').innerHTML = cur.q + (cur.say ? ` <button class="chip pr-say" title="播放發音">🔊</button>` : '');
      if (cur.say) $('.pr-say').addEventListener('click', () => speak(cur.say));
      $('.pr-fb').innerHTML = '';
      if (cur.type === 'choice') {
        $('.pr-input').innerHTML = `<div class="w-chips">${cur.options.map((o, i) => `<button class="chip pr-opt" data-o="${i}">${esc(o)}</button>`).join('')}</div>`;
        body.querySelectorAll('.pr-opt').forEach((b) => b.addEventListener('click', () => check(+b.dataset.o, b)));
        $('[data-k="check"]').style.display = 'none';
      } else {
        $('.pr-input').innerHTML = `<input class="pr-box" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(cur.placeholder || '輸入答案')}">`;
        $('[data-k="check"]').style.display = '';
        const box = $('.pr-box');
        box.addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (done) newQ(); else check(box.value); } });
        setTimeout(() => box.focus({ preventScroll: true }), 0);
      }
    }
    function judge(v) {
      if (cur.type === 'choice') return v === cur.ans;
      const list = Array.isArray(cur.ans) ? cur.ans : [cur.ans];
      return list.some((a) => norm(a) === norm(v));
    }
    function show(ok) {
      const right = cur.type === 'choice' ? cur.options[cur.ans] : ansText();
      $('.pr-fb').innerHTML = `<div class="explain"><span class="verdict ${ok ? 'ok' : 'no'}">${ok ? '✔ 答對了！' : '正確答案：' + esc(right)}</span>${cur.sol ? `<div class="pr-sol">${cur.sol}</div>` : ''}</div>`;
      $('.pr-score').innerHTML = `答對 <b>${score.r}</b> / ${score.t}${score.s >= 3 ? `　🔥 連對 ${score.s} 題` : ''}`;
      if (cur.say && ok) speak(cur.say);
    }
    function check(v, btn) {
      if (done) return;
      if (cur.type !== 'choice' && !String(v).trim()) { $('.pr-fb').innerHTML = '<span class="w-hint">請先輸入答案。</span>'; return; }
      const ok = judge(v);
      score.t++; if (ok) { score.r++; score.s++; } else score.s = 0;
      done = true;
      if (cur.type === 'choice') body.querySelectorAll('.pr-opt').forEach((b) => { b.disabled = true; if (+b.dataset.o === cur.ans) b.classList.add('ok'); else if (b === btn) b.classList.add('bad'); });
      else $('.pr-box').classList.add(ok ? 'ok' : 'bad');
      show(ok);
    }
    $('[data-k="check"]').addEventListener('click', () => check($('.pr-box') ? $('.pr-box').value : ''));
    $('[data-k="sol"]').addEventListener('click', () => { if (!done) { score.t++; score.s = 0; done = true; } show(false); });
    $('[data-k="next"]').addEventListener('click', newQ);
    body.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => { level = +b.dataset.l; body.querySelectorAll('[data-l]').forEach((x) => x.classList.toggle('active', x === b)); newQ(); }));
    const first = body.querySelector('[data-l="0"]'); if (first) first.classList.add('active');
    newQ();
  }

  // ---------- 排句子 ----------
  // cfg: { title, desc, items: [{ zh, words: [...], say }] }（words 為正確順序）
  function makeBuilder(host, cfg) {
    const body = frame(host, cfg.title, cfg.desc);
    body.innerHTML = `<div class="w-tabs"><span class="pr-score"></span><span class="w-tab-sep"></span><button class="chip" data-k="reset">重排</button><button class="chip" data-k="next">下一題 →</button></div>
      <div class="bd-zh"></div><div class="bd-line"></div><div class="w-chips bd-pool"></div><div class="w-read"></div>`;
    const $ = (s) => body.querySelector(s);
    let list = shuffle(cfg.items), idx = 0, picked = [], score = { r: 0, t: 0 }, judged = false;
    function render() {
      const it = list[idx % list.length];
      $('.bd-zh').innerHTML = `<b>題目 ${(idx % list.length) + 1}／${list.length}：</b>${esc(it.zh)}`;
      $('.bd-line').innerHTML = picked.length ? picked.map((p, i) => `<button class="chip bd-word on" data-i="${i}">${esc(p.w)}</button>`).join('') : '<span class="w-hint">點選下方的字詞，排出正確的句子（點上方的字可以收回）</span>';
      $('.bd-pool').innerHTML = it._pool.map((w, i) => (it._used[i] ? '' : `<button class="chip bd-word" data-p="${i}">${esc(w)}</button>`)).join('');
      body.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.p; it._used[i] = true; picked.push({ w: it._pool[i], i }); render(); if (picked.length === it.words.length) judge(it); }));
      body.querySelectorAll('.bd-line [data-i]').forEach((b) => b.addEventListener('click', () => { if (judged) return; const p = picked.splice(+b.dataset.i, 1)[0]; it._used[p.i] = false; render(); }));
    }
    function judge(it) {
      judged = true;
      const ok = picked.map((p) => p.w).join(' ') === it.words.join(' ');
      score.t++; if (ok) score.r++;
      $('.w-read').innerHTML = ok ? `<b class="w-ok">✔ 正確！</b> ${esc(it.words.join(' '))}` : `<b class="w-bad">✘ 順序不對</b>　正確：${esc(it.words.join(' '))}`;
      $('.pr-score').innerHTML = `答對 <b>${score.r}</b> / ${score.t}`;
      if (it.say) speak(it.say);
    }
    function load() {
      const it = list[idx % list.length];
      it._pool = shuffle(it.words); it._used = it._pool.map(() => false);
      picked = []; judged = false; $('.w-read').innerHTML = ''; render();
    }
    $('[data-k="reset"]').addEventListener('click', load);
    $('[data-k="next"]').addEventListener('click', () => { idx++; load(); });
    load();
  }

  // ---------- 找錯字 ----------
  // cfg: { title, desc, items: [{ text, wrong: 錯字所在的索引, right: 正確字, why }] }
  function makeSpot(host, cfg) {
    const body = frame(host, cfg.title, cfg.desc);
    body.innerHTML = `<div class="w-tabs"><span class="pr-score"></span><span class="w-tab-sep"></span><button class="chip" data-k="next">下一題 →</button></div><div class="sp-line"></div><div class="w-read"></div>`;
    const $ = (s) => body.querySelector(s);
    let list = shuffle(cfg.items), idx = 0, done = false, score = { r: 0, t: 0 };
    function load() {
      const it = list[idx % list.length]; done = false;
      if (typeof it.wrong === 'string') it.wrong = it.text.indexOf(it.wrong);
      $('.sp-line').innerHTML = [...it.text].map((ch, i) => `<span class="sp-ch" data-i="${i}">${esc(ch)}</span>`).join('');
      $('.w-read').innerHTML = '<b class="h">句子裡有一個錯別字，點出來！</b>';
      body.querySelectorAll('.sp-ch').forEach((s) => s.addEventListener('click', () => {
        if (done) return; done = true;
        const i = +s.dataset.i, ok = i === it.wrong;
        score.t++; if (ok) score.r++;
        body.querySelector(`.sp-ch[data-i="${it.wrong}"]`).classList.add('wrong');
        if (!ok) s.classList.add('miss');
        $('.w-read').innerHTML = `<b class="h">${ok ? '✔ 找到了！' : '✘ 錯字不是這個'}</b>「${esc(it.text[it.wrong])}」應改為「<b>${esc(it.right)}</b>」。${it.why ? esc(it.why) : ''}`;
        $('.pr-score').innerHTML = `答對 <b>${score.r}</b> / ${score.t}`;
      }));
    }
    $('[data-k="next"]').addEventListener('click', () => { idx++; load(); });
    load();
  }

  // ---------- 排順序 ----------
  // cfg: { title, desc, prompt, sets: [{ k, n, steps: [[名稱, 說明]] }] }
  function makeOrder(host, cfg) {
    const body = frame(host, cfg.title, cfg.desc);
    body.innerHTML = `<div class="w-tabs">${cfg.sets.length > 1 ? cfg.sets.map((s) => `<button class="chip" data-s="${s.k}">${s.n}</button>`).join('') : ''}<span class="w-tab-sep"></span><button class="chip" data-k="again">重新開始</button></div>
      <div class="w-order-q"></div><div class="w-order-track"></div><div class="w-chips w-order-pool"></div><div class="w-read"></div>`;
    const q = body.querySelector('.w-order-q'), track = body.querySelector('.w-order-track'), pool = body.querySelector('.w-order-pool'), read = body.querySelector('.w-read');
    let set = cfg.sets[0];
    function start() {
      body.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('active', b.dataset.s === set.k));
      let step = 0; const mySet = set;
      q.innerHTML = cfg.prompt || '請依照正確的順序點選：';
      track.innerHTML = set.steps.map((_, i) => `<span class="w-slot">${i + 1}</span>`).join('<i>→</i>');
      pool.innerHTML = shuffle(set.steps.map((s, i) => [s, i])).map(([s, i]) => `<button class="chip" data-i="${i}">${esc(s[0])}</button>`).join('');
      read.innerHTML = '<b class="h">提示</b>想一想，哪一個應該排第一？';
      pool.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
        if (!b.isConnected || mySet !== set || step >= set.steps.length) return;
        const i = +b.dataset.i;
        if (i === step) {
          const slot = track.querySelectorAll('.w-slot')[step];
          slot.textContent = set.steps[i][0]; slot.classList.add('ok'); b.remove();
          read.innerHTML = `<b class="h">✔ ${esc(set.steps[i][0])}</b>${set.steps[i][1]}`;
          step++;
          if (step === set.steps.length) read.innerHTML += '<br><b class="w-ok">🎉 全部排對了！</b>';
        } else {
          b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 500);
          read.innerHTML = `<b class="h">✘ 還不是「${esc(set.steps[i][0])}」</b>再想想第 ${step + 1} 個是什麼。`;
        }
      }));
    }
    body.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { set = cfg.sets.find((s) => s.k === b.dataset.s); start(); }));
    body.querySelector('[data-k="again"]').addEventListener('click', start);
    start();
  }

  // ---------- 情境選擇題（逐題） ----------
  // cfg: { title, desc, items: [{ q, o: [...], a, e }] }
  function makeChoiceSet(host, cfg) {
    return makePractice(host, {
      title: cfg.title, desc: cfg.desc, levels: ['情境題'],
      gen: (() => { let pool = []; return () => { if (!pool.length) pool = shuffle(cfg.items); const it = pool.pop(); return { q: esc(it.q), type: 'choice', options: it.o, ans: it.a, sol: it.e }; }; })()
    });
  }

  Object.assign(U, { makePractice, makeBuilder, makeSpot, makeOrder, makeChoiceSet, speak, pick, esc });
})();
