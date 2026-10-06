// 數學核心：分數運算、算式解析、逐步計算、題目產生器框架
(function () {
  'use strict';
  const U = window.WUtil;
  if (!U) return;
  const { frame } = U;

  // ---------- 分數 ----------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
  class F {
    constructor(n, d = 1) {
      if (d === 0) throw new Error('除數不能為 0');
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d);
      this.n = n / g; this.d = d / g;
    }
    static of(x) { return x instanceof F ? x : F.fromNumber(x); }
    static fromNumber(x) {
      if (Number.isInteger(x)) return new F(x, 1);
      const s = String(x), k = s.includes('.') ? s.split('.')[1].length : 0;
      return new F(Math.round(x * 10 ** k), 10 ** k);
    }
    add(o) { o = F.of(o); return new F(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = F.of(o); return new F(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = F.of(o); return new F(this.n * o.n, this.d * o.d); }
    div(o) { o = F.of(o); if (o.n === 0) throw new Error('除數不能為 0'); return new F(this.n * o.d, this.d * o.n); }
    pow(k) {
      if (!Number.isInteger(k)) throw new Error('指數必須是整數');
      if (k < 0) { if (this.n === 0) throw new Error('0 沒有負次方'); return new F(this.d ** -k, this.n ** -k); }
      return new F(this.n ** k, this.d ** k);
    }
    neg() { return new F(-this.n, this.d); }
    eq(o) { o = F.of(o); return this.n === o.n && this.d === o.d; }
    isInt() { return this.d === 1; }
    valueOf() { return this.n / this.d; }
    toString() { return this.d === 1 ? fmtInt(this.n) : `${this.n < 0 ? '−' : ''}${Math.abs(this.n)}/${this.d}`; }
    toHTML() {
      if (this.d === 1) return fmtInt(this.n);
      return `${this.n < 0 ? '−' : ''}<span class="frac"><span>${Math.abs(this.n)}</span><span>${this.d}</span></span>`;
    }
  }
  const fmtInt = (n) => (n < 0 ? '−' : '') + Math.abs(n);

  // ---------- 算式解析 ----------
  function tokenize(src) {
    const s = String(src).replace(/[−–—]/g, '-').replace(/[×·]/g, '*')
      .replace(/÷/g, ':').replace(/[（]/g, '(').replace(/[）]/g, ')')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => '^' + m.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c) => ({ '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9, '⁻': '-' }[c])));
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[\d.]/.test(c)) {
        let j = i; while (j < s.length && /[\d.]/.test(s[j])) j++;
        let v = F.fromNumber(parseFloat(s.slice(i, j)));
        // 數字/數字（中間沒有空白）視為分數；除法請用 ÷
        if (s[j] === '/' && /\d/.test(s[j + 1] || '')) { let k = j + 1; while (k < s.length && /\d/.test(s[k])) k++; v = v.div(parseInt(s.slice(j + 1, k), 10)); j = k; }
        out.push({ t: 'num', v });
        i = j; continue;
      }
      if (c === ':') { out.push({ t: '/' }); i++; continue; }
      if (/[a-zA-Z]/.test(c)) { out.push({ t: 'var', v: c.toLowerCase() }); i++; continue; }
      if ('+-*/^()'.includes(c)) { out.push({ t: c }); i++; continue; }
      throw new Error('看不懂的符號「' + c + '」');
    }
    return out;
  }
  function parse(src) {
    const tk = tokenize(src);
    let p = 0;
    const peek = () => tk[p], take = (t) => { if (!tk[p] || (t && tk[p].t !== t)) throw new Error('算式不完整'); return tk[p++]; };
    function expr() {
      let a = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) { const op = take().t; a = { t: 'bin', op, a, b: term() }; }
      return a;
    }
    function term() {
      let a = unary();
      for (;;) {
        const k = peek();
        if (k && (k.t === '*' || k.t === '/')) { take(); a = { t: 'bin', op: k.t, a, b: unary() }; }
        else if (k && (k.t === 'num' || k.t === 'var' || k.t === '(')) a = { t: 'bin', op: '*', a, b: unary(), imp: true };
        else return a;
      }
    }
    function unary() {
      const k = peek();
      if (k && k.t === '-') {
        take();
        // 負號直接接數字（後面不是 ^）時，合併成一個負數
        const nx = peek(), nx2 = tk[p + 1];
        if (nx && nx.t === 'num' && !(nx2 && nx2.t === '^')) { take(); return { t: 'num', v: nx.v.neg() }; }
        return { t: 'neg', a: unary() };
      }
      if (k && k.t === '+') { take(); return unary(); }
      return power();
    }
    function power() {
      const a = primary();
      if (peek() && peek().t === '^') { take(); return { t: 'bin', op: '^', a, b: unary() }; }
      return a;
    }
    function primary() {
      const k = take();
      if (k.t === 'num') return { t: 'num', v: k.v };
      if (k.t === 'var') return { t: 'var', v: k.v };
      if (k.t === '(') { const e = expr(); take(')'); return e.t === 'num' ? e : { t: 'par', a: e }; }
      throw new Error('算式格式不正確');
    }
    const r = expr();
    if (p < tk.length) throw new Error('算式格式不正確');
    return r;
  }
  function evaluate(node, vars) {
    switch (node.t) {
      case 'num': return node.v;
      case 'var': if (!vars || !(node.v in vars)) throw new Error('有未知數 ' + node.v); return F.of(vars[node.v]);
      case 'par': return evaluate(node.a, vars);
      case 'neg': return evaluate(node.a, vars).neg();
      case 'bin': {
        const a = evaluate(node.a, vars), b = evaluate(node.b, vars);
        if (node.op === '+') return a.add(b);
        if (node.op === '-') return a.sub(b);
        if (node.op === '*') return a.mul(b);
        if (node.op === '/') return a.div(b);
        if (node.op === '^') { if (!b.isInt()) throw new Error('指數必須是整數'); return a.pow(b.n); }
      }
    }
    throw new Error('無法計算');
  }
  // ---------- 逐步計算 ----------
  const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
  const OPS = { '+': ' + ', '-': ' − ', '*': ' × ', '/': ' ÷ ', '^': '^' };
  function show(node, hl) {
    const wrap = (s, n) => (n === hl ? `<mark>${s}</mark>` : s);
    // lead：是否位於算式（或括號內）最前面；最前面的負數不必加括號
    function go(n, parentPrec, lead) {
      let s;
      if (n.t === 'num') {
        s = n.v.toHTML();
        if (n.v < 0 && parentPrec > 0 && !lead) s = `(${s})`;
      } else if (n.t === 'var') s = n.v;
      else if (n.t === 'par') s = `(${go(n.a, 0, true)})`;
      else if (n.t === 'neg') { s = '−' + go(n.a, 3, false); if (parentPrec > 0 && !lead) s = `(${s})`; }
      else {
        const pr = PREC[n.op], wrapIt = pr < parentPrec;
        if (n.op === '^') s = `${go(n.a, 5, false)}<sup>${go(n.b, 0, true)}</sup>`;
        else {
          const addLike = n.op === '+' || n.op === '-';
          s = go(n.a, pr, (wrapIt || lead) && addLike) + OPS[n.op] + go(n.b, pr + (n.op === '-' || n.op === '/' ? 0.5 : 0), false);
        }
        if (wrapIt) s = `(${s})`;
      }
      return wrap(s, n);
    }
    return go(node, 0, true);
  }
  function stepOnce(root) {
    // 依運算順序（後序走訪）找第一個可以算的地方
    let target = null;
    (function walk(n) {
      if (target || n.t === 'num' || n.t === 'var') return;
      if (n.t === 'par') { if (n.a.t === 'num') { target = n; return; } walk(n.a); return; }
      if (n.t === 'neg') { if (n.a.t === 'num') { target = n; return; } walk(n.a); return; }
      walk(n.a); if (target) return; walk(n.b); if (target) return;
      if (n.a.t === 'num' && n.b.t === 'num') target = n;
    })(root);
    return target;
  }
  // 括號裡只剩一個數字時，直接去掉括號（不算一個步驟）
  function tidy(n) {
    if (!n || typeof n !== 'object' || n instanceof F) return n;
    if (n.a) n.a = tidy(n.a);
    if (n.b) n.b = tidy(n.b);
    if (n.t === 'par' && n.a.t === 'num') return n.a;
    return n;
  }
  function steps(src) {
    let root = parse(src);
    const out = [];
    const clone = (n) => JSON.parse(JSON.stringify(n), (k, v) => (v && v.n !== undefined && v.d !== undefined ? new F(v.n, v.d) : v));
    for (let guard = 0; guard < 40 && root.t !== 'num'; guard++) {
      const t = stepOnce(root);
      if (!t) break;
      const before = show(root, t);
      let label;
      if (t.t === 'par') label = '去括號';
      else if (t.t === 'neg') label = '取相反數';
      else label = { '+': '加法', '-': '減法', '*': '乘法', '/': '除法', '^': '乘方' }[t.op];
      const val = evaluate(t);
      Object.keys(t).forEach((k) => delete t[k]);
      Object.assign(t, { t: 'num', v: val });
      out.push({ before, label });
      root = tidy(clone(root));
    }
    return { steps: out, result: root.t === 'num' ? root.v : null, final: show(root) };
  }

  // ---------- 答案檢查 ----------
  function parseAnswer(str) {
    const s = String(str).trim();
    if (!s) return null;
    try { const v = evaluate(parse(s)); return v; } catch (e) { return null; }
  }
  // 比較兩個含 x 的式子是否相等（代入多個值）
  function sameExpr(a, b) {
    try {
      const A = parse(a), B = parse(b);
      return [-3, -1, 0, 2, 5, 7].every((x) => evaluate(A, { x }).eq(evaluate(B, { x })));
    } catch (e) { return false; }
  }

  // ---------- 題目產生器 ----------
  // cfg: { title, desc, levels: ['簡單','普通','挑戰'], gen(level) -> { q, ans (F|string), type: 'num'|'expr'|'text'|'choice', options, check(input), sol, hint } }
  function makePractice(host, cfg) {
    const body = frame(host, cfg.title, cfg.desc);
    const levels = cfg.levels || ['簡單', '普通', '挑戰'];
    body.innerHTML = `
      <div class="w-tabs">${levels.map((l, i) => `<button class="chip" data-l="${i}">${l}</button>`).join('')}<span class="w-tab-sep"></span><span class="pr-score"></span></div>
      <div class="pr-q"></div>
      <div class="pr-input"></div>
      <div class="w-chips"><button class="chip" data-k="check">✔ 檢查</button><button class="chip" data-k="sol">💡 看解答</button><button class="chip" data-k="next">下一題 →</button></div>
      <div class="pr-fb"></div>
      <p class="w-hint pr-tip">${cfg.tip || '分數請寫成 3/4，負數寫 -5；可以按 Enter 檢查。'}</p>`;
    const $ = (s) => body.querySelector(s);
    let level = 0, cur = null, done = false, score = { right: 0, total: 0, streak: 0 };
    function newQ() {
      cur = cfg.gen(level);
      done = false;
      $('.pr-q').innerHTML = cur.q;
      $('.pr-fb').innerHTML = '';
      if (cur.type === 'choice') {
        $('.pr-input').innerHTML = `<div class="w-chips">${cur.options.map((o, i) => `<button class="chip pr-opt" data-o="${i}">${o}</button>`).join('')}</div>`;
        body.querySelectorAll('.pr-opt').forEach((b) => b.addEventListener('click', () => check(+b.dataset.o, b)));
        $('[data-k="check"]').style.display = 'none';
      } else {
        $('.pr-input').innerHTML = `<input class="pr-box" type="text" autocomplete="off" placeholder="${cur.placeholder || '輸入答案'}">${cur.suffix ? `<span class="pr-suffix">${cur.suffix}</span>` : ''}`;
        $('[data-k="check"]').style.display = '';
        const box = $('.pr-box');
        box.addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (done) newQ(); else check(box.value); } });
        setTimeout(() => box.focus({ preventScroll: true }), 0);
      }
    }
    function judge(input) {
      if (cur.check) return cur.check(input);
      if (cur.type === 'choice') return input === cur.ans;
      if (cur.type === 'expr') return sameExpr(input, cur.ans);
      if (cur.type === 'text') return String(input).replace(/\s/g, '') === String(cur.ans).replace(/\s/g, '');
      const v = parseAnswer(input);
      return v !== null && v.eq(F.of(cur.ans));
    }
    function check(input, btn) {
      if (done) return;
      if (cur.type !== 'choice' && String(input).trim() === '') { $('.pr-fb').innerHTML = '<span class="w-hint">請先輸入答案。</span>'; return; }
      const ok = judge(input);
      score.total++;
      if (ok) { score.right++; score.streak++; } else score.streak = 0;
      done = true;
      if (cur.type === 'choice') body.querySelectorAll('.pr-opt').forEach((b) => { b.disabled = true; if (+b.dataset.o === cur.ans) b.classList.add('ok'); else if (b === btn) b.classList.add('bad'); });
      else $('.pr-box').classList.add(ok ? 'ok' : 'bad');
      $('.pr-fb').innerHTML = `<div class="explain"><span class="verdict ${ok ? 'ok' : 'no'}">${ok ? '✔ 答對了！' : '✘ 再想想，正確答案是 ' + (cur.ansHTML || (cur.ans instanceof F ? cur.ans.toHTML() : cur.ans))}</span>${cur.sol ? `<div class="pr-sol">${cur.sol}</div>` : ''}</div>`;
      $('.pr-score').innerHTML = `答對 <b>${score.right}</b> / ${score.total}${score.streak >= 3 ? `　🔥 連對 ${score.streak} 題` : ''}`;
    }
    $('[data-k="check"]').addEventListener('click', () => check($('.pr-box') ? $('.pr-box').value : ''));
    $('[data-k="sol"]').addEventListener('click', () => {
      if (!done) { score.total++; score.streak = 0; done = true; }
      $('.pr-fb').innerHTML = `<div class="explain"><span class="verdict no">正確答案：${cur.ansHTML || (cur.ans instanceof F ? cur.ans.toHTML() : cur.ans)}</span>${cur.sol ? `<div class="pr-sol">${cur.sol}</div>` : ''}</div>`;
      $('.pr-score').innerHTML = `答對 <b>${score.right}</b> / ${score.total}`;
    });
    $('[data-k="next"]').addEventListener('click', newQ);
    body.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => { level = +b.dataset.l; body.querySelectorAll('[data-l]').forEach((x) => x.classList.toggle('active', x === b)); newQ(); }));
    body.querySelector('[data-l="0"]').classList.add('active');
    newQ();
  }

  // ---------- 小工具 ----------
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const rndNZ = (a, b) => { let v; do v = rnd(a, b); while (v === 0); return v; };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const paren = (n) => (n < 0 ? `(${fmtInt(n)})` : fmtInt(n));
  const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  function primeFactors(n) { const f = {}; let d = 2; while (n > 1) { while (n % d === 0) { f[d] = (f[d] || 0) + 1; n /= d; } d++; if (d * d > n && n > 1) { f[n] = (f[n] || 0) + 1; break; } } return f; }
  const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
  const factorHTML = (f) => Object.keys(f).map(Number).sort((a, b) => a - b).map((p) => (f[p] > 1 ? `${p}<sup>${f[p]}</sup>` : `${p}`)).join(' × ');
  // 把 ax + b 寫成好看的字串
  function linear(a, b, v = 'x') {
    let s = '';
    if (a) s = (a === 1 ? '' : a === -1 ? '−' : fmtInt(a)) + v;
    if (b) s += s ? (b > 0 ? ' + ' + b : ' − ' + Math.abs(b)) : fmtInt(b);
    return s || '0';
  }

  window.MathCore = { F, gcd, lcm, parse, evaluate, steps, show, parseAnswer, sameExpr, makePractice, rnd, rndNZ, pick, paren, sup, fmtInt, primeFactors, isPrime, factorHTML, linear };
})();
