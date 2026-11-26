// Chords for Beginners: Musiktheorie, Grundgriffe, Griffbilder und Klang.
//
// Abgespeckte Fassung von web/musik.js aus „Akkordfolgen für Songwriter“ (Songwriting & Chords):
// gleiche Regeln für Stufen, Akkordnamen und Griffbilder, aber nur Grundgriffe aus daten.js,
// keine Barré-, Lagen- oder Suchgriffe. Die Klangausgabe dämpft eine Saite, wenn sie neu angeschlagen
// wird, damit Schlagmuster sauber klingen.
// Die Datei läuft im Browser und in osascript (skripte/pruefen.js), daher ohne DOM-Zugriff beim Laden.

var SC = (function () {
  'use strict';
  var D = (typeof SC_DATEN !== 'undefined') ? SC_DATEN : null;
  var mod = function (a, n) { return ((a % n) + n) % n; };

  // ------------------------------------------------------------------ Grundlagen
  var PC_NAME = ['C', 'C#', 'D', 'E♭', 'E', 'F', 'F#', 'G', 'A♭', 'A', 'B♭', 'H'];
  var LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, H: 11, B: 11 };
  // Die Tonarten und Grundtöne dieser App
  var GRUNDTOENE = [0, 2, 4, 5, 7, 9, 11];             // C D E F G A H: alle Stammtöne
  // Akkordarten dieser App: Intervalle und Pflichttöne (die übrigen dürfen fehlen)
  var TYPES = {
    '':   [[0, 4, 7], [0, 4, 7]],
    'm':  [[0, 3, 7], [0, 3, 7]],
    '7':  [[0, 4, 7, 10], [0, 4, 10]],
    'm7': [[0, 3, 7, 10], [0, 3, 10]],
  };
  var TYPE_NAMES = { '': 'Dur', 'm': 'Moll', '7': 'Dur7', 'm7': 'Moll7' };
  var TUNING = { gitarre: [4, 9, 2, 7, 11, 4], ukulele: [7, 0, 4, 9] };
  var MIDI = { gitarre: [40, 45, 50, 55, 59, 64], ukulele: [67, 60, 64, 69] };
  var SAITEN = { gitarre: 'E A D G H e', ukulele: 'G C E A' };

  function parse(s, n) {
    var parts = s.trim().indexOf(' ') >= 0 ? s.trim().split(/\s+/) : s.trim().split('');
    if (parts.length !== n) throw new Error('Griff ' + s + ' hat nicht ' + n + ' Saiten');
    return parts.map(function (p) { return (p === 'x' || p === 'X') ? null : parseInt(p, 10); });
  }
  function fs(frets) { return frets.map(function (f) { return f === null ? 'x' : String(f); }).join(' '); }
  function fretted(frets) { return frets.filter(function (f) { return f; }); }
  function max(a) { return Math.max.apply(null, a); }
  function min(a) { return Math.min.apply(null, a); }
  function bassPc(frets, tuning) {
    for (var i = 0; i < frets.length; i++) if (frets[i] !== null) return mod(tuning[i] + frets[i], 12);
    return null;
  }

  // Stimmt der Griff? Wie skripte/akkorde.py check() der Vorlage
  function check(root, typ, frets, tuning, rootBass) {
    if (rootBass === undefined) rootBass = true;
    var t = TYPES[typ];
    var tones = t[0].map(function (i) { return mod(root + i, 12); });
    var reqt = t[1].map(function (i) { return mod(root + i, 12); });
    var played = [];
    frets.forEach(function (f, i) { if (f !== null) played.push(mod(tuning[i] + f, 12)); });
    var errs = [];
    if (played.some(function (p) { return tones.indexOf(p) < 0; })) errs.push('falsche Töne');
    if (reqt.some(function (r) { return played.indexOf(r) < 0; })) errs.push('fehlende Töne');
    if (rootBass && bassPc(frets, tuning) !== root) errs.push('Grundton nicht im Bass');
    var fr = fretted(frets);
    if (fr.length && max(fr) - min(fr) > 4) errs.push('Spannweite > 4');
    return errs;
  }
  // Wie viele Finger braucht der Griff (ein Barré zählt als ein Finger)?
  function fingers(frets) {
    var fr = fretted(frets);
    if (!fr.length) return 0;
    var best = fr.length, n = frets.length;
    var vals = fr.filter(function (v, i) { return fr.indexOf(v) === i; });
    vals.forEach(function (v) {
      for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) {
        if (frets[a] !== v || frets[b] !== v) continue;
        var ok = true, cov = 0;
        for (var k = a; k <= b; k++) {
          if (frets[k] === null || frets[k] < v) { ok = false; break; }
          if (frets[k] === v) cov++;
        }
        if (ok) best = Math.min(best, 1 + fr.length - cov);
      }
    });
    return best;
  }

  // ------------------------------------------------------------------ Akkordnamen lesen
  function parseAkkord(name) {
    var m = String(name).match(/^([A-H])(#|♭)?([^/]*)(?:\/([A-H])(#|♭)?)?$/);
    if (!m) return null;
    var acc = function (a) { return a === '#' ? 1 : (a === '♭' ? -1 : 0); };
    var root = mod(LETTER_PC[m[1]] + acc(m[2]), 12);
    var bass = m[4] ? mod(LETTER_PC[m[4]] + acc(m[5]), 12) : null;
    if (bass === root) bass = null;
    return { root: root, rootName: m[1] + (m[2] || ''), typ: m[3], bass: bass, bassName: m[4] ? m[4] + (m[5] || '') : null };
  }
  // Gehört der Akkord zu den 28 Akkorden der App (C D E F G A H als Dur, Moll, 7, m7)?
  function imBereich(name) {
    var a = parseAkkord(name);
    return !!a && a.bass === null && TYPES.hasOwnProperty(a.typ) && GRUNDTOENE.indexOf(a.root) >= 0 && PC_NAME[a.root] === a.rootName;
  }

  // Der Grundgriff eines Akkords aus daten.js: { f, k: 'grund', q } oder null.
  // Akkorde außerhalb der 28 (F#m, C#m, B♭ …) bekommen ihren einfachsten Griff aus denselben Tabellen.
  // daten.js hat alle 12 Grundtöne, weil Folgen in D, E, F, A und H solche Akkorde brauchen.
  var memoG = {};
  function grundgriff(inst, name) {
    var key = inst + '|' + name;
    if (memoG.hasOwnProperty(key)) return memoG[key];
    var a = parseAkkord(name), v = null;
    if (a && a.bass === null && D) {
      var i = D[inst].typen.indexOf(a.typ), zeile = D[inst].griffe[PC_NAME[a.root]];
      if (i >= 0 && zeile && zeile[i]) v = { f: parse(zeile[i], inst === 'gitarre' ? 6 : 4), k: 'grund', q: imBereich(name) ? 'Grundgriff' : 'einfachster Griff' };
    }
    return (memoG[key] = v);
  }

  // ------------------------------------------------------------------ Stufen → Akkordnamen (wie folgen_tabelle.py)
  var LETTERS = 'CDEFGAB';
  var NAT = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var MAJOR = [0, 2, 4, 5, 7, 9, 11];
  var ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
  var ROMAN_PC = ['I', '♭II', 'II', '♭III', 'III', 'IV', '#IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
  var DUR_KEYS = [['C', 0, 'C-Dur'], ['D', -1, 'Des-Dur'], ['D', 0, 'D-Dur'], ['E', -1, 'Es-Dur'], ['E', 0, 'E-Dur'], ['F', 0, 'F-Dur'],
    ['F', 1, 'Fis-Dur'], ['G', 0, 'G-Dur'], ['A', -1, 'As-Dur'], ['A', 0, 'A-Dur'], ['B', -1, 'B-Dur (B♭)'], ['B', 0, 'H-Dur']];

  function spell(letter, acc) {
    var pc = mod(NAT[letter] + acc, 12);
    if (Math.abs(acc) > 1 || (letter === 'C' && acc === -1) || (letter === 'F' && acc === -1) ||
        (letter === 'E' && acc === 1) || (letter === 'B' && acc === 1)) return PC_NAME[pc];
    if (letter === 'B') return acc === 0 ? 'H' : 'B♭';
    return letter + (acc === 1 ? '#' : (acc === -1 ? '♭' : ''));
  }
  function letterOf(name) { return name[0] === 'H' ? 'B' : (name[0] === 'B' ? 'B' : name[0]); }
  // Ton mit passendem Buchstaben benennen (E/G#, nicht E/A♭)
  function bassName(rootName, bpc) {
    var rpc = mod(LETTER_PC[rootName[0]] + (rootName[1] === '#' ? 1 : (rootName[1] === '♭' ? -1 : 0)), 12);
    var iv = mod(bpc - rpc, 12);
    var step = [0, 1, 1, 2, 2, 3, 4, 4, 4, 5, 6, 6][iv];
    var L = LETTERS[(LETTERS.indexOf(letterOf(rootName)) + step) % 7];
    var a = mod(bpc - NAT[L], 12);
    if (a > 6) a -= 12;
    return spell(L, a);
  }
  // Nur Dur-Tonarten: alle Folgen dieser App stehen in Dur
  function key(pc) { var k = DUR_KEYS[mod(pc, 12)]; return { letter: k[0], acc: k[1], name: k[2], pc: mod(pc, 12), moll: false }; }
  function parseStufe(tok) {
    var m = tok.match(/^([♭b#]?)([IViv]+)(\S*)$/);
    if (!m || !ROMAN[m[2].toUpperCase()]) throw new Error('Stufe nicht erkannt: ' + tok);
    return { acc: m[1] === '#' ? 1 : (m[1] ? -1 : 0), num: m[2], suffix: m[3] };
  }
  function stufenTon(acc, num, k) {
    var deg = ROMAN[num.toUpperCase()];
    var L = LETTERS[(LETTERS.indexOf(k.letter) + deg - 1) % 7];
    var target = mod(NAT[k.letter] + k.acc + MAJOR[deg - 1] + acc, 12);
    var a = mod(target - NAT[L], 12);
    if (a > 6) a -= 12;
    return spell(L, a);
  }
  function stufeZuAkkord(tok, k) {
    var p = parseStufe(tok);
    var minor = p.num === p.num.toLowerCase();
    return stufenTon(p.acc, p.num, k) + (minor ? 'm' : '') + p.suffix;   // vi7 → Am7, V7 → G7
  }
  // Akkordname → Stufe, Gegenstück zu stufeZuAkkord (Am in C-Dur → vi, Am7 → vi7, G7 → V7)
  function akkordZuStufe(name, k) {
    var a = parseAkkord(name);
    if (!a || !TYPES[a.typ] || a.bass !== null) return null;
    var moll = a.typ.charAt(0) === 'm';
    var r = ROMAN_PC[mod(a.root - k.pc, 12)];
    var acc = r.replace(/[IV]+$/, ''), num = r.replace(/^[♭#]/, '');
    return acc + (moll ? num.toLowerCase() : num) + (moll ? a.typ.slice(1) : a.typ);
  }
  // Akkordtöne mit passendem Buchstaben, z. B. Am7 → A C E G
  function akkordToene(name) {
    var a = parseAkkord(name);
    if (!a || !TYPES[a.typ]) return [];
    return TYPES[a.typ][0].map(function (i) { return i === 0 ? a.rootName : bassName(a.rootName, mod(a.root + i, 12)); });
  }
  function tonleiter(k) {
    return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].map(function (r) { return stufenTon(0, r, k); });
  }

  // ------------------------------------------------------------------ Griffbild als SVG (wie zeichnen.py)
  function barres(frets) {
    var out = [], n = frets.length;
    var vals = fretted(frets).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
    vals.forEach(function (v) {
      for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) {
        if (frets[a] !== v || frets[b] !== v) continue;
        var ok = true, cov = 0;
        for (var k = a; k <= b; k++) {
          if (frets[k] === null || frets[k] < v) { ok = false; break; }
          if (frets[k] === v) cov++;
        }
        if (ok) out.push([v, a, b, cov]);
      }
    });
    return out;
  }
  function bestBarre(frets) {
    var fr = fretted(frets);
    if (!fr.length) return null;
    var bs = barres(frets);
    if (!bs.length) return null;
    var f0 = min(fr);
    var atMin = bs.filter(function (b) { return b[0] === f0; }).sort(function (x, y) { return (y[3] - x[3]) || ((y[2] - y[1]) - (x[2] - x[1])); });
    if (fr.length <= 4) return atMin.length && atMin[0][3] >= 3 ? atMin[0] : null;
    if (atMin.length) return atMin[0];
    bs.sort(function (x, y) { return (y[3] - x[3]) || (x[0] - y[0]); });
    return bs[0];
  }
  function startBund(frets) {
    var fr = fretted(frets), nf = 5;
    if (!fr.length) return 1;
    if (frets.indexOf(0) < 0 && min(fr) >= 3) return min(fr);
    if (max(fr) <= nf) return 1;
    return min(fr);
  }
  function svg(frets, opts) {
    opts = opts || {};
    var n = frets.length, W = 100, nf = 5;
    var gw = n === 6 ? 62 : 44, sp = gw / (n - 1), fh = 17.5;
    var gx = (W - gw) / 2 + 5, my = 8, gy = 18;
    var rad = Math.min(sp * 0.38, fh * 0.36);
    var base = startBund(frets);
    var unten = opts.unten && opts.unten.some(Boolean) ? opts.unten : null;   // Zeichen unter den Saiten (p i m a, B, W)
    var o = [];
    o.push('<svg class="griffbild" viewBox="0 0 ' + W + ' ' + (gy + nf * fh + (unten ? 16 : 4)) + '" role="img" aria-label="' + (opts.label || 'Griff') + ' ' + fs(frets) + '">');
    if (unten) unten.forEach(function (t, s) {
      if (t) o.push('<text class="gb-rolle" x="' + (gx + s * sp) + '" y="' + (gy + nf * fh + 12) + '">' + t + '</text>');
    });
    for (var s = 0; s < n; s++) {
      var x = gx + s * sp;
      o.push('<line class="gb-l" x1="' + x + '" y1="' + gy + '" x2="' + x + '" y2="' + (gy + nf * fh) + '"/>');
    }
    for (var k = 0; k <= nf; k++) {
      var y = gy + k * fh;
      if (k === 0 && base === 1) o.push('<rect class="gb-sattel" x="' + (gx - 0.8) + '" y="' + (gy - 3.2) + '" width="' + (gw + 1.6) + '" height="3.8" rx="0.6"/>');
      else o.push('<line class="gb-l" x1="' + gx + '" y1="' + y + '" x2="' + (gx + gw) + '" y2="' + y + '"/>');
    }
    if (base > 1) o.push('<text class="gb-bund" x="' + (gx - rad - 3.5) + '" y="' + (gy + 0.5 * fh) + '">' + base + '</text>');
    frets.forEach(function (f, s) {
      var x = gx + s * sp;
      if (f === null) {
        var r = 2.9;
        o.push('<path class="gb-x" d="M' + (x - r) + ' ' + (my - r) + 'L' + (x + r) + ' ' + (my + r) + 'M' + (x - r) + ' ' + (my + r) + 'L' + (x + r) + ' ' + (my - r) + '"/>');
      } else if (f === 0) {
        o.push('<circle class="gb-o" cx="' + x + '" cy="' + my + '" r="3.1"/>');
      }
    });
    var bb = bestBarre(frets);
    var drawn = {};
    if (bb) {
      var yb = gy + (bb[0] - base + 0.5) * fh;
      o.push('<rect class="gb-p" x="' + (gx + bb[1] * sp - rad) + '" y="' + (yb - rad) + '" width="' + ((bb[2] - bb[1]) * sp + 2 * rad) + '" height="' + (2 * rad) + '" rx="' + rad + '"/>');
      for (var j = bb[1]; j <= bb[2]; j++) if (frets[j] === bb[0]) drawn[j] = 1;
    }
    frets.forEach(function (f, s) {
      if (f && !drawn[s]) o.push('<circle class="gb-p" cx="' + (gx + s * sp) + '" cy="' + (gy + (f - base + 0.5) * fh) + '" r="' + rad + '"/>');
    });
    o.push('</svg>');
    return o.join('');
  }

  // ------------------------------------------------------------------ Klang (Karplus-Strong-Zupfsaite)
  var Klang = (function () {
    var ctx = null, master = null, cache = {}, aktiv = [], kt = 440, sitzungTyp = 'playback', ruheTimer = null;
    var MAX_PUFFER = 32;   // höchstens so viele fertige Saitenklänge behalten (je 0,3 bis 0,6 MB)
    var RUHE_NACH = 20000; // so lange nach dem letzten Ton schaltet sich die Klangausgabe ab
    var saite = {};        // letzter Ton je Saite: wird die Saite neu angeschlagen, verklingt er
    // Nachklang in Sekunden, bis ein Ton um 60 dB leiser ist. Gleich für tiefe und hohe Saiten,
    // damit die Basssaiten nicht lange nachdröhnen (klang sonst wie Hall).
    var NACHKLANG = { gitarre: 2.6, ukulele: 1.4 };
    // iPhone/iPad: 'playback' spielt auch bei eingeschaltetem Stummschalter (Safari 17+),
    // das Stimmgerät schaltet für das Mikrofon auf 'play-and-record'
    function sitzung(typ) {
      sitzungTyp = typ;
      try { if (typeof navigator !== 'undefined' && navigator.audioSession) navigator.audioSession.type = typ; } catch (e) { /* ältere Geräte */ }
    }
    function init() {
      if (typeof window === 'undefined') return false;
      sitzung(sitzungTyp);
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.55;
        var comp = ctx.createDynamicsCompressor();
        // sanft: fängt nur Spitzen ab und hebt das Ausklingen nicht an
        comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
        master.connect(comp);
        comp.connect(ctx.destination);
      }
      if (ctx.state !== 'running' && ctx.state !== 'closed' && ctx.resume) ctx.resume();
      wachBleiben();
      return true;
    }
    // Die Klangausgabe läuft nur, solange etwas erklingt. Danach schläft sie, damit die App
    // nichts rechnet und das iPhone sie im Hintergrund wirklich anhält.
    function wachBleiben() {
      clearTimeout(ruheTimer);
      ruheTimer = setTimeout(function () { if (aktiv.length) wachBleiben(); else schlafen(); }, RUHE_NACH);
    }
    function schlafen() {
      clearTimeout(ruheTimer);
      if (ctx && ctx.state === 'running' && ctx.suspend) {
        var p = ctx.suspend();
        if (p && p.catch) p.catch(function () { /* egal */ });
      }
    }
    // sofort Ruhe: alle Töne aus, Klangausgabe schlafen legen (App geht in den Hintergrund)
    function ruhe() { stopp(); schlafen(); }
    function zustand() { return ctx ? ctx.state : 'aus'; }
    function puffer(midi, inst) {
      var k = inst + midi + '@' + kt, b = cache[k];
      if (b) { delete cache[k]; cache[k] = b; return b; }   // nach hinten: zuletzt benutzt
      var alt = Object.keys(cache);
      if (alt.length >= MAX_PUFFER) delete cache[alt[0]];  // den am längsten unbenutzten Klang vergessen
      var sr = ctx.sampleRate, freq = kt * Math.pow(2, (midi - 69) / 12);
      var dauer = NACHKLANG[inst] * 0.9;
      var len = Math.floor(sr * dauer), buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
      var N = Math.max(2, Math.round(sr / freq)), ring = new Float32Array(N), prev = 0;
      for (var i = 0; i < N; i++) { var r = Math.random() * 2 - 1; prev = 0.6 * r + 0.4 * prev; ring[i] = prev; }
      var decay = Math.min(inst === 'ukulele' ? 0.9955 : 0.9975, Math.pow(10, -3 / (NACHKLANG[inst] * freq))), idx = 0;
      for (var j = 0; j < len; j++) {
        var nx = idx + 1 === N ? 0 : idx + 1, v = ring[idx];
        d[j] = v;
        ring[idx] = decay * 0.5 * (v + ring[nx]);
        idx = nx;
      }
      var fade = Math.floor(sr * (inst === 'ukulele' ? 0.2 : 0.3));
      for (var q = 0; q < fade; q++) d[len - 1 - q] *= q / fade;
      return (cache[k] = buf);
    }
    // Saiten anschlagen. frets: ein Wert je Saite, null = diese Saite nicht spielen.
    // aufwaerts: von der hohen zur tiefen Saite (Aufschlag).
    function anschlag(frets, inst, kapo, wann, laut, aufwaerts) {
      if (!init()) return;
      var t0 = wann || ctx.currentTime + 0.02;
      var noten = [];
      frets.forEach(function (f, i) { if (f !== null) noten.push({ s: i, m: MIDI[inst][i] + f + (kapo || 0) }); });
      if (aufwaerts) noten.reverse();
      noten.forEach(function (n, i) {
        var src = ctx.createBufferSource(), g = ctx.createGain(), t = t0 + i * (inst === 'ukulele' ? 0.018 : 0.024);
        src.buffer = puffer(n.m, inst);
        g.gain.value = (laut || 1) * (inst === 'ukulele' ? 0.32 : 0.26);
        src.connect(g); g.connect(master);
        src.start(t);
        // die Saite klingt nur einmal: der vorige Ton auf ihr verklingt, sobald der neue kommt
        var k = inst + n.s, vor = saite[k];
        if (vor && vor.t < t) {
          try { vor.g.gain.setTargetAtTime(0, t, 0.012); vor.src.stop(t + 0.12); } catch (e) { /* schon vorbei */ }
        }
        saite[k] = { src: src, g: g, t: t };
        aktiv.push(src);
        src.onended = function () {
          var x = aktiv.indexOf(src); if (x >= 0) aktiv.splice(x, 1);
          if (saite[k] && saite[k].src === src) delete saite[k];
        };
      });
    }
    // Akkordwechsel: die Greifhand löst den alten Akkord, alle Saiten verklingen kurz vor dem neuen
    function daempfen(wann) {
      if (!ctx) return;
      Object.keys(saite).forEach(function (k) {
        var v = saite[k];
        if (v.t >= wann) return;
        try { v.g.gain.setTargetAtTime(0, wann, 0.025); v.src.stop(wann + 0.25); } catch (e) { /* schon vorbei */ }
        delete saite[k];
      });
    }
    function stopp() {
      aktiv.slice().forEach(function (s) { try { s.stop(); } catch (e) { /* schon beendet */ } });
      aktiv = [];
      saite = {};
    }
    function zeit() { return ctx ? ctx.currentTime : 0; }
    // fertigen Puffer abspielen (Referenzton des Stimmgeräts), gibt die Quelle zurück
    function spiele(buf, laut) {
      if (!init()) return null;
      var src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = buf; g.gain.value = laut || 0.5;
      src.connect(g); g.connect(master);
      src.start(ctx.currentTime + 0.02);
      aktiv.push(src);
      src.onended = function () { var x = aktiv.indexOf(src); if (x >= 0) aktiv.splice(x, 1); };
      return src;
    }
    // Dauerton wie eine Stimmgabel (Kammerton im Stimmgerät): fast reiner Sinus, etwas Oberton,
    // damit er auch aus kleinen Lautsprechern klingt. Läuft, bis stopp() kommt; stopp() und ruhe()
    // der Klangausgabe beenden ihn ebenfalls, dann meldet er sich über fertig().
    function dauerton(hz, laut, fertig) {
      if (!init()) return null;
      var t = ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain(), aus = false;
      osc.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0]), new Float32Array([0, 1, 0.12, 0.03])));
      osc.frequency.value = hz;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(laut || 0.3, t + 0.05);   // weich einsetzen, ohne Knacken
      osc.connect(g); g.connect(master);
      osc.start(t);
      aktiv.push(osc);
      osc.onended = function () {
        aus = true;
        var x = aktiv.indexOf(osc); if (x >= 0) aktiv.splice(x, 1);
        osc.disconnect(); g.disconnect();
        if (fertig) fertig();
      };
      return {
        frequenz: function (f) { if (!aus) osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.015); },
        jetzt: function () { return osc.frequency.value; },
        stopp: function () {
          if (aus) return;
          aus = true;
          var n = ctx.currentTime;
          g.gain.cancelScheduledValues(n);
          g.gain.setValueAtTime(g.gain.value, n);
          g.gain.linearRampToValueAtTime(0, n + 0.12);   // weich ausklingen
          try { osc.stop(n + 0.13); } catch (e) { /* schon beendet */ }
        },
      };
    }
    function kontext() { return init() ? ctx : null; }
    // Kammerton A4 in Hz, gilt für alle Klänge der App
    function kammerton(hz) { if (hz !== kt) { kt = hz; cache = {}; } }   // alte Klänge passen nicht mehr
    function puffer_anzahl() { return Object.keys(cache).length; }
    return { init: init, anschlag: anschlag, daempfen: daempfen, stopp: stopp, zeit: zeit, spiele: spiele, dauerton: dauerton, kontext: kontext, kammerton: kammerton, sitzung: sitzung,
      ruhe: ruhe, zustand: zustand, _pufferAnzahl: puffer_anzahl };
  })();

  return {
    PC_NAME: PC_NAME, GRUNDTOENE: GRUNDTOENE, TYPES: TYPES, TYPE_NAMES: TYPE_NAMES, TUNING: TUNING, SAITEN: SAITEN, DUR_KEYS: DUR_KEYS,
    parse: parse, fs: fs, check: check, fingers: fingers, bassPc: bassPc, parseAkkord: parseAkkord, imBereich: imBereich,
    grundgriff: grundgriff, key: key, stufeZuAkkord: stufeZuAkkord, akkordZuStufe: akkordZuStufe, akkordToene: akkordToene, tonleiter: tonleiter,
    svg: svg, Klang: Klang,
  };
})();
