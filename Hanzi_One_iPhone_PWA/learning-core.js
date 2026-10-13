'use strict';
(function (root) {
  const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const safeKey = k => !['__proto__', 'constructor', 'prototype'].includes(k);
  function shuffle(values, random = Math.random) {
    const out = values.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function normalizeState(input) {
    if (!record(input)) throw Error('Некорректное состояние приложения');
    const out = {};
    for (const name of ['progress', 'completed', 'settings', 'streak', 'ruOverrides', 'errors', 'daily', 'listening', 'units']) {
      const source = input[name] ?? {};
      if (!record(source) || Object.keys(source).length > 100000) throw Error('Некорректный раздел: ' + name);
      out[name] = Object.fromEntries(Object.entries(source).filter(([k]) => safeKey(k)));
    }
    out.custom = input.custom ?? [];
    out.favorites = input.favorites ?? [];
    if (!Array.isArray(out.custom) || out.custom.length > 50000 || !Array.isArray(out.favorites) || out.favorites.length > 50000) throw Error('Некорректные карточки или избранное');
    const ids = new Set();
    out.custom = out.custom.map(w => {
      if (!record(w) || typeof w.id !== 'string' || !w.id || ids.has(w.id) || !safeKey(w.id) || typeof w.word !== 'string' || !w.word.trim() || w.word.length > 50 || typeof w.ru !== 'string' || !w.ru.trim() || w.ru.length > 400 || (w.pinyin !== undefined && typeof w.pinyin !== 'string')) throw Error('Некорректная пользовательская карточка');
      ids.add(w.id);
      return {id:w.id, word:w.word, ru:w.ru, pinyin:w.pinyin || '', band:'mine'};
    });
    if (out.favorites.some(x => typeof x !== 'string' || x.length > 50)) throw Error('Некорректное избранное');
    out.favorites = [...new Set(out.favorites)];
    for (const p of Object.values(out.progress)) {
      if (!record(p) || !['ease', 'rep', 'interval', 'next'].every(k => Number.isFinite(p[k]) && p[k] >= 0) || !Number.isInteger(p.rep)) throw Error('Некорректные интервалы повторений');
    }
    for (const v of Object.values(out.completed)) if (!Number.isFinite(v) || v < 0) throw Error('Некорректный результат урока');
    for (const v of Object.values(out.errors)) if (!Number.isInteger(v) || v < 0) throw Error('Некорректный журнал ошибок');
    for (const v of Object.values(out.ruOverrides)) if (typeof v !== 'string' || v.length > 400) throw Error('Некорректный перевод');
    for (const v of Object.values(out.daily)) if (!record(v) || !['repetitions', 'listening', 'exercises'].every(k => v[k] === undefined || (Number.isInteger(v[k]) && v[k] >= 0))) throw Error('Некорректная статистика');
    for (const collection of [out.units, out.listening]) for (const v of Object.values(collection)) {
      if (!record(v) || !Number.isFinite(v.best) || v.best < 0 || v.best > 100 || !Number.isInteger(v.attempts) || v.attempts < 0 || (v.last !== undefined && (!Number.isFinite(v.last) || v.last < 0 || v.last > 100))) throw Error('Некорректная история проверок');
    }
    if (out.settings.dailyGoal !== undefined && (!Number.isInteger(out.settings.dailyGoal) || out.settings.dailyGoal < 5 || out.settings.dailyGoal > 100)) throw Error('Некорректная дневная цель');
    if (out.streak.count !== undefined && (!Number.isInteger(out.streak.count) || out.streak.count < 0)) throw Error('Некорректная серия занятий');
    if (out.streak.last !== undefined && (typeof out.streak.last !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(out.streak.last))) throw Error('Некорректная дата занятий');
    return out;
  }
  function validatePack(input) {
    if (!record(input) || Object.keys(input).length > 100000) throw Error('Некорректный словарный пакет');
    const out = {};
    for (const [word, ru] of Object.entries(input)) {
      if (!safeKey(word) || !word || word.length > 20 || !/[\u3400-\u9fff]/u.test(word) || typeof ru !== 'string' || !ru.trim() || ru.length > 400) throw Error('Некорректные словарные данные');
      out[word] = ru;
    }
    return out;
  }
  function validateHSK(rows) {
    if (!Array.isArray(rows) || rows.length < 100 || rows.length > 50000) throw Error('Некорректный список HSK');
    const ids = new Set();
    for (let i = 0; i < rows.length; i++) {
      const w = rows[i], id = String(w?.sort || i);
      if (!record(w) || typeof w.word !== 'string' || !w.word || w.word.length > 50 || typeof w.pinyin !== 'string' || !w.pinyin || typeof w.levelName !== 'string' || !/^(一|二|三|四|五|六|七-九)级/.test(w.levelName) || ids.has(id)) throw Error('Некорректная запись HSK');
      ids.add(id);
    }
    return rows;
  }
  function parseBackup(payload) {
    if (!record(payload) || !['hanzi-one-v1', 'hanzi-one-v2'].includes(payload.format)) throw Error('Неизвестный формат копии');
    const state = normalizeState(payload.state);
    const ruPack = validatePack(payload.ruPack ?? {});
    const hsk = payload.hsk == null ? null : validateHSK(payload.hsk);
    if (payload.format === 'hanzi-one-v2' && hsk === null && Object.keys(state.progress).some(id => id.startsWith('hsk26-'))) throw Error('В копии отсутствует список HSK для сохранённого прогресса');
    return {state, ruPack, hsk};
  }
  function finishUnit(previous, right, total, time = Date.now()) {
    const score = total ? Math.round(right * 100 / total) : 0;
    return {best:Math.max(previous?.best || 0, score), last:score, attempts:(previous?.attempts || 0) + 1, passed:previous?.passed || (score >= 80 ? time : null)};
  }
  root.HanziCore = {shuffle, normalizeState, validatePack, validateHSK, parseBackup, finishUnit};
  if (typeof module !== 'undefined') module.exports = root.HanziCore;
})(typeof globalThis !== 'undefined' ? globalThis : window);
