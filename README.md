# Chords for Beginners

Web-App für den Einstieg mit Gitarre oder Ukulele: zwölf einfache Akkordfolgen in sieben Tonarten, Grundgriffe, Schlag- und Zupfmuster zum Mitspielen und ein Stimmgerät. Sie ist die kleine Schwester von „Songwriting & Chords“ (`../Akkordfolgen-fuer-Songwriter/web`), gleich gebaut und gleich gestaltet, läuft offline und lässt sich auf iPhone, iPad und Android installieren.

## Was drin ist

- **Akkordfolgen:** die sieben Folgen aus dem Bild (C F G C, C G Am F, F C Am Em, F Am G C, F C Am G, Dm Am F G, F G Am G) vier aus der Songwriting-App (Doo-Wop-Folge, Pop-Loop, Rock’n’Roll-Loop, 12-Takt-Blues) und die Heaven’s-Door-Folge I V ii I V IV aus „Knockin’ on Heaven’s Door“ (in G-Dur G D Am, G D C; Am ist dort die Stufe ii). Jede trägt ein deutsches Stimmungs-Etikett (fröhlich, freudig, düster, poppig, emotional, traurig, kraftvoll …). Ein Tipp öffnet ihre Seite mit Zurück-Knopf und Tonartwahl.
- **Wo du sie hörst:** Zu jeder Folge zwei bis drei Sätze, in welchen Genres sie oft vorkommt, mit bekannten Songs als Beispiel.
- **Tonarten:** C, D, E, F, G, A und H, also alle Stammtöne, jeweils in Dur. Ein grüner Punkt markiert die leichteste: G-Dur auf der Gitarre, C-Dur auf der Ukulele. Einen Kapo zum Einstellen gibt es nicht, für den Anfang braucht man ihn nicht. Auf der Seite jeder Folge und im Reiter „Tonart“ erklärt „Was macht ein Kapo?“ in zwei Sätzen und einem Beispiel, wofür man ihn nimmt.
- **Griffe:** nur Grundgriffe, je Akkord einer, für Gitarre und Ukulele. Griffbild antippen spielt den Akkord.
- **28 Akkorde** im Reiter „Akkord“: C, D, E, F, G, A, H je als Dur, Moll, Dur7 und Moll7. Du wählst nur den Grundton, dann stehen alle vier Akkorde mit Griff und Akkordtönen nebeneinander.
- **Griffe einer Tonart:** die Stufen I, ii, iii, IV, V, vi, dazu V7, ii7, iii7 und vi7.
- **Rhythmus:** sechs Muster für Anfänger mit Pfeil- und Fingerschrift, Zählzeiten, Erklärung und Genre-Hinweis: Nur Abschläge, Ab und auf, Lagerfeuer-Schlag (↓ ↓↑ ·↑ ↓↑, auf der Ukulele Island Strum), Walzer im 3/4-Takt, Wechselbass und Zupfmuster p i m a. Im Reiter „Rhythmus“ übst du jedes Muster auf einem Akkord oder auf der Pop-Folge in der leichtesten Tonart: G D Em C auf der Gitarre, C G Am F auf der Ukulele. Im gewählten Muster stehen die Griffbilder der Übungsakkorde, bei Wechselbass und Walzer mit B und W, beim Zupfmuster mit p i m a unter den Saiten. Beim Abspielen leuchtet der Griff, der gerade dran ist. Auf jeder Folgen-Seite wählst du ein Muster, die App spielt die Folge damit ab und zeigt Akkord und Schlag mit, die Griffbilder dort tragen dieselben Zeichen.
- **Eigene Akkordfolgen:** Editor mit Palette (I ii iii IV V vi und Septakkorde), Eingabe als Akkorde oder Stufen, Export und Import als Datei. Jede Folge lässt sich mit „Als eigene bearbeiten“ als Vorlage nehmen.
- **Stimmgerät** wie in der Songwriting-App: Gitarre, Ukulele, Frei, Kammerton 430 bis 450 Hz mit Dauerton zum Anhören, Zeiger als gedämpfte Feder.
- **Klang:** gezupfte Saiten mit kurzem Nachklang. Beim Akkordwechsel verklingt der alte Akkord, wie wenn die Greifhand loslässt.
- **Hell und dunkel** zum Umschalten, folgt sonst der Systemeinstellung. **Druckansicht** ohne Bedienelemente.
- **Start:** Beim ersten Öffnen stehen Gitarre und G-Dur, die leichteste Tonart, eingestellt.
- **Offline:** Nach dem ersten Öffnen läuft alles ohne Internet.

Favoriten und die Menüs für Genre und Stimmung gibt es hier nicht.

## Zwei Entscheidungen

- Stufen: Geplant waren I, iii, IV, V und vi. Weil „Traurig“ (Dm Am F G) die ii braucht, gehört sie jetzt überall dazu: im Editor, im Reiter „Tonart“ und bei den Septakkorden (ii7).
- In D, E, F, A und H brauchen die Folgen Akkorde außerhalb der 28 (F#m, C#m, G#m, D#m, F#, B♭, beim Blues auch F#7 und B♭7). Die Folgen zeigen sie trotzdem mit ihrem einfachsten Griff und einem Hinweis, der Akkord-Bereich bleibt bei 28. Auf der Seite einer Folge bietet die App dann an, in die leichteste Tonart zu wechseln.

## Aufbau

```
index.html, style.css     Oberfläche
app.js                    Bedienung: Liste, Detail, Editor, Tonart, Akkord, Rhythmus, Abspielen
musik.js                  Stufen, Akkordnamen, Grundgriffe, Griffbilder, Klang
daten.js                  Grundgriffe Dur, Moll, 7, m7 (aus der Songwriting-App)
folgen.js                 die zwölf Akkordfolgen mit Etiketten und Genre-Hinweisen
muster.js                 Schlag- und Zupfmuster: Schreibweise und welche Saiten erklingen
stimmen.js                Stimmgerät (unverändert aus der Songwriting-App)
installieren.js           Hinweis zum Installieren auf iPhone, iPad und Android
sw.js, manifest.webmanifest   Offline und Installation
icons/                    App-Icons (grün, damit sie sich von „Chords“ unterscheiden)
skripte/pruefen.js        prüft die ganze App
skripte/icons_erzeugen.js zeichnet die PNG-Icons aus icons/icon.svg
```

## Befehle

Die App braucht keinen Build-Schritt. Die Skripte laufen mit dem JavaScript, das in macOS steckt:

```
osascript -l JavaScript skripte/pruefen.js          # prüft alles, muss 0 Fehler melden
osascript -l JavaScript skripte/icons_erzeugen.js   # PNG-Icons neu zeichnen
ruby -run -e httpd . -p 8767                        # lokal ansehen unter http://localhost:8767
```

Die Prüfung schaut bei jedem Griff, ob genau die Akkordtöne erklingen, ob er mit höchstens vier Fingern geht und bei der Gitarre, ob der Grundton im Bass liegt. Sie rechnet alle Folgen in allen sieben Tonarten, prüft jedes Zeichen jedes Musters auf allen Griffen, die Tonerkennung des Stimmgeräts auf 1 Cent genau, die Geräteerkennung für den Hinweis zum Installieren, die Offline-Liste, die Icons und dass keine Gedankenstriche im Text stehen.

## Auf iPhone, iPad und Android installieren (über GitHub Pages)

1. Auf github.com ein neues Repository anlegen, zum Beispiel `chords-for-beginners`, Sichtbarkeit **Public**.
2. „uploading an existing file“ wählen und den **Inhalt** dieses Ordners hineinziehen: alle Dateien und die Ordner `icons` und `skripte`. Den Ordner `.claude` brauchst du dort nicht. Mit „Commit changes“ bestätigen.
3. Unter **Settings → Pages** bei „Source“ „Deploy from a branch“ wählen, Branch `main`, Ordner `/ (root)`, speichern.
4. Nach ein bis zwei Minuten läuft die App unter `https://DEIN-NAME.github.io/chords-for-beginners/`.

Auf dem iPhone oder iPad die Adresse in Safari öffnen, auf Teilen tippen, dann „Zum Home-Bildschirm“. Auf Android in Chrome „App installieren“. Die App zeigt diese Schritte auch selbst in einem Hinweis am unteren Rand. Auf dem Home-Bildschirm heißt sie „Beginners“, weil iOS lange Namen abschneidet.

Eigene Akkordfolgen speichert jedes Gerät für sich (`localStorage`, Schlüssel `cfb-…`, getrennt von „Songwriting & Chords“). Zum Sichern oder Übertragen gibt es unter „Sammlung: Eigene“ Exportieren und Importieren. Exporte der Songwriting-App lassen sich einlesen, soweit die Folgen in Dur stehen und nur die Stufen dieser App nutzen.

Updates: neue Dateien hochladen und in `sw.js` die `VERSION` erhöhen.

## Quellen

Recherchiert am 25.11.2026. Songtitel stammen aus diesen Seiten, Liedtexte sind keine enthalten.

- Hooktheory TheoryTab, Suche nach genau der Stufenfolge, zum Beispiel <https://www.hooktheory.com/theorytab/advanced-search?chordString=IV+I+vi+iii> (ebenso für I IV V I, IV vi V I, IV I vi V, ii vi IV V, IV V vi V, I V vi IV, I vi IV V, I IV vi V, I IV V IV) sowie die Seiten zu „Twist and Shout“ und „Wild Thing“
- Wikipedia: <https://en.wikipedia.org/wiki/I%E2%80%93V%E2%80%93vi%E2%80%93IV_progression>, <https://en.wikipedia.org/wiki/%2750s_progression>, <https://en.wikipedia.org/wiki/Twelve-bar_blues>, <https://en.wikipedia.org/wiki/Three-chord_song>, <https://en.wikipedia.org/wiki/Knockin%27_on_Heaven%27s_Door> (dazu Hooktheory <https://www.hooktheory.com/theorytab/view/bob-dylan/knockin-on-heavens-door>)
- MusicRadar zu I IV V und „Johnny B. Goode“: <https://musicradar.com/how-to/guitar-lesson-learn-the-three-chord-trick-thats-behind-thousands-of-songs>
- Muster: Premier Guitar zu den Abschlägen der Ramones <https://www.premierguitar.com/lessons/how-to-jam-out-like-the-ramones>, UkuTabs und ukulele-tabs.com zum Island Strum und zu „Riptide“ <https://ukutabs.com/ukulele-news/ukulele-strumming-patterns-beginners>, <https://ukulele-tabs.com/strumming-patterns.html>, Guitar World und National Guitar Academy zum Boom-Chick von Johnny Cash <https://guitarworld.com/lessons/johnny-cash-boom-chick-pick-and-strum-country-acoustic-style>, Killer Guitar Rigs zu „Tennessee Waltz“ im 3/4-Takt <https://killerguitarrigs.com/songs-in-3-4-time/>, TotallyGuitars zu „Mr. Bojangles“ im 3/4-Takt <https://totallyguitars.com/lessons/1260-mr-bojangles>, Fender zu PIMA <https://fender.com/articles/play/what-is-pima>, Rocksmith zu Zupfmustern und „House of the Rising Sun“ <https://www.ubisoft.com/en-us/game/rocksmith/plus/news-updates/5uhdjCXsllj9ssj1Gs9HF7/fingerpicking-patterns-for-beginners>
