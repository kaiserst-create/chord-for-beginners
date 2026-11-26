// Prüft „Chords for Beginners“ nach dem Vorbild von skripte/web_pruefen.js der Songwriting-App:
//  1. jeden Grundgriff in daten.js (richtige Töne, Grundton im Bass, Spannweite, höchstens vier Finger)
//  2. die 28 Akkorde der App (C D E F G A H als Dur, Moll, 7, m7): Griff und Akkordtöne
//  3. die zwölf Folgen in allen 7 Tonarten: Akkordnamen wie im Bild bzw. in der Songwriting-App, deutsche Namen, Griffe,
//     Akkorde außerhalb der 28, Stufen und Umrechnung, Genre-Hinweise
//  4. die Schlag- und Zupfmuster: Schreibweise, Länge, welche Saiten jedes Zeichen anschlägt
//  5. die Tonerkennung des Stimmgeräts mit erzeugten Saitenklängen (höchstens 1 Cent daneben), FEDER = 7, Reihenfolge
//  6. den Hinweis zum Installieren (Gerät, Browser, Text mit „Chords for Beginners“)
//  7. Seite und Offline: Service Worker, Manifest, Syntax, IDs, Speicher-Schlüssel, keine Favoriten,
//     keine Gedankenstriche in Texten, Icon-Größen
//
// Aufruf: osascript -l JavaScript skripte/pruefen.js

ObjC.import('Foundation');

function lies(pfad) {
  const s = $.NSString.stringWithContentsOfFileEncodingError(pfad, $.NSUTF8StringEncoding, null);
  if (s.isNil()) throw new Error('Datei nicht gefunden: ' + pfad);
  return s.js;
}
function gibtEs(pfad) { return $.NSFileManager.defaultManager.fileExistsAtPath(pfad); }
function projektordner() {
  const args = ObjC.deepUnwrap($.NSProcessInfo.processInfo.arguments);
  const cwd = $.NSFileManager.defaultManager.currentDirectoryPath.js;
  let skript = args.find(a => /pruefen\.js$/.test(a)) || 'skripte/pruefen.js';
  if (!skript.startsWith('/')) skript = cwd + '/' + skript;
  return $(skript).stringByStandardizingPath.stringByDeletingLastPathComponent.stringByDeletingLastPathComponent.js;
}

function run() {
  const basis = projektordner();
  // im globalen Bereich laden, wie <script> im Browser
  (0, eval)(lies(basis + '/daten.js') + '\n;globalThis.SC_DATEN = SC_DATEN;');
  (0, eval)(lies(basis + '/musik.js') + '\n;globalThis.SC = SC;');
  (0, eval)(lies(basis + '/folgen.js') + '\n;globalThis.SC_FOLGEN = SC_FOLGEN;');
  (0, eval)(lies(basis + '/muster.js') + '\n;globalThis.SC_MUSTER = SC_MUSTER;');
  const SC = globalThis.SC, F = globalThis.SC_FOLGEN, M = globalThis.SC_MUSTER, D = globalThis.SC_DATEN;
  const out = [];
  let fehler = 0;
  const melde = t => { fehler++; if (fehler < 40) out.push('FEHLER ' + t); };
  const PCVON = { 'C': 0, 'C#': 1, 'D♭': 1, 'D': 2, 'D#': 3, 'E♭': 3, 'E': 4, 'F': 5, 'F#': 6, 'G♭': 6, 'G': 7, 'G#': 8, 'A♭': 8, 'A': 9, 'A#': 10, 'B♭': 10, 'H': 11 };

  // ---------------------------------------------------------------- 1. alle Grundgriffe in daten.js
  let griffe = 0;
  for (const inst of ['gitarre', 'ukulele']) {
    const tuning = SC.TUNING[inst], n = tuning.length;
    if (D[inst].typen.join('|') !== '|m|7|m7') melde(inst + ': Akkordarten in daten.js sind nicht Dur, Moll, 7, m7');
    for (let root = 0; root < 12; root++) {
      const zeile = D[inst].griffe[SC.PC_NAME[root]];
      if (!zeile) { melde(inst + ' ' + SC.PC_NAME[root] + ': keine Griffe'); continue; }
      D[inst].typen.forEach((typ, i) => {
        const name = SC.PC_NAME[root] + typ;
        let f;
        try { f = SC.parse(zeile[i], n); } catch (e) { melde(inst + ' ' + name + ': ' + e.message); return; }
        griffe++;
        const e = SC.check(root, typ, f, tuning, inst === 'gitarre');
        if (e.length || SC.fingers(f) > 4) melde(inst + ' ' + name + ' ' + SC.fs(f) + ': ' + e.concat(SC.fingers(f) > 4 ? ['mehr als vier Finger'] : []).join(', '));
        const g = SC.grundgriff(inst, name);
        if (!g || SC.fs(g.f) !== SC.fs(f)) melde(inst + ' ' + name + ': grundgriff() liefert einen anderen Griff');
      });
    }
  }
  out.push(griffe + ' Grundgriffe geprüft (12 Grundtöne × Dur, Moll, 7, m7 × Gitarre und Ukulele)');

  // ---------------------------------------------------------------- 2. die 28 Akkorde der App
  if (SC.GRUNDTOENE.join(',') !== '0,2,4,5,7,9,11') melde('Grundtöne sind nicht C D E F G A H');
  if (Object.keys(SC.TYPES).sort().join('|') !== '|7|m|m7') melde('Akkordarten sind nicht Dur, Moll, 7, m7');
  const bereich = [];
  for (const pc of SC.GRUNDTOENE) for (const typ of ['', 'm', '7', 'm7']) bereich.push(SC.PC_NAME[pc] + typ);
  for (const name of bereich) {
    if (!SC.imBereich(name)) melde('Akkord ' + name + ' zählt nicht zum Bereich');
    for (const inst of ['gitarre', 'ukulele']) {
      const g = SC.grundgriff(inst, name);
      if (!g || g.q !== 'Grundgriff') melde('Akkord ' + name + ' (' + inst + '): kein Grundgriff');
    }
    const a = SC.parseAkkord(name), t = SC.akkordToene(name), soll = SC.TYPES[a.typ][0];
    if (t.length !== soll.length || t.some((x, i) => PCVON[x] !== (a.root + soll[i]) % 12)) melde('Akkordtöne ' + name + ': ' + t.join(' '));
  }
  for (const [name, soll] of [['C7', 'C E G B♭'], ['Am7', 'A C E G'], ['E7', 'E G# H D'], ['Dm7', 'D F A C'], ['F7', 'F A C E♭'], ['Gm', 'G B♭ D']]) {
    if (SC.akkordToene(name).join(' ') !== soll) melde('Akkordtöne ' + name + ': ' + SC.akkordToene(name).join(' ') + ' statt ' + soll);
  }
  for (const name of ['F#m', 'C#m', 'D#m', 'G#m', 'F#', 'F#7', 'B♭', 'B♭7', 'Cmaj7', 'C/E', 'Bm']) if (SC.imBereich(name)) melde(name + ' dürfte nicht zu den 28 Akkorden gehören');
  for (const name of ['H', 'Hm', 'H7', 'Hm7']) if (!SC.imBereich(name)) melde(name + ' fehlt im Akkord-Bereich');
  out.push(bereich.length + ' Akkorde im Akkord-Bereich geprüft');

  // ---------------------------------------------------------------- 3. die zwölf Folgen in allen Tonarten
  const BILD = {   // die ersten sieben wie im Bild des Nutzers, die übrigen wie in der Songwriting-App, alle in C-Dur
    happy: ['C-F-G-C', 'I IV V I', 'fröhlich'], joyful: ['C-G-Am-F', 'I V vi IV', 'freudig'], dark: ['F-C-Am-Em', 'IV I vi iii', 'düster'],
    pop: ['F-Am-G-C', 'IV vi V I', 'poppig'], emotional: ['F-C-Am-G', 'IV I vi V', 'emotional'], sad: ['Dm-Am-F-G', 'ii vi IV V', 'traurig'],
    powerful: ['F-G-Am-G', 'IV V vi V', 'kraftvoll'],
    doowop: ['C-Am-F-G', 'I vi IV V', 'romantisch,eingängig'], poploop: ['C-F-Am-G', 'I IV vi V', 'fröhlich,eingängig'],
    rocknroll: ['C-F-G-F', 'I IV V IV', 'fröhlich,kraftvoll'],
    heavensdoor: ['C-G-Dm-C-G-F', 'I V ii I V IV', 'entspannt,melancholisch'],   // „Knockin’ on Heaven’s Door“, im Original G D Am / G D C
    blues12: ['C7-C7-C7-C7-F7-F7-C7-C7-G7-F7-C7-G7', 'I7 I7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7', 'groovig,entspannt'],
  };
  if (F.folgen.map(f => f.id).join(' ') !== Object.keys(BILD).join(' ')) melde('Folgen: ' + F.folgen.map(f => f.id).join(' ') + ' statt der zwölf vorgesehenen');
  // Akkorde außerhalb der 28, die in den Folgen vorkommen (je Tonart)
  const FREMD_SOLL = { 0: '', 2: 'F#m', 4: 'C#m G#m F#m', 5: 'B♭ B♭7', 7: '', 9: 'F#m C#m', 11: 'C#m D#m F# G#m F#7' };
  const DEUTSCH = /^(C|C#|D|D#|E♭|E|F|F#|G|G#|A♭|A|B♭|H)(m|7|m7)?$/;
  let folgenAkkorde = 0;
  const alleNamen = {};
  for (const f of F.folgen) {
    const b = BILD[f.id];
    if (!b) continue;
    if (F.akkorde(f, 0).join('-') !== b[0]) melde('Folge ' + f.id + ' in C: ' + F.akkorde(f, 0).join('-') + ' statt ' + b[0]);
    if (f.stufen.join(' ') !== b[1]) melde('Folge ' + f.id + ': Stufen ' + f.stufen.join(' ') + ' statt ' + b[1]);
    if (f.stimmung.join() !== b[2]) melde('Folge ' + f.id + ': Etikett ' + f.stimmung.join() + ' statt ' + b[2]);
    if (f.ton !== 'dur') melde('Folge ' + f.id + ' steht nicht in Dur');
    for (const s of f.stufen) {
      if (['I', 'ii', 'iii', 'IV', 'V', 'vi'].indexOf(s) < 0 && !(/^(I|IV|V)7$/.test(s) && f.id === 'blues12')) melde('Folge ' + f.id + ': Stufe ' + s + ' gibt es in der App nicht');
    }
    // Genre-Hinweis: 2 bis 3 Sätze, mit Songtitel in „…“, ohne Gedankenstrich
    const saetze = f.genre.split(/(?<=[.?])(?<!\b[A-Z]\.)\s+(?=[A-ZÄÖÜ„])/).length;   // „Panic! At The Disco“ und „Johnny B. Goode“ sind kein Satzende
    if (saetze < 2 || saetze > 3) melde('Folge ' + f.id + ': Genre-Hinweis hat ' + saetze + ' Sätze');
    if (!/„[^“]+“/.test(f.genre)) melde('Folge ' + f.id + ': Genre-Hinweis ohne Songbeispiel');
    if (/\s[–—]\s/.test(f.genre + f.titel)) melde('Folge ' + f.id + ': Gedankenstrich im Text');
    for (const pc of SC.GRUNDTOENE) {
      const akk = F.akkorde(f, pc);
      for (const a of akk) {
        folgenAkkorde++;
        alleNamen[pc] = alleNamen[pc] || [];
        if (alleNamen[pc].indexOf(a) < 0) alleNamen[pc].push(a);
        if (!DEUTSCH.test(a)) melde('Folge ' + f.id + ' in ' + SC.key(pc).name + ': Akkordname ' + a + ' nicht deutsch');
        for (const inst of ['gitarre', 'ukulele']) {
          const g = SC.grundgriff(inst, a);
          if (!g) { melde('Folge ' + f.id + ' in ' + SC.key(pc).name + ': kein Griff für ' + a + ' (' + inst + ')'); continue; }
          if (g.q !== (SC.imBereich(a) ? 'Grundgriff' : 'einfachster Griff')) melde('Folge ' + f.id + ': ' + a + ' falsch beschriftet');
        }
      }
    }
  }
  for (const pc of SC.GRUNDTOENE) {
    const fremd = (alleNamen[pc] || []).filter(a => !SC.imBereich(a));
    if (fremd.slice().sort().join(' ') !== FREMD_SOLL[pc].split(' ').filter(Boolean).sort().join(' ')) melde(SC.key(pc).name + ': Akkorde außerhalb der 28 sind ' + fremd.join(' ') + ' statt ' + FREMD_SOLL[pc]);
  }
  // Stichproben in anderen Tonarten
  const PROBE = [['joyful', 2, 'D-A-Hm-G'], ['dark', 4, 'A-E-C#m-G#m'], ['sad', 5, 'Gm-Dm-B♭-C'], ['powerful', 9, 'D-E-F#m-E'], ['happy', 7, 'G-C-D-G'],
    ['heavensdoor', 7, 'G-D-Am-G-D-C'], ['doowop', 9, 'A-F#m-D-E'], ['rocknroll', 4, 'E-A-H-A'], ['joyful', 11, 'H-F#-G#m-E'], ['sad', 11, 'C#m-G#m-E-F#'], ['blues12', 5, 'F7-F7-F7-F7-B♭7-B♭7-F7-F7-C7-B♭7-F7-C7']];
  for (const [id, pc, soll] of PROBE) {
    const f = F.folgen.find(x => x.id === id);
    if (F.akkorde(f, pc).join('-') !== soll) melde('Folge ' + id + ' in ' + SC.key(pc).name + ': ' + F.akkorde(f, pc).join('-') + ' statt ' + soll);
  }
  // Editor: Akkord → Stufe → Akkord für alle erlaubten Stufen in allen Tonarten
  const ERLAUBT = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'I7', 'ii7', 'iii7', 'IV7', 'V7', 'vi7'];
  let rund = 0;
  for (let pc = 0; pc < 12; pc++) {
    const k = SC.key(pc);
    for (const s of ERLAUBT) {
      rund++;
      const a = SC.stufeZuAkkord(s, k), z = SC.akkordZuStufe(a, k);
      if (z !== s) melde('Umrechnung ' + s + ' in ' + k.name + ': ' + a + ' → ' + z);
    }
  }
  const appJs = lies(basis + '/app.js');
  const erlaubtApp = /var ERLAUBT = \[([^\]]*)\]/.exec(appJs);
  if (!erlaubtApp || erlaubtApp[1].replace(/[\s']/g, '') !== ERLAUBT.join(',')) melde('app.js: ERLAUBT weicht von den Stufen der App ab');
  if (!/leiter: \['I', 'ii', 'iii', 'IV', 'V', 'vi'\]/.test(appJs)) melde('app.js: Palette des Editors bietet nicht genau I ii iii IV V vi');
  if (!/var T_STUFEN = \['I', 'ii', 'iii', 'IV', 'V', 'vi'/.test(appJs)) melde('app.js: Reiter Tonart zeigt nicht I ii iii IV V vi');
  // Kapo gibt es nicht zum Einstellen (für Anfänger unnötig), nur eine Erklärung. Dafür ist die leichteste Tonart markiert: G-Dur Gitarre, C-Dur Ukulele
  if (/kapo['"]|S\.kapo|tKapo|id="[a-z-]*kapo|data-kapo/i.test(appJs + lies(basis + '/index.html'))) melde('Kapo lässt sich noch einstellen');
  if (!/function kapoTipp\(\)/.test(appJs) || (appJs.match(/kapoTipp\(\)/g) || []).length < 3) melde('Erklärung zum Kapo fehlt auf der Seite einer Folge oder im Reiter Tonart');
  if (!/var LEICHT = \{ gitarre: 7, ukulele: 0 \};/.test(appJs)) melde('Leichteste Tonart ist nicht G-Dur (Gitarre) und C-Dur (Ukulele)');
  if (!/if \(F\.folgen\.some\(function \(x\) \{ return x\.id === id; \}\)\) id = 'eigen-' \+ id;/.test(appJs)) melde('Import: eigene Folge kann eine Katalog-Folge verdecken');
  if (!/Slash-Akkorde wie C\/E/.test(appJs)) melde('Editor: Slash-Akkorde gelten als unbekannt statt als nicht dabei');
  // Start beim ersten Öffnen: Gitarre und G-Dur in Liste, Tonart und Akkord, Üben mit der Pop-Folge in G
  if (!/instrument: 'gitarre'/.test(appJs) || !/grundton: 7,/.test(appJs) || !/tGrundton: 7,/.test(appJs) || !/aGrundton: 7,/.test(appJs) || !/rAkkord: 'folge'/.test(appJs)) melde('Start: nicht Gitarre und G-Dur');
  if (!/if \(GT\.indexOf\(S\[k\]\) < 0\) S\[k\] = 7;/.test(appJs)) melde('Start: unbrauchbare Tonart fällt nicht auf G-Dur zurück');
  // Reiter Rhythmus: Griffbilder im gewählten Muster, mit Zeichen unter den Saiten
  if (!/gewaehlt \? griffeImMuster\(m\)/.test(appJs) || !/griffe: true \}/.test(appJs)) melde('Rhythmus: Griffbilder im gewählten Muster fehlen');
  const bildPima = SC.svg(SC.grundgriff('gitarre', 'C').f, { unten: ['', 'p', '', 'i', 'm', 'a'] });
  if ((bildPima.match(/class="gb-rolle"/g) || []).length !== 4 || !/viewBox="0 0 100 121.5"/.test(bildPima)) melde('Griffbild: Zeichen unter den Saiten fehlen');
  if (/gb-rolle/.test(SC.svg(SC.grundgriff('gitarre', 'C').f, { unten: ['', '', '', '', '', ''] }))) melde('Griffbild: leere Zeichenzeile wird gezeichnet');
  // Reiter Akkord: nach dem Grundton alle vier Arten, keine Auswahl der Art
  if (/a-typ|aTyp/.test(appJs + lies(basis + '/index.html')) || !/class="griffe akkord-vier"/.test(appJs)) melde('Reiter Akkord: nicht alle vier Arten auf einmal');
  if (!/var UEBEN = \[[^\]]*'folge'\]/.test(appJs) || /'C G Am F'\]/.test(appJs)) melde('Rhythmus: Übungsfolge hängt nicht von der leichtesten Tonart ab');
  for (const id of ['f-grundton', 't-grundton', 'e-grundton']) if (appJs.indexOf("markiereLeicht($('#" + id + "')") < 0) melde('Leichteste Tonart bei ' + id + ' nicht markiert');
  // in der leichtesten Tonart braucht keine Folge einen Akkord außerhalb des Bereichs
  for (const f of F.folgen) for (const pc of [7, 0]) for (const a of F.akkorde(f, pc)) if (!SC.imBereich(a)) melde('Folge ' + f.id + ' in ' + SC.key(pc).name + ': ' + a + ' außerhalb des Bereichs');
  out.push(F.folgen.length + ' Folgen in ' + SC.GRUNDTOENE.length + ' Tonarten geprüft (' + folgenAkkorde + ' Akkorde, ' + rund + ' Stufen umgerechnet)');

  // ---------------------------------------------------------------- 4. Schlag- und Zupfmuster
  const ZEICHEN = 'DUSBWpima-';
  if (!M.muster(M.STANDARD)) melde('Muster: Standard ' + M.STANDARD + ' fehlt');
  for (const id of ['abschlag', 'lagerfeuer', 'walzer', 'wechselbass', 'pima']) if (!M.muster(id)) melde('Muster ' + id + ' fehlt');
  const lager = M.muster('lagerfeuer');
  if (lager && M.schrift(lager) !== '↓ ↓↑ ·↑ ↓↑') melde('Muster Lagerfeuer-Schlag: ' + M.schrift(lager) + ' statt ↓ ↓↑ ·↑ ↓↑');
  if (M.muster('walzer') && M.muster('walzer').takt !== 3) melde('Walzer steht nicht im 3/4-Takt');
  let anschlaege = 0;
  const formen = [];
  for (const inst of ['gitarre', 'ukulele']) for (let root = 0; root < 12; root++) for (const typ of ['', 'm', '7', 'm7']) formen.push([inst, root, SC.grundgriff(inst, SC.PC_NAME[root] + typ)]);
  const ids = {};
  for (const m of M.MUSTER) {
    if (ids[m.id]) melde('Muster ' + m.id + ' doppelt');
    ids[m.id] = true;
    const s = M.schritte(m);
    if (s.length !== (m.takt === 3 ? 6 : 8)) melde('Muster ' + m.name + ': ' + s.length + ' Achtel im ' + m.takt + '/4-Takt');
    if (s.some(c => ZEICHEN.indexOf(c) < 0)) melde('Muster ' + m.name + ': unbekanntes Zeichen in ' + m.folge);
    if (s[0] === '-') melde('Muster ' + m.name + ': die 1 ist leer');
    if (!m.name || !m.text || !m.genre || !(m.tempo >= 50 && m.tempo <= 160)) melde('Muster ' + m.name + ': Name, Text, Genre oder Tempo fehlt');
    if (!/„[^“]+“/.test(m.genre)) melde('Muster ' + m.name + ': Genre-Hinweis ohne Songbeispiel');
    if (/\s[–—]\s/.test(m.name + m.text + m.genre)) melde('Muster ' + m.name + ': Gedankenstrich im Text');
    const z = M.zaehlzeiten(m);
    if (z[0] !== '1' || z[1] !== '+' || z[s.length - 2] !== String(m.takt)) melde('Muster ' + m.name + ': Zählzeiten ' + z.join(' '));
    for (const [inst, root, g] of formen) {
      const tuning = SC.TUNING[inst];
      s.forEach((c, k) => {
        const x = M.ton(c, g.f, inst, k === 0);
        if (c === '-') { if (x) melde('Muster ' + m.name + ': Pause klingt'); return; }
        if (!x) { melde('Muster ' + m.name + ' ' + inst + ' ' + SC.fs(g.f) + ': Zeichen ' + c + ' spielt nichts'); return; }
        anschlaege++;
        if (x.f.length !== g.f.length || x.f.some((v, i) => v !== null && v !== g.f[i])) melde('Muster ' + m.name + ': Zeichen ' + c + ' greift anders als der Akkord ' + SC.fs(g.f));
        const saiten = x.f.map((v, i) => v === null ? -1 : i).filter(i => i >= 0);
        if ('BWpima'.indexOf(c) >= 0 && saiten.length !== 1) melde('Muster ' + m.name + ': Zeichen ' + c + ' trifft ' + saiten.length + ' Saiten');
        if (inst === 'gitarre') {
          if ((c === 'B' || c === 'p') && SC.bassPc(x.f, tuning) !== root) melde('Muster ' + m.name + ': Basston von ' + SC.fs(g.f) + ' ist nicht der Grundton');
          if (c === 'W' && saiten[0] === M.bassSaite(g.f, inst)) melde('Muster ' + m.name + ': Wechselbass auf derselben Saite bei ' + SC.fs(g.f));
          if (c === 'U' && saiten.some(i => i < 2)) melde('Muster ' + m.name + ': Aufschlag trifft Basssaiten');
          if (c === 'S' && saiten.some(i => i < 3)) melde('Muster ' + m.name + ': kurzer Schlag trifft Basssaiten');
          if (c === 'i' && saiten[0] !== 3 || c === 'm' && saiten[0] !== 4 || c === 'a' && saiten[0] !== 5) melde('Muster ' + m.name + ': ' + c + ' auf der falschen Saite');
        } else {
          if (c === 'B' && saiten[0] !== 1 || c === 'W' && saiten[0] !== 0) melde('Muster ' + m.name + ': Ukulele-Bass auf der falschen Saite');
          if ('pima'.indexOf(c) >= 0 && saiten[0] !== 'pima'.indexOf(c)) melde('Muster ' + m.name + ': Ukulele ' + c + ' auf der falschen Saite');
        }
        if (!(x.laut > 0 && x.laut <= 1.5)) melde('Muster ' + m.name + ': Lautstärke ' + x.laut);
        if (x.auf !== (c === 'U')) melde('Muster ' + m.name + ': Richtung bei ' + c + ' falsch');
      });
    }
  }
  // Wechselbass der Gitarre bei den Grundgriffen: am liebsten die Quinte
  for (const [name, soll] of [['C', 3], ['G', 2], ['D', 3], ['A', 2], ['E', 1], ['Am', 2], ['Em', 1], ['F', 1]]) {
    const g = SC.grundgriff('gitarre', name);
    if (M.wechselSaite(g.f, 'gitarre') !== soll) melde('Wechselbass ' + name + ': Saite ' + M.wechselSaite(g.f, 'gitarre') + ' statt ' + soll);
  }
  for (const inst of ['gitarre', 'ukulele']) {
    const l = M.legende(inst);
    if (l.length < 5 || l.some(x => !x[0] || !x[1] || /\s[–—]\s/.test(x[1]))) melde('Legende ' + inst + ' unvollständig oder mit Gedankenstrich');
  }
  out.push(M.MUSTER.length + ' Muster geprüft, ' + anschlaege + ' Anschläge auf allen Grundgriffen');

  // ---------------------------------------------------------------- 5. Stimmgerät: erkennt es jede Saite auf 1 Cent genau?
  const stimmenJs = lies(basis + '/stimmen.js');
  (0, eval)(stimmenJs + '\n;globalThis.SC_STIMMEN = SC_STIMMEN;');
  const T = globalThis.SC_STIMMEN;
  if (!/var FEDER = 7;/.test(stimmenJs)) melde('Stimmgerät: FEDER ist nicht 7');
  let zufall = 4711;
  const rnd = () => (zufall = (zufall * 1103515245 + 12345) % 2147483648) / 2147483648;
  // gezupfte Saite aus Teiltönen mit zufälliger Phase, abklingend, mit leisem Rauschen
  function zupf(f, sr, len, teile, start) {
    const x = new Float32Array(len);
    teile.forEach((a, h) => {
      const fh = f * (h + 1);
      if (fh > sr * 0.45) return;
      const ph = rnd() * 2 * Math.PI, w = 2 * Math.PI * fh / sr, dk = (1.5 + h) / sr;
      for (let j = 0; j < len; j++) { const t = j + start; x[j] += a * Math.sin(w * t + ph) * Math.exp(-dk * t); }
    });
    for (let j = 0; j < len; j++) x[j] = x[j] * 0.15 + (rnd() - 0.5) * 0.004;
    return x;
  }
  const KLAENGE = [[1, 0.6, 0.4, 0.25, 0.15, 0.1], [0.25, 1, 0.6, 0.4, 0.2]];   // normal und mit schwachem Grundton wie am Handymikrofon
  let erkannt = 0, groesste = 0;
  const pruefeTon = (was, r, sollF, sollZiel, kt, midis, sollSaite) => {
    erkannt++;
    if (!r) { melde('Stimmgerät ' + was + ': nichts erkannt'); return; }
    const w = T.auswerten(r.f, kt, midis, -1), abw = Math.abs(1200 * Math.log(r.f / sollF) / Math.LN2);
    groesste = Math.max(groesste, abw);
    if (abw > 1) melde('Stimmgerät ' + was + ': ' + abw.toFixed(2) + ' Cent daneben');
    if (w.ziel !== sollZiel || (sollSaite !== undefined && w.saite !== sollSaite)) melde('Stimmgerät ' + was + ': falscher Ton ' + w.ziel + ' statt ' + sollZiel);
  };
  for (const inst of ['gitarre', 'ukulele']) {
    for (const st of T.STIMMUNGEN[inst]) {
      const s = st.toene.map(T.saite), midis = s.map(x => x.midi);
      for (const [kt, sr] of [[430, 44100], [440, 48000], [450, 48000]]) {
        const b = T.bereich(midis, kt);
        for (const cent of [-40, -12, 0, 25]) {
          s.forEach((x, i) => {
            for (const teile of KLAENGE) {
              const f = T.frequenz(x.midi, kt) * Math.pow(2, cent / 1200);
              const r = T.erkenne(zupf(f, sr, 4096, teile, Math.floor(sr * 0.15)), sr, b[0], b[1]);
              pruefeTon(inst + ' ' + st.name + ' ' + x.name + x.okt + ' ' + kt + ' Hz ' + cent + ' Cent', r, f, x.midi, kt, midis, i);
            }
          });
        }
      }
    }
  }
  // frei: jeder Halbton vom tiefen D bis C6
  for (let m = 38; m <= 84; m++) {
    for (const cent of [0, 20, -35]) {
      const f = T.frequenz(m, 440) * Math.pow(2, cent / 1200), b = T.bereich(null, 440);
      pruefeTon('frei ' + T.tonName(m).name + T.tonName(m).okt + ' ' + cent + ' Cent', T.erkenne(zupf(f, 48000, 4096, KLAENGE[0], 7200), 48000, b[0], b[1]), f, m, 440, null);
    }
  }
  // Referenztöne müssen selbst genau stimmen
  for (const inst of ['gitarre', 'ukulele']) {
    for (const st of T.STIMMUNGEN[inst]) {
      for (const x of st.toene.map(T.saite)) {
        const f = T.frequenz(x.midi, 440), d = T.zupfDaten(f, 48000, 0.4);
        pruefeTon('Referenzton ' + x.name + x.okt, T.erkenne(d.subarray(4800, 4800 + 4096), 48000, 40, 1500), f, x.midi, 440, null);
      }
    }
  }
  // Stille und Rauschen dürfen keinen Ton liefern
  const rauschen = a => { const x = new Float32Array(4096); for (let j = 0; j < x.length; j++) x[j] = (rnd() - 0.5) * a; return x; };
  if (T.erkenne(rauschen(0.004), 48000)) melde('Stimmgerät: Stille als Ton erkannt');
  if (T.erkenne(rauschen(0.3), 48000)) melde('Stimmgerät: Rauschen als Ton erkannt');
  // Klang: weniger Nachklang, Dämpfen beim Akkordwechsel
  const musikJs = lies(basis + '/musik.js');
  if (typeof SC.Klang.daempfen !== 'function' || !/SC\.Klang\.daempfen\(t0\)/.test(appJs)) melde('Klang: Akkordwechsel dämpft die alten Saiten nicht');
  const nk = /var NACHKLANG = \{ gitarre: ([\d.]+), ukulele: ([\d.]+) \}/.exec(musikJs);
  if (!nk || +nk[1] > 3 || +nk[2] > 2) melde('Klang: Nachklang fehlt oder ist länger als 3 s (Gitarre) bzw. 2 s (Ukulele)');
  if (T.KT_MIN !== 430 || T.KT_MAX !== 450 || T.KT_STANDARD !== 440) melde('Stimmgerät: Kammerton-Grenzen geändert');
  const html = lies(basis + '/index.html');
  const sgInst = /<div[^>]*id="sg-inst"[^>]*>([\s\S]*?)<\/div>/.exec(html);
  const reihe = sgInst ? [...sgInst[1].matchAll(/data-wert="([^"]+)"/g)].map(m => m[1]).join(' ') : '';
  if (reihe !== 'gitarre ukulele frei') melde('Stimmgerät: Reihenfolge „' + reihe + '“ statt „gitarre ukulele frei“ wie in der Songwriting-App');
  out.push(erkannt + ' Töne im Stimmgerät erkannt, größte Abweichung ' + groesste.toFixed(2).replace('.', ',') + ' Cent');

  // ---------------------------------------------------------------- 6. Hinweis zum Installieren: richtiges Gerät erkannt?
  const installJs = lies(basis + '/installieren.js');
  (0, eval)(installJs + '\n;globalThis.SC_INSTALL = SC_INSTALL;');
  const INST = globalThis.SC_INSTALL;
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';
  const ANDROID = 'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko)';
  const geraete = [
    ['iPhone Safari', IPHONE + ' Version/18.5 Mobile/15E148 Safari/604.1', 5, 'ios'],
    ['iPad Safari (meldet sich als Mac)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15', 5, 'ios'],
    ['altes iPad Safari', 'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1', 5, 'ios'],
    ['iPhone Chrome', IPHONE + ' CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1', 5, 'ios-anders'],
    ['iPhone Firefox', IPHONE + ' FxiOS/133.0 Mobile/15E148 Safari/605.1.15', 5, 'ios-anders'],
    ['iPhone Edge', IPHONE + ' Version/18.0 EdgiOS/131.0.2903.68 Mobile/15E148 Safari/605.1.15', 5, 'ios-anders'],
    ['iPhone Instagram', IPHONE + ' Mobile/15E148 Instagram 357.0.0.25.101 (iPhone14,5; iOS 18_5; de_DE; de; scale=3.00; 1170x2532)', 5, 'ios-app'],
    ['iPhone Facebook', IPHONE + ' Mobile/15E148 [FBAN/FBIOS;FBAV/490.0.0.38.107;FBBV/123;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS]', 5, 'ios-app'],
    ['iPhone eingebettete Ansicht', IPHONE + ' Mobile/15E148', 5, 'ios-app'],
    ['Android Chrome', ANDROID + ' Chrome/131.0.0.0 Mobile Safari/537.36', 5, 'android'],
    ['Android Samsung Internet', 'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36', 5, 'android'],
    ['Android Firefox', 'Mozilla/5.0 (Android 14; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0', 5, 'android'],
    ['Android-Tablet Chrome', 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 5, 'android'],
    ['Android eingebettete Ansicht', 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.81 Mobile Safari/537.36', 5, 'android-app'],
    ['Android Instagram', 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.81 Mobile Safari/537.36 Instagram 357.0.0.13.112 Android', 5, 'android-app'],
    ['Mac Safari', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15', 0, ''],
    ['Windows Chrome', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 0, ''],
    ['Linux Firefox', 'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0', 0, ''],
  ];
  for (const [name, ua, touch, soll] of geraete) {
    const ist = INST.art({ ua: ua, touch: touch, installiert: false, protokoll: 'https:' });
    if (ist !== soll) melde('Installieren: ' + name + ' erkannt als „' + ist + '“ statt „' + soll + '“');
    if (soll) {
      if (INST.art({ ua: ua, touch: touch, installiert: true, protokoll: 'https:' })) melde('Installieren: ' + name + ' schon installiert, trotzdem Hinweis');
      if (INST.art({ ua: ua, touch: touch, installiert: false, protokoll: 'file:' })) melde('Installieren: ' + name + ' als Datei geöffnet, trotzdem Hinweis');
    }
  }
  // jeder Hinweis hat Text und nennt „Chords for Beginners“, Android mit Installationsfenster bekommt den Knopf
  for (const a of ['ios', 'ios-anders', 'ios-app', 'android', 'android-app']) {
    for (const knopf of [false, true]) {
      const x = INST.inhalt(a, knopf);
      if (!x || !x.nutzen || (!x.schritte.length && !x.knopf)) { melde('Installieren: Hinweis für ' + a + ' leer'); continue; }
      if (!!x.knopf !== (a === 'android' && knopf)) melde('Installieren: Knopf bei ' + a + ' falsch');
      const text = [x.nutzen, x.notiz || ''].concat(x.schritte).join(' ').replace(/<[^>]+>/g, '');
      if (/ [–—] /.test(text)) melde('Installieren: Gedankenstrich im Hinweis für ' + a);
      if (a.indexOf('ios') === 0 ? /Startbildschirm/.test(text) : /Home-Bildschirm/.test(text)) melde('Installieren: falscher Name des Bildschirms bei ' + a);
      if (!/Chords for Beginners/.test(x.nutzen) || /Chords(?! for Beginners)/.test(text)) melde('Installieren: falscher App-Name im Hinweis für ' + a);
    }
  }
  if (INST.inhalt('', false)) melde('Installieren: Hinweis ohne Gerät');
  if (!/>Chords for Beginners als App installieren</.test(html)) melde('Installieren: Link im Fuß nennt nicht „Chords for Beginners“');
  out.push(geraete.length + ' Geräte für den Hinweis zum Installieren geprüft');

  // ---------------------------------------------------------------- 7. Seite, Offline, Texte, Icons
  const sw = lies(basis + '/sw.js');
  const liste = /var DATEIEN = \[([\s\S]*?)\];/.exec(sw);
  const dateien = liste ? [...liste[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
  if (!/var VERSION = 'cfb-\d{4}-\d{2}-\d{2}-\d+';/.test(sw)) melde('Service Worker: VERSION fehlt oder beginnt nicht mit cfb-');
  if (!/k\.indexOf\('cfb-'\) === 0 && k !== VERSION/.test(sw)) melde('Service Worker: löscht nicht nur die eigenen Speicher');
  for (const d of dateien) if (d !== './' && !gibtEs(basis + '/' + d)) melde('Service Worker: ' + d + ' gibt es nicht');
  const geladen = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]);
  const manifest = JSON.parse(lies(basis + '/manifest.webmanifest'));
  manifest.icons.forEach(i => geladen.push(i.src));
  for (const d of geladen) if (dateien.indexOf(d) < 0) melde('Service Worker: ' + d + ' fehlt in DATEIEN');
  if (manifest.name !== 'Chords for Beginners' || manifest.lang !== 'de' || manifest.display !== 'standalone' || manifest.start_url !== './') melde('Manifest: Name, Sprache, Anzeige oder Start falsch');
  if (!/<title>Chords for Beginners<\/title>/.test(html)) melde('index.html: Titel ist nicht „Chords for Beginners“');
  for (const d of ['app.js', 'sw.js', 'musik.js', 'folgen.js', 'muster.js', 'stimmen.js', 'installieren.js']) {
    try { new Function(lies(basis + '/' + d)); } catch (e) { melde(d + ': Syntaxfehler ' + e.message); }
  }
  // jede ID, die die Skripte suchen, gibt es in index.html genau einmal
  const idZahl = {};
  [...html.matchAll(/\sid="([^"]+)"/g)].forEach(m => { idZahl[m[1]] = (idZahl[m[1]] || 0) + 1; });
  Object.keys(idZahl).forEach(id => { if (idZahl[id] > 1) melde('index.html: ID ' + id + ' doppelt'); });
  const dynamisch = ['sg-nadel', 'd-grundton', 'd-muster', 'abspielen', 'tempo', 'tempo-wert', 'schleife', 'exportieren', 'importieren',
    'e-titel', 'e-grundton', 'e-akkorde', 'e-vorschau', 'e-palette', 'e-anhoeren', 'e-takt', 'e-notiz', 'e-fehler'];
  const gesucht = [...stimmenJs.matchAll(/\$\('([a-z-]+)'\)/g)].map(m => m[1])
    .concat([...appJs.matchAll(/\$\('#([a-z-]+)'\)/g)].map(m => m[1]))
    .concat([...installJs.matchAll(/getElementById\('([a-z-]+)'\)/g)].map(m => m[1]));
  for (const id of gesucht) if (!idZahl[id] && dynamisch.indexOf(id) < 0) melde('index.html: ID ' + id + ' fehlt');
  const tabs = [...html.matchAll(/data-tab="([a-z]+)"/g)].map(m => m[1]).join(' ');
  if (tabs !== 'folgen tonart akkord rhythmus') melde('Tabs: ' + tabs);
  for (const t of tabs.split(' ')) if (!idZahl['tab-' + t]) melde('Tab ' + t + ' ohne Inhalt');
  // eigene Speicher-Schlüssel, damit sich die App auf GitHub Pages nicht mit „Songwriting & Chords“ mischt
  for (const k of ["'cfb-zustand'", "'cfb-eigene'", "'cfb-thema'"]) if ((appJs + html).indexOf(k) < 0) melde('Speicher-Schlüssel ' + k + ' fehlt');
  if (/'sc-(zustand|eigene|thema)'/.test(appJs + html)) melde('Speicher-Schlüssel der Songwriting-App benutzt');
  // Favoriten, Genre- und Stimmungsmenüs gibt es nicht
  const ohneKommentar = appJs.replace(/^\s*\/\/.*$/gm, '') + html.replace(/<!--[\s\S]*?-->/g, '');
  if (/favorit|☆|★|data-stern/i.test(ohneKommentar)) melde('Favoriten sind noch im Code');
  if (/id="f-(genre|stimmung|suche)"/.test(html)) melde('Filtermenüs für Genre, Stimmung oder Suche sind noch da');
  // keine Gedankenstriche in sichtbaren Texten (einzelnes „–“ als Platzhalter und „ – “ zwischen Akkorden sind erlaubt)
  const musterJs = lies(basis + '/muster.js'), folgenJs = lies(basis + '/folgen.js');
  const texte = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').split(/<[^>]+>/)
    .concat([...(stimmenJs + appJs + installJs + musterJs + folgenJs).matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map(m => m[1]));
  texte.filter(t => /\S\s+[–—]\s+\S/.test(t)).forEach(t => melde('Gedankenstrich im Text: ' + t.trim().slice(0, 60)));
  // Icons haben die Größe, die das Manifest verspricht
  ObjC.import('AppKit');
  const bild = p => $.NSBitmapImageRep.imageRepWithData($.NSData.dataWithContentsOfFile(p));
  const groesse = p => { const r = bild(p); return r.isNil() ? '?' : r.pixelsWide + 'x' + r.pixelsHigh; };
  manifest.icons.filter(i => /\.png$/.test(i.src)).forEach(i => { const g = groesse(basis + '/' + i.src); if (g !== i.sizes) melde('Icon ' + i.src + ': ' + g + ' statt ' + i.sizes); });
  if (groesse(basis + '/icons/apple-touch-icon.png') !== '180x180') melde('Icon apple-touch-icon.png nicht 180x180');
  // rund mit durchsichtigen Ecken, Maskable und Apple randlos, in der Mitte nicht leer
  const ecke = p => bild(basis + '/icons/' + p).colorAtXY(2, 2).alphaComponent;
  if (ecke('icon-512.png') !== 0 || ecke('icon-192.png') !== 0) melde('Icon: Ecken nicht durchsichtig');
  if (ecke('icon-maskable-512.png') !== 1 || ecke('apple-touch-icon.png') !== 1) melde('Icon: Maskable oder Apple-Icon nicht randlos');
  if (bild(basis + '/icons/icon-512.png').colorAtXY(256, 60).alphaComponent !== 1) melde('Icon: icon-512.png ist leer');
  out.push(dateien.length + ' Dateien für offline, ' + gesucht.length + ' IDs, Texte und Icons geprüft');

  out.push(fehler + ' Fehler');
  return out.join('\n');
}
