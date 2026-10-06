window.CHAPTERS.push({
  id: 'ch5', no: 5, icon: '⏰',
  title: '現在簡單式',
  summary: '一般動詞的現在簡單式、第三人稱單數加 s / es 的規則、do / does 的否定與疑問，以及頻率副詞。',
  notes: `
<h2>5-1 現在簡單式的用法</h2>
<ul>
  <li>表示<b>習慣、經常發生的事</b>或<b>不變的事實</b>：I <b>walk</b> to school every day. ／ The sun <b>rises</b> in the east.</li>
  <li>常搭配：every day、every morning、on Sundays、頻率副詞（always、usually、often、sometimes、never）。</li>
</ul>

<h2>5-2 第三人稱單數（he / she / it / 單數名詞）</h2>
<div class="table-wrap"><table>
  <tr><th>規則</th><th>例子</th></tr>
  <tr><td>一般動詞 + <b>s</b></td><td>play → plays、read → reads</td></tr>
  <tr><td>字尾 <b>s, x, sh, ch, o</b> + <b>es</b></td><td>watch → watches、wash → washes、go → goes、do → does</td></tr>
  <tr><td><b>子音 + y</b>：去 y 加 <b>ies</b></td><td>study → studies、fly → flies（但 play → plays）</td></tr>
  <tr><td><b>不規則</b></td><td>have → <b>has</b></td></tr>
</table></div>
<div data-widget="third-gen"></div>

<h2>5-3 否定句與疑問句（助動詞 do / does）</h2>
<div class="table-wrap"><table>
  <tr><th></th><th>I / you / we / they</th><th>he / she / it</th></tr>
  <tr><td>肯定</td><td>They <b>like</b> music.</td><td>She <b>likes</b> music.</td></tr>
  <tr><td>否定</td><td>They <b>don't like</b> music.</td><td>She <b>doesn't like</b> music.</td></tr>
  <tr><td>疑問</td><td><b>Do</b> they <b>like</b> music?</td><td><b>Does</b> she <b>like</b> music?</td></tr>
  <tr><td>簡答</td><td>Yes, they do. ／ No, they don't.</td><td>Yes, she does. ／ No, she doesn't.</td></tr>
</table></div>
<div class="box tip">用了 <b>does / doesn't</b>，後面的動詞要<b>還原成原形</b>：She doesn't <b>like</b>（✘ likes）. ／ Does he <b>play</b>（✘ plays）…?</div>

<h2>5-4 頻率副詞</h2>
<ul>
  <li><b>always</b>（總是 100%）＞ <b>usually</b>（通常）＞ <b>often</b>（常常）＞ <b>sometimes</b>（有時）＞ <b>never</b>（從不 0%）</li>
  <li>位置：放在<b>一般動詞前面</b>、<b>be 動詞後面</b>：I <b>often</b> read books. ／ He is <b>always</b> late.</li>
</ul>
<div data-widget="simple-builder"></div>
`,
  cards: [
    ['現在簡單式', '表示習慣或事實'],
    ['he/she/it + 動詞', '動詞加 s / es'],
    ['watch', 'watches'],
    ['study', 'studies'],
    ['have', 'has'],
    ['go / do', 'goes / does'],
    ['否定（第三人稱單數）', 'doesn\'t + 原形動詞'],
    ['疑問（第三人稱單數）', 'Does + 主詞 + 原形動詞 …?'],
    ['always', '總是（100%）'],
    ['never', '從不（0%）'],
    ['頻率副詞位置', '一般動詞前、be 動詞後']
  ],
  quiz: [
    { q: 'He ___ to school every day.', o: ['walk', 'walks', 'walking', 'is walk'], a: 1, e: '第三人稱單數，動詞加 s。' },
    { q: 'My mother ___ TV in the evening.', o: ['watch', 'watchs', 'watches', 'watchies'], a: 2, e: '字尾 ch 加 es。' },
    { q: 'Tom ___ English very hard.', o: ['study', 'studys', 'studies', 'studyes'], a: 2, e: '子音 + y：去 y 加 ies。' },
    { q: 'She ___ two brothers.', o: ['have', 'has', 'haves', 'is have'], a: 1, e: 'have 的第三人稱單數是 has。' },
    { q: 'They ___ like coffee.', o: ['doesn\'t', 'don\'t', 'isn\'t', 'not'], a: 1, e: 'they 用 don\'t。' },
    { q: 'He ___ play basketball on Sundays.', o: ['don\'t', 'doesn\'t', 'isn\'t', 'aren\'t'], a: 1, e: 'he 用 doesn\'t。' },
    { q: 'Does your sister ___ the piano?', o: ['plays', 'play', 'playing', 'played'], a: 1, e: 'Does 後面接原形動詞。' },
    { q: 'A: Do you like dogs?　B: Yes, ___', o: ['I do.', 'I am.', 'I like.', 'you do.'], a: 0, e: '用 do 問就用 do 回答。' },
    { q: 'A: Does Amy live in Taipei?　B: No, ___', o: ['she don\'t.', 'she doesn\'t.', 'she isn\'t.', 'Amy not.'], a: 1, e: 'No, she doesn\'t.' },
    { q: '下列哪一個句子「正確」？', o: ['She don\'t like math.', 'He goes to bed at ten.', 'Does he plays soccer?', 'They likes music.'], a: 1, e: 'go → goes；其他選項文法錯誤。' },
    { q: 'I ___ eat breakfast. It\'s 100%!', o: ['never', 'sometimes', 'always', 'often'], a: 2, e: '100% 是 always。' },
    { q: '頻率副詞的位置何者正確？', o: ['I read often books.', 'I often read books.', 'Often I books read.', 'I read books often is.'], a: 1, e: '頻率副詞放在一般動詞前面。' }
  ]
});
