window.CHAPTERS.push({
  id: 'ch2', no: 2, icon: '🙋',
  title: 'be 動詞與人稱代名詞',
  summary: '主格人稱代名詞、be 動詞 am / is / are 的用法、縮寫，以及否定句與疑問句。',
  notes: `
<h2>2-1 人稱代名詞（主格）與 be 動詞</h2>
<div class="table-wrap"><table>
  <tr><th></th><th>單數</th><th>複數</th></tr>
  <tr><td>第一人稱（我）</td><td><b>I am</b>（I'm）</td><td><b>We are</b>（We're）我們</td></tr>
  <tr><td>第二人稱（你）</td><td><b>You are</b>（You're）你</td><td><b>You are</b> 你們</td></tr>
  <tr><td>第三人稱（他、她、它）</td><td><b>He is</b>（He's）／<b>She is</b>（She's）／<b>It is</b>（It's）</td><td><b>They are</b>（They're）他們、它們</td></tr>
</table></div>
<div class="box memo">口訣：「<b>I 用 am，you 用 are，is 跟著他她它，複數通通都用 are</b>」。</div>
<ul>
  <li>人名、單數名詞當主詞 → 用 <b>is</b>：Tom <b>is</b> my friend. / The cat <b>is</b> cute.</li>
  <li>兩個人以上、複數名詞 → 用 <b>are</b>：Tom and I <b>are</b> students. / The cats <b>are</b> cute.</li>
</ul>
<div data-widget="be-gen"></div>

<h2>2-2 否定句與疑問句</h2>
<div class="table-wrap"><table>
  <tr><th>句型</th><th>做法</th><th>例句</th></tr>
  <tr><td>肯定句</td><td>主詞 + be + …</td><td>She is a teacher.</td></tr>
  <tr><td><b>否定句</b></td><td>在 be 動詞<b>後面</b>加 <b>not</b></td><td>She is <b>not</b> (isn't) a teacher.</td></tr>
  <tr><td><b>疑問句</b></td><td>把 be 動詞<b>移到句首</b>，句尾改問號</td><td><b>Is</b> she a teacher?</td></tr>
  <tr><td>簡答</td><td>Yes, 主詞 + be. ／ No, 主詞 + be + not.</td><td>Yes, she <b>is</b>. ／ No, she <b>isn't</b>.</td></tr>
</table></div>
<ul>
  <li>縮寫：is not = <b>isn't</b>、are not = <b>aren't</b>；am not <b>不縮寫</b>成 amn't，要寫 I'm not。</li>
  <li>肯定簡答<b>不可縮寫</b>：Yes, I am.（✘ Yes, I'm.）</li>
  <li>問 you（你）時，回答要用 I：Are you a student? → Yes, <b>I am</b>.</li>
</ul>
<div data-widget="be-builder"></div>
`,
  cards: [
    ['I', 'am（I\'m）'],
    ['you / we / they', 'are'],
    ['he / she / it', 'is'],
    ['Tom and I', 'are（複數）'],
    ['否定句', 'be 動詞後加 not'],
    ['疑問句', 'be 動詞移到句首'],
    ['isn\'t / aren\'t', 'is not / are not 的縮寫'],
    ['Yes, I am.', '肯定簡答不可縮寫成 Yes, I\'m.'],
    ['Are you ...?', '回答用 I：Yes, I am. / No, I\'m not.']
  ],
  quiz: [
    { q: 'I ___ a student.', o: ['am', 'is', 'are', 'be'], a: 0, e: 'I 搭配 am。' },
    { q: 'She ___ my sister.', o: ['am', 'is', 'are', 'be'], a: 1, e: 'she 搭配 is。' },
    { q: 'They ___ good friends.', o: ['am', 'is', 'are', 'be'], a: 2, e: 'they 搭配 are。' },
    { q: 'Tom and Mary ___ in the classroom.', o: ['am', 'is', 'are', 'be'], a: 2, e: '兩個人是複數，用 are。' },
    { q: 'My dog ___ very cute.', o: ['am', 'is', 'are', 'be'], a: 1, e: '單數名詞用 is。' },
    { q: '把「He is a doctor.」改成否定句：', o: ['He not is a doctor.', 'He is not a doctor.', 'He don\'t a doctor.', 'Not he is a doctor.'], a: 1, e: '在 be 動詞後面加 not。' },
    { q: '把「You are a student.」改成疑問句：', o: ['You are a student?', 'Are you a student?', 'Do you a student?', 'Is you a student?'], a: 1, e: '把 be 動詞移到句首。' },
    { q: 'A: Are you twelve years old?　B: Yes, ___', o: ['you are.', 'I am.', 'I\'m.', 'I is.'], a: 1, e: '問 you 用 I 回答；肯定簡答不縮寫。' },
    { q: 'A: Is it your pen?　B: No, ___', o: ['it isn\'t.', 'it is.', 'it aren\'t.', 'I\'m not.'], a: 0, e: 'No, it isn\'t.' },
    { q: '「I am not」的縮寫是？', o: ['I amn\'t', 'I\'m not', 'I isn\'t', 'I aren\'t'], a: 1, e: 'am not 不能縮寫成 amn\'t，要寫 I\'m not。' },
    { q: 'We ___ not tired.', o: ['am', 'is', 'are', 'be'], a: 2, e: 'we 搭配 are。' },
    { q: '___ he your English teacher?', o: ['Am', 'Is', 'Are', 'Do'], a: 1, e: 'he 搭配 is，疑問句 is 放句首。' }
  ]
});
