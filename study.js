'use strict';
function currentUnit() { return COURSE_UNITS.find(u => u.id === view.unit) || COURSE_UNITS[0]; }
function unitWords(unit) { return unit.words.map(([word]) => getWords().find(w => w.word === word)).filter(Boolean); }
function unitList() {
  return `${pageHead('学习路线 · учебный маршрут','От знакомства к разговору','10 авторских тематических уроков: слова, грамматика, диалоги и 60 проверочных заданий. Это начальный маршрут, а не полный курс HSK 1–9.')}
  ${COURSE_UNITS.map((u,i) => {const result=state.units[u.id];return `<section class="panel soft"><div class="topline">Тема ${i+1} · этап ${u.stage}</div><h3>${esc(u.title)}</h3><p class="helper">${esc(u.goal)}</p><p><span class="tag ${result?.passed?'':'gold'}">${result?.passed?'зачтён':result?'нужна практика':'новый урок'}</span> <span class="helper">${result?`Лучший результат: ${result.best}% · попыток: ${result.attempts}`:'6 заданий · проходной результат 80%'}</span></p><button class="btn alt" data-unit="${u.id}">Открыть тему</button></section>`;}).join('')}`;
}
function dialogueHtml(unit, translations) {
  return `<div class="dialogue">${unit.dialogue.map(([zh,py,ru],i)=>`<div class="dialogue-line"><span class="tag">${i%2?'Б':'А'}</span><div><p class="dialogue-hanzi">${esc(zh)}</p>${translations?`<div class="pinyin">${esc(py)}</div><p class="helper">${esc(ru)}</p><button class="btn dim small" data-action="listen-example" data-example="${esc(zh)}" aria-label="Прослушать реплику ${i+1}">▶ Слушать</button>`:''}</div></div>`).join('')}</div>`;
}
function unitPage() {
  const u=currentUnit(), result=state.units[u.id];
  return `${pageHead('Тематический урок',u.title,u.goal)}<section class="panel"><h3>Слова темы</h3>${unitWords(u).map(w=>wordHtml(w,true)).join('')}<div class="btnrow">${linkBtn('unit-add-cards','Добавить слова в повторение','btn alt')}</div></section>
  <section class="panel soft"><h3>Как строится фраза</h3><p>${esc(u.grammar)}</p></section>
  <section class="panel"><h3>Диалог</h3>${dialogueHtml(u,true)}</section>
  <section class="panel soft"><h3>Проверь понимание</h3><p>6 заданий: выбор значения, пропуски, сборка предложения и чтение. Для зачёта нужно минимум 80%.</p>${result?`<p class="helper">Последняя попытка: ${result.last}% · лучший результат: ${result.best}%</p>`:''}<div class="btnrow">${linkBtn('unit-test','Начать проверку','btn')}${linkBtn('open-units','Все темы','btn dim')}</div></section>`;
}
function startUnitQuiz(retry=false) {
  const u=currentUnit(), old=view.unitQuiz;
  let items=u.exercises.map((ex,index)=>{const [type,prompt,correct,distractors,explanation]=ex;return {type,prompt,correct,explanation:type==='order'?distractors:explanation,index,choices:type==='order'?[]:rand([correct,...distractors]),tokens:type==='order'?rand(correct.map((text,id)=>({text,id}))):[],answer:null,selected:[]};});
  if(retry&&old?.unit===u.id) items=items.filter(it=>old.wrong.includes(it.index));
  if(!items.length)return;
  view.unitQuiz={unit:u.id,items:rand(items),i:0,right:0,wrong:[],finished:false,retry};
  openPage('unitQuiz');
}
function unitQuizPage() {
  const q=view.unitQuiz;if(!q)return unitPage();
  const u=COURSE_UNITS.find(x=>x.id===q.unit);
  if(q.finished){const score=pct(q.right,q.items.length),passed=score>=80;const next=COURSE_UNITS[COURSE_UNITS.indexOf(u)+1];return `${pageHead(q.retry?'Повтор ошибок':'Проверка темы',u.title,'Результат сохранён на этом устройстве.')}<section class="panel prompt"><div class="score-big">${score}%</div><h3>${q.retry?'Повтор завершён':passed?'Тема зачтена!':'Вернись к сложным заданиям'}</h3><p>${q.right} из ${q.items.length} верно</p><p class="helper">${q.retry?'Повтор ошибок помогает закрепить материал. Для зачёта темы пройди полную проверку.':'Слова темы доступны в карточках. Можно перечитать диалог и повторить проверку.'}</p><div class="btnrow">${q.wrong.length?linkBtn('unit-retry-errors','Повторить ошибки','btn'):''}${linkBtn('unit-test','Вся проверка заново','btn alt')}${linkBtn('unit-return','Вернуться к уроку','btn dim')}${!q.retry&&passed&&next?`<button class="btn" data-unit="${next.id}">Следующая тема →</button>`:''}</div></section>`;}
  const it=q.items[q.i],answered=it.answer!==null;
  return `${pageHead('Проверка темы',`Задание ${q.i+1} из ${q.items.length}`,u.title)}<div class="progressbar"><i style="width:${pct(q.i,q.items.length)}%"></i></div>${it.type==='reading'?`<section class="panel soft"><h3>Прочитай диалог</h3>${dialogueHtml(u,false)}</section>`:''}<section class="panel"><h3>${esc(it.prompt)}</h3>${it.type==='order'?`<div class="sentence-answer" aria-live="polite">${it.selected.length?it.selected.map(id=>esc(it.tokens.find(t=>t.id===id).text)).join(' '):'Нажимай на слова в нужном порядке'}</div><div class="token-bank">${it.tokens.map(t=>`<button class="btn dim" data-token="${t.id}" ${answered||it.selected.includes(t.id)?'disabled':''}>${esc(t.text)}</button>`).join('')}</div>${!answered?`<div class="btnrow">${linkBtn('unit-check-order','Проверить','btn',it.selected.length!==it.tokens.length?'disabled':'')}${linkBtn('unit-undo-token','Убрать последнее','btn dim',!it.selected.length?'disabled':'')}</div>`:''}`:`<div class="choices">${it.choices.map((c,i)=>`<button class="choice ${answered?(c===it.correct?'correct':c===it.answer?'wrong':''):''}" data-unit-choice="${i}" ${answered?'disabled':''}>${esc(c)}</button>`).join('')}</div>`}
  ${answered?`<div class="result ${it.ok?'':'bad'}"><b>${it.ok?'Верно!':'Верный ответ: '+esc(Array.isArray(it.correct)?it.correct.join(''):it.correct)}</b><p>${esc(it.explanation)}</p></div><div class="btnrow">${linkBtn('unit-next',q.i+1===q.items.length?'Показать результат':'Далее →','btn')}</div>`:''}</section>`;
}
function answerUnit(value) {
  const q=view.unitQuiz,it=q?.items[q.i];if(!it||q.finished||it.answer!==null)return;
  it.answer=value;it.ok=it.type==='order'?value===it.correct.join(''):value===it.correct;
  if(it.ok)q.right++;else q.wrong.push(it.index);
  state.daily[dayKey()]??={repetitions:0,listening:0};state.daily[dayKey()].exercises=(state.daily[dayKey()].exercises||0)+1;
  touch();save();render();
}
function studyClick(btn) {
  if(btn.dataset.unit){view.unit=btn.dataset.unit;openPage('unit');return true;}
  if(btn.dataset.unitChoice!==undefined){const it=view.unitQuiz?.items[view.unitQuiz.i];if(it)answerUnit(it.choices[Number(btn.dataset.unitChoice)]);return true;}
  if(btn.dataset.token!==undefined){const q=view.unitQuiz,it=q?.items[q.i],id=Number(btn.dataset.token);if(it&&!q.finished&&it.answer===null&&!it.selected.includes(id)&&it.tokens.some(t=>t.id===id)){it.selected.push(id);render();}return true;}
  return false;
}
function studyAction(name) {
  switch(name){
    case 'open-units':openPage('units');break;
    case 'continue-unit':view.unit=(COURSE_UNITS.find(u=>!state.units[u.id]?.passed)||COURSE_UNITS[0]).id;openPage('unit');break;
    case 'unit-return':view.unit=view.unitQuiz?.unit||view.unit;openPage('unit');break;
    case 'unit-add-cards':for(const w of unitWords(currentUnit()))state.progress[w.id]??={ease:2.5,rep:0,interval:0,next:0};save();alert('Слова темы добавлены в повторение.');break;
    case 'unit-test':startUnitQuiz();break;
    case 'unit-retry-errors':view.unit=view.unitQuiz.unit;startUnitQuiz(true);break;
    case 'unit-undo-token':{const q=view.unitQuiz,it=q?.items[q.i];if(it&&it.answer===null)it.selected.pop();render();break;}
    case 'unit-check-order':{const q=view.unitQuiz,it=q?.items[q.i];if(it&&it.answer===null&&it.selected.length===it.tokens.length)answerUnit(it.selected.map(id=>it.tokens.find(t=>t.id===id).text).join(''));break;}
    case 'unit-next':{const q=view.unitQuiz;if(!q||q.finished||q.items[q.i].answer===null)break;q.i++;if(q.i===q.items.length){q.finished=true;if(!q.retry){state.units[q.unit]=HanziCore.finishUnit(state.units[q.unit],q.right,q.items.length);for(const w of unitWords(COURSE_UNITS.find(u=>u.id===q.unit)))state.progress[w.id]??={ease:2.5,rep:0,interval:0,next:0};}save();}render();break;}
    default:return false;
  }
  return true;
}
