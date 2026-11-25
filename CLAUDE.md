# Projekt: Chords for Beginners

Web-App für Einsteiger ohne Build-Schritt (reines HTML, CSS, JavaScript mit klassischen Skripten, keine Module). Sie ist eine abgespeckte Fassung von „Songwriting & Chords“ (`../Akkordfolgen-fuer-Songwriter/web`) mit gleichem Aufbau und gleicher Optik. Wer dort etwas an Stimmgerät, Installationshinweis, Klang oder Griffbildern verbessert, prüft, ob es hierher gehört, und umgekehrt. An der Songwriting-App und am Tuner (`../Tuner`) nichts ändern, ohne dass der Nutzer es sagt.

## Schreibweise und Text

- Oberfläche und Texte auf Deutsch, Du-Ton, kurze Sätze, keine Floskeln. Im Fließtext keine Gedankenstriche, nur Punkt, Komma und Doppelpunkt. „ – “ ist nur zwischen Akkorden oder Stufen erlaubt (C – F – G).
- Akkordnamen deutsch: H statt B, das deutsche B als B♭, Vorzeichen als ♭ und #, Moll mit kleinem m (Hm, F#m).
- Stufen als römische Ziffern: groß = Dur, klein = Moll.

## Umfang (so gewollt)

- 11 Folgen in `folgen.js`: die sieben aus dem Bild des Nutzers (I IV V I, I V vi IV, IV I vi iii, IV vi V I, IV I vi V, ii vi IV V, IV V vi V) und aus der Songwriting-App Doo-Wop-Folge, Pop-Loop, Rock’n’Roll-Loop und 12-Takt-Blues. Jede mit deutschem Stimmungs-Etikett und Genre-Hinweis (2 bis 3 Sätze, Songbeispiele nur aus recherchierten Quellen, Quelle in `quelle`, Liste in README.md, keine Liedtexte).
- Tonarten C, D, E, F, G, A, H in Dur, also alle Stammtöne (`SC.GRUNDTOENE`). Kein Kapo, auf Wunsch des Nutzers ganz entfernt (für Anfänger unnötig). Stattdessen ist die leichteste Tonart markiert (`LEICHT` in `app.js`: G-Dur Gitarre, C-Dur Ukulele) mit grünem Punkt in Liste, Reiter Tonart und Editor, „· am leichtesten“ in der Auswahl der Folgen-Seite, und der Hinweis zu Akkorden außerhalb bietet dort den Wechsel an. Im Reiter Rhythmus übt „folge“ die Pop-Folge I V vi IV in der leichtesten Tonart (`uebenNamen`). `kapoTipp()` erklärt aufklappbar, wofür ein Kapo gut ist (Folgen-Seite und Reiter Tonart), mit Beispiel aus der leichtesten Tonart und Kapo im 2. Bund.
- Stufen nur I, ii, iii, IV, V, vi (die ii auf Wunsch des Nutzers, weil „Traurig“ sie braucht), im Blues I7 IV7 V7. Palette des Editors: I ii iii IV V vi plus I7 IV7 V7 ii7 iii7 vi7 (`ERLAUBT`, `PALETTE` in `app.js`), Reiter Tonart zusätzlich V7 ii7 iii7 vi7 (`T_STUFEN`).
- Akkord-Bereich: C D E F G A H als Dur, Moll, 7, m7 = 28 Akkorde (`SC.imBereich`). Akkorde außerhalb (F#m, C#m, G#m, D#m, F#, B♭, F#7, B♭7) zeigen die Folgen mit ihrem einfachsten Griff und einem Hinweis.
- Nur Grundgriffe aus `daten.js` (Kopie der Grundgriffe Dur, Moll, 7, m7 aus `skripte/griffe_*.py` der Songwriting-App, alle 12 Grundtöne, weil die Folgen in D, E, F, A und H Akkorde außerhalb des Bereichs brauchen). Keine Alternativen, Lagen, Barré-Varianten.
- Keine Favoriten, keine Menüs für Genre und Stimmung, keine Suche.

## Dateien

- `muster.js`: Schlag- und Zupfmuster als Achtel-Zeichen (D U S B W p i m a -), dazu `ton()`: welche Saiten ein Zeichen anschlägt. Gitarre: U über die Saiten ab D, S nur G H e, B die tiefste Saite des Griffs, W die nächste Basssaite mit der Quinte, i m a auf G H e. Ukulele: B die C-Saite, W die G-Saite, p i m a auf G C E A. Neue Muster brauchen Text, Genre-Hinweis mit Songbeispiel und Quelle in README.md.
- `app.js`: spielt Muster über `SC.Klang.anschlag` mit der Uhr der Klangausgabe (Takt für Takt kurz vorher geplant), Anzeige von Akkord und Schlag per `requestAnimationFrame`, nur solange es spielt. Jeder Akkord bekommt einen Takt, bei eigenen Folgen mit 2 Schlägen pro Akkord den halben (außer Walzer).
- `musik.js`: `SC.Klang.anschlag` dämpft den vorigen Ton einer Saite, wenn sie neu angeschlagen wird. `NACHKLANG` legt fest, nach wie vielen Sekunden ein Ton 60 dB leiser ist (Gitarre 2,6, Ukulele 1,4, gleich für tiefe und hohe Saiten, auf Wunsch des Nutzers weniger Hall). `SC.Klang.daempfen(t)` lässt beim Akkordwechsel alle Saiten verklingen, `app.js` ruft es beim Abspielen auf. Der Kompressor ist sanft eingestellt, damit er das Ausklingen nicht anhebt.
- `stimmen.js` und `installieren.js`: aus der Songwriting-App, nur Kopfzeile bzw. App-Name „Chords for Beginners“ geändert. Stimmgerät mit `FEDER = 7` und Reihenfolge Gitarre, Ukulele, Frei.
- Speicher nur im Browser, Schlüssel mit `cfb-`: `cfb-zustand`, `cfb-eigene`, `cfb-thema`. Nie die Schlüssel der Songwriting-App (`sc-…`) benutzen, auf GitHub Pages teilen sich die Apps eines Kontos den Speicher. Exportformat wie dort (`format: 1`, Stufen, `ton: 'dur'`), `pruefeFolge` nimmt nur Dur-Folgen mit erlaubten Stufen an.

## Regeln

- Nach jeder Änderung muss `osascript -l JavaScript skripte/pruefen.js` mit 0 Fehlern durchlaufen.
- Nach jeder Änderung an einer Datei der App die `VERSION` in `sw.js` erhöhen (`cfb-JJJJ-MM-TT-N`). Neue Dateien auch in `DATEIEN` dort aufnehmen. Der Service Worker löscht nur Speicher, die mit `cfb-` beginnen.
- Im Hintergrund läuft nichts: Bei `visibilitychange` und `pagehide` stoppt `app.js` das Abspielen und legt die Klangausgabe schlafen, das Stimmgerät gibt das Mikrofon frei. Neue Timer, Schleifen oder Audio-Quellen müssen dort mit aufhören. Kein `setInterval` ohne Ende.
- Lokal testen: `ruby -run -e httpd . -p 8767` (8765 gehört der Songwriting-App, 8766 dem Tuner). Startet die Vorschau den Server selbst („cfb“), sperrt macOS ihm den Ordner „Dokumente“. Dann den Server aus dem Terminal starten und die Vorschau mit „cfb-laufend“ anhängen. Ist das Vorschau-Fenster ausgeblendet, läuft `requestAnimationFrame` nur etwa dreimal pro Sekunde, die Markierung beim Abspielen springt dann, der Klang bleibt im Takt.
- Die Vorschau blockiert das Mikrofon. Zum Testen `navigator.mediaDevices.getUserMedia` per JavaScript durch einen Oszillator ersetzen (`createMediaStreamDestination`, Teiltöne über `createPeriodicWave`).
- Die Klasse `.leer` gehört der Vorlage (volle Zeile im Raster). Für Pausen im Muster heißt sie `.pause`.
- Nichts auf GitHub hochladen und kein Repository anlegen. Das macht der Nutzer selbst.
