window.CHAPTERS.push({
  id: 'ch4', no: 4, icon: '👪',
  title: '所有格與疑問詞',
  summary: '所有格形容詞（my / your / his …）、名詞所有格 \'s、所有格代名詞，以及 Who / What / Where / How old 等疑問詞。',
  notes: `
<h2>4-1 所有格</h2>
<div class="table-wrap"><table>
  <tr><th>主格</th><th>所有格（+ 名詞）</th><th>所有格代名詞（單獨使用）</th></tr>
  <tr><td>I</td><td><b>my</b> book</td><td><b>mine</b></td></tr>
  <tr><td>you</td><td><b>your</b> book</td><td><b>yours</b></td></tr>
  <tr><td>he</td><td><b>his</b> book</td><td><b>his</b></td></tr>
  <tr><td>she</td><td><b>her</b> book</td><td><b>hers</b></td></tr>
  <tr><td>it</td><td><b>its</b> tail</td><td>—</td></tr>
  <tr><td>we</td><td><b>our</b> book</td><td><b>ours</b></td></tr>
  <tr><td>they</td><td><b>their</b> book</td><td><b>theirs</b></td></tr>
</table></div>
<ul>
  <li>所有格後面<b>一定要接名詞</b>：This is <b>my</b> bag. ／ 所有格代名詞<b>不接名詞</b>：This bag is <b>mine</b>.（mine = my bag）</li>
  <li><b>名詞所有格</b>：名詞 + <b>'s</b>：Tom<b>'s</b> bike、my mother<b>'s</b> car。字尾是 s 的複數名詞只加 <b>'</b>：the students<b>'</b> books。</li>
  <li>注意：<b>its</b>（它的）≠ <b>it's</b>（it is）。</li>
</ul>
<div data-widget="poss-gen"></div>

<h2>4-2 疑問詞</h2>
<div class="table-wrap"><table>
  <tr><th>疑問詞</th><th>問什麼</th><th>例句</th><th>回答</th></tr>
  <tr><td><b>Who</b></td><td>誰</td><td>Who is that girl?</td><td>She's my sister.</td></tr>
  <tr><td><b>What</b></td><td>什麼</td><td>What is your name?</td><td>My name is Ann.</td></tr>
  <tr><td><b>Where</b></td><td>哪裡</td><td>Where is my cap?</td><td>It's on the desk.</td></tr>
  <tr><td><b>How old</b></td><td>幾歲</td><td>How old are you?</td><td>I'm thirteen (years old).</td></tr>
  <tr><td><b>Whose</b></td><td>誰的</td><td>Whose bag is this?</td><td>It's Tom's.</td></tr>
  <tr><td><b>How</b></td><td>如何、怎麼樣</td><td>How are you?</td><td>I'm fine.</td></tr>
</table></div>
<div class="box tip">疑問詞問句的 be 動詞放在疑問詞後面：<b>Where are</b> my keys? 回答時<b>不用</b> Yes / No。</div>
<div data-widget="wh-gen"></div>
`,
  cards: [
    ['my / mine', '我的（+名詞）／我的東西'],
    ['your / yours', '你的／你的東西'],
    ['his', '他的（兩種用法同形）'],
    ['her / hers', '她的／她的東西'],
    ['its', '它的（≠ it\'s）'],
    ['our / ours', '我們的'],
    ['their / theirs', '他們的'],
    ['Tom\'s', '名詞所有格：Tom 的'],
    ['Who', '問「誰」'],
    ['Where', '問「哪裡」'],
    ['How old', '問「幾歲」'],
    ['Whose', '問「誰的」']
  ],
  quiz: [
    { q: 'This is ___ pencil box.（我的）', o: ['I', 'me', 'my', 'mine'], a: 2, e: '所有格 my + 名詞。' },
    { q: 'The red bag is ___.（她的）', o: ['she', 'her', 'hers', 'she\'s'], a: 2, e: '單獨使用，用所有格代名詞 hers。' },
    { q: 'They are ___ parents.（他們的）', o: ['they', 'them', 'their', 'theirs'], a: 2, e: 'their + 名詞。' },
    { q: 'The dog is wagging ___ tail.（牠的）', o: ['it', 'its', 'it\'s', 'it is'], a: 1, e: 'its 是「它的」；it\'s 是 it is。' },
    { q: 'This is ___ bike.（Tom 的）', o: ['Tom', 'Toms', 'Tom\'s', 'Toms\''], a: 2, e: '名詞所有格加 \'s。' },
    { q: '「This book is mine.」中的 mine 等於？', o: ['I', 'my book', 'me', 'my'], a: 1, e: 'mine = my book。' },
    { q: '___ is that boy? He\'s my brother.', o: ['What', 'Who', 'Where', 'How'], a: 1, e: '問「誰」用 Who。' },
    { q: '___ is my phone? It\'s on the sofa.', o: ['Who', 'What', 'Where', 'How old'], a: 2, e: '問地點用 Where。' },
    { q: '___ are you? I\'m twelve.', o: ['How old', 'How many', 'What', 'Who'], a: 0, e: '問年齡用 How old。' },
    { q: '___ umbrella is this? It\'s Amy\'s.', o: ['Who', 'Whose', 'What', 'Where'], a: 1, e: '問「誰的」用 Whose。' },
    { q: 'A: What\'s your favorite color?　B: ___', o: ['Yes, it is.', 'It\'s blue.', 'I\'m fine.', 'She\'s my mom.'], a: 1, e: '疑問詞問句不用 Yes / No 回答。' },
    { q: 'We love ___ school.（我們的）', o: ['we', 'us', 'our', 'ours'], a: 2, e: 'our + 名詞。' }
  ]
});
