// 國文互動圖
(function () {
  'use strict';
  const W = (window.WIDGETS = window.WIDGETS || {});
  const U = window.WUtil;
  if (!U || !U.makePractice) return;
  const { frame, shuffle, makeSorter, makePractice, makeSpot, makeChoiceSet, pick, esc } = U;
  // 由清單出選擇題：每次取一題，選項為正解＋其他干擾項
  function choiceGen(items, toQ, optionsOf) {
    let pool = [];
    return () => {
      if (!pool.length) pool = shuffle(items);
      const it = pool.pop();
      const opts = shuffle(optionsOf(it));
      return Object.assign({ type: 'choice', options: opts, ans: opts.indexOf(it.ans) }, toQ(it));
    };
  }

  // ---------- 字音字形 ----------
  const DUO = [
    ['行', 'ㄒㄧㄥˊ', '行走'], ['行', 'ㄏㄤˊ', '銀行'], ['樂', 'ㄌㄜˋ', '快樂'], ['樂', 'ㄩㄝˋ', '音樂'],
    ['重', 'ㄓㄨㄥˋ', '重要'], ['重', 'ㄔㄨㄥˊ', '重複'], ['長', 'ㄔㄤˊ', '長短'], ['長', 'ㄓㄤˇ', '校長'],
    ['調', 'ㄉㄧㄠˋ', '調查'], ['調', 'ㄊㄧㄠˊ', '調皮'], ['便', 'ㄅㄧㄢˋ', '方便'], ['便', 'ㄆㄧㄢˊ', '便宜'],
    ['傳', 'ㄔㄨㄢˊ', '傳說'], ['傳', 'ㄓㄨㄢˋ', '傳記'], ['處', 'ㄔㄨˇ', '相處'], ['處', 'ㄔㄨˋ', '好處'],
    ['好', 'ㄏㄠˇ', '美好'], ['好', 'ㄏㄠˋ', '好學'], ['曲', 'ㄑㄩ', '彎曲'], ['曲', 'ㄑㄩˇ', '歌曲']
  ].map(([c, r, w]) => ({ c, ans: r, w }));
  const OTHER = ['ㄒㄧㄥˋ', 'ㄏㄤˋ', 'ㄌㄠˋ', 'ㄓㄨㄥ', 'ㄔㄤˇ', 'ㄉㄧㄠ', 'ㄅㄧㄢ', 'ㄔㄨㄢˋ', 'ㄔㄨ', 'ㄏㄠ', 'ㄑㄩˋ'];
  W['duoyin-gen'] = (host) => makePractice(host, {
    title: '🎲 破音字練習', desc: '選出字在詞語中的正確讀音', levels: ['讀音選擇'],
    gen: choiceGen(DUO, (it) => ({ q: `「<b>${it.w.replace(it.c, `<u>${it.c}</u>`)}</b>」中的「${it.c}」讀作？`, sol: `${it.c}：${DUO.filter((d) => d.c === it.c).map((d) => `${d.ans}（${d.w}）`).join('｜')}` }),
      (it) => { const same = DUO.filter((d) => d.c === it.c).map((d) => d.ans); const rest = shuffle(OTHER.filter((o) => !same.includes(o))).slice(0, 4 - same.length); return [...new Set([...same, ...rest])].slice(0, 4); })
  });
  W['typo-spot'] = (host) => makeSpot(host, {
    title: '🔍 找出錯別字', desc: '每句都有一個錯字，點出來看看',
    items: [
      { text: '這次比賽輸了，我們要再接再勵。', wrong: '勵', right: '厲', why: '「再接再厲」的厲是磨刀的意思。' },
      { text: '他一股作氣跑完了全程。', wrong: '股', right: '鼓', why: '「一鼓作氣」原指擊鼓作戰。' },
      { text: '做事不能默守成規，要懂得創新。', wrong: '默', right: '墨', why: '「墨守成規」源自墨子善於守城。' },
      { text: '放學鐘一響，他就迫不急待衝出教室。', wrong: '急', right: '及', why: '「迫不及待」：急迫到不能等待。' },
      { text: '他的棋藝高超，我只好甘敗下風。', wrong: '敗', right: '拜', why: '「甘拜下風」是心甘情願認輸。' },
      { text: '學習要按步就班，不能心急。', wrong: '步', right: '部', why: '「按部就班」：依照門類、次序。' },
      { text: '她每次考試都名列前矛。', wrong: '矛', right: '茅', why: '「名列前茅」的茅是茅草。' },
      { text: '假日的夜市人潮穿流不息。', wrong: '穿', right: '川', why: '「川流不息」：像河水一樣流個不停。' }
    ]
  });

  // ---------- 成語 ----------
  const IDIOMS = [
    ['栩栩如生', '形容藝術作品逼真，好像活的一樣'], ['欣欣向榮', '草木茂盛；比喻事業蓬勃發展'], ['畫蛇添足', '多此一舉，反而弄巧成拙'],
    ['守株待兔', '死守經驗不知變通，或妄想不勞而獲'], ['杯水車薪', '力量太小，無濟於事'], ['亡羊補牢', '犯錯後及時補救，還不算晚'],
    ['對牛彈琴', '對不懂道理的人講道理，白費力氣'], ['井底之蛙', '見識狹小的人'], ['半途而廢', '做事沒有恆心，中途放棄'],
    ['一舉兩得', '做一件事得到兩種好處'], ['手不釋卷', '勤奮好學，書本不離手'], ['不翼而飛', '東西突然不見了']
  ].map(([w, m]) => ({ w, m }));
  W['idiom-gen'] = (host) => makePractice(host, {
    title: '🎲 成語配對', desc: '看意思選成語，或看成語選意思', levels: ['看意思選成語', '看成語選意思'],
    gen(lv) {
      const it = pick(IDIOMS), others = shuffle(IDIOMS.filter((x) => x !== it)).slice(0, 3);
      const opts = shuffle([it, ...others]);
      return lv === 0
        ? { q: `哪一個成語的意思是「${esc(it.m)}」？`, type: 'choice', options: opts.map((o) => o.w), ans: opts.indexOf(it) }
        : { q: `「<b>${it.w}</b>」的意思是？`, type: 'choice', options: opts.map((o) => o.m), ans: opts.indexOf(it) };
    }
  });
  W['idiom-use'] = (host) => makeChoiceSet(host, {
    title: '✅ 成語用得對嗎？', desc: '判斷句子中的成語使用是否恰當',
    items: [
      { q: '「這幅畫裡的老虎栩栩如生。」', o: ['使用正確', '使用錯誤'], a: 0, e: '栩栩如生形容藝術作品逼真。' },
      { q: '「我家的小狗栩栩如生，非常可愛。」', o: ['使用正確', '使用錯誤'], a: 1, e: '真的動物本來就是活的，不能用栩栩如生。' },
      { q: '「這座新落成的圖書館美輪美奐。」', o: ['使用正確', '使用錯誤'], a: 0, e: '美輪美奐形容建築物。' },
      { q: '「她穿的禮服美輪美奐。」', o: ['使用正確', '使用錯誤'], a: 1, e: '美輪美奐只能形容建築物。' },
      { q: '「這次考了 75 分，還算差強人意。」', o: ['使用正確', '使用錯誤'], a: 0, e: '差強人意是大致令人滿意。' },
      { q: '「他的表現很爛，真是差強人意。」', o: ['使用正確', '使用錯誤'], a: 1, e: '差強人意不是很差的意思。' },
      { q: '「地震發生時，靠近震央的城市首當其衝。」', o: ['使用正確', '使用錯誤'], a: 0, e: '首當其衝是最先受到災難。' },
      { q: '「老師一問問題，小明總是首當其衝地舉手。」', o: ['使用正確', '使用錯誤'], a: 1, e: '首當其衝不是第一個去做。' }
    ]
  });

  // ---------- 修辭 ----------
  W['rhetoric-sort'] = (host) => makeSorter(host, {
    title: '🎨 修辭分類', desc: '判斷每個句子主要使用的修辭',
    cats: ['譬喻', '轉化', '誇飾', '排比'],
    items: [
      ['月亮像一艘小船，掛在天空。', '譬喻', '有喻詞「像」。'], ['老師是我們人生的燈塔。', '譬喻', '暗喻，喻詞為「是」。'],
      ['小草從土裡探出頭來，好奇地張望。', '轉化', '把小草當成人來寫（擬人）。'], ['時間偷偷地從指縫間溜走。', '轉化', '把抽象的時間寫成會溜走。'],
      ['我等你等到頭髮都白了。', '誇飾', '刻意誇大等待的時間。'], ['他的聲音小得像蚊子叫。', '誇飾', '刻意縮小聲音，也帶有比喻，主要是誇飾效果。'],
      ['我愛春天的花，我愛夏天的海，我愛秋天的楓。', '排比', '三句結構相似。'], ['風在窗外輕輕地唱著歌。', '轉化', '風會唱歌是擬人。']
    ]
  });
  const RH = [
    ['她的臉紅得像蘋果。', '譬喻'], ['書是人類的好朋友。', '譬喻'], ['太陽公公笑瞇瞇地看著大地。', '轉化'],
    ['我把思念寄給遠方的你。', '轉化'], ['他一口氣能喝下整個游泳池的水。', '誇飾'], ['教室裡安靜得連一根針掉下來都聽得見。', '誇飾'],
    ['咖啡的香味在空氣中瀰漫。', '摹寫'], ['冰涼的溪水從腳邊流過。', '摹寫'], ['青青的草，藍藍的天。', '類疊'],
    ['難道你不愛自己的家鄉嗎？', '設問'], ['人生的意義是什麼？是不斷地學習與成長。', '設問'],
    ['勤奮使人進步，懶惰使人落後。', '映襯'], ['海闊憑魚躍，天高任鳥飛。', '對偶'], ['團結是力量，友愛是溫暖，誠信是基石。', '排比']
  ].map(([s, a]) => ({ s, ans: a }));
  const RH_ALL = ['譬喻', '轉化', '誇飾', '摹寫', '類疊', '設問', '映襯', '對偶', '排比'];
  W['rhetoric-gen'] = (host) => makePractice(host, {
    title: '🎲 修辭判斷練習', desc: '讀句子，選出主要使用的修辭', levels: ['修辭判斷'],
    gen: choiceGen(RH, (it) => ({ q: `「${esc(it.s)}」` }), (it) => [it.ans, ...shuffle(RH_ALL.filter((r) => r !== it.ans)).slice(0, 3)])
  });

  // ---------- 標點 ----------
  const PUNCT = [
    ['我買了蘋果＿香蕉和葡萄。', '、'], ['媽媽說＿「吃飯囉！」', '：'], ['你明天會來參加嗎＿', '？'], ['好美的夕陽啊＿', '！'],
    ['晴天時，我們去爬山＿雨天時，我們在家看書。', '；'], ['我最喜歡的作家＿張曉風，寫了很多散文。', '——'],
    ['他支支吾吾地說：「我＿我不是故意的。」', '……'], ['他說：「老師說＿明天放假』。」', '『'], ['雖然下著大雨＿他還是準時到校。', '，'], ['我昨天讀了＿西遊記》。', '《']
  ].map(([s, a]) => ({ s, ans: a }));
  const P_ALL = ['，', '、', '；', '：', '？', '！', '——', '……', '『', '《', '。'];
  W['punct-gen'] = (host) => makePractice(host, {
    title: '🎲 標點符號填空', desc: '選出空格（＿）最適合的標點符號', levels: ['標點填空'],
    gen: choiceGen(PUNCT, (it) => ({ q: `<span class="big-say">${esc(it.s).replace('＿', '<u>　</u>')}</span>` }), (it) => [it.ans, ...shuffle(P_ALL.filter((p) => p !== it.ans)).slice(0, 3)])
  });

  // ---------- 詞性與句型 ----------
  W['pos-sort'] = (host) => makeSorter(host, {
    title: '🔤 詞性分類', desc: '判斷每個詞語（底線部分）的詞性',
    cats: ['名詞', '動詞', '形容詞', '副詞'],
    items: [
      ['「圖書館」', '名詞', '地點的名稱。'], ['「思考」', '動詞', '心理活動。'], ['「安靜」', '形容詞', '描寫狀態。'],
      ['「非常」', '副詞', '表示程度。'], ['「跳舞」', '動詞', '表示動作。'], ['「春天」', '名詞', '時間的名稱。'],
      ['「高大」', '形容詞', '描寫性質。'], ['「已經」', '副詞', '表示時間。'], ['「不」（不去）', '副詞', '表示否定。']
    ]
  });
  W['sentence-sort'] = (host) => makeSorter(host, {
    title: '🧱 句型分類', desc: '判斷每個句子屬於哪一種句型',
    cats: ['敘事句', '有無句', '表態句', '判斷句'],
    items: [
      ['弟弟在公園踢足球。', '敘事句', '敘述做什麼事。'], ['媽媽正在廚房煮飯。', '敘事句', '敘述動作。'],
      ['書包裡有三本書。', '有無句', '表示存在。'], ['沙漠中沒有河流。', '有無句', '表示不存在。'],
      ['今天的天空很藍。', '表態句', '主語＋形容詞。'], ['這朵花非常美麗。', '表態句', '描寫性質。'],
      ['他是我的同學。', '判斷句', '主語＋是＋名詞。'], ['鯨魚是哺乳類動物。', '判斷句', '判斷主語是什麼。']
    ]
  });

  // ---------- 文體與詩歌 ----------
  W['genre-sort'] = (host) => makeSorter(host, {
    title: '📚 這是哪一種文體？', desc: '判斷每篇文章最可能屬於哪一種文體',
    cats: ['記敘文', '抒情文', '論說文', '說明文'],
    items: [
      ['〈我的第一次露營〉：記錄露營的經過', '記敘文', '記錄事件經過。'], ['〈想念外婆〉：抒發對外婆的思念', '抒情文', '抒發情感。'],
      ['〈學生應該穿制服嗎？〉：提出主張並舉證', '論說文', '提出看法說服讀者。'], ['〈認識臺灣黑熊〉：介紹黑熊的特徵與習性', '說明文', '客觀介紹事物。'],
      ['〈閱讀的重要〉：說明讀書帶來的好處並勸人閱讀', '論說文', '提出觀點並說服。'], ['〈珍珠奶茶的製作方法〉', '說明文', '說明步驟與方法。']
    ]
  });
  W['poem-form'] = function (host) {
    const body = frame(host, '🏯 近體詩形式分析', '選一首詩，看句數、字數、押韻與對仗');
    const P = [
      { t: '靜夜思', a: '李白', lines: ['床前明月光', '疑是地上霜', '舉頭望明月', '低頭思故鄉'], rhyme: [0, 1, 3] },
      { t: '登鸛雀樓', a: '王之渙', lines: ['白日依山盡', '黃河入海流', '欲窮千里目', '更上一層樓'], rhyme: [1, 3] },
      { t: '早發白帝城', a: '李白', lines: ['朝辭白帝彩雲間', '千里江陵一日還', '兩岸猿聲啼不住', '輕舟已過萬重山'], rhyme: [0, 1, 3] },
      { t: '春望', a: '杜甫', lines: ['國破山河在', '城春草木深', '感時花濺淚', '恨別鳥驚心', '烽火連三月', '家書抵萬金', '白頭搔更短', '渾欲不勝簪'], rhyme: [1, 3, 5, 7] },
      { t: '登高', a: '杜甫', lines: ['風急天高猿嘯哀', '渚清沙白鳥飛迴', '無邊落木蕭蕭下', '不盡長江滾滾來', '萬里悲秋常作客', '百年多病獨登臺', '艱難苦恨繁霜鬢', '潦倒新停濁酒杯'], rhyme: [0, 1, 3, 5, 7] }
    ];
    const TYPES = ['五言絕句', '七言絕句', '五言律詩', '七言律詩'];
    body.innerHTML = `<div class="w-tabs">${P.map((p, i) => `<button class="chip" data-p="${i}">${p.t}</button>`).join('')}</div>
      <div class="pf-grid"></div><div class="w-chips pf-opts"></div><div class="w-read"></div>`;
    const grid = body.querySelector('.pf-grid'), opts = body.querySelector('.pf-opts'), read = body.querySelector('.w-read');
    function show(i) {
      const p = P[i], n = p.lines.length, k = p.lines[0].length, type = (k === 5 ? '五言' : '七言') + (n === 4 ? '絕句' : '律詩');
      body.querySelectorAll('[data-p]').forEach((b) => b.classList.toggle('active', +b.dataset.p === i));
      const LIAN = ['首聯', '頷聯', '頸聯', '尾聯'];
      grid.innerHTML = `<div class="pf-title">〈${p.t}〉　${p.a}</div>` + p.lines.map((l, j) => `
        <div class="pf-line${n === 8 && (j === 2 || j === 3 || j === 4 || j === 5) ? ' duizhang' : ''}">
          <span class="pf-no">${n === 8 && j % 2 === 0 ? LIAN[j / 2] : ''}</span>
          ${[...l].map((ch, x) => `<span class="pf-ch${x === k - 1 && p.rhyme.includes(j) ? ' rhyme' : ''}">${ch}</span>`).join('')}
        </div>`).join('');
      opts.innerHTML = '<span class="w-small-label">這首詩是：</span>' + TYPES.map((t) => `<button class="chip" data-t="${t}">${t}</button>`).join('');
      read.innerHTML = '<b class="h">先數一數</b>有幾句？每句幾個字？再選出體裁。';
      opts.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
        const ok = b.dataset.t === type;
        opts.querySelectorAll('[data-t]').forEach((x) => { x.disabled = true; if (x.dataset.t === type) x.classList.add('ok'); else if (x === b) x.classList.add('bad'); });
        read.innerHTML = `<b class="h">${ok ? '✔ 答對了！' : '✘ 再數一次'}　〈${p.t}〉是${type}</b>
          ${n} 句 × ${k} 字 = ${n * k} 字。<span class="pf-key rhyme">押韻字</span>：${p.rhyme.map((j) => p.lines[j][k - 1]).join('、')}（${p.rhyme.includes(0) ? '首句也押韻' : '首句不押韻'}，偶數句押韻）。
          ${n === 8 ? '<br>律詩的<b>頷聯</b>（3、4 句）與<b>頸聯</b>（5、6 句）必須<b>對仗</b>（底色標示）。' : ''}`;
      }));
    }
    body.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => show(+b.dataset.p)));
    show(0);
  };
})();
