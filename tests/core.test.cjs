const {test} = require('node:test');
const assert = require('node:assert/strict');
const core = require('../learning-core.js');
require('../course-data.js');
const empty = () => core.normalizeState({});
test('old 0.2 progress keeps IDs, intervals and translations', () => {
  const state=empty();state.progress['demo-0']={ease:2.5,rep:2,interval:3,next:1234};state.completed['1:0']=10;state.ruOverrides['你好']='привет';
  const backup=core.parseBackup({format:'hanzi-one-v1',state});
  assert.deepEqual(backup.state.progress,state.progress);assert.equal(backup.state.ruOverrides['你好'],'привет');assert.deepEqual(backup.state.units,{});
});
test('new backup retains custom words, favourites and thematic results', () => {
  const state=empty();state.custom=[{id:'own-1',word:'猫',pinyin:'māo',ru:'кошка',band:'mine'}];state.favorites=['猫'];state.units.greetings=core.finishUnit(null,6,6,100);
  const result=core.parseBackup(JSON.parse(JSON.stringify({format:'hanzi-one-v2',state,ruPack:{猫:'кошка'},hsk:null})));
  assert.deepEqual(result.state,state);assert.equal(result.ruPack.猫,'кошка');
});
test('rejects corrupted intervals and duplicate card IDs before restoring', () => {
  const state=empty();state.progress.x={ease:2,rep:1,interval:1,next:'tomorrow'};
  assert.throws(()=>core.parseBackup({format:'hanzi-one-v1',state}),/интервалы/);
  state.progress={};const word={id:'same',word:'猫',ru:'кошка'};state.custom=[word,word];assert.throws(()=>core.normalizeState(state),/карточка/);
});
test('rejects malformed nested state and prototype keys', () => {
  for(const key of ['progress','daily','units','settings']) assert.throws(()=>core.normalizeState({[key]:[]}),/раздел/);
  const state=core.normalizeState(JSON.parse('{"progress":{"__proto__":{"next":0}}}'));
  assert.equal(Object.hasOwn(state.progress,'__proto__'),false);assert.equal({}.next,undefined);
});
test('invalid percentages, goals, translations and counters cannot enter storage', () => {
  assert.throws(()=>core.normalizeState({units:{x:{best:101,attempts:1}}}));
  assert.throws(()=>core.normalizeState({settings:{dailyGoal:0}}));
  assert.throws(()=>core.normalizeState({ruOverrides:{猫:{}}}));
  assert.throws(()=>core.normalizeState({errors:{猫:-1}}));
});
test('dictionary pack is validated independently of existing user translations', () => {
  assert.deepEqual(core.validatePack({猫:'кошка'}),{猫:'кошка'});
  assert.throws(()=>core.validatePack({猫:[]}));assert.throws(()=>core.validatePack({hello:'привет'}));
});
test('HSK backup must include the dataset associated with IDs', () => {
  const state=empty();state.progress['hsk26-1']={ease:2.5,rep:1,interval:1,next:100};
  assert.throws(()=>core.parseBackup({format:'hanzi-one-v2',state}),/отсутствует список/);
  const rows=Array.from({length:100},(_,i)=>({sort:i+1,word:'词'+i,pinyin:'cí',levelName:'一级'}));
  assert.equal(core.parseBackup({format:'hanzi-one-v2',state,hsk:rows}).hsk.length,100);
  rows[1].sort=1;assert.throws(()=>core.validateHSK(rows),/запись/);
});
test('a successful full check remains passed after a later failed attempt', () => {
  let result=core.finishUnit(null,5,6,123);
  assert.equal(result.best,83);assert.equal(result.passed,123);
  result=core.finishUnit(result,1,6,456);assert.equal(result.best,83);assert.equal(result.last,17);assert.equal(result.passed,123);assert.equal(result.attempts,2);
  assert.equal(core.finishUnit(null,4,6,789).passed,null);
});
test('shuffle keeps every element exactly once and does not mutate the source', () => {
  const source=['a','b','c','d'];const result=core.shuffle(source,()=>0);
  assert.deepEqual(source,['a','b','c','d']);assert.deepEqual(result.slice().sort(),source);assert.notDeepEqual(result,source);
});
test('all 60 original exercises have real distractors or usable sentence tokens', () => {
  const units=globalThis.COURSE_UNITS;assert.equal(units.length,10);assert.equal(new Set(units.map(u=>u.id)).size,10);
  let count=0;
  for(const unit of units){assert.equal(unit.exercises.length,6);assert.equal(unit.dialogue.length,4);
    for(const ex of unit.exercises){count++;const [type,prompt,correct,options,explanation]=ex;assert.ok(prompt);
      if(type==='order'){assert.ok(correct.length>=4);assert.ok(options);assert.equal(new Set(correct).size,correct.length);}
      else{assert.equal(options.length,3);assert.equal(new Set([correct,...options]).size,4);assert.ok(explanation);}
    }
  }
  assert.equal(count,60);
});
