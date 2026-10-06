// 全冊模擬卷（第三次段考・全冊總複習用），題目不與各章練習題重複
window.EXAM_SETS = [
  {
    id: 'setA', mark: 'A', name: '全冊模擬卷 A',
    quiz: [
      { ch: 'ready', q: '「50」的英文是？', o: ['fifty', 'fivety', 'fifteen', 'fiveteen'], a: 0, e: '50 = fifty；15 = fifteen。' },
      { ch: 'ready', q: 'What day comes after Wednesday?', o: ['Thursday', 'Tuesday', 'Friday', 'Monday'], a: 0, e: '星期三的下一天是星期四 Thursday。' },
      { ch: 'ready', q: '下列哪一個字的 o 唸短母音 /ɑ/？', o: ['hot', 'home', 'nose', 'rope'], a: 0, e: 'hot 是子音＋母音＋子音；其他字尾有不發音的 e，o 唸長音。' },
      { ch: 'ch1', q: 'I have ___ umbrella and ___ uniform.', o: ['an / a', 'a / an', 'an / an', 'a / a'], a: 0, e: 'umbrella 的 u 唸 /ʌ/（母音）用 an；uniform 的 u 唸 /ju/（子音）用 a。' },
      { ch: 'ch1', q: 'A: Good night, Mom.　B: ___', o: ['Good night.', 'Good morning.', 'You\'re welcome.', 'Nice to meet you.'], a: 0, e: '睡前道晚安，回 Good night.' },
      { ch: 'ch1', q: 'A: How are you today?　B: ___', o: ['I\'m great, thanks.', 'I\'m Amy.', 'It\'s a book.', 'You\'re welcome.'], a: 0, e: 'How are you? 問近況。' },
      { ch: 'ch2', q: 'Amy and I ___ classmates.', o: ['are', 'am', 'is', 'be'], a: 0, e: 'Amy and I = we，用 are。' },
      { ch: 'ch2', q: '___ your brother a student?', o: ['Is', 'Are', 'Am', 'Do'], a: 0, e: 'your brother 是第三人稱單數，用 Is。' },
      { ch: 'ch2', q: 'A: Are you and Tom friends?　B: Yes, ___', o: ['we are.', 'you are.', 'they are.', 'I am.'], a: 0, e: '問 you and Tom，回答用 we。' },
      { ch: 'ch3', q: 'watch 的複數是？', o: ['watches', 'watchs', 'watchies', 'watch'], a: 0, e: '字尾 ch 加 es。' },
      { ch: 'ch3', q: '___ are my shoes over there.', o: ['Those', 'This', 'That', 'These'], a: 0, e: 'over there（遠）＋複數 → Those。' },
      { ch: 'ch3', q: 'There are two ___ in the box.', o: ['mice', 'mouse', 'mouses', 'mices'], a: 0, e: 'mouse 的複數是不規則的 mice。' },
      { ch: 'ch4', q: 'This is Tom. ___ bike is blue.', o: ['His', 'He', 'Him', 'He\'s'], a: 0, e: '後面接名詞 bike，用所有格 His。' },
      { ch: 'ch4', q: 'A: ___ are your parents?　B: They\'re in the kitchen.', o: ['Where', 'Who', 'What', 'How old'], a: 0, e: '回答地點，用 Where 問。' },
      { ch: 'ch4', q: 'These are ___ pencils.（我們的）', o: ['our', 'ours', 'us', 'we'], a: 0, e: '後面接名詞用所有格 our。' },
      { ch: 'ch5', q: 'My sister ___ her homework after dinner every day.', o: ['does', 'do', 'doing', 'is do'], a: 0, e: '第三人稱單數，do → does。' },
      { ch: 'ch5', q: 'A: Does Ben like soccer?　B: Yes, ___', o: ['he does.', 'he is.', 'he likes.', 'Ben do.'], a: 0, e: '用 Does 問，用 does 回答。' },
      { ch: 'ch5', q: 'We ___ go to school on Sundays.', o: ['don\'t', 'doesn\'t', 'aren\'t', 'not'], a: 0, e: 'we 搭配 don\'t + 原形動詞。' },
      { ch: 'ch6', q: '___ late for school!', o: ['Don\'t be', 'Not be', 'Don\'t', 'Be not'], a: 0, e: 'late 是形容詞，否定祈使句用 Don\'t be。' },
      { ch: 'ch6', q: 'A: Can you ride a bike?　B: ___', o: ['Yes, I can.', 'Yes, I do.', 'Yes, I am.', 'Yes, I ride.'], a: 0, e: '用 can 問，用 can 回答。' }
    ]
  },
  {
    id: 'setB', mark: 'B', name: '全冊模擬卷 B',
    quiz: [
      { ch: 'ready', q: '「thirty-four」是多少？', o: ['34', '43', '304', '14'], a: 0, e: 'thirty（30）+ four（4）= 34。' },
      { ch: 'ready', q: 'December 是幾月？', o: ['十二月', '十月', '十一月', '九月'], a: 0, e: 'December（Dec.）是十二月。' },
      { ch: 'ch1', q: '___ honest boy', o: ['an', 'a', 'two', 'many'], a: 0, e: 'honest 的 h 不發音，以母音開頭，用 an。' },
      { ch: 'ch1', q: 'A: I\'m sorry I\'m late.　B: ___', o: ['That\'s OK.', 'You\'re welcome.', 'Thank you.', 'Nice to meet you.'], a: 0, e: '回應道歉用 That\'s OK.' },
      { ch: 'ch2', q: '把「He is my teacher.」改成否定句：', o: ['He isn\'t my teacher.', 'He not is my teacher.', 'He doesn\'t my teacher.', 'He aren\'t my teacher.'], a: 0, e: 'be 動詞的否定直接在後面加 not：isn\'t。' },
      { ch: 'ch2', q: 'I ___ twelve years old.', o: ['am', 'is', 'are', 'be'], a: 0, e: 'I 搭配 am。' },
      { ch: 'ch2', q: 'They\'re 是哪兩個字的縮寫？', o: ['They are', 'They is', 'Their', 'There are'], a: 0, e: 'They\'re = They are。' },
      { ch: 'ch3', q: '下列單複數的配對，何者「錯誤」？', o: ['knife – knifes', 'man – men', 'child – children', 'tooth – teeth'], a: 0, e: 'knife 的複數是 knives。' },
      { ch: 'ch3', q: 'A: What are these?　B: ___', o: ['They\'re erasers.', 'It\'s an eraser.', 'This is erasers.', 'These is eraser.'], a: 0, e: 'these 是複數，用 They\'re 回答。' },
      { ch: 'ch3', q: 'How many ___ are there on the desk?', o: ['boxes', 'box', 'boxs', 'a box'], a: 0, e: 'How many 後面接複數名詞；box → boxes。' },
      { ch: 'ch4', q: 'The cap is ___.（他的）', o: ['his', 'he', 'him', 'he\'s'], a: 0, e: '後面沒有名詞，用所有格代名詞 his（his 兩種用法同形）。' },
      { ch: 'ch4', q: 'A: ___ is your favorite subject?　B: It\'s English.', o: ['What', 'Who', 'Where', 'Whose'], a: 0, e: '問「什麼」科目用 What。' },
      { ch: 'ch4', q: '___ book is this? It\'s Mary\'s.', o: ['Whose', 'Who', 'Who\'s', 'What'], a: 0, e: '問「誰的」用 Whose。' },
      { ch: 'ch5', q: 'She ___ her teeth every morning.', o: ['brushes', 'brush', 'brushs', 'brushies'], a: 0, e: '字尾 sh 加 es。' },
      { ch: 'ch5', q: '下列頻率副詞，何者表示的頻率最高？', o: ['always', 'usually', 'sometimes', 'never'], a: 0, e: 'always（100%）> usually > sometimes > never（0%）。' },
      { ch: 'ch5', q: 'A: ___ your parents work on Saturdays?　B: No, they don\'t.', o: ['Do', 'Does', 'Are', 'Is'], a: 0, e: 'your parents 是複數，用 Do 問。' },
      { ch: 'ch5', q: 'Tom ___ TV at night.（從不）', o: ['never watches', 'watches never', 'never watch', 'don\'t watch never'], a: 0, e: '頻率副詞放在一般動詞前；Tom 是第三人稱單數，動詞加 es。' },
      { ch: 'ch6', q: 'Let\'s ___ the classroom together.', o: ['clean', 'cleans', 'cleaning', 'to clean'], a: 0, e: 'Let\'s + 原形動詞。' },
      { ch: 'ch6', q: 'My dog ___ swim.', o: ['can', 'cans', 'can to', 'is can'], a: 0, e: 'can 不隨主詞變化，後面直接接原形動詞。' },
      { ch: 'ch6', q: '___ talk in class, please.', o: ['Don\'t', 'Not', 'No', 'Doesn\'t'], a: 0, e: '否定祈使句用 Don\'t + 原形動詞。' }
    ]
  }
];
