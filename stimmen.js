// Chords for Beginners: Stimmgerät (unverändert aus „Songwriting & Chords“, web/stimmen.js)
// Oben Stimmungen und Tonerkennung ohne Bezug zur Seite (skripte/web_pruefen.js testet sie),
// unten das Fenster mit Zeiger, Saiten, Kammerton und Mikrofon.
var SC_STIMMEN = (function () {
  'use strict';

  // ------------------------------------------------------------------ Stimmungen, von der tiefsten Saite aus (Ukulele: G C E A)
  var STIMMUNGEN = {
    gitarre: [
      { id: 'standard', name: 'Standard', toene: ['E2', 'A2', 'D3', 'G3', 'H3', 'E4'] },
      { id: 'halbton', name: 'Halbton tiefer', toene: ['E♭2', 'A♭2', 'D♭3', 'G♭3', 'B♭3', 'E♭4'] },
      { id: 'drop-d', name: 'Drop D', toene: ['D2', 'A2', 'D3', 'G3', 'H3', 'E4'] },
      { id: 'dadgad', name: 'DADGAD', toene: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'] },
      { id: 'open-g', name: 'Open G', toene: ['D2', 'G2', 'D3', 'G3', 'H3', 'D4'] },
    ],
    ukulele: [
      { id: 'standard', name: 'Standard, hohes G', toene: ['G4', 'C4', 'E4', 'A4'] },
      { id: 'tiefes-g', name: 'Tiefes G', toene: ['G3', 'C4', 'E4', 'A4'] },
      { id: 'd', name: 'D-Stimmung', toene: ['A4', 'D4', 'F#4', 'H4'] },
      { id: 'bariton', name: 'Bariton', toene: ['D3', 'G3', 'H3', 'E4'] },
    ],
  };
  var NAMEN = ['C', 'C#', 'D', 'E♭', 'E', 'F', 'F#', 'G', 'A♭', 'A', 'B♭', 'H'];
  var ANDERS = { 1: 'D♭', 3: 'D#', 6: 'G♭', 8: 'G#' };
  var PC = { 'C': 0, 'C#': 1, 'D♭': 1, 'D': 2, 'D#': 3, 'E♭': 3, 'E': 4, 'F': 5, 'F#': 6, 'G♭': 6, 'G': 7, 'G#': 8, 'A♭': 8, 'A': 9, 'B♭': 10, 'H': 11 };
  var KT_MIN = 430, KT_MAX = 450, KT_STANDARD = 440;
  var RUHE = 0.004;      // darunter gilt das Signal als Stille
  var SCHWELLE = 0.12;   // YIN: erste Periode, deren Abweichung darunter liegt

  function saite(ton) {   // 'E♭2' → { name: 'E♭', okt: 2, midi: 39 }
    var m = /^(.+?)(\d)$/.exec(ton);
    return { name: m[1], okt: +m[2], midi: (+m[2] + 1) * 12 + PC[m[1]] };
  }
  function stimmung(inst, id) {
    var l = STIMMUNGEN[inst] || [];
    return l.filter(function (s) { return s.id === id; })[0] || l[0];
  }
  function frequenz(midi, kt) { return (kt || KT_STANDARD) * Math.pow(2, (midi - 69) / 12); }
  function midiVon(f, kt) { return 69 + 12 * Math.log(f / (kt || KT_STANDARD)) / Math.LN2; }
  function tonName(midi) {
    var r = Math.round(midi), pc = ((r % 12) + 12) % 12;
    return { name: NAMEN[pc], anders: ANDERS[pc] || '', okt: Math.floor(r / 12) - 1 };
  }
  // Frequenzbereich, in dem gesucht wird: um die Saiten herum, frei vom tiefen E bis weit über die Singstimme
  function bereich(midis, kt) {
    if (!midis || !midis.length) return [50, 1500];
    var f = midis.map(function (m) { return frequenz(m, kt); });
    return [Math.max(40, Math.min.apply(null, f) * 0.6), Math.max.apply(null, f) * 1.6];
  }

  // ------------------------------------------------------------------ Tonerkennung (YIN mit Feinabgleich)
  function scheitel(a, i) {   // Parabel durch drei Punkte: wie weit liegt das Minimum neben i?
    var n = a[i - 1] - 2 * a[i] + a[i + 1];
    if (!n) return 0;
    var v = (a[i - 1] - a[i + 1]) / (2 * n);
    return v > 1 ? 1 : (v < -1 ? -1 : v);
  }
  // schnelle Fourier-Transformation (in place, Länge Zweierpotenz)
  var fftTab = {};
  function fft(re, im, rueck) {
    var n = re.length, t = fftTab[n], i, j, k, len, half, step, a, b, tr, ti, wr, wi;
    if (!t) {
      var bits = Math.round(Math.log(n) / Math.LN2);
      t = fftTab[n] = { rev: new Uint32Array(n), cos: new Float64Array(n >> 1), sin: new Float64Array(n >> 1) };
      for (i = 0; i < n; i++) { var r = 0, v = i; for (k = 0; k < bits; k++) { r = (r << 1) | (v & 1); v >>= 1; } t.rev[i] = r; }
      for (i = 0; i < n >> 1; i++) { t.cos[i] = Math.cos(2 * Math.PI * i / n); t.sin[i] = Math.sin(2 * Math.PI * i / n); }
    }
    for (i = 0; i < n; i++) { j = t.rev[i]; if (j > i) { a = re[i]; re[i] = re[j]; re[j] = a; a = im[i]; im[i] = im[j]; im[j] = a; } }
    for (len = 2; len <= n; len <<= 1) {
      half = len >> 1; step = n / len;
      for (i = 0; i < n; i += len) {
        for (k = 0; k < half; k++) {
          wr = t.cos[k * step]; wi = rueck ? t.sin[k * step] : -t.sin[k * step];
          a = i + k; b = a + half;
          tr = re[b] * wr - im[b] * wi; ti = re[b] * wi + im[b] * wr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
    }
  }
  // YIN-Differenz d(t) = Σ (y[j] − y[j+t])² für j < W, über die Kreuzkorrelation per FFT
  function differenz(y, W, tMax) {
    var n = y.length, M = 1, i;
    while (M < n) M <<= 1;
    var zr = new Float64Array(M), zi = new Float64Array(M), pr = new Float64Array(M), pi = new Float64Array(M);
    for (i = 0; i < n; i++) { zi[i] = y[i]; if (i < W) zr[i] = y[i]; }   // a = Fenster (real), y (imaginär)
    fft(zr, zi, false);
    for (i = 0; i < M; i++) {
      var km = (M - i) & (M - 1), mr = zr[km], mi = -zi[km];
      var ar = (zr[i] + mr) / 2, ai = (zi[i] + mi) / 2, yr = (zi[i] - mi) / 2, yi = -(zr[i] - mr) / 2;
      pr[i] = ar * yr + ai * yi; pi[i] = ar * yi - ai * yr;            // konj(A) · Y
    }
    fft(pr, pi, true);
    var q2 = new Float64Array(n + 1), d = new Float32Array(tMax + 2);
    for (i = 0; i < n; i++) q2[i + 1] = q2[i] + y[i] * y[i];
    for (i = 1; i <= tMax + 1; i++) {
      var v = q2[W] + q2[i + W] - q2[i] - 2 * pr[i] / M;
      d[i] = v > 0 ? v : 0;
    }
    return d;
  }
  function pegel(x) {
    var s = 0, m = 0, i;
    for (i = 0; i < x.length; i++) m += x[i];
    m /= x.length;
    for (i = 0; i < x.length; i++) s += (x[i] - m) * (x[i] - m);
    return Math.sqrt(s / x.length);
  }
  // x: Abtastwerte, sr: Abtastrate. Gibt { f, klar } zurück oder null bei Stille und Geräusch.
  function erkenne(x, sr, fMin, fMax) {
    fMin = fMin || 50; fMax = fMax || 1500;
    // grob auf etwa 24 kHz verdichten, das spart Rechenzeit und reicht bis weit über 1500 Hz
    var q = Math.max(1, Math.round(sr / 24000)), n = Math.floor(x.length / q), y = new Float32Array(n), i, j, s, v;
    var mittel = 0, energie = 0;
    for (i = 0; i < n; i++) { s = 0; for (j = 0; j < q; j++) s += x[i * q + j]; y[i] = s / q; mittel += y[i]; }
    mittel /= n;
    for (i = 0; i < n; i++) { y[i] -= mittel; energie += y[i] * y[i]; }
    if (Math.sqrt(energie / n) < RUHE) return null;
    var r = sr / q, tMin = Math.max(2, Math.floor(r / fMax)), tMax = Math.min(Math.ceil(r / fMin), Math.floor(n / 2) - 2), W = n - tMax - 2;
    var d = differenz(y, W, tMax), cm = new Float32Array(tMax + 2), summe = 0, t;
    cm[0] = 1;
    for (t = 1; t <= tMax + 1; t++) {
      summe += d[t];
      cm[t] = summe > 0 ? d[t] * t / summe : 1;
    }
    var best = -1;
    for (t = tMin; t <= tMax; t++) {
      if (cm[t] < SCHWELLE) { while (t < tMax && cm[t + 1] < cm[t]) t++; best = t; break; }
    }
    if (best < 0) {
      var m = tMin;
      for (t = tMin + 1; t <= tMax; t++) if (cm[t] < cm[m]) m = t;
      if (cm[m] > 0.3 || m === tMin || m === tMax) return null;
      best = m;
    }
    var klar = 1 - cm[best], T0 = (best + scheitel(cm, best)) * q;
    // Feinabgleich mit voller Abtastrate rund um die gefundene Periode
    var N = x.length, c = Math.round(T0), lo = Math.max(1, c - 3), hi = c + 3, Wf = N - hi - 1;
    if (Wf < N / 3) return { f: sr / T0, klar: klar };
    var D = [], k;
    for (k = lo; k <= hi; k++) {
      s = 0;
      for (j = 0; j < Wf; j++) { v = x[j] - x[j + k]; s += v * v; }
      D.push(s);
    }
    var mi = 1;
    for (k = 2; k < D.length - 1; k++) if (D[k] < D[mi]) mi = k;
    return { f: sr / (lo + mi + scheitel(D, mi)), klar: klar };
  }
  // Ergebnis einordnen: nächste Saite (oder die festgehaltene) bzw. nächster Halbton
  function auswerten(f, kt, midis, fest) {
    var m = midiVon(f, kt), ziel, s = -1, i;
    if (midis && midis.length) {
      if (fest >= 0 && fest < midis.length) s = fest;
      else { s = 0; for (i = 1; i < midis.length; i++) if (Math.abs(m - midis[i]) < Math.abs(m - midis[s])) s = i; }
      ziel = midis[s];
    } else ziel = Math.round(m);
    return { f: f, midi: m, ziel: ziel, saite: s, cent: (m - ziel) * 100 };
  }
  // Referenzton: gezupfter Klang aus Teiltönen, genau auf der Frequenz
  function zupfDaten(f, sr, dauer) {
    var len = Math.floor(sr * dauer), d = new Float32Array(len), teile = [1, 0.5, 0.33, 0.22, 0.14, 0.09, 0.06, 0.04], h, j, max = 0;
    for (h = 0; h < teile.length; h++) {
      var fh = f * (h + 1);
      if (fh > sr * 0.45) break;
      var w = 2 * Math.PI * fh / sr, abkl = Math.exp(-(1.2 + h * 0.9) / sr), a = teile[h];
      for (j = 0; j < len; j++) { d[j] += a * Math.sin(w * j); a *= abkl; }
    }
    for (j = 0; j < len; j++) if (Math.abs(d[j]) > max) max = Math.abs(d[j]);
    var ein = Math.floor(sr * 0.006), aus = Math.floor(sr * 0.08);
    for (j = 0; j < len; j++) {
      var g = 0.8 / (max || 1);
      if (j < ein) g *= j / ein;
      if (j > len - aus) g *= (len - j) / aus;
      d[j] *= g;
    }
    return d;
  }

  // ------------------------------------------------------------------ Fenster
  var A = null;       // Verbindung zur App: { S, speichern, vorher }
  var el = {}, offen = false, fest = -1, gestimmt = {}, verlauf = [], imZiel = 0, refBis = 0, refText = '';
  var letzteAnalyse = 0, letzterTon = 0, zeigerIst = 0, zeigerSoll = 0, wach = null, refCache = {};
  var mic = null;     // { ctx, stream, analyser, buf, raf, startet }
  var ktTon = null, ktTimer = 0;   // Kammerton zum Anhören (Dauerton aus SC.Klang)
  var KT_DAUER = 60000;            // spätestens nach einer Minute hört er von selbst auf
  var CX = 130, CY = 130, R = 104, GRAD = 80;   // Skala: ±50 Cent über ±80 Grad

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hz(f) { return f.toFixed(1).replace('.', ',') + ' Hz'; }
  function modus() { return A.S.stInst; }
  function frei() { return modus() === 'frei'; }
  function aktuell() { return frei() ? null : stimmung(modus(), modus() === 'gitarre' ? A.S.stGit : A.S.stUke); }
  function saiten() { var st = aktuell(); return st ? st.toene.map(saite) : []; }
  function midis() { return saiten().map(function (s) { return s.midi; }); }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b[b.length >> 1]; }

  function punkt(grad, r) {
    var w = grad * Math.PI / 180;
    return [+(CX + r * Math.sin(w)).toFixed(1), +(CY - r * Math.cos(w)).toFixed(1)];
  }
  function skala() {
    var h = '', a, b, c, p;
    a = punkt(-GRAD, R); b = punkt(GRAD, R);
    h += '<path class="bogen" d="M' + a + ' A' + R + ' ' + R + ' 0 0 1 ' + b + '"/>';
    a = punkt(-3 * GRAD / 50, R); b = punkt(3 * GRAD / 50, R);
    h += '<path class="zone" d="M' + a + ' A' + R + ' ' + R + ' 0 0 1 ' + b + '"/>';
    for (c = -50; c <= 50; c += 5) {
      var lang = c % 25 === 0, g = c / 50 * GRAD;
      a = punkt(g, R); b = punkt(g, R - (lang ? 14 : 7));
      h += '<line class="strich' + (lang ? ' lang' : '') + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
      if (lang) { p = punkt(g, R + 13); h += '<text x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle" dominant-baseline="middle">' + (c > 0 ? '+' : c < 0 ? '−' : '') + Math.abs(c) + '</text>'; }
    }
    h += '<text x="26" y="138" text-anchor="middle">tiefer</text><text x="234" y="138" text-anchor="middle">höher</text>';
    h += '<g id="sg-nadel" class="sg-nadel"><line x1="' + CX + '" y1="' + CY + '" x2="' + CX + '" y2="' + (CY - R + 10) + '"/></g>';
    h += '<circle class="sg-nabe" cx="' + CX + '" cy="' + CY + '" r="7"/>';
    el.skala.innerHTML = h;
    el.nadel = $('sg-nadel');
    zeigerGemalt = '';
  }
  // Zeiger wie bei einem echten Messgerät: eine kritisch gedämpfte Feder. Er beschleunigt und bremst
  // weich, schwingt nicht über und schluckt das Zittern der Messung. Gerechnet wird mit der echten Zeit,
  // damit er auf 60- und 120-Hz-Bildschirmen (iPhone Pro, iPad Pro) gleich schnell ist.
  var FEDER = 7;   // Eigenfrequenz in 1/s: kleiner = träger, größer = flinker
  var zeigerV = 0, zeigerZeit = 0, zeigerGemalt = '';
  function setzeZeiger(grad) {
    zeigerIst = grad;
    var t = grad.toFixed(2);
    if (t === zeigerGemalt) return;   // nichts geändert, nichts zeichnen
    zeigerGemalt = t;
    el.nadel.setAttribute('transform', 'rotate(' + t + ' ' + CX + ' ' + CY + ')');
  }
  function zeigerHalt(grad) { zeigerV = 0; zeigerZeit = 0; setzeZeiger(grad); }
  function gleiten(jetzt) {
    var dt = zeigerZeit ? Math.min(0.1, (jetzt - zeigerZeit) / 1000) : 0;
    zeigerZeit = jetzt;
    if (!dt || (zeigerIst === zeigerSoll && !zeigerV)) return;
    var n = Math.ceil(dt / 0.008), h = dt / n, x = zeigerIst, v = zeigerV;
    for (var i = 0; i < n; i++) { v += (FEDER * FEDER * (zeigerSoll - x) - 2 * FEDER * v) * h; x += v * h; }
    if (Math.abs(zeigerSoll - x) < 0.02 && Math.abs(v) < 0.1) { x = zeigerSoll; v = 0; }   // angekommen
    zeigerV = v;
    setzeZeiger(x);
  }

  // ---------------------------------------------------- Aufbau
  function render() {
    el.inst.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.wert === modus()));
    });
    el.stimmungFeld.hidden = frei();
    if (!frei()) {
      el.stimmung.innerHTML = STIMMUNGEN[modus()].map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.name + ' · ' + s.toene.map(function (t) { return saite(t).name; }).join(' ')) + '</option>';
      }).join('');
      el.stimmung.value = aktuell().id;
    }
    renderKt();
    renderSaiten();
    anzeigen(null);
    knopf();
    ktKnopf();
  }
  function renderKt() {
    var kt = A.S.kammerton;
    el.kt.value = kt;
    el.ktWert.textContent = kt + ' Hz';
    el.ktReset.hidden = kt === KT_STANDARD;
  }
  function renderSaiten() {
    var s = saiten();
    el.saitenFeld.hidden = !s.length;
    if (!s.length) { el.saiten.innerHTML = ''; return; }
    el.saiten.innerHTML = '<button type="button" class="chip sg-auto" data-saite="-1" aria-pressed="' + (fest < 0) + '">Auto</button>' +
      s.map(function (x, i) {
        return '<button type="button" class="chip sg-saite' + (gestimmt[i] ? ' gestimmt' : '') + '" data-saite="' + i + '" aria-pressed="' + (fest === i) + '"' +
          ' aria-label="' + esc(x.name + x.okt) + ', Referenzton spielen"><b>' + esc(x.name) + '</b><small>' + x.okt + '</small></button>';
      }).join('');
  }
  function markiereSaite(i) {
    el.saiten.querySelectorAll('.sg-saite').forEach(function (b) { b.classList.toggle('erkannt', +b.dataset.saite === i); });
  }
  function knopf() {
    var t = mic ? (mic.startet ? 'Mikrofon startet …' : 'Mikrofon aus') : 'Mikrofon starten';
    el.mikro.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>' + t;
    el.mikro.classList.toggle('zweit', !!mic);
    el.mikro.setAttribute('aria-pressed', String(!!mic));
  }
  function hinweis(text) {
    el.hinweis.textContent = text || 'Die App hört nur zu, solange das Stimmgerät offen ist. Es wird nichts aufgenommen oder verschickt.';
    el.hinweis.classList.toggle('warm', !!text);
  }

  // ---------------------------------------------------- Anzeige
  function zeigeTon(name, okt, anders) {
    el.ton.innerHTML = name ? esc(name) + '<small>' + okt + '</small>' + (anders ? '<span class="anders">' + esc(anders) + '</span>' : '') : '–';
  }
  function anzeigen(w) {
    var box = el.anzeige, s = saiten();
    if (!w) {
      box.classList.remove('gut', 'daneben');
      box.classList.add('still');
      zeigerSoll = 0;
      if (!mic) zeigerHalt(0);
      if (ktTon) zeigeTon('A', 4);
      else if (fest >= 0 && s[fest]) zeigeTon(s[fest].name, s[fest].okt);
      else zeigeTon('');
      var t;
      if (refText) t = refText;
      else if (mic && !mic.startet) t = frei() ? 'Spiel oder sing einen Ton' : (fest >= 0 ? 'Spiel die ' + s[fest].name + '-Saite an' : 'Spiel eine Saite an');
      else if (mic) t = 'Mikrofon startet …';
      else t = 'Starte unten das Mikrofon';
      el.status.textContent = t;
      el.info.textContent = ktTon ? 'Stimm nach Gehör oder stell den Kammerton ein' : fest >= 0 && s[fest] ? 'Ziel ' + hz(frequenz(s[fest].midi, A.S.kammerton)) : '';
      markiereSaite(-1);
      return;
    }
    // grün ab 3 Cent, erst ab 4 Cent wieder orange: kein Flackern an der Grenze
    var c = w.cent, ac = Math.abs(c), gut = ac <= 3 || (box.classList.contains('gut') && ac <= 4);
    box.classList.remove('still');
    box.classList.toggle('gut', gut);
    box.classList.toggle('daneben', !gut);
    zeigerSoll = Math.max(-50, Math.min(50, c)) / 50 * GRAD;
    if (w.saite >= 0) zeigeTon(s[w.saite].name, s[w.saite].okt);
    else { var tn = tonName(w.ziel); zeigeTon(tn.name, tn.okt, tn.anders); }
    var richtung = c < 0 ? 'zu tief' : 'zu hoch';
    if (gut) el.status.textContent = '✓ passt';
    else if (ac >= 100) { var ht = Math.round(ac / 100); el.status.textContent = richtung + ' · etwa ' + ht + (ht === 1 ? ' Halbton' : ' Halbtöne'); }
    else el.status.textContent = richtung + ' · ' + (c < 0 ? '−' : '+') + Math.round(ac) + ' Cent';
    el.info.textContent = 'gemessen ' + hz(w.f) + ' · Ziel ' + hz(frequenz(w.ziel, A.S.kammerton));
    markiereSaite(fest < 0 ? w.saite : -1);
    // eine halbe Sekunde im grünen Bereich: Saite bekommt einen Haken
    if (gut && w.saite >= 0) {
      if (++imZiel >= 15 && !gestimmt[w.saite]) { gestimmt[w.saite] = true; renderSaiten(); markiereSaite(fest < 0 ? w.saite : -1); }
    } else imZiel = 0;
  }

  // ---------------------------------------------------- Mikrofon
  function mikroStart() {
    var md = navigator.mediaDevices, AC = window.AudioContext || window.webkitAudioContext;
    if (!window.isSecureContext || !md || !md.getUserMedia || !AC) {
      hinweis('Das Mikrofon geht nur, wenn die App über https läuft, zum Beispiel über GitHub Pages oder vom Home-Bildschirm. Referenztöne gehen trotzdem: Tippe auf eine Saite.');
      return;
    }
    SC.Klang.sitzung('play-and-record');
    var ctx = new AC();              // im Tipp anlegen, sonst bleibt er auf dem iPhone stumm
    if (ctx.resume) ctx.resume();
    mic = { ctx: ctx, startet: true };
    knopf(); hinweis(''); anzeigen(null);
    md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
      if (!mic || mic.ctx !== ctx) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      var quelle = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(), stumm = ctx.createGain();
      an.fftSize = Math.round(ctx.sampleRate / 24000) > 2 ? 8192 : 4096;
      stumm.gain.value = 0;
      quelle.connect(an); an.connect(stumm); stumm.connect(ctx.destination);
      mic.stream = stream; mic.analyser = an; mic.buf = new Float32Array(an.fftSize); mic.startet = false;
      stream.getAudioTracks().forEach(function (t) { t.onended = function () { if (mic && mic.stream === stream) mikroStopp('Das Mikrofon wurde beendet, zum Beispiel durch einen Anruf. Starte es einfach neu.'); }; });
      wachHalten(true);
      verlauf = []; letzterTon = 0;
      knopf(); anzeigen(null);
      schleife();
    }).catch(function (err) {
      if (!mic || mic.ctx !== ctx) return;
      mikroStopp(err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')
        ? 'Kein Zugriff aufs Mikrofon. Erlaube ihn in Safari über „aA“ → Website-Einstellungen oder in den iPhone-Einstellungen unter Apps → Safari → Mikrofon.'
        : 'Das Mikrofon ließ sich nicht starten. Ist eins angeschlossen?');
    });
  }
  function mikroStopp(text) {
    if (mic) {
      if (mic.raf) cancelAnimationFrame(mic.raf);
      if (mic.stream) mic.stream.getTracks().forEach(function (t) { t.stop(); });
      try { var p = mic.ctx.close(); if (p && p.catch) p.catch(function () { /* egal */ }); } catch (e) { /* egal */ }
      mic = null;
      SC.Klang.sitzung('playback');
    }
    wachHalten(false);
    verlauf = []; imZiel = 0;
    if (el.anzeige) { knopf(); hinweis(text); anzeigen(null); el.pegel.style.width = '0'; }
  }
  function wachHalten(an) {
    if (!an) { if (wach) { try { wach.release(); } catch (e) { /* egal */ } wach = null; } return; }
    if (navigator.wakeLock && navigator.wakeLock.request) {
      navigator.wakeLock.request('screen').then(function (l) { if (mic) wach = l; else l.release(); }).catch(function () { /* Bildschirm darf aus */ });
    }
  }
  function schleife() {
    if (!mic || !mic.analyser) return;
    mic.raf = requestAnimationFrame(schleife);
    var jetzt = performance.now();
    if (jetzt - letzteAnalyse >= 30) {
      letzteAnalyse = jetzt;
      mic.analyser.getFloatTimeDomainData(mic.buf);
      el.pegel.style.width = Math.min(100, Math.round(pegel(mic.buf) * 500)) + '%';
      if (jetzt < refBis) { /* Referenzton läuft, nicht auf sich selbst hören */ }
      else {
        if (refText) { refText = ''; anzeigen(null); }
        var kt = A.S.kammerton, m = midis(), b = bereich(m, kt), r = erkenne(mic.buf, mic.ctx.sampleRate, b[0], b[1]);
        if (r) {
          var mm = midiVon(r.f, kt);
          if (verlauf.length && Math.abs(mm - median(verlauf)) > 0.5) verlauf = [];
          verlauf.push(mm);
          if (verlauf.length > 5) verlauf.shift();
          if (verlauf.length >= 2) { letzterTon = jetzt; anzeigen(auswerten(frequenz(median(verlauf), kt), kt, m, fest)); }
        } else if (letzterTon && jetzt - letzterTon > 1200) { letzterTon = 0; verlauf = []; imZiel = 0; anzeigen(null); }
      }
    }
    gleiten(jetzt);
  }

  // ---------------------------------------------------- Referenzton
  function referenz(i) {
    var s = saiten()[i], ctx = SC.Klang.kontext();
    if (!s || !ctx) return;
    ktAus();
    var f = frequenz(s.midi, A.S.kammerton), k = f.toFixed(3) + '@' + ctx.sampleRate;
    if (!refCache[k]) {
      var d = zupfDaten(f, ctx.sampleRate, 3), b = ctx.createBuffer(1, d.length, ctx.sampleRate);
      b.getChannelData(0).set(d);
      refCache[k] = b;
    }
    SC.Klang.stopp();
    SC.Klang.spiele(refCache[k], 0.75);
    refBis = performance.now() + 3000; verlauf = []; letzterTon = 0;
    refText = 'Referenzton ' + s.name + s.okt + ' · ' + hz(f);
    anzeigen(null);
    setTimeout(function () { if (performance.now() >= refBis && refText) { refText = ''; if (offen) anzeigen(null); } }, 3050);
  }

  // ---------------------------------------------------- Kammerton anhören
  // Dauerton auf A4 wie eine Stimmgabel. Er folgt dem Regler, solange er spielt. Das Stimmgerät
  // hört währenddessen nicht zu, sonst würde es den eigenen Ton messen.
  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>';
  var ICON_STOPP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>';
  function ktKnopf() {
    var an = !!ktTon;
    el.ktSpielen.innerHTML = an ? ICON_STOPP + 'Stopp' : ICON_PLAY + 'Anhören';
    el.ktSpielen.setAttribute('aria-pressed', String(an));
    el.ktSpielen.setAttribute('aria-label', an ? 'Kammerton stoppen' : 'Kammerton A4 anhören');
  }
  function ktText() { refText = 'Kammerton A4 · ' + A.S.kammerton + ' Hz'; }
  function ktSpielen() {
    if (ktTon) { ktStopp(); return; }
    SC.Klang.stopp();   // laufenden Referenzton beenden
    var ton = SC.Klang.dauerton(A.S.kammerton, 0.3, function () { if (ktTon === ton) ktFertig(); });
    if (!ton) return;
    ktTon = ton;
    ktTimer = setTimeout(ktStopp, KT_DAUER);
    refBis = Infinity; verlauf = []; letzterTon = 0; imZiel = 0;
    ktText(); ktKnopf(); anzeigen(null);
  }
  function ktAus() {   // nur den Zustand zurücksetzen, den Klang beendet der Aufrufer
    clearTimeout(ktTimer);
    if (!ktTon) return;
    ktTon = null;
    refText = ''; refBis = 0;
    if (el.ktSpielen) ktKnopf();
  }
  function ktStopp() {
    if (!ktTon) return;
    var ton = ktTon;
    ktAus();
    ton.stopp();
    refBis = performance.now() + 300;   // kurz warten, bis er verklungen ist
    if (offen) anzeigen(null);
  }
  function ktFertig() {   // von außen beendet, zum Beispiel weil die App in den Hintergrund ging
    ktAus();
    if (offen) anzeigen(null);
  }

  // ---------------------------------------------------- Öffnen und Schließen
  function oeffnen() {
    if (offen) return;
    if (A.vorher) A.vorher();
    if (A.S.stInst !== 'frei') A.S.stInst = A.S.instrument;
    try { history.pushState({ sc: 'stimmen' }, ''); } catch (e) { /* ohne Verlauf geht es auch */ }
    zeigen();
  }
  function hintergrund(aus) {   // Seite hinter dem Fenster für Tastatur und Vorlesen sperren
    document.querySelectorAll('body > header, body > nav, body > main, body > footer').forEach(function (x) {
      if (aus) x.setAttribute('inert', ''); else x.removeAttribute('inert');
    });
  }
  function zeigen() {
    offen = true; fest = -1; gestimmt = {}; refText = ''; refBis = 0;
    el.fenster.hidden = false;
    document.documentElement.classList.add('sg-offen');
    hintergrund(true);
    render();
    hinweis('');
    el.fenster.scrollTop = 0;
    try { el.zurueck.focus({ preventScroll: true }); } catch (e) { /* egal */ }
  }
  function schliessen() {
    mikroStopp();
    ktAus();
    SC.Klang.stopp();
    refCache = {};   // Referenztöne nur behalten, solange das Fenster offen ist
    offen = false;
    el.fenster.hidden = true;
    document.documentElement.classList.remove('sg-offen');
    hintergrund(false);
    try { $('stimmen-knopf').focus({ preventScroll: true }); } catch (e) { /* egal */ }
  }
  function zurueck() {
    if (history.state && history.state.sc === 'stimmen') history.back();
    else schliessen();
  }
  // von app.js aufgerufen, bevor sie selbst auf Zurück und Vor reagiert
  function popstate(st) {
    if (st && st.sc === 'stimmen') { if (!offen) zeigen(); return true; }
    if (offen) { schliessen(); return true; }
    return false;
  }
  function neuAnfangen() { fest = -1; gestimmt = {}; verlauf = []; imZiel = 0; }
  function setzeKt(v) {
    v = Math.max(KT_MIN, Math.min(KT_MAX, Math.round(v)));
    if (v === A.S.kammerton) return renderKt();
    A.S.kammerton = v;
    SC.Klang.kammerton(v);
    refCache = {};
    A.speichern();
    gestimmt = {}; verlauf = [];
    if (ktTon) { ktTon.frequenz(v); ktText(); }   // spielt er gerade, hört man die Änderung sofort
    renderKt(); renderSaiten(); anzeigen(null);
  }

  function einrichten(app) {
    A = app;
    var S = A.S;
    if (['gitarre', 'ukulele', 'frei'].indexOf(S.stInst) < 0) S.stInst = 'gitarre';
    S.stGit = stimmung('gitarre', S.stGit).id;
    S.stUke = stimmung('ukulele', S.stUke).id;
    S.kammerton = Math.round(S.kammerton);
    if (!(S.kammerton >= KT_MIN && S.kammerton <= KT_MAX)) S.kammerton = KT_STANDARD;
    SC.Klang.kammerton(S.kammerton);
    el = {
      fenster: $('stimmgeraet'), zurueck: $('sg-zurueck'), inst: $('sg-inst'), stimmungFeld: $('sg-stimmung-feld'), stimmung: $('sg-stimmung'),
      kt: $('sg-kt'), ktWert: $('sg-kt-wert'), ktReset: $('sg-kt-reset'), anzeige: $('sg-anzeige'), skala: $('sg-skala'),
      ton: $('sg-ton'), status: $('sg-status'), info: $('sg-info'), pegel: $('sg-pegel'), saitenFeld: $('sg-saiten-feld'), saiten: $('sg-saiten'),
      mikro: $('sg-mikro'), hinweis: $('sg-hinweis'), ktSpielen: $('sg-kt-spielen'),
    };
    skala();
    $('stimmen-knopf').onclick = oeffnen;
    el.zurueck.onclick = zurueck;
    el.inst.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || b.dataset.wert === S.stInst) return;
      S.stInst = b.dataset.wert; A.speichern(); neuAnfangen(); render();
    });
    el.stimmung.onchange = function () {
      if (S.stInst === 'gitarre') S.stGit = this.value; else S.stUke = this.value;
      A.speichern(); neuAnfangen(); renderSaiten(); anzeigen(null);
    };
    el.kt.oninput = function () { setzeKt(+this.value); };
    $('sg-kt-minus').onclick = function () { setzeKt(S.kammerton - 1); };
    $('sg-kt-plus').onclick = function () { setzeKt(S.kammerton + 1); };
    el.ktReset.onclick = function () { setzeKt(KT_STANDARD); };
    el.ktSpielen.onclick = ktSpielen;
    el.saiten.addEventListener('click', function (e) {
      var b = e.target.closest('[data-saite]');
      if (!b) return;
      var i = +b.dataset.saite;
      fest = i; verlauf = []; imZiel = 0;
      renderSaiten();
      if (i >= 0) referenz(i);
      else { ktAus(); refText = ''; refBis = 0; SC.Klang.stopp(); anzeigen(null); }
    });
    el.mikro.onclick = function () { if (mic) mikroStopp(); else mikroStart(); };
    document.addEventListener('keydown', function (e) { if (offen && e.key === 'Escape') zurueck(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) ktStopp();
      if (document.hidden && mic) mikroStopp('Pausiert, weil die App im Hintergrund war. Tippe auf „Mikrofon starten“.');
    });
    window.addEventListener('pagehide', function () { ktStopp(); if (mic) mikroStopp(); });
  }

  return {
    STIMMUNGEN: STIMMUNGEN, KT_MIN: KT_MIN, KT_MAX: KT_MAX, KT_STANDARD: KT_STANDARD,
    saite: saite, stimmung: stimmung, frequenz: frequenz, midiVon: midiVon, tonName: tonName, bereich: bereich,
    erkenne: erkenne, auswerten: auswerten, zupfDaten: zupfDaten,
    einrichten: einrichten, oeffnen: oeffnen, popstate: popstate,
  };
})();
