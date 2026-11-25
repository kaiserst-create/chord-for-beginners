// Chords for Beginners: Schlag- und Zupfmuster
// Oben die Muster als Daten, darunter, welche Saiten ein Zeichen anschlägt. Ohne Zugriff auf die Seite,
// damit skripte/pruefen.js alles testen kann. Abgespielt wird in app.js über SC.Klang.anschlag.
//
// Ein Muster ist eine Folge von Achteln: 8 Zeichen im 4/4-Takt, 6 im 3/4-Takt.
//   D  Abschlag über alle Saiten           U  Aufschlag über die hohen Saiten
//   S  kurzer Abschlag nur auf den hohen Saiten (nach einem Basston)
//   B  Basston: Grundton auf der tiefsten Saite   W  Wechselbass: eine andere Basssaite
//   p i m a  Daumen, Zeige-, Mittel-, Ringfinger zupfen je eine Saite
//   -  nichts anschlagen, klingen lassen (bei U D U: Luftschlag)
// genre: wo das Muster oft vorkommt, recherchiert am 25.11.2026, Quellen in README.md.

var SC_MUSTER = (function () {
  'use strict';

  var MUSTER = [
    { id: 'abschlag', name: 'Nur Abschläge', takt: 4, folge: 'D-D-D-D-', tempo: 70,
      text: 'Ein Abschlag auf jeden Schlag, mehr nicht. Damit fängst du an: Akkord greifen, laut mitzählen, pünktlich wechseln.',
      genre: 'Der Einstieg für jedes Genre. Im Punk ist das sogar Programm: Johnny Ramone spielte fast nur Abschläge, allerdings doppelt so schnell in Achteln, zum Beispiel in „Blitzkrieg Bop“ der Ramones.' },
    { id: 'achtel', name: 'Ab und auf', takt: 4, folge: 'DUDUDUDU', tempo: 70,
      text: 'Abschlag auf der Zahl, Aufschlag auf dem „und“. Die Hand pendelt gleichmäßig wie ein Metronom und bleibt nie stehen.',
      genre: 'Die Grundlage für Pop, Rock und Folk. Ukulele-Seiten empfehlen dieses Ab und Auf zum Beispiel für „Riptide“ von Vance Joy.' },
    { id: 'lagerfeuer', name: 'Lagerfeuer-Schlag', takt: 4, folge: 'D-DU-UDU', tempo: 80,
      text: 'Ab, ab auf, auf ab auf. Auf der 3 geht die Hand nach unten, trifft aber nicht: Dieser Luftschlag macht den Schwung. Auf der Ukulele heißt das Muster Island Strum.',
      genre: 'Das Allzweck-Muster für Pop, Folk und Singer-Songwriter, auf Ukulele-Seiten das meistgenutzte überhaupt. Dort steht es zum Beispiel bei „Somewhere Over the Rainbow“ von Israel Kamakawiwoʻole und „Top of the World“ von den Carpenters.' },
    { id: 'walzer', name: 'Walzer im 3/4-Takt', takt: 3, folge: 'B-S-S-', tempo: 90,
      text: 'Drei Schläge pro Takt: erst der Basston, dann zwei kurze Schläge auf die hohen Saiten. Zähl „eins, zwei, drei“, das klingt wie „Umm, ta, ta“.',
      genre: 'Für Walzer, Country-Balladen und Volkslieder im Dreiertakt. Bekannte Songs im 3/4-Takt sind der Country-Klassiker „Tennessee Waltz“ und „Mr. Bojangles“.' },
    { id: 'wechselbass', name: 'Wechselbass', takt: 4, folge: 'B-S-W-S-', tempo: 90,
      text: 'Der Daumen spielt auf der 1 den Grundton, auf der 3 eine andere Basssaite, dazwischen schlägst du kurz die hohen Saiten an. Im Englischen heißt das „boom chick“.',
      genre: 'Der Klang von Country, Folk und Rockabilly. Berühmt ist der Wechselbass von Johnny Cash, etwa in „I Walk the Line“ und „Folsom Prison Blues“.' },
    { id: 'pima', name: 'Zupfmuster p i m a', takt: 4, folge: 'pimapima', tempo: 80,
      text: 'Statt zu schlagen, zupfst du die Saiten einzeln: erst der Daumen (p), dann Zeige-, Mittel- und Ringfinger (i, m, a). Die Buchstaben kommen aus dem Spanischen: pulgar, índice, medio, anular.',
      genre: 'Typisch für Folk, Singer-Songwriter und ruhige Balladen, die Fingernamen stammen aus der klassischen Gitarre. Ein bekanntes Beispiel für Akkorde, die Ton für Ton gezupft werden, ist „House of the Rising Sun“ von The Animals.' },
  ];
  var ZEICHEN = { D: '↓', S: '↓', U: '↑', B: 'B', W: 'W', p: 'p', i: 'i', m: 'm', a: 'a', '-': '·' };
  var STANDARD = 'lagerfeuer';

  function muster(id) { return MUSTER.filter(function (m) { return m.id === id; })[0] || null; }
  function schritte(m) { return m.folge.split(''); }
  // Zählzeiten unter den Zeichen: 1 + 2 + 3 + 4 +
  function zaehlzeiten(m) { return schritte(m).map(function (c, i) { return i % 2 ? '+' : String(i / 2 + 1); }); }
  function zeichen(c) { return ZEICHEN[c] || '?'; }
  // So steht das Muster als Text da, Achtel einer Zählzeit stehen zusammen: ↓ ↓↑ ·↑ ↓↑
  function schrift(m) {
    var s = schritte(m).map(zeichen), out = [];
    for (var i = 0; i < s.length; i += 2) out.push((s[i] + s[i + 1]).replace(/·$/, ''));
    return out.join(' ');
  }

  // ------------------------------------------------------------------ welche Saiten?
  // Gitarre: Saiten 0 bis 5 = E A D G H e. Ukulele: 0 bis 3 = G C E A (hohes G, die C-Saite klingt am tiefsten).
  var TUNING = { gitarre: [4, 9, 2, 7, 11, 4], ukulele: [7, 0, 4, 9] };
  var PIMA = { gitarre: { i: 3, m: 4, a: 5 }, ukulele: { p: 0, i: 1, m: 2, a: 3 } };
  function klingt(frets, s) { return s >= 0 && s < frets.length && frets[s] !== null; }
  // Basssaite: Gitarre die tiefste gespielte Saite (bei Grundgriffen der Grundton), Ukulele die C-Saite
  function bassSaite(frets, inst) {
    if (inst === 'ukulele') return 1;
    for (var i = 0; i < frets.length; i++) if (frets[i] !== null) return i;
    return -1;
  }
  // Wechselbass: Gitarre eine der beiden nächsten Basssaiten, am liebsten die mit der Quinte; Ukulele die G-Saite
  function wechselSaite(frets, inst) {
    if (inst === 'ukulele') return 0;
    var r = bassSaite(frets, inst);
    if (r < 0) return -1;
    var t = TUNING.gitarre, quinte = (t[r] + frets[r] + 7) % 12, kand = [r + 1, r + 2].filter(function (s) { return s <= 3 && klingt(frets, s); });
    var q = kand.filter(function (s) { return (t[s] + frets[s]) % 12 === quinte; })[0];
    if (q !== undefined) return q;
    return kand.length ? kand[0] : r;
  }
  function nur(frets, saiten) { return frets.map(function (f, i) { return saiten.indexOf(i) >= 0 ? f : null; }); }
  function abSaite(frets, ab) { return frets.map(function (f, i) { return i >= ab ? f : null; }); }
  function einzeln(frets, s) { return klingt(frets, s) ? nur(frets, [s]) : null; }

  // Was erklingt bei Zeichen c? Ergebnis { f: Griff mit null für stille Saiten, laut, auf } oder null.
  // eins: erster Schlag im Takt, der wird etwas betont.
  function ton(c, frets, inst, eins) {
    var g = inst === 'gitarre', f = null, laut = 1, auf = false;
    if (c === 'D') { f = frets.slice(); laut = eins ? 1 : 0.8; }
    else if (c === 'U') { f = g ? abSaite(frets, 2) : frets.slice(); laut = 0.55; auf = true; }
    else if (c === 'S') { f = g ? abSaite(frets, 3) : frets.slice(); laut = 0.7; }
    else if (c === 'B' || (c === 'p' && g)) { f = einzeln(frets, bassSaite(frets, inst)); laut = 1.35; }
    else if (c === 'W') { f = einzeln(frets, wechselSaite(frets, inst)); laut = 1.25; }
    else if (PIMA[inst] && PIMA[inst].hasOwnProperty(c)) { f = einzeln(frets, PIMA[inst][c]); laut = c === 'p' ? 1.35 : 1.1; }
    if (!f || !f.some(function (x) { return x !== null; })) return null;
    return { f: f, laut: laut, auf: auf };
  }

  // Erklärung der Schreibweise, passend zum Instrument
  function legende(inst) {
    var g = inst === 'gitarre';
    return [
      ['↓', 'Abschlag: von der tiefen zur hohen Saite. Steht er nach einem Basston, triffst du nur die hohen Saiten.'],
      ['↑', g ? 'Aufschlag: zurück nach oben, meist nur über die drei, vier hohen Saiten.' : 'Aufschlag: zurück nach oben über alle Saiten.'],
      ['·', 'kein Anschlag. Die Hand bewegt sich trotzdem weiter, der Akkord klingt.'],
      ['B', g ? 'Basston: der Daumen spielt nur die tiefste Saite des Griffs, meist den Grundton.' : 'Basston: der Daumen spielt nur die C-Saite, sie klingt auf der Ukulele am tiefsten.'],
      ['W', g ? 'Wechselbass: der Daumen spielt eine andere Basssaite, meist die Nachbarsaite mit der Quinte.' : 'Wechselbass: der Daumen spielt die G-Saite.'],
      ['p i m a', g ? 'Daumen auf der Basssaite, Zeigefinger auf der G-, Mittelfinger auf der H-, Ringfinger auf der hohen e-Saite.' : 'Daumen auf der G-, Zeigefinger auf der C-, Mittelfinger auf der E-, Ringfinger auf der A-Saite.'],
    ];
  }

  return { MUSTER: MUSTER, STANDARD: STANDARD, muster: muster, schritte: schritte, zaehlzeiten: zaehlzeiten, zeichen: zeichen, schrift: schrift,
    bassSaite: bassSaite, wechselSaite: wechselSaite, ton: ton, legende: legende };
})();
