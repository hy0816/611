window.CHAPTERS.push({
  id: 'ch3', no: 3, icon: '🍎',
  title: '指示代名詞與名詞單複數',
  summary: 'this / that / these / those 的用法、名詞複數的變化規則、不規則複數，以及 How many 問數量。',
  notes: `
<h2>3-1 指示代名詞</h2>
<div class="table-wrap"><table>
  <tr><th></th><th>近（這）</th><th>遠（那）</th></tr>
  <tr><td>單數</td><td><b>This is</b> a pen.</td><td><b>That is</b> (That's) a ruler.</td></tr>
  <tr><td>複數</td><td><b>These are</b> pens.</td><td><b>Those are</b> rulers.</td></tr>
</table></div>
<ul>
  <li>回答時用代名詞：Is this your bag? → Yes, <b>it</b> is.　Are these your books? → Yes, <b>they</b> are.</li>
  <li>問「這是什麼？」：<b>What is this?</b> → It's an eraser.　<b>What are these?</b> → They're erasers.</li>
</ul>

<h2>3-2 名詞的複數</h2>
<div class="table-wrap"><table>
  <tr><th>規則</th><th>例子</th></tr>
  <tr><td>一般名詞 + <b>s</b></td><td>book → books、cat → cats</td></tr>
  <tr><td>字尾 <b>s, x, sh, ch, o</b> + <b>es</b></td><td>bus → buses、box → boxes、dish → dishes、watch → watches、tomato → tomatoes</td></tr>
  <tr><td><b>子音 + y</b>：去 y 加 <b>ies</b></td><td>baby → babies、city → cities（但 boy → boys，因為 o 是母音）</td></tr>
  <tr><td>字尾 <b>f / fe</b>：改 <b>ves</b></td><td>leaf → leaves、knife → knives</td></tr>
  <tr><td><b>不規則</b></td><td>man → men、woman → women、child → children、foot → feet、tooth → teeth、mouse → mice</td></tr>
  <tr><td><b>單複數同形</b></td><td>fish → fish、sheep → sheep、deer → deer</td></tr>
</table></div>
<div class="box tip">例外要注意：photo → photos、piano → pianos（字尾 o 只加 s）；roof → roofs。</div>
<div data-widget="plural-gen"></div>

<h2>3-3 問數量</h2>
<ul>
  <li><b>How many + 複數名詞 + are there?</b>　How many <b>apples</b> are there? → There are five apples.</li>
  <li>數字一以上，名詞要用<b>複數</b>：one book、two book<b>s</b>。</li>
</ul>
<div data-widget="this-these-gen"></div>
`,
  cards: [
    ['this / that', '這（近）／那（遠），單數'],
    ['these / those', '這些／那些，複數'],
    ['box', 'boxes（字尾 x 加 es）'],
    ['baby', 'babies（子音 + y → ies）'],
    ['boy', 'boys（母音 + y 直接加 s）'],
    ['leaf', 'leaves（f → ves）'],
    ['child', 'children'],
    ['foot', 'feet'],
    ['tooth', 'teeth'],
    ['fish / sheep', '單複數同形'],
    ['How many ...?', '問數量，後接複數名詞']
  ],
  quiz: [
    { q: '___ are my books.（這些）', o: ['This', 'That', 'These', 'It'], a: 2, e: '近的複數用 these。' },
    { q: '___ is a bird over there.（那）', o: ['This', 'That', 'These', 'Those'], a: 1, e: '遠的單數用 that。' },
    { q: 'A: Are those your shoes?　B: Yes, ___', o: ['it is.', 'they are.', 'those is.', 'I am.'], a: 1, e: '複數回答用 they。' },
    { q: 'box 的複數是？', o: ['boxs', 'boxes', 'boxies', 'box'], a: 1, e: '字尾 x 加 es。' },
    { q: 'baby 的複數是？', o: ['babys', 'babies', 'babyes', 'baby'], a: 1, e: '子音 + y：去 y 加 ies。' },
    { q: 'boy 的複數是？', o: ['boys', 'boies', 'boyes', 'boy'], a: 0, e: '母音 + y 直接加 s。' },
    { q: 'child 的複數是？', o: ['childs', 'childes', 'children', 'childrens'], a: 2, e: '不規則變化：children。' },
    { q: 'foot 的複數是？', o: ['foots', 'feet', 'feets', 'footes'], a: 1, e: '不規則變化：feet。' },
    { q: 'leaf 的複數是？', o: ['leafs', 'leaves', 'leafes', 'leavs'], a: 1, e: 'f 改成 ves。' },
    { q: 'There are three ___ in the river.', o: ['fish', 'fishs', 'fishies', 'a fish'], a: 0, e: 'fish 單複數同形。' },
    { q: 'How many ___ do you have?', o: ['pencil', 'pencils', 'a pencil', 'pencilies'], a: 1, e: 'How many 後面接複數名詞。' },
    { q: 'What are these?', o: ['It\'s a cup.', 'They\'re cups.', 'This is a cup.', 'These is cups.'], a: 1, e: 'these 是複數，用 They\'re 回答。' }
  ]
});
