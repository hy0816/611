window.CHAPTERS.push({
  id: 'ch1', no: 1, icon: '🔠',
  title: '冠詞 a / an 與打招呼',
  summary: 'a 與 an 的用法（看第一個發音），以及打招呼、問候、自我介紹、道謝與道歉的說法。',
  notes: `
<h2>1-1 a 與 an</h2>
<p>表示「一個」時，看後面單字的<b>第一個發音</b>（不是看字母）：</p>
<div class="table-wrap"><table>
  <tr><th></th><th>規則</th><th>例子</th></tr>
  <tr><td><b>a</b></td><td>後面接<b>子音開頭</b>的發音</td><td>a book、a dog、a <b>u</b>niform（u 唸 /ju/）</td></tr>
  <tr><td><b>an</b></td><td>後面接<b>母音開頭</b>的發音</td><td>an apple、an egg、an <b>h</b>our（h 不發音）</td></tr>
</table></div>
<div data-widget="a-an-gen"></div>

<h2>1-2 打招呼與自我介紹</h2>
<div class="table-wrap"><table>
  <tr><th>情境</th><th>說法</th><th>回應</th></tr>
  <tr><td>打招呼</td><td>Hello! / Hi! / Good morning.</td><td>Hello! / Good morning.</td></tr>
  <tr><td>問候</td><td>How are you?</td><td>I'm fine, thank you. / I'm good.</td></tr>
  <tr><td>初次見面</td><td>Nice to meet you.</td><td>Nice to meet you, too.</td></tr>
  <tr><td>問名字</td><td>What's your name?</td><td>My name is Amy. / I'm Amy.</td></tr>
  <tr><td>道別</td><td>Goodbye. / See you.</td><td>Bye! / See you later.</td></tr>
  <tr><td>道謝</td><td>Thank you.</td><td>You're welcome.</td></tr>
  <tr><td>道歉</td><td>I'm sorry.</td><td>That's OK.</td></tr>
</table></div>
<div data-widget="greet-match"></div>
`,
  cards: [
    ['a + 子音發音', 'a book、a uniform'],
    ['an + 母音發音', 'an apple、an hour'],
    ['How are you?', 'I\'m fine, thank you.'],
    ['Nice to meet you.', 'Nice to meet you, too.'],
    ['What\'s your name?', 'My name is ___. / I\'m ___.'],
    ['Thank you.', 'You\'re welcome.'],
    ['I\'m sorry.', 'That\'s OK.'],
    ['Goodbye. / See you.', 'Bye! / See you later.']
  ],
  quiz: [
    { q: '___ apple', o: ['a', 'an', 'the a', '不用填'], a: 1, e: 'apple 是母音開頭，用 an。' },
    { q: '___ book', o: ['a', 'an', 'two', 'many'], a: 0, e: 'book 是子音開頭，用 a。' },
    { q: '___ hour（一小時）', o: ['a', 'an', 'some', 'two'], a: 1, e: 'hour 的 h 不發音，以母音開頭，用 an。' },
    { q: '___ uniform（一套制服）', o: ['a', 'an', 'two', 'many'], a: 0, e: 'uniform 的 u 唸 /ju/，是子音開頭，用 a。' },
    { q: 'A: How are you?　B: ___', o: ['I\'m fine, thank you.', 'I\'m Amy.', 'Nice to meet you.', 'You\'re welcome.'], a: 0, e: 'How are you? 是問候對方過得好不好。' },
    { q: 'A: Nice to meet you.　B: ___', o: ['Nice to meet you, too.', 'I\'m fine.', 'Goodbye.', 'That\'s OK.'], a: 0, e: '回應 Nice to meet you, too.' },
    { q: 'A: Thank you.　B: ___', o: ['I\'m sorry.', 'You\'re welcome.', 'Good morning.', 'See you.'], a: 1, e: '回應道謝用 You\'re welcome.' },
    { q: 'A: What\'s your name?　B: ___', o: ['I\'m fine.', 'My name is Ken.', 'Thank you.', 'It\'s a book.'], a: 1, e: '問名字回答 My name is ___.' },
    { q: '___ egg and ___ banana', o: ['a / a', 'an / a', 'a / an', 'an / an'], a: 1, e: 'egg 母音開頭用 an；banana 子音開頭用 a。' },
    { q: 'A: I\'m sorry.　B: ___', o: ['That\'s OK.', 'You\'re welcome.', 'Nice to meet you.', 'I\'m fine.'], a: 0, e: '回應道歉用 That\'s OK.' },
    { q: 'A: Goodbye, Mr. Lin.　B: ___', o: ['Good morning.', 'See you tomorrow.', 'Thank you.', 'I\'m fine.'], a: 1, e: '道別可回 Bye! / See you tomorrow.' },
    { q: '早上見到老師，應該說？', o: ['Good night.', 'Good morning.', 'Goodbye.', 'You\'re welcome.'], a: 1, e: '早上問好用 Good morning.' }
  ]
});
