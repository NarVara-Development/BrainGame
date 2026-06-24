// ============================================================
// Procedural soal generator — 5000 questions/puzzles PER GAME.
// Writes data/<game>/<difficulty>_<lang>.json
// Run:  node scripts/generate.js
// ============================================================
const fs = require('fs');
const path = require('path');
const P = require('./pools');

const DATA = path.join(__dirname, '..', 'data');
const LANGS = ['id', 'en'];
const DIFFS = ['easy', 'medium', 'hard'];
const PER_FILE = 834; // 834 * 6 files ≈ 5000 per game
const VERSION = '1.0';

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}
function writeJson(game, diff, lang, payload) {
  const dir = path.join(DATA, game);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, `${diff}_${lang}.json`), JSON.stringify(payload));
}

function makeOptions(rng, answer, distractors) {
  const set = [answer];
  for (const d of distractors) {
    if (set.length >= 4) break;
    if (!set.includes(d)) set.push(d);
  }
  let guard = 0;
  while (set.length < 4 && guard++ < 50) {
    const d = answer + (Math.floor(rng() * 19) - 9);
    if (!set.includes(d)) set.push(d);
  }
  const shuffled = P.shuffle(rng, set);
  return { options: shuffled.map(String), answer: shuffled.indexOf(answer) };
}

// Number-sequence families → large unique parameter space.
function genSequence(rng, diff, maxStep, geomChance) {
  const range = diff === 'easy' ? 50 : diff === 'medium' ? 80 : 99;
  const a = 1 + Math.floor(rng() * range);
  const families = diff === 'easy' ? ['arith', 'tri', 'sq', 'double', 'fib']
    : diff === 'medium' ? ['arith', 'tri', 'sq', 'double', 'fib']
    : ['arith', 'tri', 'sq', 'double', 'ratio3', 'fib'];
  const fam = families[Math.floor(rng() * families.length)];
  const step = 1 + Math.floor(rng() * maxStep);

  switch (fam) {
    case 'arith': {
      const dir = rng() < 0.3 && diff !== 'easy' && a - step * 4 >= 0 ? -1 : 1;
      const seq = [0, 1, 2, 3].map((i) => a + dir * step * i);
      return { seq, answer: a + dir * step * 4 };
    }
    case 'tri': {
      const k = step;
      const term = (i) => a + k * (i * (i + 1)) / 2;
      return { seq: [0, 1, 2, 3].map(term), answer: term(4) };
    }
    case 'sq': {
      const term = (i) => a + (i + 1) * (i + 1);
      return { seq: [0, 1, 2, 3].map(term), answer: term(4) };
    }
    case 'double':
      return { seq: [a, a * 2, a * 4, a * 8], answer: a * 16 };
    case 'ratio3':
      return { seq: [a, a * 3, a * 9, a * 27], answer: a * 81 };
    case 'fib': {
      const b = 1 + Math.floor(rng() * step);
      const s = [a, b, a + b, a + 2 * b];
      return { seq: s, answer: 2 * a + 3 * b };
    }
    default:
      return null;
  }
}

// ------------------------------------------------------------
// LOGIC
// ------------------------------------------------------------
function genLogic(diff, lang) {
  const rng = P.makeRng(hash(`logic_${diff}_${lang}`));
  const out = [];
  const seen = new Set();
  let n = 0;

  const STR = lang === 'id'
    ? {
        seq: 'Berapa angka berikutnya dalam deret: ',
        syll: (x, y) => `Jika semua ${x} adalah ${y}, apakah semua ${y} adalah ${x}?`,
        syllOpt: ['Ya', 'Tidak', 'Mungkin', 'Tidak bisa ditentukan'],
        syllExp: 'Hubungan ini tidak berlaku terbalik.',
        analogy: (a, b, c) => `${a} berbanding ${b}, sama seperti ${c} berbanding ...?`,
        odd: 'Manakah yang tidak termasuk kelompok?',
      }
    : {
        seq: 'What is the next number in the sequence: ',
        syll: (x, y) => `If all ${x} are ${y}, are all ${y} also ${x}?`,
        syllOpt: ['Yes', 'No', 'Maybe', 'Cannot be determined'],
        syllExp: 'The relationship does not hold in reverse.',
        analogy: (a, b, c) => `${a} is to ${b} as ${c} is to ...?`,
        odd: 'Which one does not belong?',
      };

  const maxStep = diff === 'easy' ? 8 : diff === 'medium' ? 12 : 18;
  const geomChance = diff === 'hard' ? 0.4 : diff === 'medium' ? 0.2 : 0;

  while (out.length < PER_FILE && n++ < PER_FILE * 40) {
    const kind = rng();
    let q = null;

    if (kind < 0.6) {
      // number sequence (many families → high variety)
      const r = genSequence(rng, diff, maxStep, geomChance);
      if (!r) continue;
      const { seq, answer } = r;
      const text = STR.seq + seq.join(', ') + ', ?';
      if (seen.has(text)) continue;
      seen.add(text);
      const { options, answer: ai } = makeOptions(rng, answer, [
        answer + 1, answer - 1, answer + 2, answer * 2,
      ]);
      q = { id: id('L', out.length), question: text, options, answer: ai };
    } else if (kind < 0.7) {
      // syllogism (reverse implication = No)
      const [x, y] = P.pick(rng, P.CATS[lang]);
      const text = STR.syll(x, y);
      if (seen.has(text)) continue;
      seen.add(text);
      q = { id: id('L', out.length), question: text, options: STR.syllOpt, answer: 1, explanation: STR.syllExp };
    } else if (kind < 0.88) {
      // analogy
      const [a, b, c, d] = P.pick(rng, P.ANALOGY[lang]);
      const text = STR.analogy(a, b, c);
      if (seen.has(text)) continue;
      seen.add(text);
      const distract = P.ANALOGY[lang].map((t) => t[3]).filter((w) => w !== d);
      const opts = P.shuffle(rng, [d, ...P.sample(rng, distract, 3)]);
      q = { id: id('L', out.length), question: text, options: opts, answer: opts.indexOf(d) };
    } else {
      // odd one out
      const cats = P.CATS[lang];
      const groupBy = {};
      cats.forEach(([w, c]) => {
        (groupBy[c] = groupBy[c] || []).push(w);
      });
      const cs = Object.keys(groupBy).filter((c) => groupBy[c].length >= 2);
      if (cs.length < 2) continue;
      const main = P.pick(rng, cs);
      let other = P.pick(rng, cs);
      if (other === main) continue;
      const three = P.sample(rng, groupBy[main], Math.min(3, groupBy[main].length));
      if (three.length < 2) continue;
      const odd = P.pick(rng, groupBy[other]);
      const opts = P.shuffle(rng, [...three, odd]);
      const text = STR.odd + ' (' + opts.join(', ') + ')';
      if (seen.has(text)) continue;
      seen.add(text);
      q = { id: id('L', out.length), question: STR.odd, options: opts, answer: opts.indexOf(odd) };
    }

    if (q) out.push(q);
  }

  return { game: 'logic', language: lang, difficulty: diff, version: VERSION, questions: out };
}

// ------------------------------------------------------------
// MATH
// ------------------------------------------------------------
function genMath(diff, lang) {
  const rng = P.makeRng(hash(`math_${diff}_${lang}`));
  const out = [];
  const seen = new Set();
  let n = 0;

  const r = (max) => 1 + Math.floor(rng() * max);

  while (out.length < PER_FILE && n++ < PER_FILE * 50) {
    let expr, ans;
    if (diff === 'easy') {
      const a = r(60), b = r(60);
      if (rng() < 0.5) { expr = `${a} + ${b}`; ans = a + b; }
      else { const hi = Math.max(a, b), lo = Math.min(a, b); expr = `${hi} - ${lo}`; ans = hi - lo; }
    } else if (diff === 'medium') {
      const k = rng();
      if (k < 0.4) { const a = 2 + r(24), b = 2 + r(15); expr = `${a} × ${b}`; ans = a * b; }
      else if (k < 0.75) { const b = 2 + r(15), q = 2 + r(20); expr = `${b * q} ÷ ${b}`; ans = q; }
      else { const a = 11 + r(89), b = 11 + r(89); expr = `${a} + ${b}`; ans = a + b; }
    } else {
      const k = rng();
      if (k < 0.3) { const a = 4 + r(20); expr = `√${a * a}`; ans = a; }
      else if (k < 0.65) { const a = r(40), b = 2 + r(8), c = r(30); expr = `${a} + ${b} × ${c}`; ans = a + b * c; }
      else { const a = 2 + r(12), b = 2 + r(12), c = r(50); expr = `${a} × ${b} - ${c}`; ans = a * b - c; }
    }
    if (seen.has(expr)) continue;
    seen.add(expr);
    out.push({ id: id('M', out.length), expression: expr, answer: ans });
  }

  return { game: 'math', language: lang, difficulty: diff, version: VERSION, questions: out };
}

// ------------------------------------------------------------
// WORDSEARCH
// ------------------------------------------------------------
function genWord(diff, lang) {
  const rng = P.makeRng(hash(`word_${diff}_${lang}`));
  const cap = diff === 'easy' ? 10 : diff === 'medium' ? 12 : 15;
  const count = diff === 'easy' ? 8 : diff === 'medium' ? 12 : 18;
  const themes = P.WORD_THEMES[lang];
  const themeNames = Object.keys(themes);
  const fillPool = [].concat(...themeNames.map((t) => themes[t])).filter((w) => w.length <= cap);

  const out = [];
  const seen = new Set();
  let n = 0;

  while (out.length < PER_FILE && n++ < PER_FILE * 40) {
    const theme = P.pick(rng, themeNames);
    let words = P.shuffle(rng, themes[theme].filter((w) => w.length <= cap));
    words = words.slice(0, count);
    // top up from global pool if short
    let fp = 0;
    const fp2 = P.shuffle(rng, fillPool);
    while (words.length < count && fp < fp2.length) {
      const w = fp2[fp++];
      if (!words.includes(w)) words.push(w);
    }
    if (words.length < Math.min(count, 6)) continue;
    const key = theme + '|' + words.slice(0, 6).sort().join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: id('W', out.length), theme, words });
  }

  return { game: 'word', language: lang, difficulty: diff, version: VERSION, puzzles: out };
}

// ------------------------------------------------------------
// CROSSWORD (greedy interlocking generator)
// ------------------------------------------------------------
function buildCrossword(rng, bank, target) {
  const chosen = P.sample(rng, bank, Math.min(target + 14, bank.length))
    .map(([answer, clue]) => ({ answer: answer.toUpperCase().replace(/[^A-Z]/g, ''), clue }))
    .filter((w) => w.answer.length >= 3 && w.answer.length <= 12)
    .sort((a, b) => b.answer.length - a.answer.length);
  if (chosen.length === 0) return null;

  const grid = new Map(); // "r,c" -> letter
  const placed = []; // {answer, clue, r, c, dir}
  const at = (r, c) => grid.get(`${r},${c}`);

  const first = chosen[0];
  for (let i = 0; i < first.answer.length; i++) grid.set(`0,${i}`, first.answer[i]);
  placed.push({ ...first, r: 0, c: 0, dir: 'across' });

  function canPlace(word, r, c, dir) {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    // before/after must be empty
    if (at(r - dr, c - dc)) return false;
    if (at(r + dr * word.length, c + dc * word.length)) return false;
    let crosses = 0;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      const cur = at(rr, cc);
      if (cur) {
        if (cur !== word[i]) return false;
        crosses++;
      } else {
        // perpendicular neighbors must be empty (avoid accidental words)
        if (dir === 'across') {
          if (at(rr - 1, cc) || at(rr + 1, cc)) return false;
        } else {
          if (at(rr, cc - 1) || at(rr, cc + 1)) return false;
        }
      }
    }
    return crosses >= 1;
  }

  function place(word, r, c, dir) {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    for (let i = 0; i < word.answer.length; i++) grid.set(`${r + dr * i},${c + dc * i}`, word.answer[i]);
    placed.push({ ...word, r, c, dir });
  }

  for (let w = 1; w < chosen.length && placed.length < target; w++) {
    const word = chosen[w];
    let done = false;
    for (let i = 0; i < word.answer.length && !done; i++) {
      const ch = word.answer[i];
      for (const pl of P.shuffle(rng, placed)) {
        const dir = pl.dir === 'across' ? 'down' : 'across';
        const dr = pl.dir === 'down' ? 1 : 0;
        const dc = pl.dir === 'across' ? 1 : 0;
        for (let j = 0; j < pl.answer.length; j++) {
          if (pl.answer[j] !== ch) continue;
          const cr = pl.r + dr * j, cc = pl.c + dc * j;
          const r = dir === 'down' ? cr - i : cr;
          const c = dir === 'across' ? cc - i : cc;
          if (canPlace(word.answer, r, c, dir)) {
            place(word, r, c, dir);
            done = true;
            break;
          }
        }
        if (done) break;
      }
    }
  }

  if (placed.length < 4) return null;

  // normalize
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  for (const key of grid.keys()) {
    const [r, c] = key.split(',').map(Number);
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  const h = maxR - minR + 1, w = maxC - minC + 1;
  const size = Math.max(h, w);
  const gridArr = Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
  for (const [key, letter] of grid.entries()) {
    const [r, c] = key.split(',').map(Number);
    gridArr[r - minR][c - minC] = letter;
  }

  // numbering
  const norm = placed.map((p) => ({ ...p, r: p.r - minR, c: p.c - minC }));
  const startCells = new Map();
  norm.forEach((p) => startCells.set(`${p.r},${p.c}`, true));
  const sorted = [...startCells.keys()]
    .map((k) => k.split(',').map(Number))
    .sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  const numberOf = new Map();
  sorted.forEach(([r, c], i) => numberOf.set(`${r},${c}`, i + 1));

  const across = [], down = [];
  norm.forEach((p) => {
    const entry = { number: numberOf.get(`${p.r},${p.c}`), clue: p.clue, answer: p.answer, row: p.r, col: p.c };
    (p.dir === 'across' ? across : down).push(entry);
  });
  across.sort((a, b) => a.number - b.number);
  down.sort((a, b) => a.number - b.number);

  return { size, grid: gridArr, clues: { across, down } };
}

function genCrossword(diff, lang) {
  const rng = P.makeRng(hash(`crossword_${diff}_${lang}`));
  const bank = P.CROSSWORD_WORDS[lang];
  const target = diff === 'easy' ? 7 : diff === 'medium' ? 12 : 18;
  const out = [];
  let n = 0;
  while (out.length < PER_FILE && n++ < PER_FILE * 30) {
    const puz = buildCrossword(rng, bank, target);
    if (!puz) continue;
    out.push({ id: id('C', out.length), ...puz });
  }
  return { game: 'crossword', language: lang, difficulty: diff, version: VERSION, puzzles: out };
}

// ------------------------------------------------------------
// MEMORY
// ------------------------------------------------------------
function genMemory(diff, lang) {
  const rng = P.makeRng(hash(`memory_${diff}_${lang}`));
  const pairsCount = diff === 'easy' ? 8 : diff === 'medium' ? 12 : 18;
  const out = [];
  const seen = new Set();
  let n = 0;

  while (out.length < PER_FILE && n++ < PER_FILE * 40) {
    let pairs, theme;
    if (diff === 'easy') {
      theme = lang === 'id' ? 'Emoji' : 'Emoji';
      const e = P.sample(rng, P.EMOJIS, pairsCount);
      pairs = e.map((x) => [x, x]);
    } else if (diff === 'medium') {
      // Picture ↔ word: match emoji to its name in the active language.
      theme = lang === 'id' ? 'Gambar & Kata' : 'Picture & Word';
      const picks = P.sample(rng, P.EMOJI_WORDS, Math.min(pairsCount, P.EMOJI_WORDS.length));
      pairs = picks.map(([emoji, id, en]) => [emoji, lang === 'id' ? id : en]);
    } else {
      theme = lang === 'id' ? 'Matematika' : 'Math';
      const used = new Set();
      pairs = [];
      let g = 0;
      while (pairs.length < pairsCount && g++ < 400) {
        const a = 2 + Math.floor(rng() * 12), b = 2 + Math.floor(rng() * 12);
        const op = rng() < 0.5 ? '+' : '×';
        const ans = op === '+' ? a + b : a * b;
        const q = `${a} ${op} ${b}`;
        if (used.has(ans) || used.has(q)) continue;
        used.add(ans); used.add(q);
        pairs.push([q, String(ans)]);
      }
    }
    const key = pairs.map((p) => p[0]).sort().join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: id('MM', out.length), theme, pairs });
  }

  return { game: 'memory', language: lang, difficulty: diff, version: VERSION, sets: out };
}

// ------------------------------------------------------------
function id(prefix, i) {
  return `${prefix}${String(i + 1).padStart(5, '0')}`;
}
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ------------------------------------------------------------
// TRUE/FALSE — equation is right or wrong
// ------------------------------------------------------------
function genTrueFalse(diff, lang) {
  const rng = P.makeRng(hash(`truefalse_${diff}_${lang}`));
  const out = [];
  const seen = new Set();
  let n = 0;
  const r = (max) => 1 + Math.floor(rng() * max);
  while (out.length < PER_FILE && n++ < PER_FILE * 60) {
    let a, b, op, real;
    if (diff === 'easy') { a = r(40); b = r(40); op = rng() < 0.5 ? '+' : '-'; real = op === '+' ? a + b : a - b; }
    else if (diff === 'medium') { if (rng() < 0.5) { a = 2 + r(12); b = 2 + r(12); op = '×'; real = a * b; } else { a = r(80); b = r(80); op = '+'; real = a + b; } }
    else { if (rng() < 0.5) { a = 3 + r(18); b = 3 + r(18); op = '×'; real = a * b; } else { const q = 2 + r(12), d = 2 + r(12); a = q * d; b = d; op = '÷'; real = q; } }
    const showTrue = rng() < 0.5;
    let shown = real;
    if (!showTrue) { const delta = (1 + Math.floor(rng() * 5)) * (rng() < 0.5 ? 1 : -1); shown = real + delta; if (shown === real) shown = real + 1; }
    const text = `${a} ${op} ${b} = ${shown}`;
    if (seen.has(text)) continue;
    seen.add(text);
    out.push({ id: id('TF', out.length), text, answer: shown === real });
  }
  return { game: 'truefalse', language: lang, difficulty: diff, version: VERSION, questions: out };
}

// ------------------------------------------------------------
// NUMBER TAP — tap numbers in ascending order
// ------------------------------------------------------------
function genTap(diff, lang) {
  const rng = P.makeRng(hash(`tap_${diff}_${lang}`));
  const count = diff === 'easy' ? 9 : diff === 'medium' ? 16 : 25;
  const out = [];
  const seen = new Set();
  let n = 0;
  while (out.length < PER_FILE && n++ < PER_FILE * 40) {
    const order = P.shuffle(rng, Array.from({ length: count }, (_, i) => i + 1));
    const key = order.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: id('TP', out.length), order });
  }
  return { game: 'tap', language: lang, difficulty: diff, version: VERSION, questions: out };
}

// ------------------------------------------------------------
// SLIDE PUZZLE — arrange numbered tiles; 0 is the empty slot.
// Scrambled from the solved state so every board is solvable.
// ------------------------------------------------------------
function genSlide(diff, lang) {
  const rng = P.makeRng(hash(`slide_${diff}_${lang}`));
  const size = diff === 'easy' ? 3 : diff === 'medium' ? 4 : 5;
  const cells = size * size;
  const depth = cells * 12;
  const goal = Array.from({ length: cells }, (_, i) => (i + 1) % cells); // [1..n-1, 0]
  const out = [];
  const seen = new Set();
  let n = 0;
  while (out.length < PER_FILE && n++ < PER_FILE * 30) {
    const tiles = goal.slice();
    let blank = cells - 1;
    let prev = -1;
    for (let m = 0; m < depth; m++) {
      const r = Math.floor(blank / size), c = blank % size;
      const moves = [];
      if (r > 0) moves.push(blank - size);
      if (r < size - 1) moves.push(blank + size);
      if (c > 0) moves.push(blank - 1);
      if (c < size - 1) moves.push(blank + 1);
      const opts = moves.filter((x) => x !== prev);
      const target = P.pick(rng, opts.length ? opts : moves);
      [tiles[blank], tiles[target]] = [tiles[target], tiles[blank]];
      prev = blank;
      blank = target;
    }
    const key = tiles.join(',');
    if (seen.has(key) || key === goal.join(',')) continue;
    seen.add(key);
    out.push({ id: id('SL', out.length), size, tiles });
  }
  return { game: 'slide', language: lang, difficulty: diff, version: VERSION, questions: out };
}

// ------------------------------------------------------------
// ODD ONE OUT — pick the emoji that doesn't belong
// ------------------------------------------------------------
function genOdd(diff, lang) {
  const rng = P.makeRng(hash(`odd_${diff}_${lang}`));
  const count = diff === 'easy' ? 4 : diff === 'medium' ? 6 : 9;
  const groups = P.EMOJI_GROUPS;
  const keys = Object.keys(groups);
  const out = [];
  const seen = new Set();
  let n = 0;
  while (out.length < PER_FILE && n++ < PER_FILE * 40) {
    const mainKey = P.pick(rng, keys);
    let oddKey = P.pick(rng, keys);
    if (oddKey === mainKey) continue;
    const mains = P.sample(rng, groups[mainKey], count - 1);
    if (mains.length < count - 1) continue;
    const odd = P.pick(rng, groups[oddKey]);
    if (mains.includes(odd)) continue;
    const options = P.shuffle(rng, [...mains, odd]);
    const key = options.join('');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: id('OD', out.length), options, answer: options.indexOf(odd) });
  }
  return { game: 'odd', language: lang, difficulty: diff, version: VERSION, questions: out };
}

// ------------------------------------------------------------
// SIMON SEQUENCE — remember and repeat the flashing pattern
// ------------------------------------------------------------
function genSimon(diff, lang) {
  const rng = P.makeRng(hash(`simon_${diff}_${lang}`));
  const tiles = diff === 'easy' ? 4 : diff === 'medium' ? 6 : 9;
  const masterLen = 24;
  const out = [];
  const seen = new Set();
  let n = 0;
  while (out.length < PER_FILE && n++ < PER_FILE * 20) {
    const seq = Array.from({ length: masterLen }, () => Math.floor(rng() * tiles));
    const key = seq.join('');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: id('SI', out.length), tiles, seq });
  }
  return { game: 'simon', language: lang, difficulty: diff, version: VERSION, questions: out };
}

// ------------------------------------------------------------
const GENERATORS = {
  logic: genLogic,
  math: genMath,
  word: genWord,
  crossword: genCrossword,
  memory: genMemory,
  tap: genTap,
  truefalse: genTrueFalse,
  slide: genSlide,
  odd: genOdd,
  simon: genSimon,
};

function main() {
  let grand = 0;
  for (const game of Object.keys(GENERATORS)) {
    let gameTotal = 0;
    for (const diff of DIFFS) {
      for (const lang of LANGS) {
        const payload = GENERATORS[game](diff, lang);
        const items = payload.questions || payload.puzzles || payload.sets;
        writeJson(game, diff, lang, payload);
        gameTotal += items.length;
        process.stdout.write(`  ${game}/${diff}_${lang}.json → ${items.length}\n`);
      }
    }
    console.log(`✓ ${game}: ${gameTotal} total\n`);
    grand += gameTotal;
  }
  console.log(`★ GRAND TOTAL: ${grand} soal across ${Object.keys(GENERATORS).length} games`);
}

main();
