// Chords for Beginners: Oberfläche
// Aufbau wie app.js von „Songwriting & Chords“, abgespeckt: elf Folgen, sieben Tonarten, nur Grundgriffe,
// keine Favoriten und keine Filtermenüs. Neu sind die Genre-Hinweise und die Schlag- und Zupfmuster.
(function () {
  'use strict';
  var F = SC_FOLGEN, M = SC_MUSTER;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };
  var unique = function (a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); };
  var GT = SC.GRUNDTOENE;                                    // C D E F G A H
  // „Üben mit“ im Reiter Rhythmus: einzelne Akkorde oder 'folge' = I V vi IV in der leichtesten Tonart
  // des Instruments (Gitarre G D Em C, Ukulele C G Am F)
  var UEBEN = ['C', 'D', 'E', 'F', 'G', 'A', 'H', 'Am', 'Dm', 'Em', 'folge'];

  // ------------------------------------------------------------------ Zustand (bleibt im Browser gespeichert)
  var S = {
    instrument: 'gitarre', tab: 'folgen',
    sammlung: 'alle', grundton: 0, tempo: 80, schleife: false, muster: M.STANDARD,
    tGrundton: 0, tAus: {},
    aGrundton: 0, aTyp: '',
    rAkkord: 'C',
    stInst: 'gitarre', stGit: 'standard', stUke: 'standard', kammerton: 440,
    installZu: false,   // Hinweis zum Installieren geschlossen
  };
  try {
    var gespeichert = JSON.parse(localStorage.getItem('cfb-zustand') || '{}');
    Object.keys(S).forEach(function (k) {
      var v = gespeichert[k];
      if (v === null || v === undefined || typeof v !== typeof S[k] || Array.isArray(v) || (typeof v === 'number' && !isFinite(v))) return;
      S[k] = v;
    });
  } catch (e) { /* ohne Speicher geht es auch */ }
  // nur gültige Werte übernehmen, sonst Grundeinstellung
  function nurAus(k, liste) { if (liste.indexOf(S[k]) < 0) S[k] = liste[0]; }
  function ganzzahl(k, min, max, std) { S[k] = Math.round(S[k]); if (!(S[k] >= min && S[k] <= max)) S[k] = std; }
  nurAus('instrument', ['gitarre', 'ukulele']);
  nurAus('tab', ['folgen', 'tonart', 'akkord', 'rhythmus']);
  nurAus('sammlung', ['alle', 'eigene']);
  ['grundton', 'tGrundton', 'aGrundton'].forEach(function (k) { nurAus(k, GT); });
  nurAus('aTyp', ['', 'm', '7', 'm7']);
  if (S.rAkkord === 'C G Am F') S.rAkkord = 'folge';   // ältere Fassung
  nurAus('rAkkord', UEBEN);
  if (!M.muster(S.muster)) S.muster = M.STANDARD;
  ganzzahl('tempo', 50, 160, 80);
  function speichern() { try { localStorage.setItem('cfb-zustand', JSON.stringify(S)); } catch (e) { /* egal */ } }

  // ------------------------------------------------------------------ eigene Akkordfolgen
  // Gespeichert als Stufen in Dur, Format wie in „Songwriting & Chords“ (format: 1). Erlaubt sind nur
  // die Stufen dieser App: I ii iii IV V vi und die Septakkorde I7 IV7 V7 ii7 iii7 vi7.
  var EIGENE_KEY = 'cfb-eigene';
  var ERLAUBT = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'I7', 'ii7', 'iii7', 'IV7', 'V7', 'vi7'];
  var PALETTE = { leiter: ['I', 'ii', 'iii', 'IV', 'V', 'vi'], sieben: ['I7', 'IV7', 'V7', 'ii7', 'iii7', 'vi7'] };
  function pruefeFolge(f) {
    if (!f || typeof f.id !== 'string' || !Array.isArray(f.stufen) || !f.stufen.length || f.ton !== 'dur') return null;
    var stufen = f.stufen.map(String).slice(0, 64);
    if (!stufen.every(function (s) { return ERLAUBT.indexOf(s) >= 0; })) return null;
    var gt = +(f.eingabe && f.eingabe.grundton);
    var id = f.id.slice(0, 40);
    // eigene Folgen dürfen keine Katalog-Folge verdecken (zum Beispiel eine importierte Folge mit der ID „happy“)
    if (F.folgen.some(function (x) { return x.id === id; })) id = 'eigen-' + id;
    var o = {
      id: id, titel: String(f.titel || 'Eigene Akkordfolge').slice(0, 60), stufen: stufen, ton: 'dur',
      genres: [], stimmung: [], notiz: String(f.notiz || '').slice(0, 300), takt: f.takt === 2 ? 2 : 4, eigen: true, quelle: 'Eigene Akkordfolge',
      eingabe: { grundton: GT.indexOf(gt) >= 0 ? gt : 0 },
    };
    return o;
  }
  var eigene = [];
  try { eigene = (JSON.parse(localStorage.getItem(EIGENE_KEY) || '[]') || []).map(pruefeFolge).filter(Boolean); } catch (e) { eigene = []; }
  function eigeneSpeichern() {
    try { localStorage.setItem(EIGENE_KEY, JSON.stringify(eigene)); return true; } catch (e) {
      alert('Speichern hat nicht geklappt. Ist der private Modus an? Dann bleibt die Folge nur bis zum Schließen erhalten.');
      return false;
    }
  }
  function alleFolgen() { return eigene.concat(F.folgen); }
  function folge(id) { return alleFolgen().find(function (f) { return f.id === id; }); }

  // ------------------------------------------------------------------ Hilfen
  function segment(el, wert, onChange) {
    el.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.wert === String(wert)));
      b.onclick = function () { onChange(b.dataset.wert); };
    });
  }
  function tonartSegment(el) {
    el.innerHTML = GT.map(function (pc) { return '<button type="button" role="radio" data-wert="' + pc + '">' + SC.PC_NAME[pc] + '</button>'; }).join('');
  }
  function optionen(sel, liste, wert) {
    sel.innerHTML = liste.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('');
    sel.value = String(wert);
  }
  // Die leichteste Tonart für Einsteiger: auf der Gitarre G-Dur, auf der Ukulele C-Dur
  var LEICHT = { gitarre: 7, ukulele: 0 };
  function instName() { return S.instrument === 'gitarre' ? 'Gitarre' : 'Ukulele'; }
  function leichtText() { return SC.key(LEICHT[S.instrument]).name + ' ist auf der ' + instName() + ' am leichtesten'; }
  function grundtonOpt() {
    return GT.map(function (pc) { return [String(pc), SC.key(pc).name + (pc === LEICHT[S.instrument] ? ' · am leichtesten' : '')]; });
  }
  // Erklärung zum Kapo: Die App hat keinen (für Anfänger unnötig), erklärt aber, wofür man ihn nimmt.
  // Beispiel mit den Griffen der leichtesten Tonart und Kapo im 2. Bund.
  function kapoTipp() {
    var k = SC.key(LEICHT[S.instrument]), hoch = SC.key(LEICHT[S.instrument] + 2), st = ['I', 'V', 'vi', 'IV'];
    var name = function (key) { return function (s) { return SC.stufeZuAkkord(s, key); }; };
    return '<details class="kapo-tipp"><summary>Was macht ein Kapo?</summary>' +
      '<p>Ein Kapo ist eine Klemme, die du quer über alle Saiten direkt hinter einen Bund setzt. Die Saiten werden kürzer und klingen höher, deine Griffe bleiben gleich. ' +
      'So spielst du mit den leichten Griffen aus ' + esc(k.name) + ' auch in anderen Tonarten, etwa passend zu deiner Stimme oder zu einem Song.</p>' +
      '<p>Beispiel mit Kapo im 2. Bund: Du greifst ' + esc(st.map(name(k)).join(', ')) + ', es klingt wie ' + esc(st.map(name(hoch)).join(', ')) +
      ', also wie in ' + esc(hoch.name) + '. Jeder Bund macht alles einen Halbton höher.</p></details>';
  }
  // Knopf der leichtesten Tonart mit grünem Punkt, darunter ein Satz dazu
  function markiereLeicht(el, hinweis) {
    el.querySelectorAll('button').forEach(function (b) {
      var ja = +b.dataset.wert === LEICHT[S.instrument];
      b.classList.toggle('leicht', ja);
      b.setAttribute('aria-label', SC.key(+b.dataset.wert).name + (ja ? ', am leichtesten auf der ' + instName() : ''));
      b.title = ja ? 'am leichtesten auf der ' + instName() : '';
    });
    if (hinweis) hinweis.innerHTML = '<i class="leicht-punkt" aria-hidden="true"></i>' + esc(leichtText());
  }
  var ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>';
  var ICON_STOP = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3.5" width="9" height="9" rx="1.5"/></svg>';
  var ICON_TON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3.5v11L5 10H2z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  var LEGENDE = function () { return '<p class="leise klein-text" style="margin-top:12px">Saiten von links: ' + SC.SAITEN[S.instrument] + ' · x = nicht spielen · o = leere Saite · Zahl links = Bund · Griffbild antippen zum Anhören</p>'; };

  function griff(name) { return SC.grundgriff(S.instrument, name); }
  function fretAttr(f) { return f.map(function (x) { return x === null ? 'x' : x; }).join(','); }

  // Ein Griffbild mit Name, Griffschrift und Herkunft
  function griffHtml(name, v, opts) {
    opts = opts || {};
    if (!v) return '<div class="griff"><div class="griff-name">' + esc(name) + '</div><p class="leise">kein Griff gefunden</p></div>';
    var h = '<div class="griff' + (SC.imBereich(name) ? '' : ' fremd') + '">';
    h += '<div class="griff-name">' + esc(name) + (opts.klingt ? '<span class="klingt">klingt als ' + esc(opts.klingt) + '</span>' : '') + '</div>';
    h += '<button type="button" class="griff-bild" data-spiel="' + fretAttr(v.f) + '" title="Anhören">' + SC.svg(v.f, { label: name }) + '</button>';
    h += '<div class="griff-tab">' + SC.fs(v.f) + '</div>';
    h += '<div class="griff-quelle">' + (opts.stufe ? '<span class="roem">' + esc(opts.stufe) + '</span> · ' : '') + esc(v.q) + '</div>';
    return h + '</div>';
  }
  function spieleString(s) {
    SC.Klang.anschlag(s.split(',').map(function (x) { return x === 'x' ? null : parseInt(x, 10); }), S.instrument, 0);
  }
  function griffKlick(e) {
    var b = e.target.closest('[data-spiel]');
    if (b) { spieleString(b.dataset.spiel); return true; }
    return false;
  }
  // Hinweis für Akkorde außerhalb der 28
  // tonartKnopf: auf der Seite einer Folge den Wechsel in die leichteste Tonart anbieten
  function fremdHinweis(namen, tonartKnopf) {
    var fremd = unique(namen.filter(function (n) { return !SC.imBereich(n); }));
    if (!fremd.length) return '';
    return '<p class="hinweis">' + esc(fremd.join(', ')) + (fremd.length === 1 ? ' gehört' : ' gehören') +
      ' nicht zu den ' + (GT.length * 4) + ' Akkorden dieser App. Du siehst ' + (fremd.length === 1 ? 'ihn' : 'sie') + ' hier mit dem einfachsten Griff, oft ist das ein Barré.' +
      (tonartKnopf && S.grundton !== LEICHT[S.instrument] ? ' Leichter geht es in ' + esc(SC.key(LEICHT[S.instrument]).name) + '. <button type="button" class="link-knopf" data-leicht>übernehmen</button>' : '') + '</p>';
  }

  // ------------------------------------------------------------------ Schreibweise der Muster
  function schriftHtml(m, zeile) {
    var s = M.schritte(m), z = M.zaehlzeiten(m);
    return '<div class="schrift' + (m.takt === 3 ? ' drei' : '') + '" data-muster-zeile="' + esc(zeile) + '" role="img" aria-label="' + esc(m.name + ': ' + M.schrift(m)) + '">' +
      s.map(function (c, i) {
        return '<span class="schlag' + (c === '-' ? ' pause' : '') + (i % 2 ? ' und' : '') + '" data-schlag="' + i + '"><b>' + esc(M.zeichen(c)) + '</b><small>' + z[i] + '</small></span>';
      }).join('') + '</div>';
  }

  // ------------------------------------------------------------------ Kopf, Tabs, Thema
  function istDunkel() {
    var t = document.documentElement.dataset.theme;
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function themaFarbe() {
    if (!document.documentElement.dataset.theme) return;
    var farbe = istDunkel() ? '#14161b' : '#f5f3ee';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', farbe); });
  }
  $('#thema').onclick = function () {
    var dunkel = !istDunkel();
    document.documentElement.dataset.theme = dunkel ? 'dark' : 'light';
    try { localStorage.setItem('cfb-thema', dunkel ? 'dunkel' : 'hell'); } catch (e) { /* egal */ }
    themaFarbe();
  };
  themaFarbe();

  function renderKopf() {
    segment($('#instrument'), S.instrument, function (w) { S.instrument = w; stoppen(); speichern(); alles(); });
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.tab === S.tab));
      b.onclick = function () { S.tab = b.dataset.tab; stoppen(); speichern(); renderKopf(); renderTab(); window.scrollTo(0, 0); };
    });
    ['folgen', 'tonart', 'akkord', 'rhythmus'].forEach(function (t) { $('#tab-' + t).hidden = S.tab !== t; });
  }

  // ------------------------------------------------------------------ Ansichten im Reiter Akkordfolgen: Liste, Detail, Editor
  var V = { ansicht: 'liste', id: null, editor: null };
  function oeffneDetail(id) {
    stoppen();
    V.ansicht = 'detail'; V.id = id;
    try { history.pushState({ sc: 'detail', id: id }, ''); } catch (e) { /* file:// in alten Browsern */ }
    zeigeAnsicht(); window.scrollTo(0, 0);
  }
  function oeffneEditor(vorlage) {
    stoppen();
    V.editor = editorStart(vorlage);
    V.ansicht = 'editor';
    try { history.pushState({ sc: 'editor' }, ''); } catch (e) { /* egal */ }
    zeigeAnsicht(); window.scrollTo(0, 0);
  }
  function zurueck() {
    if (history.state && history.state.sc) history.back();
    else { V.ansicht = 'liste'; zeigeAnsicht(); }
  }
  window.addEventListener('popstate', function (e) {
    if (SC_STIMMEN.popstate(e.state)) return;   // Stimmgerät öffnen oder schließen
    stoppen();
    var st = e.state;
    if (st && st.sc === 'detail' && folge(st.id)) { V.ansicht = 'detail'; V.id = st.id; }
    else if (st && st.sc === 'editor' && V.editor) V.ansicht = 'editor';
    else V.ansicht = 'liste';
    if (S.tab !== 'folgen') { S.tab = 'folgen'; renderKopf(); }
    zeigeAnsicht(); window.scrollTo(0, 0);
  });
  function zeigeAnsicht() {
    $('#folgen-liste-ansicht').hidden = V.ansicht !== 'liste';
    $('#folgen-detail-ansicht').hidden = V.ansicht !== 'detail';
    $('#folgen-editor-ansicht').hidden = V.ansicht !== 'editor';
    // versteckte Ansichten leeren, damit keine alten Knöpfe im Dokument hängen bleiben
    if (V.ansicht !== 'detail') $('#folgen-detail-ansicht').innerHTML = '';
    if (V.ansicht !== 'editor') $('#folgen-editor-ansicht').innerHTML = '';
    if (V.ansicht === 'detail') renderDetail();
    else if (V.ansicht === 'editor') renderEditor();
    else renderFolgen();
  }

  // ------------------------------------------------------------------ Liste
  function karteHtml(f) {
    var t = F.tonart(f, S.grundton);
    return '<article class="folge-karte" data-id="' + esc(f.id) + '" tabindex="0" role="button" aria-label="' + esc(f.titel) + ' öffnen">' +
      '<div class="fk-kopf"><span class="fk-titel">' + esc(f.titel) + '</span><span class="fk-tonart">' + esc(t.heim.name) + '</span></div>' +
      '<div class="fk-akkorde">' + esc(f.zeilen ? unique(F.akkorde(f, S.grundton)).join(' · ') : F.akkorde(f, S.grundton).join(' – ')) + '</div>' +
      '<div class="fk-stufen">' + esc(f.zeilen ? 'Schema mit ' + f.stufen.length + ' Takten' : F.stufenText(f)) + '</div>' +
      '<div class="tags">' + (f.eigen ? '<span class="tag eigen">eigene</span>' : '') +
      f.stimmung.map(function (s) { return '<span class="tag st">' + esc(s) + '</span>'; }).join('') + '</div>' +
      '</article>';
  }
  function renderFolgen() {
    segment($('#f-sammlung'), S.sammlung, function (w) { S.sammlung = w; speichern(); renderFolgen(); });
    segment($('#f-grundton'), S.grundton, function (w) { S.grundton = +w; speichern(); renderFolgen(); });
    markiereLeicht($('#f-grundton'), $('#f-leicht'));
    var liste = S.sammlung === 'eigene' ? eigene : alleFolgen();
    $('#treffer').textContent = liste.length === 1 ? '1 Akkordfolge' : liste.length + ' Akkordfolgen';
    $('#eigene-werkzeuge').innerHTML = S.sammlung === 'eigene'
      ? '<div class="karte werkzeuge"><p>Deine eigenen Akkordfolgen bleiben auf diesem Gerät. Zum Sichern oder für ein anderes Gerät kannst du sie als Datei weitergeben.</p>' +
        '<div class="liste-aktionen"><button type="button" class="knopf zweit klein" id="exportieren"' + (eigene.length ? '' : ' disabled') + '>Exportieren</button>' +
        '<button type="button" class="knopf zweit klein" id="importieren">Importieren</button></div></div>'
      : '';
    $('#liste').innerHTML = liste.map(karteHtml).join('') ||
      '<div class="leer karte">Noch keine eigenen Akkordfolgen. <button type="button" class="link-knopf" data-neu>Leg deine erste an</button>.</div>';
  }
  $('#liste').addEventListener('click', function (e) {
    if (e.target.closest('[data-neu]')) { oeffneEditor(null); return; }
    var k = e.target.closest('.folge-karte');
    if (k) oeffneDetail(k.dataset.id);
  });
  $('#liste').addEventListener('keydown', function (e) {
    var k = e.target.closest('.folge-karte');
    if (k && e.target === k && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); oeffneDetail(k.dataset.id); }
  });
  $('#f-neu').onclick = function () { oeffneEditor(null); };
  $('#eigene-werkzeuge').addEventListener('click', function (e) {
    if (e.target.closest('#exportieren')) exportieren();
    if (e.target.closest('#importieren')) $('#import-datei').click();
  });

  // ------------------------------------------------------------------ Export und Import der eigenen Folgen
  function exportieren() {
    var daten = { app: 'Chords for Beginners', format: 1, exportiert: new Date().toISOString(), eigene: eigene };
    var text = JSON.stringify(daten, null, 1), name = 'chords-for-beginners-eigene.json';
    var datei = null;
    try { datei = new File([text], name, { type: 'application/json' }); } catch (e) { /* alte Browser */ }
    if (datei && navigator.canShare && navigator.canShare({ files: [datei] })) {
      navigator.share({ files: [datei], title: 'Eigene Akkordfolgen' }).catch(function () { /* abgebrochen */ });
      return;
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  // liest eine Export-Datei, gibt die Zahlen für die Meldung zurück (auch für Tests ohne Datei)
  function importiere(text) {
    var neu = 0, doppelt = 0, fehler = 0, daten;
    try { daten = JSON.parse(text); } catch (e) { daten = null; }
    if (!daten || typeof daten !== 'object' || Array.isArray(daten) || !Array.isArray(daten.eigene)) return null;
    daten.eigene.forEach(function (f) {
      var p = pruefeFolge(f);
      if (!p) { fehler++; return; }
      if (eigene.some(function (x) { return x.id === p.id; })) { doppelt++; return; }
      eigene.push(p); neu++;
    });
    S.sammlung = 'eigene';
    eigeneSpeichern(); speichern();
    if (S.tab === 'folgen') { V.ansicht = 'liste'; zeigeAnsicht(); }
    return { neu: neu, doppelt: doppelt, fehler: fehler };
  }
  $('#import-datei').addEventListener('change', function () {
    var datei = this.files && this.files[0];
    this.value = '';
    if (!datei) return;
    var r = new FileReader();
    r.onload = function () {
      var x = importiere(r.result);
      if (!x) { alert('Die Datei ist keine gültige Export-Datei.'); return; }
      alert(x.neu + (x.neu === 1 ? ' Akkordfolge' : ' Akkordfolgen') + ' importiert' +
        (x.doppelt ? ', ' + x.doppelt + (x.doppelt === 1 ? ' war' : ' waren') + ' schon da' : '') +
        (x.fehler ? ', ' + x.fehler + ' ' + (x.fehler === 1 ? 'passt' : 'passen') + ' nicht in diese App (nur Dur mit den Stufen I bis vi)' : '') + '.');
    };
    r.readAsText(datei);
  });

  // ------------------------------------------------------------------ Detail

  function renderDetail() {
    var f = folge(V.id);
    var el = $('#folgen-detail-ansicht');
    if (!f) { V.ansicht = 'liste'; zeigeAnsicht(); return; }
    var t = F.tonart(f, S.grundton);
    var klang = F.akkorde(f, S.grundton);
    var inst = S.instrument === 'gitarre' ? 'Gitarre' : 'Ukulele';
    var m = M.muster(S.muster);

    var h = '<div class="ansicht-kopf"><button type="button" class="zurueck" data-zurueck>‹ Zurück</button>' +
      '<div class="aktionen">' + (f.eigen
        ? '<button type="button" class="knopf zweit klein" data-bearbeiten>Bearbeiten</button><button type="button" class="knopf zweit klein gefahr" data-loeschen>Löschen</button>'
        : '<button type="button" class="knopf zweit klein" data-kopieren>Als eigene bearbeiten</button>') +
      '</div></div>';

    h += '<div class="karte detail">';
    h += '<div class="detail-kopf"><div><h2>' + esc(f.titel) + '</h2><div class="sub">in ' + esc(t.heim.name) + (f.eigen ? ' · eigene Akkordfolge' : '') + '</div></div>' +
      '<div class="detail-wahl"><label class="feld"><span>Tonart</span><select id="d-grundton"></select></label></div></div>';
    if (f.eigen && f.notiz) h += '<p class="info"><b>Notiz:</b> ' + esc(f.notiz) + '</p>';
    h += '<div class="tags" style="margin-top:8px">' + (f.eigen ? '<span class="tag eigen">eigene</span>' : '') +
      f.stimmung.map(function (s) { return '<span class="tag st">' + esc(s) + '</span>'; }).join('') + '</div>';

    h += '<div class="sequenz' + (f.zeilen ? ' zeilen' : '') + '">';
    klang.forEach(function (a, i) {
      h += '<button type="button" class="seq-akkord" data-seq="' + i + '"><b>' + esc(a) + '</b><small>' + esc(f.stufen[i]) + '</small></button>';
    });
    h += '</div>';
    h += '<p class="leise klein-text">Stufen: ' + esc(F.stufenText(f)) + '</p>';
    if (f.hinweis) h += '<p class="hinweis">' + esc(f.hinweis) + '</p>';
    if (f.genre) h += '<div class="genre-box"><h3>Wo du sie hörst</h3><p>' + esc(f.genre) + '</p><p class="leise klein-text">Songbeispiele nach ' + esc(f.quelle) + '</p></div>';

    // Rhythmus: Muster wählen, ansehen, abspielen
    h += '<div class="rhythmus-block"><div class="griffe-kopf"><h3>Rhythmus</h3>' +
      '<label class="feld muster-wahl"><span>Muster</span><select id="d-muster"></select></label></div>';
    h += schriftHtml(m, 'detail');
    h += '<p class="leise klein-text">' + esc(m.text) + ' <button type="button" class="link-knopf" data-zum-rhythmus>Mehr zu den Mustern</button></p>';
    h += '<div class="spieler"><button type="button" class="knopf" id="abspielen"></button>' +
      '<label>Tempo <input type="range" id="tempo" min="50" max="160" step="5" value="' + S.tempo + '"><span id="tempo-wert">' + S.tempo + ' BPM</span></label>' +
      '<label><input type="checkbox" id="schleife"' + (S.schleife ? ' checked' : '') + '> Schleife</label></div></div>';

    var namen = unique(klang);
    h += '<div class="griffe-kopf"><h3>Griffe für ' + inst + '</h3></div>';
    h += '<div class="griffe">' + namen.map(function (n) { return griffHtml(n, griff(n)); }).join('') + '</div>';
    h += fremdHinweis(namen, true);
    h += kapoTipp();
    h += LEGENDE();
    h += '</div>';
    el.innerHTML = h;

    optionen($('#d-grundton'), grundtonOpt(), S.grundton);
    optionen($('#d-muster'), M.MUSTER.map(function (x) { return [x.id, x.name]; }), S.muster);
    $('#d-grundton').onchange = function () { S.grundton = +this.value; stoppen(); speichern(); renderDetail(); };
    $('#d-muster').onchange = function () { S.muster = this.value; stoppen(); speichern(); renderDetail(); };
    $('#abspielen').onclick = function () { if (spiel.an && spiel.o.knopf === 'abspielen') stoppen(); else spielen(f); };
    $('#tempo').oninput = function () { S.tempo = +this.value; $('#tempo-wert').textContent = S.tempo + ' BPM'; speichern(); };
    $('#schleife').onchange = function () { S.schleife = this.checked; speichern(); };
    knoepfe();
  }

  $('#folgen-detail-ansicht').addEventListener('click', function (e) {
    var b, f = folge(V.id);
    if (!f) return;
    if (e.target.closest('[data-zurueck]')) { zurueck(); return; }
    if (e.target.closest('[data-bearbeiten]')) { oeffneEditor(f); return; }
    if (e.target.closest('[data-kopieren]')) { oeffneEditor(f); return; }
    if (e.target.closest('[data-zum-rhythmus]')) { stoppen(); S.tab = 'rhythmus'; speichern(); renderKopf(); renderTab(); window.scrollTo(0, 0); return; }
    if (e.target.closest('[data-loeschen]')) {
      if (!confirm('„' + f.titel + '“ löschen? Das lässt sich nicht rückgängig machen.')) return;
      eigene = eigene.filter(function (x) { return x.id !== f.id; });
      eigeneSpeichern();
      zurueck();
      return;
    }
    if (e.target.closest('[data-leicht]')) { S.grundton = LEICHT[S.instrument]; stoppen(); speichern(); renderDetail(); return; }
    if ((b = e.target.closest('[data-seq]'))) {
      var g = griff(F.akkorde(f, S.grundton)[+b.dataset.seq]);
      if (g) SC.Klang.anschlag(g.f, S.instrument, 0);
      return;
    }
    griffKlick(e);
  });

  // ------------------------------------------------------------------ Abspielen mit Schlag- oder Zupfmuster
  // Jeder Akkord bekommt einen Takt des Musters (bei eigenen Folgen mit 2 Schlägen pro Akkord den halben).
  // Geplant wird mit der Uhr der Klangausgabe, angezeigt per requestAnimationFrame, solange es spielt.
  var spiel = { an: false, timer: 0, raf: 0, i: 0, zeit: 0, plan: [], o: {}, zeigt: '', vorher: null };
  function markiere(i) {
    document.querySelectorAll('.seq-akkord[data-seq]').forEach(function (x) { x.classList.toggle('spielt', spiel.o.seq === true && +x.dataset.seq === i); });
  }
  function markiereSchlag(k) {
    document.querySelectorAll('[data-muster-zeile] .schlag').forEach(function (x) {
      x.classList.toggle('jetzt', k >= 0 && x.parentNode.dataset.musterZeile === spiel.o.zeile && +x.dataset.schlag === k);
    });
  }
  function knoepfe() {
    var b = $('#abspielen'), an = function (id) { return spiel.an && spiel.o.knopf === id; };
    if (b) { b.innerHTML = an('abspielen') ? ICON_STOP + 'Stopp' : ICON_PLAY + 'Abspielen'; b.setAttribute('aria-pressed', String(an('abspielen'))); }
    b = $('#e-anhoeren');
    if (b) b.textContent = an('e-anhoeren') ? '■ stopp' : '▶ anhören';
    document.querySelectorAll('[data-r-spiel]').forEach(function (x) {
      var ja = an('r-' + x.dataset.rSpiel);
      x.innerHTML = ja ? ICON_STOP + 'Stopp' : ICON_PLAY + 'Anhören';
      x.setAttribute('aria-pressed', String(ja));
    });
  }
  // griffe: Liste von Grundgriffen (oder null), o: { muster, beats, zeile, knopf, seq, schleife }
  function spielSequenz(griffe, o) {
    stoppen();
    if (!SC.Klang.init()) { alert('Dein Browser kann leider keinen Ton abspielen.'); return; }
    var inst = S.instrument, schr = M.schritte(o.muster);
    var n = o.muster.takt === 3 ? schr.length : Math.min(schr.length, (o.beats || 4) * 2);
    spiel.an = true; spiel.i = 0; spiel.plan = []; spiel.o = o; spiel.zeigt = ''; spiel.vorher = null;
    spiel.zeit = SC.Klang.zeit() + 0.08;
    knoepfe();
    (function tick() {
      if (!spiel.an) return;
      if (spiel.i >= griffe.length) {
        if (!(o.schleife !== undefined ? o.schleife : S.schleife)) {
          spiel.timer = setTimeout(stoppen, Math.max(0, spiel.zeit - SC.Klang.zeit()) * 1000 + 250);
          return;
        }
        spiel.i = 0;
      }
      var achtel = 30 / S.tempo, t0 = Math.max(spiel.zeit, SC.Klang.zeit() + 0.02), v = griffe[spiel.i];
      if (v && spiel.vorher && SC.fs(v.f) !== SC.fs(spiel.vorher.f)) SC.Klang.daempfen(t0);   // neuer Akkord: alter verklingt
      spiel.vorher = v;
      for (var k = 0; k < n; k++) {
        var x = v && M.ton(schr[k], v.f, inst, k === 0);
        if (x) SC.Klang.anschlag(x.f, inst, 0, t0 + k * achtel, x.laut, x.auf);
      }
      spiel.plan.push({ t: t0, akkord: spiel.i, achtel: achtel, n: n });
      spiel.i++;
      spiel.zeit = t0 + n * achtel;
      spiel.timer = setTimeout(tick, Math.max(0, spiel.zeit - SC.Klang.zeit() - 0.15) * 1000);   // kurz vor Ende den nächsten Takt planen
    })();
    anzeige();
  }
  function anzeige() {
    if (!spiel.an) return;
    spiel.raf = requestAnimationFrame(anzeige);
    var jetzt = SC.Klang.zeit();
    while (spiel.plan.length > 1 && spiel.plan[1].t <= jetzt) spiel.plan.shift();
    var p = spiel.plan[0];
    if (!p || jetzt < p.t) return;
    var k = Math.min(p.n - 1, Math.floor((jetzt - p.t) / p.achtel)), z = p.akkord + ':' + k;
    if (z === spiel.zeigt) return;
    spiel.zeigt = z;
    markiere(p.akkord);
    markiereSchlag(k);
  }
  function spielen(f) {
    spielSequenz(F.akkorde(f, S.grundton).map(griff), { muster: M.muster(S.muster), beats: f.takt || 4, zeile: 'detail', knopf: 'abspielen', seq: true });
  }
  function stoppen() {
    var war = spiel.an;
    spiel.an = false;
    clearTimeout(spiel.timer);
    cancelAnimationFrame(spiel.raf);
    spiel.plan = []; spiel.zeigt = '';
    SC.Klang.stopp();
    if (war) { markiere(-1); markiereSchlag(-1); }
    knoepfe();
  }

  // ------------------------------------------------------------------ Editor für eigene Folgen
  function editorStart(vorlage) {
    var e = { id: null, titel: '', grundton: S.grundton, text: '', notiz: '', takt: 4 };
    if (vorlage) {
      var gt = vorlage.eigen ? vorlage.eingabe.grundton : S.grundton;
      e.grundton = gt;
      e.text = F.akkorde(vorlage, gt).join(' ');
      e.takt = vorlage.takt === 2 ? 2 : 4;
      if (vorlage.eigen) { e.id = vorlage.id; e.titel = vorlage.titel; e.notiz = vorlage.notiz || ''; }
      else { e.titel = vorlage.titel + ' (eigene)'; e.notiz = 'nach „' + vorlage.titel + '“ (' + vorlage.stimmung.join(', ') + ')'; }
    }
    return e;
  }
  function editorKey() { return SC.key(V.editor.grundton); }

  // Eingabe wie „C G Am F“, „Fis h E7“ oder „I V vi IV“ lesen
  function normAkkordEingabe(t) {
    var m = t.match(/^([A-Ha-h])(is|es|s(?!us)|#|♭|b)?([^/]*)$/);
    if (!m) return null;
    var L = m[1].toUpperCase(), endung = m[2];
    var acc = !endung ? '' : ((endung === 'is' || endung === '#') ? '#' : '♭');
    var ton = L === 'B' ? (acc === '#' ? 'C' : 'B♭') : L + acc;     // deutsches B ist B♭
    // Kleinbuchstabe ohne Zusatz heißt Moll (deutsche Schreibweise: a = a-Moll)
    var typ = (m[3] || '').replace(/^-?moll$/i, 'm').replace(/^-?dur$/i, '').replace(/^(min|mi|-)(?=$|7)/, 'm').replace(/^-?moll7$/i, 'm7');
    if (m[1] === m[1].toLowerCase() && typ === '') typ = 'm';
    return ton + typ;
  }
  // r: { roh, stufe, name } oder { roh, fehler: 'unbekannt' | 'fremd' }
  function parseEingabe(text, k) {
    return text.split(/[\s,;|–—→]+/).filter(Boolean).map(function (roh) {
      var r = { roh: roh }, st = null;
      try {
        if (/^[♭b#]?[IViv]/.test(roh)) { st = roh.replace(/^b/, '♭'); SC.stufeZuAkkord(st, k); }
        else {
          var name = normAkkordEingabe(roh), a = name && SC.parseAkkord(name);
          if (/^[A-Ha-h](is|es|#|♭|b)?[^/]*\/[A-Ha-h]/.test(roh)) st = 'fremd';   // Slash-Akkorde wie C/E gibt es hier nicht
          else if (a && !SC.TYPES.hasOwnProperty(a.typ) && /^(maj7|6|m6|9|m9|sus2|sus4|add9|°7?|\+|5|m7♭5)$/.test(a.typ)) st = 'fremd';   // Akkordart gibt es hier nicht
          else st = name && SC.akkordZuStufe(name, k);
        }
      } catch (e) { st = null; }
      if (st === 'fremd') r.fehler = 'fremd';
      else if (!st) r.fehler = 'unbekannt';
      else if (ERLAUBT.indexOf(st) < 0) r.fehler = 'fremd';
      else { r.stufe = st; r.name = SC.stufeZuAkkord(st, k); }
      return r;
    });
  }
  function erlaubtText(k) {
    var n = function (s) { return SC.stufeZuAkkord(s, k); };
    return 'Hier gibt es die Stufen I, ii, iii, IV, V und vi, in ' + k.name + ' also ' + PALETTE.leiter.map(n).join(', ') +
      ', dazu die Septakkorde ' + PALETTE.sieben.map(n).join(', ') + '.';
  }

  function renderEditor() {
    var E = V.editor, el = $('#folgen-editor-ansicht');
    var h = '<div class="ansicht-kopf"><button type="button" class="zurueck" data-zurueck>‹ Abbrechen</button>' +
      '<h2 class="ansicht-titel">' + (E.id ? 'Akkordfolge bearbeiten' : 'Neue eigene Akkordfolge') + '</h2></div>';
    h += '<div class="karte editor">';
    h += '<div class="filter innen">' +
      '<label class="feld breit"><span>Name</span><input id="e-titel" type="text" maxlength="60" placeholder="z. B. Strophe Sommerlied" value="' + esc(E.titel) + '"></label>' +
      '<div class="feld"><span>Tonart</span><div class="segment klein" id="e-grundton" role="radiogroup" aria-label="Tonart"></div></div>' +
      '</div>';
    h += '<label class="feld breit"><span>Akkorde</span><input id="e-akkorde" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ' +
      'placeholder="Akkorde oder Stufen, z. B. C G Am F oder I V vi IV" value="' + esc(E.text) + '"></label>';
    h += '<p class="leise klein-text">Tippen oder unten antippen. Erlaubt sind Akkorde (C, Am, G7, Em7, auch deutsch wie a oder Fis) und Stufen (I, vi, V7). Wechselst du die Tonart, wandern die Akkorde mit.</p>';
    h += '<div id="e-vorschau" class="sequenz"></div>';
    h += '<div class="feld breit"><span>Antippen zum Hinzufügen</span>' +
      '<div id="e-palette" class="palette"></div>' +
      '<div class="chips"><button type="button" class="chip" data-e="letzter">⌫ letzten entfernen</button><button type="button" class="chip" data-e="leeren">alle entfernen</button>' +
      '<button type="button" class="chip" data-e="anhoeren" id="e-anhoeren">▶ anhören</button></div></div>';
    h += '<div class="filter innen"><div class="feld"><span>Schläge pro Akkord</span><div class="segment klein" id="e-takt"><button type="button" data-wert="2">2</button><button type="button" data-wert="4">4</button></div></div>' +
      '<label class="feld breit"><span>Notiz (optional)</span><textarea id="e-notiz" rows="2" maxlength="300" placeholder="Idee, Text, Rhythmus ...">' + esc(E.notiz) + '</textarea></label></div>';
    h += '<p id="e-fehler" class="hinweis warm" hidden></p>';
    h += '<div class="editor-knoepfe"><button type="button" class="knopf" data-e="speichern">Speichern</button><button type="button" class="knopf zweit" data-zurueck>Abbrechen</button>' +
      (E.id ? '<button type="button" class="link-knopf gefahr" data-e="loeschen">Löschen</button>' : '') + '</div>';
    h += '</div>';
    el.innerHTML = h;

    tonartSegment($('#e-grundton'));
    $('#e-titel').oninput = function () { E.titel = this.value; };
    $('#e-notiz').oninput = function () { E.notiz = this.value; };
    $('#e-akkorde').oninput = function () { E.text = this.value; editorVorschau(); };
    editorAktualisieren();
  }
  function editorAktualisieren() {
    var E = V.editor;
    segment($('#e-grundton'), E.grundton, function (w) {
      // Akkorde wandern mit: Stufen behalten, in der neuen Tonart neu benennen
      var alt = parseEingabe(E.text, editorKey());
      E.grundton = +w;
      var k = editorKey();
      E.text = alt.map(function (r) { return r.stufe ? SC.stufeZuAkkord(r.stufe, k) : r.roh; }).join(' ');
      $('#e-akkorde').value = E.text;
      editorAktualisieren();
    });
    markiereLeicht($('#e-grundton'));
    segment($('#e-takt'), String(E.takt), function (w) { E.takt = +w; editorAktualisieren(); });
    var k = editorKey();
    function knopf(s) {
      var n = SC.stufeZuAkkord(s, k);
      return '<button type="button" class="pal" data-pal="' + esc(n) + '"><b>' + esc(n) + '</b><small>' + esc(s) + '</small></button>';
    }
    $('#e-palette').innerHTML = '<div class="pal-gruppe"><span class="leise">Akkorde in ' + esc(k.name) + '</span><div class="chips">' + PALETTE.leiter.map(knopf).join('') + '</div></div>' +
      '<div class="pal-gruppe"><span class="leise">Septakkorde</span><div class="chips">' + PALETTE.sieben.map(knopf).join('') + '</div></div>';
    editorVorschau();
  }
  function editorVorschau() {
    var E = V.editor, liste = parseEingabe(E.text, editorKey());
    $('#e-vorschau').innerHTML = liste.length ? liste.map(function (r) {
      return r.fehler
        ? '<span class="seq-akkord fehler"><b>' + esc(r.roh) + '</b><small>' + (r.fehler === 'fremd' ? 'nicht dabei' : 'unbekannt') + '</small></span>'
        : '<button type="button" class="seq-akkord" data-e-spiel="' + esc(r.name) + '"><b>' + esc(r.name) + '</b><small>' + esc(r.stufe) + '</small></button>';
    }).join('') : '<p class="leise">Noch keine Akkorde.</p>';
    return liste;
  }
  $('#folgen-editor-ansicht').addEventListener('click', function (e) {
    var E = V.editor, b;
    if (!E) return;
    if (e.target.closest('[data-zurueck]')) { stoppen(); zurueck(); return; }
    if ((b = e.target.closest('[data-pal]'))) {
      E.text = (E.text.trim() ? E.text.trim() + ' ' : '') + b.dataset.pal;
      $('#e-akkorde').value = E.text; editorVorschau();
      var v = griff(b.dataset.pal);
      if (v) SC.Klang.anschlag(v.f, S.instrument, 0);
      return;
    }
    if ((b = e.target.closest('[data-e-spiel]'))) { var g = griff(b.dataset.eSpiel); if (g) SC.Klang.anschlag(g.f, S.instrument, 0); return; }
    if (!(b = e.target.closest('[data-e]'))) return;
    var aktion = b.dataset.e;
    if (aktion === 'letzter') { E.text = E.text.trim().split(/\s+/).slice(0, -1).join(' '); $('#e-akkorde').value = E.text; editorVorschau(); }
    else if (aktion === 'leeren') { E.text = ''; $('#e-akkorde').value = ''; editorVorschau(); }
    else if (aktion === 'anhoeren') {
      if (spiel.an) { stoppen(); return; }
      var ok = parseEingabe(E.text, editorKey()).filter(function (r) { return !r.fehler; });
      if (!ok.length) return;
      spielSequenz(ok.map(function (r) { return griff(r.name); }), { muster: M.muster(S.muster), beats: E.takt, zeile: '', knopf: 'e-anhoeren', schleife: false });
    }
    else if (aktion === 'speichern') editorSpeichern();
    else if (aktion === 'loeschen') {
      if (!confirm('„' + (E.titel || 'Diese Akkordfolge') + '“ löschen? Das lässt sich nicht rückgängig machen.')) return;
      var id = E.id;
      eigene = eigene.filter(function (x) { return x.id !== id; });
      eigeneSpeichern();
      V.editor = null; V.ansicht = 'liste';
      try { history.replaceState(null, ''); } catch (er) { /* egal */ }
      zeigeAnsicht();
    }
  });
  function editorSpeichern() {
    var E = V.editor, k = editorKey(), liste = parseEingabe(E.text, k), fehlerEl = $('#e-fehler');
    var unbekannt = liste.filter(function (r) { return r.fehler === 'unbekannt'; }), fremd = liste.filter(function (r) { return r.fehler === 'fremd'; });
    var meldung = '';
    if (!liste.length) meldung = 'Gib mindestens einen Akkord ein.';
    else if (unbekannt.length) meldung = 'Diese Eingabe verstehe ich nicht: ' + unbekannt.map(function (r) { return r.roh; }).join(', ') + '. Schreib Akkorde wie C, Am, G7 oder Stufen wie I, vi, V7.';
    else if (fremd.length) meldung = fremd.map(function (r) { return r.roh; }).join(', ') + (fremd.length === 1 ? ' passt' : ' passen') + ' nicht in diese App. ' + erlaubtText(k);
    if (meldung) { fehlerEl.textContent = meldung; fehlerEl.hidden = false; return; }
    fehlerEl.hidden = true;
    var titel = E.titel.trim() || ('Eigene Akkordfolge ' + (eigene.length + 1));
    var obj = pruefeFolge({
      id: E.id || ('eigen-' + Date.now().toString(36)), titel: titel, stufen: liste.map(function (r) { return r.stufe; }), ton: 'dur',
      notiz: E.notiz.trim(), takt: E.takt, eingabe: { grundton: E.grundton },
    });
    if (!obj) { fehlerEl.textContent = 'Die Folge konnte nicht gespeichert werden.'; fehlerEl.hidden = false; return; }
    var war = eigene.findIndex(function (x) { return x.id === obj.id; });
    if (war >= 0) eigene[war] = obj; else eigene.unshift(obj);
    if (!eigeneSpeichern()) return;
    stoppen();
    // Die neue Folge in ihrer eigenen Tonart zeigen
    S.grundton = E.grundton; speichern();
    V.editor = null;
    if (war >= 0 && history.state && history.state.sc === 'editor') {
      history.back();                                       // zurück zur Detailseite, die neu zeichnet
    } else {
      V.ansicht = 'detail'; V.id = obj.id;
      try { history.replaceState({ sc: 'detail', id: obj.id }, ''); } catch (er) { /* egal */ }
      zeigeAnsicht(); window.scrollTo(0, 0);
    }
  }

  // ------------------------------------------------------------------ Griffe einer Tonart
  var T_STUFEN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'V7', 'ii7', 'iii7', 'vi7'];
  tonartSegment($('#t-grundton'));
  function renderTonart() {
    segment($('#t-grundton'), S.tGrundton, function (w) { S.tGrundton = +w; speichern(); renderTonart(); });
    markiereLeicht($('#t-grundton'), $('#t-leicht'));
    var k = SC.key(S.tGrundton);
    $('#t-titel').textContent = k.name;
    $('#t-leiter').textContent = 'Tonleiter: ' + SC.tonleiter(k).join(' ');
    $('#t-akkorde').innerHTML = T_STUFEN.map(function (s) {
      return '<button type="button" class="chip" data-stufe="' + esc(s) + '" aria-pressed="' + !S.tAus[s] + '"><span class="roem">' + esc(s) + '</span>' + esc(SC.stufeZuAkkord(s, k)) + '</button>';
    }).join('');
    var gezeigt = T_STUFEN.filter(function (s) { return !S.tAus[s]; });
    var formen = gezeigt.map(function (s) { return SC.stufeZuAkkord(s, k); });
    var h = gezeigt.map(function (s, i) {
      return griffHtml(formen[i], griff(formen[i]), { stufe: s });
    }).join('');
    $('#t-griffe').innerHTML = h
      ? '<div class="karte tonart-griffe"><div class="griffe">' + h + '</div>' + fremdHinweis(formen) + kapoTipp() + LEGENDE() + '</div>'
      : '<div class="karte leer" style="margin-top:14px">Wähle oben mindestens einen Akkord aus.</div>';
  }
  $('#t-akkorde').addEventListener('click', function (e) {
    var b = e.target.closest('[data-stufe]');
    if (!b) return;
    S.tAus[b.dataset.stufe] = !S.tAus[b.dataset.stufe];
    speichern(); renderTonart();
  });
  $('#t-griffe').addEventListener('click', function (e) { griffKlick(e); });

  // ------------------------------------------------------------------ Einzelner Akkord: C D E F G A als Dur, Moll, 7 und m7
  var A_TYPEN = ['', 'm', '7', 'm7'];
  var A_BESCHREIBUNG = { '': 'Dur-Dreiklang', 'm': 'Moll-Dreiklang', '7': 'Dur mit kleiner Septime (Dur7)', 'm7': 'Moll mit kleiner Septime (Moll7)' };
  function renderAkkord() {
    var root = SC.PC_NAME[S.aGrundton];
    $('#a-grundton').innerHTML = GT.map(function (pc) {
      return '<button type="button" class="chip gross" data-a-root="' + pc + '" aria-pressed="' + (pc === S.aGrundton) + '">' + SC.PC_NAME[pc] + '</button>';
    }).join('');
    $('#a-typ').innerHTML = A_TYPEN.map(function (t) {
      return '<button type="button" class="chip gross" data-a-typ="' + esc(t) + '" aria-pressed="' + (t === S.aTyp) + '" title="' + esc(A_BESCHREIBUNG[t]) + '">' + esc(root + t) + '<small>' + SC.TYPE_NAMES[t] + '</small></button>';
    }).join('');
    var name = root + S.aTyp, v = griff(name);
    var h = '<div class="karte akkord-ergebnis"><div class="reihe-kopf"><h2>' + esc(name) + '</h2>' +
      '<span class="leise">' + esc(A_BESCHREIBUNG[S.aTyp]) + ' · Akkordtöne: ' + esc(SC.akkordToene(name).join(' ')) + '</span>' +
      (v ? '<button type="button" class="knopf zweit" data-spiel="' + fretAttr(v.f) + '">' + ICON_TON + 'anhören</button>' : '') + '</div>';
    h += '<div class="griffe einzeln">' + griffHtml(name, v) + '</div>';
    h += LEGENDE() + '</div>';
    $('#a-ergebnis').innerHTML = h;
  }
  $('#tab-akkord').addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-a-root]'))) { S.aGrundton = +b.dataset.aRoot; speichern(); renderAkkord(); return; }
    if ((b = e.target.closest('[data-a-typ]'))) { S.aTyp = b.dataset.aTyp; speichern(); renderAkkord(); return; }
    griffKlick(e);
  });

  // ------------------------------------------------------------------ Rhythmus: Muster erklären und üben
  function renderRhythmus() {
    $('#r-akkord').innerHTML = UEBEN.map(function (a) {
      return '<button type="button" class="chip" data-r-akkord="' + esc(a) + '" aria-pressed="' + (a === S.rAkkord) + '"' +
        (a === 'folge' ? ' title="Die Pop-Folge in ' + esc(SC.key(LEICHT[S.instrument]).name) + ', der leichtesten Tonart für ' + (S.instrument === 'gitarre' ? 'die Gitarre' : 'die Ukulele') + '"' : '') + '>' +
        esc(uebenNamen(a).join(' – ')) + '</button>';
    }).join('');
    $('#r-tempo').value = S.tempo;
    $('#r-tempo-wert').textContent = S.tempo + ' BPM';
    $('#r-muster').innerHTML = M.MUSTER.map(function (m) {
      var gewaehlt = m.id === S.muster;
      return '<article class="karte muster-karte' + (gewaehlt ? ' gewaehlt' : '') + '">' +
        '<div class="mk-kopf"><h3>' + esc(m.name) + '</h3><span class="mk-takt">' + m.takt + '/4</span>' +
        (gewaehlt ? '<span class="tag eigen">für die Akkordfolgen gewählt</span>' : '') +
        '<button type="button" class="knopf zweit klein" data-r-spiel="' + m.id + '"></button></div>' +
        schriftHtml(m, 'r-' + m.id) +
        '<p>' + esc(m.text) + '</p>' +
        '<p class="mk-genre"><b>Wo du es hörst:</b> ' + esc(m.genre) + '</p>' +
        (gewaehlt ? '' : '<button type="button" class="link-knopf" data-r-waehle="' + m.id + '">für die Akkordfolgen nehmen</button>') +
        '</article>';
    }).join('');
    $('#r-legende').innerHTML = '<dl class="legende">' + M.legende(S.instrument).map(function (x) {
      return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>';
    }).join('') + '</dl>';
    knoepfe();
  }
  $('#r-tempo').oninput = function () { S.tempo = +this.value; $('#r-tempo-wert').textContent = S.tempo + ' BPM'; speichern(); };
  $('#tab-rhythmus').addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-r-akkord]'))) {
      S.rAkkord = b.dataset.rAkkord; speichern();
      var lief = spiel.an && spiel.o.knopf && spiel.o.knopf.indexOf('r-') === 0 ? spiel.o.knopf.slice(2) : null;
      stoppen(); renderRhythmus();
      if (lief) ueben(lief);
      return;
    }
    if ((b = e.target.closest('[data-r-waehle]'))) { S.muster = b.dataset.rWaehle; speichern(); renderRhythmus(); return; }
    if ((b = e.target.closest('[data-r-spiel]'))) {
      var id = b.dataset.rSpiel;
      if (spiel.an && spiel.o.knopf === 'r-' + id) { stoppen(); return; }
      if (S.muster !== id) { S.muster = id; speichern(); stoppen(); renderRhythmus(); }
      ueben(id);
    }
  });
  function uebenNamen(a) {
    if (a !== 'folge') return [a];
    var k = SC.key(LEICHT[S.instrument]);
    return ['I', 'V', 'vi', 'IV'].map(function (s) { return SC.stufeZuAkkord(s, k); });
  }
  function ueben(id) {
    var namen = uebenNamen(S.rAkkord);
    spielSequenz(namen.map(griff), { muster: M.muster(id), beats: 4, zeile: 'r-' + id, knopf: 'r-' + id, schleife: true });
  }

  // ------------------------------------------------------------------ Start
  function renderTab() {
    if (S.tab === 'folgen') zeigeAnsicht();
    else if (S.tab === 'tonart') renderTonart();
    else if (S.tab === 'akkord') renderAkkord();
    else renderRhythmus();
  }
  function alles() { renderKopf(); renderTab(); }
  tonartSegment($('#f-grundton'));
  try { history.replaceState(null, ''); } catch (e) { /* egal */ }
  SC_STIMMEN.einrichten({ S: S, speichern: speichern, vorher: stoppen });
  SC_INSTALL.einrichten({ S: S, speichern: speichern });
  alles();

  // ------------------------------------------------------------------ Hintergrund: nichts läuft weiter
  // Geht die App in den Hintergrund oder wird sie geschlossen, hört das Abspielen auf und die
  // Klangausgabe schläft. Das Stimmgerät schaltet sein Mikrofon selbst ab (stimmen.js).
  function ruhe() { if (spiel.an) stoppen(); SC.Klang.ruhe(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) ruhe(); });
  window.addEventListener('pagehide', ruhe);

  // ------------------------------------------------------------------ Offline (Service Worker)
  var status = $('#offline-status');
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').then(function () {
      return navigator.serviceWorker.ready;
    }).then(function () {
      status.textContent = 'Offline verfügbar · Stand ' + SC_DATEN.stand;
    }).catch(function () {
      status.textContent = 'Stand ' + SC_DATEN.stand;
    });
  } else {
    status.textContent = 'Lokal geöffnet, läuft ohne Internet · Stand ' + SC_DATEN.stand;
  }

})();
