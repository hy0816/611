// 英文互動圖
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U || !U.makePractice) return;
  const { frame, shuffle, makePractice, makeBuilder, makeChoiceSet, pick, esc, speak } = U;

  // ---------- Get Ready ----------
  const ABC_WORD = { a: 'apple', b: 'book', c: 'cat', d: 'dog', e: 'egg', f: 'fish', g: 'girl', h: 'hat', i: 'ink', j: 'jam', k: 'kite', l: 'lion', m: 'map', n: 'nose', o: 'orange', p: 'pen', q: 'queen', r: 'red', s: 'sun', t: 'ten', u: 'umbrella', v: 'van', w: 'water', x: 'box', y: 'yellow', z: 'zoo' };
  const LETTERS = Object.keys(ABC_WORD);
  W['alphabet-board'] = function (host) {
    const body = frame(host, '🔤 字母板', '瀏覽：點字母聽發音與例字；聽力挑戰：聽發音，點出正確的字母');
    body.innerHTML = `<div class="w-tabs"><button class="chip active" data-m="browse">瀏覽</button><button class="chip" data-m="quiz">聽力挑戰</button><span class="w-tab-sep"></span><span class="pr-score"></span></div>
      <div class="ab-grid">${LETTERS.map((l) => `<button class="ab-key${'aeiou'.includes(l) ? ' vowel' : ''}" data-l="${l}">${l.toUpperCase()}<small>${l}</small></button>`).join('')}</div>
      <div class="w-read"></div><p class="w-legend-row"><span class="ab-key vowel ab-mini">A</span> 母音字母　<span class="ab-key ab-mini">B</span> 子音字母</p>`;
    const read = body.querySelector('.w-read'), sc = body.querySelector('.pr-score');
    let mode = 'browse', target = null, score = { r: 0, t: 0 };
    const ask = () => {
      target = pick(LETTERS);
      read.innerHTML = '<b class="h">🎧 聽聽看</b>是哪一個字母？ <button class="chip" data-k="again">🔊 再聽一次</button>';
      read.querySelector('[data-k="again"]').addEventListener('click', () => target && speak(target.toUpperCase()));
      speak(target.toUpperCase());
    };
    body.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.m; body.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('active', x === b));
      sc.innerHTML = ''; score = { r: 0, t: 0 };
      if (mode === 'quiz') ask(); else { target = null; read.innerHTML = ''; }
    }));
    body.querySelectorAll('.ab-grid .ab-key').forEach((k) => k.addEventListener('click', () => {
      const l = k.dataset.l;
      if (mode === 'browse') {
        speak(l.toUpperCase() + '. ' + ABC_WORD[l]);
        read.innerHTML = `<b class="h">${l.toUpperCase()} ${l}</b>${'aeiou'.includes(l) ? '母音字母' : '子音字母'}・例字：<b>${ABC_WORD[l]}</b>`;
        return;
      }
      if (!target) return;
      const t = target, ok = l === t; score.t++; if (ok) score.r++;
      sc.innerHTML = `答對 <b>${score.r}</b> / ${score.t}`;
      k.classList.add(ok ? 'ok' : 'bad'); setTimeout(() => k.classList.remove('ok', 'bad'), 600);
      read.innerHTML = ok ? `<b class="h">✔ 答對了！</b>${t.toUpperCase()} ${t}（${ABC_WORD[t]}）` : `<b class="h">✘ 不是 ${l.toUpperCase()}</b>正確答案是 <b>${t.toUpperCase()} ${t}</b>`;
      target = null; setTimeout(() => { if (mode === 'quiz' && !target) ask(); }, 1400);
    }));
  };

  const PHON = {
    a: ['/æ/', ['cat', 'bag', 'map', 'hat', 'fan', 'bat']], e: ['/ɛ/', ['bed', 'pen', 'red', 'ten', 'leg', 'net']],
    i: ['/ɪ/', ['pig', 'sit', 'big', 'six', 'fish', 'milk']], o: ['/ɑ/', ['dog', 'hot', 'box', 'top', 'fox', 'mop']],
    u: ['/ʌ/', ['bus', 'cup', 'sun', 'run', 'duck', 'bug']]
  };
  const MAGIC = [['cap', 'cape'], ['kit', 'kite'], ['hop', 'hope'], ['cut', 'cute'], ['tap', 'tape'], ['pin', 'pine']];
  W['phonics-say'] = function (host) {
    const body = frame(host, '🔊 自然發音：短母音', '選一個母音，點例字聽發音；下方比較字尾加 e 之後的長母音');
    body.innerHTML = `<div class="w-tabs">${Object.keys(PHON).map((v, i) => `<button class="chip${i ? '' : ' active'}" data-v="${v}">${v}</button>`).join('')}</div>
      <div class="ph-words"></div><p class="ph-sub"><b>短母音 → 長母音（字尾加 e）</b></p>
      <div class="vs-grid">${MAGIC.map(([a, b]) => `<button class="vs-item" data-s="${a}. ${b}."><span class="vs-en">🔊 ${a} → ${a}<b>e</b></span><span class="vs-zh">${a[1]} 由短母音變長母音</span></button>`).join('')}</div>`;
    const words = body.querySelector('.ph-words');
    const show = (v) => {
      const [ipa, list] = PHON[v];
      words.innerHTML = `<p><b class="ph-big">${v}</b>　短母音唸 <b>${ipa}</b></p><div class="w-chips">${list.map((w) => `<button class="chip" data-s="${w}">🔊 ${w.replace(v, `<b class="ph-hl">${v}</b>`)}</button>`).join('')}</div>`;
      words.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => speak(b.dataset.s)));
    };
    body.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => { body.querySelectorAll('[data-v]').forEach((x) => x.classList.toggle('active', x === b)); show(b.dataset.v); }));
    body.querySelectorAll('.vs-item').forEach((b) => b.addEventListener('click', () => speak(b.dataset.s)));
    show('a');
  };

  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const numWord = (n) => (n === 100 ? 'one hundred' : n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));
  const numHint = (n) => {
    if (n >= 40 && n < 50) return '注意：forty 沒有 u。';
    if (n >= 13 && n <= 19) return '13～19 字尾是 -teen。';
    if (n >= 20 && n < 100 && n % 10 === 0) return '整十字尾是 -ty。';
    if (n > 20 && n < 100) return '十位和個位之間加連字號 -。';
    return '';
  };
  W['number-gen'] = (host) => makePractice(host, {
    title: '🎲 數字練習', desc: '寫出數字的英文，或把英文換成阿拉伯數字', levels: ['數字 → 英文', '英文 → 數字'],
    tip: '21～99 中間的連字號可以打 - 或空格，例如 forty-five 或 forty five。',
    gen(lv) {
      const r = Math.random();
      const n = r < 0.3 ? 11 + Math.floor(Math.random() * 9) : r < 0.4 ? 100 : 1 + Math.floor(Math.random() * 99);
      const w = numWord(n);
      if (lv === 0) return { q: `<span class="big-say">${n}</span> 的英文是？`, ans: [w, w.replace('-', ' ')], sol: `${n} = <b>${w}</b>。${numHint(n)}`, say: w, placeholder: '輸入英文' };
      return { q: `<b>${w}</b> 是多少？`, ans: String(n), sol: `${w} = <b>${n}</b>`, say: w, placeholder: '輸入數字' };
    }
  });

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const abbr = (m) => (m === 'May' ? 'May' : m.slice(0, 3) + '.');
  const opts4 = (all, ans) => shuffle(shuffle(all.filter((x) => x !== ans)).slice(0, 3).concat(ans));
  W['calendar-gen'] = (host) => makePractice(host, {
    title: '🎲 星期與月份', desc: '選出正確的星期或月份', levels: ['星期', '月份'],
    gen(lv) {
      let q, a;
      if (lv === 0) {
        const i = Math.floor(Math.random() * 7), t = pick(['zh', 'next', 'prev', 'abbr']);
        if (t === 'zh') { q = `「星期${DAYS_ZH[i]}」的英文是？`; a = DAYS[i]; }
        else if (t === 'next') { q = `<b>${DAYS[i]}</b> 的<b>下一天</b>是？`; a = DAYS[(i + 1) % 7]; }
        else if (t === 'prev') { q = `<b>${DAYS[i]}</b> 的<b>前一天</b>是？`; a = DAYS[(i + 6) % 7]; }
        else { q = `縮寫 <b>${DAYS[i].slice(0, 3)}.</b> 是哪一天？`; a = DAYS[i]; }
        const o = opts4(DAYS, a);
        return { q, type: 'choice', options: o, ans: o.indexOf(a), sol: `<b>${a}</b>＝星期${DAYS_ZH[DAYS.indexOf(a)]}`, say: a };
      }
      const i = Math.floor(Math.random() * 12), t = pick(['zh', 'next', 'abbr']);
      if (t === 'zh') { q = `「${i + 1} 月」的英文是？`; a = MONTHS[i]; }
      else if (t === 'next') { q = `<b>${MONTHS[i]}</b> 的<b>下一個月</b>是？`; a = MONTHS[(i + 1) % 12]; }
      else { q = `縮寫 <b>${abbr(MONTHS[i])}</b> 是哪一個月？`; a = MONTHS[i]; }
      const o = opts4(MONTHS, a);
      return { q, type: 'choice', options: o, ans: o.indexOf(a), sol: `<b>${a}</b>＝${MONTHS.indexOf(a) + 1} 月`, say: a };
    }
  });

  // ---------- 第 1 章 ----------
  const AAN = [
    ['apple', 'an', '母音 a 開頭'], ['book', 'a', '子音 b 開頭'], ['egg', 'an', '母音 e 開頭'], ['dog', 'a', '子音 d 開頭'],
    ['orange', 'an', '母音 o 開頭'], ['umbrella', 'an', 'u 唸 /ʌ/，母音開頭'], ['uniform', 'a', 'u 唸 /ju/，子音開頭'],
    ['hour', 'an', 'h 不發音，母音開頭'], ['house', 'a', 'h 有發音，子音開頭'], ['elephant', 'an', '母音 e 開頭'],
    ['ice cream', 'an', '母音 i 開頭'], ['university', 'a', 'u 唸 /ju/，子音開頭'], ['eraser', 'an', '母音 e 開頭'],
    ['cat', 'a', '子音 c 開頭'], ['honest boy', 'an', 'h 不發音，母音開頭'], ['useful book', 'a', 'u 唸 /ju/，子音開頭']
  ];
  W['a-an-gen'] = (host) => makePractice(host, {
    title: '🎲 a 還是 an？', desc: '看第一個「發音」決定用 a 或 an；按 🔊 聽發音', levels: ['a / an'],
    gen() { const [w, a, why] = pick(AAN); return { q: `___ <b>${w}</b>`, type: 'choice', options: ['a', 'an'], ans: a === 'a' ? 0 : 1, sol: `${a} ${w}：${why}。`, say: w }; }
  });
  W['greet-match'] = (host) => makeChoiceSet(host, {
    title: '💬 對話配對', desc: '選出最適合的回應',
    items: [
      { q: 'How are you?', o: ['I\'m fine, thank you.', 'I\'m Ken.', 'You\'re welcome.'], a: 0, e: '問候身體或心情。' },
      { q: 'Nice to meet you.', o: ['See you.', 'Nice to meet you, too.', 'Thank you.'], a: 1, e: '初次見面。' },
      { q: 'Thank you very much.', o: ['You\'re welcome.', 'I\'m sorry.', 'Good night.'], a: 0, e: '回應道謝。' },
      { q: 'I\'m sorry.', o: ['That\'s OK.', 'Nice to meet you.', 'I\'m fine.'], a: 0, e: '回應道歉。' },
      { q: 'What\'s your name?', o: ['I\'m twelve.', 'My name is Lily.', 'It\'s a pen.'], a: 1, e: '詢問名字。' },
      { q: 'Goodbye!', o: ['See you tomorrow!', 'Good morning!', 'You\'re welcome.'], a: 0, e: '道別。' },
      { q: 'May I come in?', o: ['Yes, please.', 'I\'m fine.', 'Nice to meet you.'], a: 0, e: '請求許可。' }
    ]
  });
  W['vocab-say-1'] = function (host) {
    const body = frame(host, '🔊 教室用語發音', '點選句子聽發音（使用瀏覽器內建語音）');
    const L = [['Stand up.', '起立'], ['Sit down.', '坐下'], ['Open your book.', '打開課本'], ['Close your book.', '合上課本'], ['Listen.', '聽'], ['Read after me.', '跟我念'], ['Raise your hand.', '舉手'], ['May I go to the restroom?', '我可以去洗手間嗎？'], ['Good morning.', '早安'], ['Nice to meet you.', '很高興認識你'], ['How are you?', '你好嗎？'], ['See you tomorrow.', '明天見']];
    body.innerHTML = `<div class="vs-grid">${L.map(([e, z]) => `<button class="vs-item" data-s="${esc(e)}"><span class="vs-en">🔊 ${esc(e)}</span><span class="vs-zh">${z}</span></button>`).join('')}</div><p class="w-hint vs-note"></p>`;
    body.querySelectorAll('.vs-item').forEach((b) => b.addEventListener('click', () => { if (!speak(b.dataset.s)) body.querySelector('.vs-note').textContent = '這個瀏覽器不支援語音播放。'; }));
  };

  // ---------- 第 2 章 ----------
  const SUBJ = [['I', 'am'], ['You', 'are'], ['He', 'is'], ['She', 'is'], ['It', 'is'], ['We', 'are'], ['They', 'are'], ['Tom', 'is'], ['Tom and Amy', 'are'], ['My cat', 'is'], ['The books', 'are'], ['My parents', 'are'], ['Mr. Lin', 'is'], ['You and I', 'are']];
  const COMP = ['happy', 'at school', 'in the classroom', 'hungry', 'from Taiwan', 'good friends', 'busy today', 'very tall'];
  W['be-gen'] = (host) => makePractice(host, {
    title: '🎲 be 動詞練習', desc: '基本：選 am / is / are；進階：改成疑問句', levels: ['填 be 動詞', '改成疑問句'],
    tip: '進階題請輸入完整的疑問句，例如 Are you happy?',
    gen(lv) {
      const [s, b] = pick(SUBJ), c = pick(COMP);
      if (lv === 0) return { q: `${esc(s)} ___ ${c}.`, type: 'choice', options: ['am', 'is', 'are'], ans: ['am', 'is', 'are'].indexOf(b), sol: `主詞 ${esc(s)} 搭配 <b>${b}</b>。`, say: `${s} ${b} ${c}.` };
      const subjQ = s === 'I' ? 'I' : /^(Tom|Amy|Mr\.)/.test(s) ? s : s[0].toLowerCase() + s.slice(1);
      const be = b[0].toUpperCase() + b.slice(1);
      const ans = `${be} ${subjQ} ${c}?`;
      return { q: `改成疑問句：<b>${esc(s)} ${b} ${c}.</b>`, ans: [ans, ans.replace(/\?$/, '')], sol: `把 be 動詞 <b>${b}</b> 移到句首：${esc(ans)}`, say: ans };
    }
  });
  W['be-builder'] = (host) => makeBuilder(host, {
    title: '🧩 排出正確的句子', desc: '依中文意思，點選單字排出英文句子',
    items: [
      { zh: '我是一個學生。', words: ['I', 'am', 'a', 'student.'] },
      { zh: '她不是我的老師。', words: ['She', 'is', 'not', 'my', 'teacher.'] },
      { zh: '你是新同學嗎？', words: ['Are', 'you', 'a', 'new', 'student?'] },
      { zh: '他們是我的好朋友。', words: ['They', 'are', 'my', 'good', 'friends.'] },
      { zh: '湯姆和我在教室裡。', words: ['Tom', 'and', 'I', 'are', 'in', 'the', 'classroom.'] },
      { zh: '牠是一隻可愛的狗嗎？', words: ['Is', 'it', 'a', 'cute', 'dog?'] }
    ].map((x) => Object.assign(x, { say: x.words.join(' ') }))
  });

  // ---------- 第 3 章 ----------
  const PL = [['book', 'books', '一般加 s'], ['box', 'boxes', '字尾 x 加 es'], ['bus', 'buses', '字尾 s 加 es'], ['dish', 'dishes', '字尾 sh 加 es'], ['watch', 'watches', '字尾 ch 加 es'],
    ['tomato', 'tomatoes', '字尾 o 加 es'], ['photo', 'photos', '例外：photo 只加 s'], ['baby', 'babies', '子音 + y → ies'], ['city', 'cities', '子音 + y → ies'], ['boy', 'boys', '母音 + y 直接加 s'],
    ['key', 'keys', '母音 + y 直接加 s'], ['leaf', 'leaves', 'f → ves'], ['knife', 'knives', 'fe → ves'], ['man', 'men', '不規則'], ['woman', 'women', '不規則'],
    ['child', 'children', '不規則'], ['foot', 'feet', '不規則'], ['tooth', 'teeth', '不規則'], ['mouse', 'mice', '不規則'], ['fish', 'fish', '單複數同形'], ['sheep', 'sheep', '單複數同形']];
  W['plural-gen'] = (host) => makePractice(host, {
    title: '🎲 名詞複數拼字', desc: '輸入名詞的複數形', levels: ['規則變化', '全部（含不規則）'],
    gen(lv) {
      const pool = lv === 0 ? PL.slice(0, 13) : PL;
      const [s, p, why] = pick(pool);
      return { q: `<span class="big-say">${s}</span> 的複數是？`, ans: p, sol: `${s} → <b>${p}</b>（${why}）`, say: p, placeholder: '輸入複數形' };
    }
  });
  W['this-these-gen'] = (host) => makePractice(host, {
    title: '🎲 this / that / these / those', desc: '看距離與數量選出正確的指示代名詞', levels: ['選擇'],
    gen() {
      const items = [['🍎', 'apple', 'apples'], ['📚', 'book', 'books'], ['🐱', 'cat', 'cats'], ['✏️', 'pencil', 'pencils'], ['🚲', 'bike', 'bikes']];
      const [ic, one, many] = pick(items), near = Math.random() < 0.5, plural = Math.random() < 0.5;
      const ans = near ? (plural ? 'These' : 'This') : (plural ? 'Those' : 'That');
      const be = plural ? 'are' : 'is', noun = plural ? many : `${/^[aeiou]/.test(one) ? 'an' : 'a'} ${one}`;
      return { q: `${near ? '👉 近處' : '👉 ……遠處'}：${plural ? ic + ic + ic : ic}<br>___ ${be} ${noun}.`, type: 'choice', options: ['This', 'That', 'These', 'Those'], ans: ['This', 'That', 'These', 'Those'].indexOf(ans), sol: `${near ? '近' : '遠'}、${plural ? '複數' : '單數'} → <b>${ans}</b>`, say: `${ans} ${be} ${noun}.` };
    }
  });

  // ---------- 第 4 章 ----------
  const POSS = [
    ['This is ___ bag.', '我的', 'my', ['my', 'mine', 'me', 'I']], ['The bag is ___.', '我的', 'mine', ['my', 'mine', 'me', 'I']],
    ['Is this ___ pen?', '你的', 'your', ['you', 'your', 'yours', 'you\'re']], ['The pen is ___.', '你的', 'yours', ['you', 'your', 'yours', 'you\'re']],
    ['___ name is Ben.', '他的', 'His', ['He', 'His', 'Him', 'He\'s']], ['That is ___ room.', '她的', 'her', ['she', 'her', 'hers', 'she\'s']],
    ['The red cap is ___.', '她的', 'hers', ['she', 'her', 'hers', 'she\'s']], ['The cat likes ___ toy.', '牠的', 'its', ['it', 'its', 'it\'s', 'it is']],
    ['We love ___ teacher.', '我們的', 'our', ['we', 'us', 'our', 'ours']], ['These seats are ___.', '他們的', 'theirs', ['they', 'them', 'their', 'theirs']]
  ];
  W['poss-gen'] = (host) => makePractice(host, {
    title: '🎲 所有格練習', desc: '依中文提示選出正確的所有格', levels: ['所有格'],
    gen() { const [s, zh, a, opts] = pick(POSS); const o = shuffle(opts); return { q: `${esc(s)}（${zh}）`, type: 'choice', options: o, ans: o.indexOf(a), sol: /___\.$/.test(s) ? `後面沒有名詞，用所有格代名詞 <b>${esc(a)}</b>。` : `後面接名詞，用所有格 <b>${esc(a)}</b>。`, say: s.replace('___', a) }; }
  });
  const WH = [['___ is that girl?', 'She\'s my cousin.', 'Who'], ['___ is your pencil box?', 'It\'s in my bag.', 'Where'], ['___ is this?', 'It\'s a ruler.', 'What'],
    ['___ are you?', 'I\'m thirteen.', 'How old'], ['___ cap is this?', 'It\'s Leo\'s.', 'Whose'], ['___ are you?', 'I\'m fine, thanks.', 'How'],
    ['___ are my keys?', 'They\'re on the table.', 'Where'], ['___ is your father?', 'He\'s a doctor.', 'What']];
  W['wh-gen'] = (host) => makePractice(host, {
    title: '🎲 疑問詞練習', desc: '看回答，選出正確的疑問詞', levels: ['疑問詞'],
    gen() {
      const [q, a, w] = pick(WH);
      const o = shuffle(['Who', 'What', 'Where', 'How old', 'Whose', 'How'].filter((x) => x !== w)).slice(0, 3).concat(w);
      const opts = shuffle(o);
      return { q: `A: ${esc(q)}<br>B: ${esc(a)}`, type: 'choice', options: opts, ans: opts.indexOf(w), sol: `回答是「${esc(a)}」，所以問 <b>${w}</b>。`, say: q.replace('___', w) };
    }
  });

  // ---------- 第 5 章 ----------
  const V3 = [['play', 'plays'], ['read', 'reads'], ['like', 'likes'], ['eat', 'eats'], ['watch', 'watches'], ['wash', 'washes'], ['go', 'goes'], ['do', 'does'], ['study', 'studies'], ['fly', 'flies'], ['cry', 'cries'], ['have', 'has'], ['fix', 'fixes'], ['buy', 'buys'], ['teach', 'teaches']];
  const SUBJ3 = ['He', 'She', 'My brother', 'Amy', 'The dog', 'Mr. Chen'];
  W['third-gen'] = (host) => makePractice(host, {
    title: '🎲 第三人稱單數', desc: '基本：寫出動詞的變化；進階：判斷句子用原形或加 s', levels: ['動詞變化', '句子填空'],
    gen(lv) {
      const [v, v3] = pick(V3);
      if (lv === 0) return { q: `he / she / it + <b>${v}</b> → ?`, ans: v3, sol: `${v} → <b>${v3}</b>`, say: v3, placeholder: '輸入動詞變化' };
      const neg = Math.random() < 0.4, plural = !neg && Math.random() < 0.3;
      const s = plural ? pick(['They', 'We', 'My parents', 'I']) : pick(SUBJ3);
      const tail = 'every day';
      if (neg) return { q: `${s} doesn't ___ (${v}) ${tail}.`, ans: v, sol: `doesn't 後面用<b>原形</b>：${v}`, say: `${s} doesn't ${v} ${tail}.`, placeholder: '填入動詞' };
      return { q: `${s} ___ (${v}) ${tail}.`, ans: plural ? v : v3, sol: plural ? `${s} 不是第三人稱單數，用<b>原形</b> ${v}。` : `${s} 是第三人稱單數：<b>${v3}</b>`, say: `${s} ${plural ? v : v3} ${tail}.`, placeholder: '填入動詞' };
    }
  });
  W['simple-builder'] = (host) => makeBuilder(host, {
    title: '🧩 現在簡單式排句子', desc: '依中文意思排出正確的英文句子',
    items: [
      { zh: '我每天走路上學。', words: ['I', 'walk', 'to', 'school', 'every', 'day.'] },
      { zh: '她週末常常打網球。', words: ['She', 'often', 'plays', 'tennis', 'on', 'weekends.'] },
      { zh: '他不喜歡吃青椒。', words: ['He', 'doesn\'t', 'like', 'green', 'peppers.'] },
      { zh: '你的哥哥會讀英文書嗎？', words: ['Does', 'your', 'brother', 'read', 'English', 'books?'] },
      { zh: '我們總是準時到校。', words: ['We', 'are', 'always', 'on', 'time', 'for', 'school.'] },
      { zh: '他們從不在晚上喝咖啡。', words: ['They', 'never', 'drink', 'coffee', 'at', 'night.'] }
    ].map((x) => Object.assign(x, { say: x.words.join(' ') }))
  });

  // ---------- 第 6 章 ----------
  W['imp-gen'] = (host) => makeChoiceSet(host, {
    title: '🎲 祈使句、Let\'s 與 can', desc: '選出正確的答案',
    items: [
      { q: '___ the door, please.', o: ['Close', 'Closes', 'Closing'], a: 0, e: '祈使句用原形動詞開頭。' },
      { q: '___ run in the hallway!', o: ['Not', 'Don\'t', 'Doesn\'t'], a: 1, e: '否定祈使句用 Don\'t。' },
      { q: '___ careful!', o: ['Are', 'Be', 'Is'], a: 1, e: 'be 動詞的原形是 be。' },
      { q: 'Let\'s ___ to the zoo.', o: ['go', 'goes', 'going'], a: 0, e: 'Let\'s + 原形動詞。' },
      { q: 'My sister can ___ the violin.', o: ['plays', 'play', 'playing'], a: 1, e: 'can + 原形動詞。' },
      { q: 'A: Can your dog swim?　B: Yes, ___', o: ['it can.', 'it does.', 'it is.'], a: 0, e: '用 can 問，用 can 回答。' },
      { q: '___ I use your phone?', o: ['Can', 'Am', 'Does'], a: 0, e: 'Can I ...? 請求許可。' },
      { q: 'Let\'s ___ play games. It\'s late.', o: ['don\'t', 'not', 'no'], a: 1, e: 'Let\'s 的否定是 Let\'s not。' }
    ]
  });
  W['can-builder'] = (host) => makeBuilder(host, {
    title: '🧩 祈使句與 can 排句子', desc: '依中文意思排出正確的英文句子',
    items: [
      { zh: '請打開窗戶。', words: ['Please', 'open', 'the', 'window.'] },
      { zh: '不要在教室裡吃東西。', words: ['Don\'t', 'eat', 'in', 'the', 'classroom.'] },
      { zh: '我們放學後去打籃球吧。', words: ['Let\'s', 'play', 'basketball', 'after', 'school.'] },
      { zh: '我的弟弟會騎腳踏車。', words: ['My', 'brother', 'can', 'ride', 'a', 'bike.'] },
      { zh: '你會說日文嗎？', words: ['Can', 'you', 'speak', 'Japanese?'] },
      { zh: '她不會游泳。', words: ['She', 'can\'t', 'swim.'] }
    ].map((x) => Object.assign(x, { say: x.words.join(' ') }))
  });
})();
