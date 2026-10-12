'use strict';
// Personal Chinese-learning PWA. Entirely local user progress, no backend or paid services.
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const now=()=>Date.now();
const DAY=86400000;
const BAND_LABELS=['1','2','3','4','5','6','7-9'];
const HSK_URL='https://raw.githubusercontent.com/profesorm/hsk30/main/data/hsk_vocabulary_compact.json';
const BASE_WORDS=`你好|nǐ hǎo|здравствуй|1
谢谢|xiè xie|спасибо|1
再见|zài jiàn|до свидания|1
我|wǒ|я|1
你|nǐ|ты|1
他|tā|он|1
她|tā|она|1
我们|wǒ men|мы|1
是|shì|быть; являться|1
不|bù|не|1
有|yǒu|иметь; есть|1
没有|méi yǒu|нет; не иметь|1
好|hǎo|хороший|1
很|hěn|очень|1
大|dà|большой|1
小|xiǎo|маленький|1
人|rén|человек|1
中国|Zhōng guó|Китай|1
中文|Zhōng wén|китайский язык|1
汉语|Hàn yǔ|китайский язык|1
学习|xué xí|учиться|1
学生|xué sheng|ученик; студент|1
老师|lǎo shī|учитель|1
朋友|péng you|друг|1
家|jiā|дом; семья|1
妈妈|mā ma|мама|1
爸爸|bà ba|папа|1
儿子|ér zi|сын|1
女儿|nǚ ér|дочь|1
水|shuǐ|вода|1
茶|chá|чай|1
咖啡|kā fēi|кофе|1
米饭|mǐ fàn|рис (готовый)|1
吃|chī|есть (пищу)|1
喝|hē|пить|1
看|kàn|смотреть|1
听|tīng|слушать|1
说|shuō|говорить|1
读|dú|читать|1
写|xiě|писать|1
会|huì|уметь; мочь|1
想|xiǎng|хотеть; думать|1
喜欢|xǐ huan|нравиться|1
爱|ài|любить|1
今天|jīn tiān|сегодня|1
明天|míng tiān|завтра|1
昨天|zuó tiān|вчера|1
现在|xiàn zài|сейчас|1
时间|shí jiān|время|1
一|yī|один|1
二|èr|два|1
三|sān|три|1
四|sì|четыре|1
五|wǔ|пять|1
六|liù|шесть|1
七|qī|семь|1
八|bā|восемь|1
九|jiǔ|девять|1
十|shí|десять|1
多少|duō shao|сколько|1
什么|shén me|что|1
谁|shéi|кто|1
哪儿|nǎr|где|1
哪里|nǎ lǐ|где|1
怎么|zěn me|как|1
为什么|wèi shén me|почему|1
吗|ma|вопросительная частица|1
呢|ne|частица уточнения|1
的|de|частица принадлежности|1
这|zhè|это|1
那|nà|то|1
个|gè|универсальное счётное слово|1
本|běn|счётное слово для книг|1
书|shū|книга|1
桌子|zhuō zi|стол|1
椅子|yǐ zi|стул|1
手机|shǒu jī|мобильный телефон|1
电脑|diàn nǎo|компьютер|1
学校|xué xiào|школа|1
工作|gōng zuò|работа; работать|1
去|qù|идти; ехать|1
来|lái|приходить|1
回|huí|возвращаться|1
买|mǎi|покупать|1
卖|mài|продавать|1
钱|qián|деньги|1
块|kuài|юань (разговорное); кусок|1
请|qǐng|пожалуйста; просить|1
对不起|duì bu qǐ|извини(те)|1
没关系|méi guān xi|ничего страшного|1
可以|kě yǐ|можно|1
知道|zhī dào|знать|1
认识|rèn shi|быть знакомым|1
天气|tiān qì|погода|1
热|rè|жарко; горячий|1
冷|lěng|холодно|1
漂亮|piào liang|красивый|1
高兴|gāo xìng|радостный|1
生日|shēng rì|день рождения|1`;
const SEED=BASE_WORDS.trim().split('\n').map((line,i)=>{const [word,pinyin,ru,band]=line.split('|');return {id:`demo-${i}`,word,pinyin,ru,band};});
const RU_MAP=new Map(SEED.map(w=>[w.word,w.ru]));
const GRAMMAR=[
{title:'Приветствия',band:'1',theory:'你好 (nǐ hǎo) — «здравствуй». Вежливое 您好 (nín hǎo). Вопросительный суффикс 吗 превращает утверждение в общий вопрос.',ex:'你好吗？ — Как дела?'},
{title:'Предложения с 是',band:'1',theory:'是 связывает подлежащее с существительным: 我是学生 — Я студент. Для отрицания используется 不是.',ex:'他不是老师。— Он не учитель.'},
{title:'Вопросительная частица 吗',band:'1',theory:'Добавьте 吗 в конец утверждения, чтобы сделать общий вопрос: 你是老师吗？ В ответе повторяют глагол или используют его отрицание.',ex:'你喝茶吗？— Ты пьёшь чай?'},
{title:'Частица 的',band:'1',theory:'的 соединяет определение и существительное, в том числе для выражения принадлежности: 我的书 — моя книга.',ex:'这是我的朋友。— Это мой друг.'},
{title:'Отрицание 不 и 没',band:'1',theory:'不 употребляют перед глаголами/прилагательными, 没(有) — для отсутствия или отрицания прошедшего действия. В сочетании 不 + 4-й тон нередко происходит изменение тона.',ex:'我不喝茶。 / 我没有钱。'},
{title:'Счётные слова',band:'1',theory:'При числительном перед существительным часто нужно счётное слово: 一个学生, 三本书. Выбор счётного слова зависит от существительного.',ex:'三本书 — три книги'},
{title:'Порядок слов',band:'1',theory:'Базовый порядок: подлежащее + время + место + глагол + дополнение. Китайские глаголы обычно не изменяются по лицам и числам.',ex:'我今天学习中文。— Я сегодня учу китайский.'},
{title:'Классификаторы и направления',band:'2',theory:'После числительного уточняйте тип предмета счётным словом. Для направления часто используется 去 / 来 с местом.',ex:'我明天去学校。— Завтра я иду в школу.'},
{title:'Аспект 了',band:'2',theory:'了 может указывать на завершение действия либо изменение ситуации; это не универсальный показатель прошедшего времени.',ex:'我买了一本书。— Я купил книгу.'},
{title:'Сравнение с 比',band:'3',theory:'Конструкция A 比 B + прилагательное выражает сравнение. Меру различия можно уточнить после прилагательного.',ex:'今天比昨天冷。— Сегодня холоднее, чем вчера.'},
{title:'Конструкция 把',band:'4',theory:'把 выносит определённый объект перед глаголом, обычно когда действие существенно меняет объект.',ex:'请把门打开。— Пожалуйста, открой дверь.'},
{title:'Сложноподчинённые связи',band:'5',theory:'虽然……但是…… выражает уступку: «хотя…, но…». Части могут разделяться другими словами.',ex:'虽然下雨，但是我还要去。'},
{title:'Письменный регистр',band:'6',theory:'В письменном языке широко встречаются конструкции 由于、因此、然而 и формальные связки причинно-следственных отношений.',ex:'由于天气原因，活动取消。'},
{title:'Продвинутый стиль',band:'7-9',theory:'На продвинутом уровне тренируются анализ текста, нюансы синонимов, аргументация и перевод. Полный материал для этого уровня ещё предстоит подготовить.',ex:'这项研究的结论仍有待进一步验证。'}
];
const KEY='hanzi-one-state-v1';
let state;
try {state=JSON.parse(localStorage.getItem(KEY)||'null');}catch{};
state=state&&typeof state==='object'?state:{};
state.progress??={};state.completed??={};state.custom??=[];state.settings??={};state.streak??={};state.favorites??=[];state.ruOverrides??={};state.errors??={};state.daily??={};state.listening??={};
const view={page:'home',band:'1',lesson:0,quiz:null,cardQueue:[],cardFlip:false,search:'',radicals:[],radical:null,practiceWord:'我',showHint:true,msg:'',speakTone:1,speakResult:null,shownWord:null,grammar:0,favoritesOnly:false,listening:null};
let dataset=SEED.slice();let ruPack={};let hskLoaded=false;let hskStatus='Доступны начальные учебные примеры. Полный словарь можно загрузить.';
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){alert('Не удалось сохранить прогресс. Проверь свободное место на устройстве.');}};
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s'’]/g,'');
const ruOf=w=>String(state.ruOverrides?.[w?.word]||w?.ru||ruPack[w?.word]||'');
const getWords=()=>dataset.concat(state.custom);
const todayStats=()=>state.daily?.[dayKey()]||{repetitions:0,listening:0};
const byId=id=>getWords().find(w=>w.id===id);
const wordsInBand=band=>getWords().filter(w=>w.band===band);
const due=()=>Object.entries(state.progress).filter(([_,p])=>p.next<=now()).map(([id])=>byId(id)).filter(Boolean);
const learned=()=>Object.keys(state.progress).length;
const mastered=()=>Object.values(state.progress).filter(p=>p.rep>=4).length;
const pct=(a,b)=>b?Math.round(a*100/b):0;
const rand=xs=>xs.slice().sort(()=>Math.random()-.5);
const dayKey=()=>new Date().toLocaleDateString('en-CA');
function touch(){const d=dayKey();const p=state.streak;if(p.last!==d){const prev=new Date(Date.now()-DAY).toLocaleDateString('en-CA');p.count=p.last===prev?(p.count||0)+1:1;p.last=d;save();}}
function schedule(word,quality){if(!word)return;const p=state.progress[word.id]||{ease:2.5,rep:0,interval:0,next:0};quality=Math.max(0,Math.min(5,quality));if(quality<3){p.rep=0;p.interval=0.01;}else{p.interval=p.rep===0?1:p.rep===1?3:Math.max(1,Math.round(p.interval*p.ease));p.rep++;}p.ease=Math.max(1.3,p.ease+.1-(5-quality)*(.08+(5-quality)*.02));p.next=now()+p.interval*DAY;p.last=now();state.progress[word.id]=p;state.daily[dayKey()]??={repetitions:0,listening:0};state.daily[dayKey()].repetitions++;touch();save();}
function idb(){return new Promise((resolve,reject)=>{const r=indexedDB.open('hanzi-one-db',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function getAsset(key){try{const db=await idb();return await new Promise(resolve=>{const tx=db.transaction('assets');const rq=tx.objectStore('assets').get(key);rq.onsuccess=()=>{resolve(rq.result);db.close();};rq.onerror=()=>{resolve(null);db.close();};});}catch{return null;}}
async function setAsset(key,value){try{const db=await idb();return await new Promise(resolve=>{const tx=db.transaction('assets','readwrite');tx.objectStore('assets').put(value,key);tx.oncomplete=()=>{resolve(true);db.close();};tx.onerror=()=>{resolve(false);db.close();};});}catch{return false;}}
function replaceDataset(rows){if(!Array.isArray(rows)||rows.length<100)return false;const level=n=>n.includes('七-九级')?'7-9':({'一':'1','二':'2','三':'3','四':'4','五':'5','六':'6'})[n.charAt(0)]||'';const good=rows.filter(w=>w?.word&&w?.pinyin&&level(w.levelName||'')).map((w,i)=>{const word=String(w.word).replace(/[0-9]+$/,'');return{id:`hsk26-${w.sort||i}`,word,pinyin:String(w.pinyin),ru:RU_MAP.get(word)||'',band:level(w.levelName)}});if(good.length<100)return false;// Transfer spaced-repetition progress from the offline starter list into the official word IDs.
if(!hskLoaded){let transferred=0;for(const seed of SEED){const prior=state.progress[seed.id];if(!prior)continue;const match=good.find(w=>w.word===seed.word&&norm(w.pinyin)===norm(seed.pinyin))||good.find(w=>w.word===seed.word);if(match&&!state.progress[match.id]){state.progress[match.id]=prior;transferred++;}delete state.progress[seed.id];}if(transferred){for(const key of Object.keys(state.completed)){if(/^\d+:\d+$/.test(key)){state.completed['starter:'+key]=state.completed[key];delete state.completed[key];}}save();}}
dataset=good;hskLoaded=true;hskStatus=`Загружено ${good.length.toLocaleString('ru-RU')} слов с пиньинем. Русские переводы есть у ${good.filter(w=>ruOf(w)).length} слов.`;return true;}
async function fetchHSK(force=false){if(!force){const old=await getAsset('hsk');if(replaceDataset(old)){render();return;}}hskStatus='Загружаем открытый список HSK через интернет…';render();try{const res=await fetch(HSK_URL,{cache:'no-cache'});if(!res.ok)throw Error(`HTTP ${res.status}`);const text=await res.text();const payload=JSON.parse(text);const data=payload?.data?.records;if(!replaceDataset(data))throw Error('Неподдерживаемый формат файла');await setAsset('hsk',data);}catch(e){hskStatus=`Загрузить полный список не удалось (${e.message}). Доступны встроенные примеры. Попробуй повторить при наличии интернета.`;}render();}
function linkBtn(action,txt,css='btn dim small',extra=''){return `<button class="${css}" data-action="${action}" ${extra}>${esc(txt)}</button>`;}
function pageHead(section,title,subtitle){return `<div class="topline">${esc(section)}</div><h1 class="page-head">${esc(title)}</h1><p class="intro">${esc(subtitle)}</p>`;}
function bandTabs(){return `<div class="tabs">${BAND_LABELS.map(b=>`<button class="chip ${view.band===b?'active':''}" data-band="${b}">HSK ${b}</button>`).join('')}</div>`;}
function home(){const d=due().length;const p=wordsInBand(view.band).length;return `${pageHead('今天 · сегодня','Твой китайский каждый день','Учись в одном месте. Всё, что изучаешь, становится частью общей системы повторения.')}
<section class="panel hero"><div class="topline">Твой следующий шаг</div><h2>${d?'Повтори то, что пора вспомнить':'Продолжай открывать новое'}</h2><p>Курс HSK ${view.band} · ${p} слов доступно в выбранном разделе</p><div class="btnrow">${linkBtn(d?'review':'start-lesson',d?`Повторить (${d})`:'Начать урок','btn')}${linkBtn('open-speak','Тренировка тонов','btn alt')}</div></section>
<div class="stats"><div class="stat"><strong>${learned()}</strong><span>изученных слов</span></div><div class="stat"><strong>${mastered()}</strong><span>закреплено</span></div><div class="stat"><strong>${state.streak.count||0}</strong><span>дней подряд</span></div></div>
<section class="panel soft"><h3>Цель на сегодня · 10 повторений</h3><p class="helper">Выполнено: ${todayStats().repetitions} из 10. Прослушивания: ${todayStats().listening||0}.</p><div class="progressbar"><i style="width:${Math.min(100,todayStats().repetitions*10)}%"></i></div><div class="btnrow">${linkBtn('open-listening','Аудирование','btn alt small')}${linkBtn('open-errors','Работа над ошибками','btn dim small')}</div></section>
<div class="two"><button class="wordcard" data-nav="courses"><span class="hanzi">课</span><b>Уроки HSK</b><span class="ru">Темы и проверки знаний</span></button><button class="wordcard" data-nav="hanzi"><span class="hanzi">字</span><b>Ключи и письмо</b><span class="ru">214 ключей и прописи</span></button><button class="wordcard" data-action="open-dict"><span class="hanzi">词</span><b>Словарь</b><span class="ru">Поиск, добавление слов</span></button><button class="wordcard" data-action="open-grammar"><span class="hanzi">语</span><b>Грамматика</b><span class="ru">Правила и примеры</span></button></div>
<section class="panel soft" style="margin-top:15px"><h3>Учебная база</h3><p class="helper">${esc(hskStatus)}</p><div class="btnrow">${linkBtn('load-hsk',hskLoaded?'Обновить полный HSK':'Загрузить HSK 1–9','btn dim small')}</div><p class="helper">Источник полного списка: profesorm/hsk30 — экзаменационная программа 2025/2026 (CC BY 4.0). В открытом списке отсутствуют русские переводы, поэтому упражнения на перевод пока доступны только для слов с переводом.</p></section>`;}
function courses(){const arr=wordsInBand(view.band),count=Math.max(1,Math.ceil(arr.length/10));return `${pageHead('课程 · уроки','Курс HSK 1–9','Разделы по десять слов, проверка усвоения и общий прогресс.')}${bandTabs()}
<section class="panel soft"><h3>Выбранный уровень</h3><p>${arr.length} записей · ${count} учебных разделов · ${Object.keys(state.completed).filter(k=>k.startsWith(view.band+':')).length} успешно проверено</p><div class="progressbar"><i style="width:${pct(Object.keys(state.completed).filter(k=>k.startsWith(view.band+':')).length,count)}%"></i></div></section>
${!hskLoaded&&view.band!=='1'?`<div class="empty">Для HSK ${view.band} необходимо загрузить полный открытый список на главном экране.</div>`:''}
${arr.length?`<section class="panel"><h3>Выбери раздел</h3><div class="item"><div><b>Раздел ${view.lesson+1} из ${count}</b><div class="helper">Слова ${view.lesson*10+1}–${Math.min((view.lesson+1)*10,arr.length)}</div></div><span class="tag ${state.completed[view.band+':'+view.lesson]?'':'gold'}">${state.completed[view.band+':'+view.lesson]?'зачтён':'практика'}</span></div><div class="btnrow">${linkBtn('prev-lesson','← Назад','btn dim small',view.lesson===0?'disabled':'')}${linkBtn('next-lesson','Следующий →','btn dim small',view.lesson>=count-1?'disabled':'')}${linkBtn('start-lesson','Открыть урок','btn')}</div></section>`:''}
<section class="panel soft"><h3>Проверка разделов</h3><p class="helper">Чтобы зачесть раздел, набери минимум 80% и убедись, что для всех проверяемых слов есть русский перевод. Если перевод отсутствует, работает тренировка пиньиня без зачёта смыслового усвоения. Ошибки добавляются в повторения.</p></section>`;}
function wordHtml(w,detail=false){return `<div class="item"><div><b class="hanzi">${esc(w.word)}</b><div class="pinyin">${esc(w.pinyin||'')}</div><div class="small">${esc(ruOf(w)||'Перевод ещё не добавлен')}</div></div><div class="btnrow mini-actions" style="margin-top:0">${linkBtn('hear','▶','btn dim small',`data-word="${esc(w.id)}" aria-label="Произнести"`)}${linkBtn('toggle-favorite',(state.favorites.includes(w.word)?'★':'☆'),'btn dim small',`data-word="${esc(w.id)}" aria-label="Избранное"`)}${detail?linkBtn('write-word','✎','btn dim small',`data-word="${esc(w.id)}" aria-label="Писать"`):''}${detail?linkBtn('edit-translation','RU','btn dim small',`data-word="${esc(w.id)}" aria-label="Изменить перевод"`):''}</div></div>`;}
function lesson(){const arr=wordsInBand(view.band),items=arr.slice(view.lesson*10,(view.lesson+1)*10);if(!items.length)return courses();const k=view.band+':'+view.lesson;return `${pageHead(`HSK ${view.band} · Раздел ${view.lesson+1}`,'Новые слова','Слушай, запоминай, затем пройди проверку.')}
<section class="panel"><h3>Материал урока</h3>${items.map(w=>wordHtml(w,true)).join('')}<div class="btnrow">${linkBtn('start-quiz','Проверить знания','btn')}${linkBtn('add-to-cards','Добавить в повторение','btn alt')}</div></section>
<section class="panel soft"><h3>Грамматика этого уровня</h3>${GRAMMAR.filter(g=>g.band===view.band).slice(0,3).map(g=>`<p><b>${esc(g.title)}</b><br><span class="helper">${esc(g.ex)}</span></p>`).join('')||'<p class="helper">Материалы уровня дополняются.</p>'}<div class="btnrow">${linkBtn('open-grammar','Открыть грамматику','btn dim small')}</div></section><p class="helper">${state.completed[k]?'Этот раздел уже зачтён. Можно проверить знания повторно.':'Тест станет зачтённым при результате не ниже 80%.'}</p>`;}
function makeQuiz(){const arr=wordsInBand(view.band).slice(view.lesson*10,(view.lesson+1)*10);const bank=wordsInBand(view.band).filter(w=>w.word&&w.pinyin);
const items=rand(arr).map(w=>{const isRu=!!ruOf(w);const correct=isRu?ruOf(w):w.pinyin;let pool=rand(bank.filter(x=>x.id!==w.id&&((isRu&&ruOf(x))||(!isRu&&x.pinyin)))).map(x=>isRu?ruOf(x):x.pinyin).filter(x=>x&&x!==correct);pool=[...new Set(pool)];return {id:w.id,word:w.word,correct,kind:isRu?'Значение':'Пиньинь (это не проверка понимания перевода)',choices:rand([correct,...pool.slice(0,3)]),answer:null};});view.quiz={items,i:0,right:0,finished:false,hasTranslations:arr.every(w=>!!ruOf(w))};view.page='quiz';render();}
function quizPage(){const q=view.quiz;if(!q)return courses();if(q.finished){const score=pct(q.right,q.items.length),passed=score>=80&&q.hasTranslations;return `${pageHead('测试 · тест','Результат проверки',`HSK ${view.band}, раздел ${view.lesson+1}`)}<section class="panel prompt"><div style="font-size:64px;color:${passed?'var(--jade)':'var(--gold)'}">${score}%</div><h3>${passed?'Раздел зачтён!':(!q.hasTranslations&&score>=80?'Тест на пиньинь пройден':'Нужна дополнительная практика')}</h3><p>${q.right} из ${q.items.length} правильных ответов</p><p class="helper">${passed?'Теперь повторения помогут закрепить результат.':(!q.hasTranslations?'В разделе есть слова без русского перевода. Тест пиньиня полезен, но не засчитывает полное понимание значения. Добавь переводы через словарь.':'Пройди слова и попробуй снова — это нормальная часть учёбы.')}</p><div class="btnrow" style="justify-content:center">${linkBtn('start-quiz','Повторить тест','btn alt')}${linkBtn('back-courses','К урокам','btn')}</div></section>`;}
const item=q.items[q.i];return `${pageHead('Проверка усвоения',`Задание ${q.i+1} из ${q.items.length}`,`Выбери ${item.kind.toLowerCase()} слова`)}<div class="progressbar"><i style="width:${pct(q.i,q.items.length)}%"></i></div><section class="panel prompt" style="margin-top:15px"><span class="hanzi">${esc(item.word)}</span><div class="btnrow" style="justify-content:center">${linkBtn('hear','▶ Прослушать','btn dim small',`data-word="${esc(item.id)}"`)}</div><div class="choices">${item.choices.map((choice,j)=>`<button class="choice ${item.answer!==null?(choice===item.correct?'correct':(choice===item.answer?'wrong':'')):''}" data-choice="${j}" ${item.answer!==null?'disabled':''}>${esc(choice)}</button>`).join('')}</div>${item.answer!==null?`<div class="result ${item.answer===item.correct?'':'bad'}">${item.answer===item.correct?'Верно!':'Верный ответ: '+esc(item.correct)}</div><div class="btnrow" style="justify-content:center">${linkBtn('quiz-next','Далее →','btn')}</div>`:''}</section>`;}
function cardQueue(){const ids=new Set();let arr=due().filter(w=>{ids.add(w.id);return true;});const fresh=state.custom.concat(wordsInBand(view.band)).filter(w=>!ids.has(w.id)&&!state.progress[w.id]).slice(0,15);arr=arr.concat(fresh);if(!arr.length)arr=wordsInBand(view.band).slice(0,10);view.cardQueue=arr.map(w=>w.id);view.cardFlip=false;view.page='cards';render();}
function cards(){let q=view.cardQueue.map(byId).filter(Boolean);if(!q.length){const a=due(),b=state.custom.concat(wordsInBand(view.band)).filter(w=>!state.progress[w.id]).slice(0,15);q=a.concat(b.length?b:wordsInBand(view.band).slice(0,10));view.cardQueue=q.map(w=>w.id);}const w=q[0];return `${pageHead('复习 · повторения','Умные карточки',`Сегодня к повторению: ${due().length}. Система использует интервальное повторение.`)}
${w?`<section class="panel prompt"><div class="helper">Осталось карточек: ${q.length}</div><div style="min-height:175px;display:grid;place-items:center"><div><span class="hanzi" style="font-size:74px">${esc(w.word)}</span><div class="pinyin">${view.cardFlip?esc(w.pinyin):'Пиньинь скрыт'}</div>${view.cardFlip?`<p>${esc(ruOf(w)||'Русский перевод пока не добавлен')}</p>`:''}</div></div><div class="btnrow" style="justify-content:center">${linkBtn('hear','▶','btn dim small',`data-word="${esc(w.id)}"`)}${!view.cardFlip?linkBtn('flip','Открыть ответ','btn'):''}</div>${view.cardFlip?`<p class="helper">Оцени, как хорошо вспомнила слово</p><div class="four">${[['Не помню',1],['Трудно',3],['Хорошо',4],['Легко',5]].map(([label,num])=>linkBtn('grade-card',label,'btn dim small',`data-grade="${num}"`)).join('')}</div>`:''}</section>`:`<div class="empty">Нет карточек. Добавь слова из курса или словаря.</div>`}
<section class="panel soft"><h3>Твои наборы</h3><p class="helper">Импортированные слова: ${state.custom.length}. Поддерживается импорт CSV/TSV/текста из экспорта твоих собственных наборов.</p><div class="btnrow">${linkBtn('open-import','Импортировать карточки','btn alt small')}${linkBtn('reload-cards','Собрать новую колоду','btn dim small')}</div></section>`;}
function hanzi(){const filtered=view.radicals.filter(r=>!view.search||`${r.radical} ${r.base} ${r.ru} ${r.id}`.toLowerCase().includes(view.search.toLowerCase()));return `${pageHead('部首 · иероглифы','Ключи и прописи','214 традиционных ключей Канси, русские значения и свободная практика письма.')}
<div class="panel"><input id="radical-search" class="input" placeholder="Номер, ключ или значение" value="${esc(view.search)}" aria-label="Поиск ключа"><p class="helper">${filtered.length} из 214 ключей</p><div id="radical-results" class="k-grid">${filtered.map(r=>`<button class="k-cell" data-radical="${r.id}" title="${esc(r.ru)}">${esc(r.radical)}<small>${r.id}</small></button>`).join('')}</div></div>
<section class="panel soft"><h3>Тренировка письма</h3><p class="helper">Свободная пропись доступна без интернета. Проверка порядка черт подключается через открытую библиотеку Hanzi Writer при наличии интернета.</p><div class="btnrow">${linkBtn('write-selected','Открыть прописи','btn')}</div></section>`;}
function radicalPage(){const r=view.radical;if(!r)return hanzi();return `${pageHead('Ключи Канси',`Ключ № ${r.id}`,r.ru)}<section class="panel radical-detail"><div class="hero-character">${esc(r.radical)}</div><p style="text-align:center"><b>${esc(r.base)}</b> — ${esc(r.ru)}</p><p class="helper" style="text-align:center">Ключи Канси — традиционная система из 214 графических компонентов. Отдельный знак ключа и его вариант в современном иероглифе могут различаться.</p><div class="btnrow" style="justify-content:center">${linkBtn('write-radical','Практиковать написание','btn')}${linkBtn('back-radicals','← Все ключи','btn dim')}</div></section>`;}
function writePage(){return `${pageHead('写字 · прописи','Учимся писать',`Иероглиф: ${view.practiceWord}`)}<section class="panel"><div class="hero-character" style="font-size:68px">${esc(view.practiceWord)}</div><div class="btnrow" style="justify-content:center">${linkBtn('animate-strokes','Показать порядок черт','btn alt small')}${linkBtn('quiz-strokes','Проверить черты','btn alt small')}</div><div id="writerbox" class="canvas-wrap"><canvas id="draw"></canvas></div><div class="btnrow">${linkBtn('clear-canvas','Очистить','btn dim small')}${linkBtn('hint-canvas',view.showHint?'Скрыть подсказку':'Подсказка','btn dim small')}</div><p id="writer-msg" class="helper">Для проверки порядка черт нужна открытая библиотека Hanzi Writer и доступ к её данным. Если загрузка невозможна, работает свободная пропись.</p></section>`;}
function dictionary(){const results=findWords(view.search);return `${pageHead('词典 · словарь',view.favoritesOnly?'Избранные слова':'Словарь','Поиск по иероглифам, пиньиню и русским переводам. Можно добавлять и исправлять переводы.')}
<input class="input" id="dict-search" placeholder="Например: 你好, ni hao, привет" value="${esc(view.search)}" autocomplete="off" aria-label="Поиск слова">
<section class="panel soft" style="margin-top:13px"><div class="item"><b id="dict-count">${results.length} результатов</b><div class="btnrow">${linkBtn('toggle-favorites-filter',view.favoritesOnly?'Все слова':'★ Избранное','btn dim small')}${linkBtn('create-word','+ Слово','btn alt small')}</div></div><div id="dict-results">${results.slice(0,35).map(w=>wordHtml(w,true)).join('')||'<div class="empty">Совпадений не найдено</div>'}</div></section>`;}
function findWords(term){const q=norm(term);const source=view.favoritesOnly?getWords().filter(w=>state.favorites.includes(w.word)):getWords();if(!q)return source.slice(0,view.favoritesOnly?200:35);return source.filter(w=>norm(w.word).includes(q)||norm(w.pinyin).includes(q)||norm(ruOf(w)).includes(q)).slice(0,200);}
function grammar(){return `${pageHead('语法 · грамматика','Правила китайского','Учебные заметки собственного составления. Для полного HSK 1–9 необходимо расширение материалов.')}${bandTabs()}${GRAMMAR.filter(g=>g.band===view.band).map((g,i)=>`<section class="panel soft"><h3>${esc(g.title)}</h3><p>${esc(g.theory)}</p><p class="pinyin">${esc(g.ex)}</p>${linkBtn('listen-example','▶ Слушать пример','btn dim small',`data-example="${esc(g.ex.split(/[—。]/)[0])}"`)}</section>`).join('')||'<div class="empty">Для уровня пока нет грамматических заметок.</div>'}`;}
function toneText(t){return {1:'mā — высокий ровный',2:'má — восходящий',3:'mǎ — нисходяще-восходящий',4:'mà — резкий нисходящий'}[t];}
function speak(){const sr=view.speakResult;return `${pageHead('发音 · произношение','Практика тонов','Запиши отдельный слог. Приложение оценивает контур высоты голоса — это экспериментальная подсказка, не оценка преподавателя.')}
<section class="panel"><h3>Выбери тон</h3><div class="four">${[1,2,3,4].map(t=>`<button class="chip ${view.speakTone===t?'active':''}" data-tone="${t}">${['mā','má','mǎ','mà'][t-1]}</button>`).join('')}</div><div class="hero-character" style="font-size:77px">${['妈','麻','马','骂'][view.speakTone-1]}</div><p style="text-align:center;color:var(--jade)">${toneText(view.speakTone)}</p><div class="btnrow" style="justify-content:center">${linkBtn('hear-syllable','▶ Пример','btn dim')}${linkBtn('record-tone','🎙 Записать тон','btn')}${linkBtn('recognize','Распознать фразу','btn alt')}</div><p class="helper">Произнеси «ма» выбранным тоном отдельно, спокойно и достаточно громко. Нужен доступ к микрофону. Распознавание фраз зависит от поддержки Safari и может использовать сетевой сервис устройства.</p><div id="tonebars" class="tonebars">${Array.from({length:22},()=>'<div style="height:8px;opacity:.28"></div>').join('')}</div><p id="speaking-status" class="helper">${esc(sr?.message||'Микрофон ещё не включён.')}</p>${sr?.count?`<div class="result ${sr.detected===view.speakTone?'':'bad'}">Определённый контур: ${esc(toneText(sr.detected))}. Анализ ${sr.count} измерений.</div>`:''}</section>`;}
function importPage(){return `${pageHead('📁 · данные','Импорт и резервные копии','Все импортированные данные остаются на устройстве. Облачной синхронизации пока нет.')}
<section class="panel"><h3>Добавить карточки</h3><p class="helper">Экспортируй свои наборы из Quizlet или других приложений, если у них доступен экспорт. Поддерживаются строки «иероглиф<TAB>перевод<TAB>пиньинь» (TSV), CSV с тремя столбцами или JSON-массив. Пиньинь можно не указывать.</p><textarea class="input" id="import-text" placeholder="你好\tздравствуй\tnǐ hǎo\n谢谢\tспасибо\txiè xie"></textarea><div class="btnrow">${linkBtn('import-pasted','Импортировать текст','btn') }</div><p class="helper">Или выбери файл TXT, TSV, CSV, JSON</p><label class="btn dim small upload-label">Выбрать файл карточек<input id="import-file" class="file-input" type="file" accept=".txt,.tsv,.csv,.json,text/plain,application/json"/></label></section>
<section class="panel soft"><h3>Русский словарь для HSK</h3><p class="helper">Импорт дополнительного пакета переводов в формате Hanzi One JSON. Слова будут подставляться во все учебные разделы, при этом собственные правки сохраняют приоритет. Сейчас в пакете: ${Object.keys(ruPack).length} записей.</p><label class="btn dim small upload-label">Выбрать пакет переводов<input id="ru-pack-file" class="file-input" type="file" accept=".json,application/json"/></label><p class="helper">Инструкция и конвертер открытого словаря FreeDict — в папке tools скачанного архива. Большой словарь сохраняется в IndexedDB, а не в настройках браузера.</p></section>
<section class="panel soft"><h3>Резервная копия</h3><p class="helper">Сохраняются твои импортированные слова, статистика, прохождение уроков и интервалы повторений. Не удаляй данные Safari без резервной копии.</p><div class="btnrow">${linkBtn('export-backup','Скачать резервную копию','btn alt')}${linkBtn('restore-backup','Восстановить копию','btn dim')}</div><input id="restore-file" type="file" accept=".json" style="display:none"/></section>`;}
function more(){return `${pageHead('工具 · инструменты','Все инструменты','Доступ к словарю, произношению, грамматике и сохранению данных.')}
<div class="two"><button class="wordcard" data-action="open-dict"><span class="hanzi">词</span><b>Словарь</b><span class="ru">Поиск и избранное</span></button><button class="wordcard" data-action="open-speak"><span class="hanzi">声</span><b>Произношение</b><span class="ru">Четыре китайских тона</span></button><button class="wordcard" data-action="open-grammar"><span class="hanzi">语</span><b>Грамматика</b><span class="ru">Правила и примеры</span></button><button class="wordcard" data-action="open-import"><span class="hanzi">存</span><b>Импорт / копии</b><span class="ru">Quizlet, CSV, JSON</span></button></div>
<section class="panel soft"><h3>Тренировка навыков</h3><div class="two"><button class="wordcard" data-action="open-listening"><span class="hanzi">听</span><b>Аудирование</b><span class="ru">Короткие фразы с вопросами</span></button><button class="wordcard" data-action="open-favorites"><span class="hanzi">★</span><b>Избранное</b><span class="ru">${state.favorites.length} сохранённых слов</span></button><button class="wordcard" data-action="open-errors"><span class="hanzi">错</span><b>Мои ошибки</b><span class="ru">Слова, требующие внимания</span></button></div></section>
<section class="panel soft" style="margin-top:15px"><h3>Что реализовано и что ещё нет</h3><p>Работают: локальное запоминание, карточки с повторами, тесты, общий прогресс, 214 ключей, рукописная практика, базовые уроки, поиск, импорт и резервные копии.</p><p class="helper">Ограничения версии: русский перевод есть только у начальной подборки; полный HSK загружается отдельно и содержит иероглифы и пиньинь; нет собственного каталога видео, полноценной грамматики HSK 1–9, OCR, облачной синхронизации и гарантированно точной проверки произношения. Проверка порядка черт зависит от доступности открытых данных.</p><h3>Открытые источники</h3><p class="helper"><a style="color:var(--jade)" href="https://github.com/profesorm/hsk30" target="_blank" rel="noopener">profesorm/hsk30 — HSK 3.0 (программа 2025/2026), CC BY 4.0</a><br><a style="color:var(--jade)" href="https://hanziwriter.org/license.html" target="_blank" rel="noopener">Hanzi Writer — MIT / Arphic Public License для данных</a></p></section>`;}
function createWordPage(){return `${pageHead('✚ · карточки','Добавить слово','Новые слова появятся в словаре и карточках.')}
<section class="panel"><label>Иероглифы <input id="new-hanzi" class="input" maxlength="25" placeholder="你好"></label><label>Русский перевод <input id="new-ru" class="input" maxlength="120" placeholder="привет"></label><label>Пиньинь <input id="new-pinyin" class="input" maxlength="100" placeholder="nǐ hǎo"></label><div class="btnrow">${linkBtn('save-word','Сохранить слово','btn')}</div></section>`;}

// Short original listening exercises. Audio is synthesized by the device, not recorded by a native speaker.
const LISTEN_ITEMS=[
 {band:'1',word:'你好！',ru:'Привет!'},
 {band:'1',word:'我是学生。',ru:'Я студент.'},
 {band:'1',word:'你喝茶吗？',ru:'Ты пьёшь чай?'},
 {band:'1',word:'我有一本书。',ru:'У меня есть книга.'},
 {band:'1',word:'今天很热。',ru:'Сегодня жарко.'},
 {band:'1',word:'她是我的朋友。',ru:'Она моя подруга.'},
 {band:'1',word:'我不喜欢咖啡。',ru:'Я не люблю кофе.'},
 {band:'1',word:'明天见！',ru:'До завтра!'},
 {band:'2',word:'我已经吃过饭了。',ru:'Я уже поел.'},
 {band:'2',word:'请你说慢一点。',ru:'Пожалуйста, говори немного медленнее.'},
 {band:'2',word:'外面正在下雨。',ru:'На улице сейчас идёт дождь.'},
 {band:'2',word:'我想买两张票。',ru:'Я хочу купить два билета.'},
 {band:'2',word:'他的中文越来越好。',ru:'Его китайский становится всё лучше.'},
 {band:'3',word:'虽然有点困难，但是我会继续学习。',ru:'Хотя это немного трудно, я продолжу учиться.'},
 {band:'3',word:'如果明天天气好，我们就去公园。',ru:'Если завтра будет хорошая погода, мы пойдём в парк.'},
 {band:'3',word:'请把你的意见告诉我。',ru:'Пожалуйста, скажи мне своё мнение.'},
 {band:'4',word:'只有坚持练习，才能逐渐提高语言能力。',ru:'Только регулярно практикуясь, можно постепенно повысить уровень языка.'},
 {band:'4',word:'这项计划需要大家共同参与。',ru:'Этот план требует совместного участия всех.'},
 {band:'5',word:'即使面临挑战，我们也不应该轻易放弃目标。',ru:'Даже столкнувшись с трудностями, не следует легко отказываться от цели.'},
 {band:'6',word:'我们应当客观地分析问题，并提出切实可行的解决方案。',ru:'Нужно объективно анализировать проблему и предлагать практически осуществимые решения.'},
 {band:'7-9',word:'该研究成果在一定程度上揭示了复杂系统内部的相互作用机制。',ru:'Результаты исследования в определённой мере раскрывают механизмы взаимодействия внутри сложных систем.'},
];
function listeningPage(){const q=view.listening;const pool=LISTEN_ITEMS.filter(x=>x.band===view.band);const previous=state.listening[view.band];
 const head=pageHead('听力 · аудирование','Слушаем и понимаем','Прослушай фразу и выбери её русский смысл. Аудио синтезирует твой iPhone, а не преподаватель.');
 if(!q||q.band!==view.band)return `${head}${bandTabs()}<section class="panel"><h3>Уровень HSK ${esc(view.band)}</h3><p>${pool.length} учебных фраз. Лучший результат: ${previous?previous.best+'%':'ещё нет'}.</p><p class="helper">После воспроизведения не смотри на иероглифы: тренируем понимание на слух, а не чтение.</p>${linkBtn('start-listening','Начать тренировку','btn')}</section>`;
 if(q.finished)return `${head}<section class="panel prompt"><div class="score-big">${pct(q.right,q.items.length)}%</div><h3>Аудирование завершено</h3><p>${q.right} из ${q.items.length} верно. Лучший результат: ${state.listening[view.band]?.best||0}%.</p><div class="btnrow" style="justify-content:center">${linkBtn('start-listening','Ещё раз','btn')}${linkBtn('open-errors','Другие слабые места','btn dim')}</div></section>`;
 const it=q.items[q.i];return `${head}<section class="panel prompt"><div class="topline">Вопрос ${q.i+1} / ${q.items.length}</div><div class="audio-symbol" aria-hidden="true">听</div>${linkBtn('listen-hear','▶ Прослушать фразу','btn')}<p class="helper">Выбери правильный перевод из вариантов ниже.</p><div class="choices">${it.choices.map((c,j)=>`<button class="choice ${it.answer!==null?(c===it.ru?'correct':c===it.answer?'wrong':''):''}" data-listen-choice="${j}" ${it.answer!==null?'disabled':''}>${esc(c)}</button>`).join('')}</div>${it.answer!==null?`<div class="result ${it.answer===it.ru?'':'bad'}">${it.answer===it.ru?'Верно!':'Верный ответ: '+esc(it.ru)}<div class="pinyin" style="padding-top:8px;font-size:18px">${esc(it.word)}</div></div><div class="btnrow" style="justify-content:center">${linkBtn('listen-next','Дальше →','btn')}</div>`:''}</section>`;
}
function startListening(){const pool=LISTEN_ITEMS.filter(x=>x.band===view.band);if(pool.length<1){alert('Для выбранного уровня пока нет примеров.');return;}
 const list=rand(pool).slice(0,Math.min(5,pool.length));const items=list.map(it=>{const distractors=rand(LISTEN_ITEMS.filter(x=>x.ru!==it.ru&&x.band===it.band).concat(LISTEN_ITEMS.filter(x=>x.ru!==it.ru&&x.band!==it.band))).map(x=>x.ru);return {...it,choices:rand([it.ru,...new Set(distractors)].slice(0,4)),answer:null};});
 view.listening={band:view.band,items,i:0,right:0,finished:false};openPage('listening');speech(items[0].word);
}
function advanceListening(){const q=view.listening;if(!q||q.finished)return;q.i++;if(q.i>=q.items.length){q.finished=true;const value=pct(q.right,q.items.length),old=state.listening[view.band]||{best:0,attempts:0};state.listening[view.band]={best:Math.max(old.best,value),last:value,attempts:(old.attempts||0)+1};touch();save();}render();}
function errorsPage(){const list=Object.entries(state.errors).filter(([_,count])=>count>0).sort((a,b)=>b[1]-a[1]).slice(0,80);
 return `${pageHead('错题 · ошибки','Разберём слабые места','Слова, в которых ты ошибалась на проверках. При правильных ответах счётчик постепенно уменьшается.')}${list.length?`<section class="panel">${list.map(([word,n])=>{const w=getWords().find(x=>x.word===word);return `<div class="item"><div><b class="hanzi">${esc(word)}</b><div class="pinyin">${esc(w?.pinyin||'')}</div><div class="helper">${esc(ruOf(w)||'Перевод отсутствует')} · ошибок: ${n}</div></div>${w?linkBtn('hear','▶','btn dim small',`data-word="${esc(w.id)}"`):''}</div>`;}).join('')}<div class="btnrow">${linkBtn('review','Повторять карточки','btn')}</div></section>`:'<div class="empty">Пока нет зафиксированных ошибок. Продолжай уроки!</div>'}`;
}

function render(){if(!view.radicals.length&&view.page!=='home'){}const pages={home,courses,lesson,quiz:quizPage,cards,hanzi,radical:radicalPage,write:writePage,dictionary,grammar,speak,import:importPage,more,create:createWordPage,listening:listeningPage,errors:errorsPage};$('#app').innerHTML=(pages[view.page]||home)();document.querySelectorAll('[data-nav]').forEach(n=>n.classList.toggle('active',n.dataset.nav===view.page||((view.page==='lesson'||view.page==='quiz')&&n.dataset.nav==='courses')||((view.page==='radical'||view.page==='write')&&n.dataset.nav==='hanzi')||(['dictionary','grammar','speak','import','create','listening','errors'].includes(view.page)&&n.dataset.nav==='more')));if(view.page==='write')setupCanvas();}
function openPage(p){view.page=p;view.search='';view.msg='';render();window.scrollTo(0,0);}
function speech(text){if(!('speechSynthesis'in window)){alert('На этом устройстве нет синтеза речи.');return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.78;const voices=speechSynthesis.getVoices();const v=voices.find(x=>x.lang.toLowerCase().startsWith('zh-cn'))||voices.find(x=>x.lang.toLowerCase().startsWith('zh'));if(v)u.voice=v;speechSynthesis.speak(u);}
let canvasStroke=null,writer=null;
function setupCanvas(){const canvas=$('#draw');if(!canvas)return;const wrap=$('#writerbox');const w=Math.min(wrap.getBoundingClientRect().width,360);canvas.width=w*devicePixelRatio;canvas.height=w*devicePixelRatio;const ctx=canvas.getContext('2d');ctx.scale(devicePixelRatio,devicePixelRatio);function bg(){ctx.clearRect(0,0,w,w);if(view.showHint){ctx.fillStyle='#d0d6d2';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${w*.64}px serif`;ctx.fillText(view.practiceWord,w/2,w/2+8);}}
bg();let last=null;const pos=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);last=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.strokeStyle='#163f39';ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineTo(last.x+.01,last.y+.01);ctx.stroke();};canvas.onpointermove=e=>{if(!last)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;};canvas.onpointerup=canvas.onpointercancel=()=>{last=null;};canvasStroke=bg;}
let writerLoader=null;
function loadHanziWriter(){if(window.HanziWriter)return Promise.resolve(window.HanziWriter);if(writerLoader)return writerLoader;writerLoader=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/hanzi-writer@3.0.0/dist/hanzi-writer.min.js';script.onload=()=>window.HanziWriter?resolve(window.HanziWriter):reject(Error('Библиотека недоступна'));script.onerror=()=>reject(Error('Не удалось загрузить Hanzi Writer'));document.head.appendChild(script);}).catch(e=>{writerLoader=null;throw e;});return writerLoader;}
async function showWriter(quiz){const msg=$('#writer-msg');if(msg)msg.textContent='Загружаем открытые данные о чертах…';try{const HW=await loadHanziWriter();if(view.page!=='write')return;const box=$('#writerbox');box.innerHTML='';const size=Math.min(box.clientWidth,360);writer=HW.create('writerbox',view.practiceWord[0],{width:size,height:size,padding:20,showOutline:true,showCharacter:!quiz,highlightColor:'#2d9985',strokeColor:'#1a4a41',outlineColor:'#bed7cc'});if(quiz)writer.quiz({onComplete:()=>{if($('#writer-msg'))$('#writer-msg').textContent='Отлично! Порядок черт выполнен правильно.';}});else writer.animateCharacter();if(msg)msg.textContent=quiz?'Веди пальцем по чертам в правильном порядке.':'Анимация черт первого иероглифа. Для слов из нескольких знаков выбирай каждый отдельно.';}catch(e){if(msg)msg.textContent=e.message+'. Свободная пропись остаётся доступной.';if(view.page==='write'){const box=$('#writerbox');if(box&&!box.querySelector('canvas'))box.innerHTML='<canvas id="draw"></canvas>';setupCanvas();}}}
function toneFromPitch(arr){if(arr.length<6)return null;const a=arr.map(v=>Math.log2(v));const median=xs=>xs.slice().sort((x,y)=>x-y)[Math.floor(xs.length/2)];const chunks=[a.slice(0,Math.ceil(a.length/3)),a.slice(Math.floor(a.length/3),Math.ceil(2*a.length/3)),a.slice(Math.floor(2*a.length/3))];const [first,mid,last]=chunks.map(median);const delta=(last-first)*12;const dip=(Math.min(first,last)-mid)*12;const spread=(Math.max(...a)-Math.min(...a))*12;if(dip>1.25&&first-mid>.05&&last-mid>.05)return 3;if(delta>=1.5)return 2;if(delta<=-1.5)return 4;if(spread<3.5)return 1;return delta<0?4:2;}
function pitchOfBuffer(data,sr){let rms=0;for(let i=0;i<data.length;i++)rms+=data[i]*data[i];rms=Math.sqrt(rms/data.length);if(rms<.023)return null;const minLag=Math.floor(sr/600),maxLag=Math.min(Math.floor(sr/85),data.length-1);let best=-1,bestLag=0;const span=data.length-maxLag;for(let lag=minLag;lag<=maxLag;lag+=2){let sum=0,sq1=0,sq2=0;for(let i=0;i<span;i+=2){const a=data[i],b=data[i+lag];sum+=a*b;sq1+=a*a;sq2+=b*b;}const corr=sum/Math.sqrt((sq1*sq2)||1);if(corr>best){best=corr;bestLag=lag;}}return best>.71?sr/bestLag:null;}
async function recordTone(){const label=$('#speaking-status');try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Запись микрофона недоступна');const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});const AudioC=window.AudioContext||window.webkitAudioContext;if(!AudioC)throw Error('Web Audio недоступен');const ctx=new AudioC();await ctx.resume();const src=ctx.createMediaStreamSource(stream);const analyser=ctx.createAnalyser();analyser.fftSize=4096;src.connect(analyser);const buffer=new Float32Array(analyser.fftSize);let pitches=[];if(label)label.textContent='Произнеси слог ма выбранным тоном…';let ticker=setInterval(()=>{analyser.getFloatTimeDomainData(buffer);const f=pitchOfBuffer(buffer,ctx.sampleRate);if(f)pitches.push(f);},85);setTimeout(async()=>{clearInterval(ticker);stream.getTracks().forEach(t=>t.stop());await ctx.close();const detected=toneFromPitch(pitches);const message=detected===null?'Голос не удалось уверенно измерить. Попробуй в тихом помещении.':`Запись завершена. Ожидался ${view.speakTone}-й тон; вероятный контур: ${detected}-й. Это предварительный результат.`;view.speakResult={detected,count:pitches.length,message};if(view.page==='speak'){render();const bars=$('#tonebars');if(bars&&pitches.length){const arr=pitches.filter((_,i)=>i%Math.max(1,Math.floor(pitches.length/22))===0).slice(0,22);const min=Math.min(...arr),max=Math.max(...arr);bars.innerHTML=arr.map(x=>`<div style="height:${Math.round(14+78*(x-min)/(max-min||1))}px"></div>`).join('');}}},2700);}catch(e){if(label)label.textContent='Ошибка записи: '+e.message;}}
function recognizeSpeech(){const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;const label=$('#speaking-status');if(!Speech){if(label)label.textContent='На этой версии Safari распознавание фраз не поддерживается.';return;}try{const r=new Speech();r.lang='zh-CN';r.interimResults=false;r.maxAlternatives=1;r.onresult=e=>{if(label)label.textContent='Распознано: '+e.results[0][0].transcript+' (это не проверка точности тонов).';};r.onerror=e=>{if(label)label.textContent='Распознавание недоступно: '+e.error;};r.start();if(label)label.textContent='Говори по-китайски…';}catch(e){if(label)label.textContent='Не удалось начать распознавание: '+e.message;}}
function csvLine(s){const parts=[];let cur='',q=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(q&&s[i+1]==='"'){cur+='"';i++;}else q=!q;}else if((c===','||c===';')&&!q){parts.push(cur.trim());cur='';}else cur+=c;}parts.push(cur.trim());return parts;}
function importText(s){s=s.trim();let entries=[];if(!s)return 0;try{const parsed=JSON.parse(s);if(Array.isArray(parsed))entries=parsed.map(x=>[x.word||x.term||x.hanzi||x.front||x[0],x.ru||x.definition||x.translation||x.back||x[1],x.pinyin||x[2]]);else throw Error('Неверный формат');}catch{entries=s.split(/\r?\n/).map(l=>l.includes('\t')?l.split('\t'):csvLine(l));}let count=0;const existing=new Set(getWords().map(w=>w.word+'|'+w.ru));entries.forEach(([word,ru,pinyin])=>{word=String(word||'').trim();ru=String(ru||'').trim();pinyin=String(pinyin||'').trim();if(!word||!ru||word.length>50||ru.length>300||existing.has(word+'|'+ru))return;if(/^(term|word|слово|иероглиф)$/i.test(word))return;const id=`own-${Date.now()}-${state.custom.length}-${count}`;state.custom.push({id,word,ru,pinyin,band:'mine'});existing.add(word+'|'+ru);count++;});save();return count;}
function saveDownload(name,text,mime='application/json'){const blob=new Blob([text],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);}
function renderDictionaryResults(){const q=view.search,arr=findWords(q);if($('#dict-results'))$('#dict-results').innerHTML=arr.slice(0,35).map(w=>wordHtml(w,true)).join('')||'<div class="empty">Совпадений не найдено</div>';if($('#dict-count'))$('#dict-count').textContent=`${arr.length} результатов`;
}
function renderRadicalResults(){const filtered=view.radicals.filter(r=>!view.search||`${r.radical} ${r.base} ${r.ru} ${r.id}`.toLowerCase().includes(view.search.toLowerCase()));if($('#radical-results'))$('#radical-results').innerHTML=filtered.map(r=>`<button class="k-cell" data-radical="${r.id}" title="${esc(r.ru)}">${esc(r.radical)}<small>${r.id}</small></button>`).join('');}
async function action(name,button){switch(name){case'load-hsk':await fetchHSK(true);break;case'start-lesson':openPage('lesson');break;case'back-courses':openPage('courses');break;case'prev-lesson':view.lesson=Math.max(0,view.lesson-1);render();break;case'next-lesson':view.lesson=Math.min(Math.max(0,Math.ceil(wordsInBand(view.band).length/10)-1),view.lesson+1);render();break;case'start-quiz':makeQuiz();break;case'quiz-next':{const q=view.quiz;q.i++;if(q.i>=q.items.length){q.finished=true;if(q.hasTranslations&&pct(q.right,q.items.length)>=80)state.completed[view.band+':'+view.lesson]=now();save();}render();break;}
case'add-to-cards':{wordsInBand(view.band).slice(view.lesson*10,(view.lesson+1)*10).forEach(w=>{state.progress[w.id]??={ease:2.5,rep:0,interval:0,next:0};});save();alert('Слова добавлены в повторение.');break;}
case'review':case'reload-cards':cardQueue();break;case'flip':view.cardFlip=true;render();break;case'grade-card':{const word=byId(view.cardQueue.shift());schedule(word,Number(button.dataset.grade));view.cardFlip=false;render();break;}
case'hear':{const w=byId(button.dataset.word);if(w)speech(w.word);break;}
case'listen-example':speech(button.dataset.example);break;case'open-dict':view.favoritesOnly=false;openPage('dictionary');break;
case'toggle-favorites-filter':view.favoritesOnly=!view.favoritesOnly;render();break;
case'open-favorites':view.favoritesOnly=true;openPage('dictionary');break;
case'toggle-favorite':{const w=byId(button.dataset.word);if(!w)break;state.favorites=state.favorites.includes(w.word)?state.favorites.filter(x=>x!==w.word):[...state.favorites,w.word];save();render();break;}
case'edit-translation':{const w=byId(button.dataset.word);if(!w)break;const entered=prompt(`Перевод для ${w.word} (${w.pinyin}). Оставь пустым, чтобы отменить собственный перевод.`,ruOf(w));if(entered===null)break;const value=entered.trim().slice(0,300);if(value)state.ruOverrides[w.word]=value;else delete state.ruOverrides[w.word];save();render();break;}
case'open-errors':openPage('errors');break;case'open-listening':openPage('listening');break;case'start-listening':startListening();break;case'listen-hear':if(view.listening&&!view.listening.finished)speech(view.listening.items[view.listening.i].word);break;case'listen-next':advanceListening();break;case'open-speak':openPage('speak');break;case'open-grammar':openPage('grammar');break;case'open-import':openPage('import');break;
case'write-word':{const w=byId(button.dataset.word);if(w){view.practiceWord=w.word;view.showHint=true;openPage('write');}break;}
case'write-radical':view.practiceWord=view.radical.base;openPage('write');break;case'write-selected':openPage('write');break;case'back-radicals':openPage('hanzi');break;
case'animate-strokes':await showWriter(false);break;case'quiz-strokes':await showWriter(true);break;case'clear-canvas':if(writer){writer=null;render();}else canvasStroke?.();break;case'hint-canvas':view.showHint=!view.showHint;render();break;
case'hear-syllable':speech(['妈','麻','马','骂'][view.speakTone-1]);break;case'record-tone':await recordTone();break;case'recognize':recognizeSpeech();break;
case'create-word':openPage('create');break;case'save-word':{const word=$('#new-hanzi').value.trim(),ru=$('#new-ru').value.trim(),pinyin=$('#new-pinyin').value.trim();if(!word||!ru){alert('Нужны иероглифы и русский перевод.');return;}importText(JSON.stringify([{word,ru,pinyin}]));openPage('dictionary');break;}
case'import-pasted':{const count=importText($('#import-text').value);alert(`Импортировано карточек: ${count}`);render();break;}
case'export-backup':saveDownload('hanzi-one-backup-'+dayKey()+'.json',JSON.stringify({format:'hanzi-one-v1',date:new Date().toISOString(),state,ruPack},null,2));break;
case'restore-backup':$('#restore-file').click();break;
}}
document.addEventListener('click',async e=>{const btn=e.target.closest('[data-nav],[data-band],[data-radical],[data-tone],[data-choice],[data-listen-choice],[data-action]');if(!btn||btn.disabled)return;if(btn.dataset.nav){openPage(btn.dataset.nav);return;}if(btn.dataset.band){view.band=btn.dataset.band;view.lesson=0;render();return;}if(btn.dataset.radical){view.radical=view.radicals.find(r=>r.id===Number(btn.dataset.radical));openPage('radical');return;}if(btn.dataset.tone){view.speakTone=Number(btn.dataset.tone);view.speakResult=null;render();return;}if(btn.dataset.choice!==undefined){const q=view.quiz;if(!q||q.finished||q.items[q.i].answer!==null)return;const item=q.items[q.i];item.answer=item.choices[Number(btn.dataset.choice)];if(item.answer===item.correct)q.right++;schedule(byId(item.id),item.answer===item.correct?4:1);if(item.answer!==item.correct)state.errors[item.word]=(state.errors[item.word]||0)+1;else if(state.errors[item.word])state.errors[item.word]=Math.max(0,state.errors[item.word]-1);save();render();return;}if(btn.dataset.listenChoice!==undefined){const q=view.listening;if(!q||q.finished||q.items[q.i].answer!==null)return;const item=q.items[q.i];item.answer=item.choices[Number(btn.dataset.listenChoice)];if(item.answer===item.ru)q.right++;state.daily[dayKey()]??={repetitions:0,listening:0};state.daily[dayKey()].listening++;save();render();return;}if(btn.dataset.action){try{await action(btn.dataset.action,btn);}catch(err){console.error(err);alert('Ошибка: '+err.message);}}});
document.addEventListener('input',e=>{if(e.target.id==='dict-search'){view.search=e.target.value;renderDictionaryResults();}else if(e.target.id==='radical-search'){view.search=e.target.value;renderRadicalResults();}});
document.addEventListener('change',async e=>{if(e.target.id==='ru-pack-file'){const f=e.target.files?.[0];if(!f)return;try{const payload=JSON.parse(await f.text());if(payload.format!=='hanzi-one-ru-v1'||!payload.words||typeof payload.words!=='object'||Array.isArray(payload.words))throw Error('Неизвестный формат пакета');const entries=Object.entries(payload.words);if(entries.length>100000)throw Error('Пакет слишком велик');let valid=0;for(const [word,ru] of entries){if(word.length<1||word.length>20||!/[\u3400-\u9fff]/u.test(word)||typeof ru!=='string'||!ru.trim()||ru.length>400)throw Error('Некорректные словарные данные');valid++;}const merged={...ruPack,...payload.words};if(!await setAsset('ruPack',merged))throw Error('Не удалось сохранить словарь в IndexedDB');ruPack=merged;alert(`Загружено переводов: ${valid}. В словаре всего: ${Object.keys(ruPack).length}.`);render();}catch(err){alert('Ошибка импорта словаря: '+err.message);}return;}if(e.target.id==='import-file'){const f=e.target.files?.[0];if(f){const count=importText(await f.text());alert(`Импортировано карточек: ${count}`);render();}}else if(e.target.id==='restore-file'){const f=e.target.files?.[0];if(!f)return;try{const j=JSON.parse(await f.text());if(j.format!=='hanzi-one-v1'||!j.state?.progress||!Array.isArray(j.state.custom))throw Error('Неизвестный формат');if(!confirm('Заменить нынешний прогресс данными из копии?'))return;if(j.ruPack&&typeof j.ruPack==='object'&&!Array.isArray(j.ruPack)){ruPack=j.ruPack;await setAsset('ruPack',ruPack);}state=j.state;state.favorites??=[];state.ruOverrides??={};state.errors??={};state.daily??={};state.listening??={};state.settings??={};state.completed??={};state.streak??={};save();openPage('home');}catch(err){alert('Не удалось прочитать резервную копию: '+err.message);}}});
async function init(){try{const res=await fetch('radicals.json');if(res.ok)view.radicals=await res.json();}catch{}if(!view.radicals.length){hskStatus+=' Данные ключей временно недоступны.';}ruPack=(await getAsset('ruPack'))||{};render();if('serviceWorker'in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js').catch(console.warn);}if('indexedDB'in window)fetchHSK(false).catch(console.warn);}
init();
