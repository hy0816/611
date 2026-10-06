window.CHAPTERS.push({
  id: 'u7', no: 7, label: '2-3', mark: '2-3', icon: '🍫',
  title: '分數的運算與指數律',
  summary: '負分數、約分與擴分、分數的大小比較與四則運算，以及指數律與負指數。',
  notes: `
<h2>1. 分數的基本性質</h2>
<ul>
  <li><b>擴分</b>：分子、分母同乘一個不為 0 的數；<b>約分</b>：分子、分母同除以公因數。分數的值不變。</li>
  <li><b>最簡分數</b>：分子、分母互質。約分時可以直接除以最大公因數。</li>
  <li>負分數的寫法：<span class="frac"><span>−3</span><span>4</span></span> = <span class="frac"><span>3</span><span>−4</span></span> = −<span class="frac"><span>3</span><span>4</span></span>，通常寫成最後一種。</li>
  <li>比較大小：先<b>通分</b>（化成同分母）再比較分子；負分數比較時，絕對值大的反而小。</li>
</ul>

<h2>2. 分數的加減</h2>
<p>先<b>通分</b>（分母取最小公倍數），分子相加減，最後<b>約分</b>。例：<span class="frac"><span>1</span><span>4</span></span> − <span class="frac"><span>5</span><span>6</span></span> = <span class="frac"><span>3</span><span>12</span></span> − <span class="frac"><span>10</span><span>12</span></span> = −<span class="frac"><span>7</span><span>12</span></span></p>
<div data-widget="frac-bars"></div>

<h2>3. 分數的乘除</h2>
<ul>
  <li><b>乘法</b>：分子乘分子、分母乘分母，可以先<b>約分</b>再乘。正負號規則與整數相同。</li>
  <li><b>倒數</b>：乘積為 1 的兩數互為倒數。<span class="frac"><span>a</span><span>b</span></span> 的倒數是 <span class="frac"><span>b</span><span>a</span></span>；<b>0 沒有倒數</b>。</li>
  <li><b>除法</b>：除以一個數等於<b>乘以它的倒數</b>。例：<span class="frac"><span>2</span><span>3</span></span> ÷ (−<span class="frac"><span>4</span><span>9</span></span>) = <span class="frac"><span>2</span><span>3</span></span> × (−<span class="frac"><span>9</span><span>4</span></span>) = −<span class="frac"><span>3</span><span>2</span></span></li>
  <li>四則運算順序與整數相同：括號 → 乘方 → 乘除 → 加減。</li>
</ul>
<div data-widget="gen-u7a"></div>

<h2>4. 指數律</h2>
<div class="table-wrap"><table>
  <tr><th>指數律</th><th>例子</th></tr>
  <tr><td>a<sup>m</sup> × a<sup>n</sup> = a<sup>m+n</sup></td><td>2<sup>3</sup> × 2<sup>4</sup> = 2<sup>7</sup></td></tr>
  <tr><td>a<sup>m</sup> ÷ a<sup>n</sup> = a<sup>m−n</sup>（a ≠ 0）</td><td>5<sup>6</sup> ÷ 5<sup>2</sup> = 5<sup>4</sup></td></tr>
  <tr><td>(a<sup>m</sup>)<sup>n</sup> = a<sup>m×n</sup></td><td>(3<sup>2</sup>)<sup>4</sup> = 3<sup>8</sup></td></tr>
  <tr><td>(a × b)<sup>n</sup> = a<sup>n</sup> × b<sup>n</sup></td><td>(2 × 5)<sup>3</sup> = 2<sup>3</sup> × 5<sup>3</sup></td></tr>
  <tr><td>a<sup>0</sup> = 1（a ≠ 0）</td><td>2026<sup>0</sup> = 1</td></tr>
  <tr><td>a<sup>−n</sup> = <span class="frac"><span>1</span><span>a<sup>n</sup></span></span>（a ≠ 0）</td><td>10<sup>−3</sup> = <span class="frac"><span>1</span><span>1000</span></span> = 0.001</td></tr>
</table></div>
<ul><li>很小的數可用科學記號表示：0.00056 = 5.6 × 10<sup>−4</sup>。</li></ul>
<div class="box tip">常見錯誤：2<sup>3</sup> × 2<sup>4</sup> ≠ 2<sup>12</sup>（指數是相加不是相乘）；2<sup>3</sup> × 3<sup>4</sup> 底數不同，不能直接用指數律合併。</div>
<div data-widget="gen-u7b"></div>
`,
  cards: [
    ['約分', '分子、分母同除以公因數，值不變。'],
    ['最簡分數', '分子與分母互質。'],
    ['分數加減', '先通分，再把分子相加減，最後約分。'],
    ['倒數', '乘積為 1 的兩數；0 沒有倒數。'],
    ['分數除法', '除以一數 = 乘以它的倒數。'],
    ['aᵐ × aⁿ', '= aᵐ⁺ⁿ'],
    ['aᵐ ÷ aⁿ', '= aᵐ⁻ⁿ'],
    ['(aᵐ)ⁿ', '= aᵐⁿ'],
    ['a⁰', '= 1（a ≠ 0）'],
    ['a⁻ⁿ', '= 1/aⁿ（a ≠ 0）']
  ],
  quiz: [
    { q: '把 18/24 約分成最簡分數是？', o: ['9/12', '3/4', '6/8', '2/3'], a: 1, e: '分子分母同除以 (18, 24) = 6。' },
    { q: '下列哪一個分數最大？', o: ['−2/3', '−3/4', '−5/6', '−1/2'], a: 3, e: '負分數絕對值愈小愈大：1/2 最小，所以 −1/2 最大。' },
    { q: '1/4 − 5/6 = ?', o: ['−4/2', '−7/12', '7/12', '−1/3'], a: 1, e: '3/12 − 10/12 = −7/12。' },
    { q: '(−2/3) × (9/8) = ?', o: ['−3/4', '3/4', '−18/24', '−4/3'], a: 0, e: '先約分再乘：−(2×9)/(3×8) = −3/4。' },
    { q: '−3/5 的倒數是？', o: ['3/5', '5/3', '−5/3', '−3/5'], a: 2, e: '倒數不改變正負號。' },
    { q: '(3/4) ÷ (−9/8) = ?', o: ['−2/3', '−27/32', '2/3', '−3/2'], a: 0, e: '3/4 × (−8/9) = −24/36 = −2/3。' },
    { q: '下列何者沒有倒數？', o: ['1', '−1', '0', '1/2'], a: 2, e: '0 沒有倒數。' },
    { q: '3⁴ × 3⁵ = ?', o: ['3²⁰', '3⁹', '9⁹', '3¹'], a: 1, e: '同底數相乘，指數相加。' },
    { q: '(2³)⁴ = ?', o: ['2⁷', '2¹²', '2⁸¹', '8⁷'], a: 1, e: '乘方的乘方，指數相乘。' },
    { q: '7⁰ = ?', o: ['0', '1', '7', '無意義'], a: 1, e: '任何不為 0 的數的 0 次方都是 1。' },
    { q: '2⁻³ = ?', o: ['−8', '−6', '1/8', '8'], a: 2, e: 'a⁻ⁿ = 1/aⁿ，2⁻³ = 1/8。' },
    { q: '0.00072 用科學記號表示為？', o: ['7.2 × 10⁻⁴', '72 × 10⁻⁵', '7.2 × 10⁴', '0.72 × 10⁻³'], a: 0, e: '小數點向右移 4 位，指數為 −4。' }
  ]
});
