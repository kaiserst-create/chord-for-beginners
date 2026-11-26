// Chords for Beginners: die zwölf Akkordfolgen
//
// Jede Folge steht als Stufen in Dur, die App setzt sie in die Tonarten C, D, E, F, G und A.
// Die ersten sieben stammen aus dem Bild des Nutzers, dazu vier aus „Songwriting & Chords“
// (web/folgen.js: Doo-Wop-Folge, Pop-Loop, Rock’n’Roll-Loop, 12-Takt-Blues) und die Folge aus
// „Knockin’ on Heaven’s Door“ (Wunsch des Nutzers; Am ist in G-Dur die Stufe ii).
// stimmung: deutsche Etiketten (im Bild englisch: Happy, Joyful, Dark, Pop, Emotional, Sad, Powerful,
//   bei den übernommenen Folgen wie in der Songwriting-App)
// genre: wo die Folge oft vorkommt, mit Songbeispielen. Recherchiert am 25.11.2026, Quellen stehen in README.md:
//   Songbeispiele aus der Datenbank von Hooktheory (TheoryTab, Suche nach genau dieser Stufenfolge)
//   und aus Wikipedia („I–V–vi–IV progression“, „'50s progression“, „Twelve-bar blues“).
// takt: Schläge pro Akkord beim Abspielen (Standard 4), zeilen: Akkorde pro Zeile (Blues-Schema), hinweis: Spieltipp

var SC_FOLGEN = (function () {
  'use strict';

  var folgen = [];
  function f(id, titel, stufen, stimmung, genre, extra) {
    var o = { id: id, titel: titel, stufen: stufen.split(' '), ton: 'dur', stimmung: [].concat(stimmung), genre: genre, takt: 4, quelle: 'Hooktheory' };
    for (var k in extra || {}) o[k] = extra[k];
    folgen.push(o);
  }

  f('happy', 'Die drei Hauptakkorde', 'I IV V I', 'fröhlich',
    'Mit diesen drei Akkorden kommen viele Volkslieder, Country-Songs und frühe Rock’n’Roll-Nummern aus, auch der Zwölftakt-Blues baut auf ihnen auf. ' +
    'In der Hooktheory-Datenbank steht genau diese Folge zum Beispiel in der Strophe von „You’re Still The One“ von Shania Twain und im Refrain von „When I Was Your Man“ von Bruno Mars. ' +
    'Den Refrain von „Twist and Shout“ der Beatles tragen I, IV und V.');
  f('joyful', 'Die Pop-Folge', 'I V vi IV', 'freudig',
    'Die bekannteste Folge im Pop. Sie heißt auch Axis-Folge, weil die Comedy-Band The Axis of Awesome damit 2009 Dutzende Hits in einem Medley verbunden hat. ' +
    'Sie läuft durch Pop, Rock, Country und Reggae, etwa in „I’m Yours“ von Jason Mraz, „Hey Soul Sister“ von Train, „Someone You Loved“ von Lewis Capaldi und „No Woman, No Cry“ von Bob Marley.', { quelle: 'Hooktheory und Wikipedia' });
  f('dark', 'Abwärts nach Moll', 'IV I vi iii', 'düster',
    'Die Folge endet auf dem Moll-Akkord iii statt auf der V, dadurch bleibt sie offen und etwas wehmütig. ' +
    'Hooktheory findet sie vor allem in Pop, R&B und Country: in Strophe und Refrain von „High Hopes“ von Panic! At The Disco, im Refrain von „Whatcha Say“ von Jason Derulo und von „Don’t You Wanna Stay“ von Jason Aldean. ' +
    'Auch der Schluss von „Bohemian Rhapsody“ von Queen nutzt sie.');
  f('pop', 'Heimweg über die vi', 'IV vi V I', 'poppig',
    'Sie beginnt auf der IV und landet erst am Ende auf der I, deshalb klingt jeder Durchgang wie ein Ankommen. ' +
    'Typisch für Pop-Rock und Dance-Pop: „Shut Up and Dance“ von Walk The Moon und „Dynamite“ von Taio Cruz nutzen sie im Refrain, „Raise Your Glass“ von Pink und „Stitches“ von Shawn Mendes in der Strophe.');
  f('emotional', 'Pop-Akkorde ab der IV', 'IV I vi V', 'emotional',
    'Dieselben vier Akkorde wie die Pop-Folge, nur in anderer Reihenfolge. Weil sie auf der V endet, zieht sie immer weiter und passt zu großen Refrains in Pop, Indie und Country. ' +
    'Beispiele sind die Refrains von „Heat Waves“ von Glass Animals, „Beautiful Things“ von Benson Boone und „Some Nights“ von der Band Fun.');
  f('sad', 'Moll-Start auf der ii', 'ii vi IV V', 'traurig',
    'Eine seltenere Folge: Sie fängt mit zwei Moll-Akkorden an und wird erst danach heller. ' +
    'Hooktheory führt sie nur bei wenigen Songs, meist im Gitarrenpop und Indie, zum Beispiel in der Strophe von „And I Love Her“ von den Beatles und in der Bridge von „There She Goes“ von The La’s.');
  f('powerful', 'Aufstieg zur vi', 'IV V vi V', 'kraftvoll',
    'Der Bass steigt von der IV über die V zur vi und fällt zurück auf die V: eine Welle, die Schwung holt, gern vor oder in einem Refrain. ' +
    'Du hörst sie in Pop-Balladen und bei Singer-Songwritern, etwa in „Thinking Out Loud“ von Ed Sheeran, im Intro von „Let Her Go“ von Passenger und im Pre-Chorus von „Story of My Life“ von One Direction.');

  // ---------------------------------------------------------------- aus „Songwriting & Chords“
  f('doowop', 'Doo-Wop-Folge', 'I vi IV V', ['romantisch', 'eingängig'],
    'Die Folge der 50er und frühen 60er, benannt nach dem Doo-Wop, im Englischen auch „Heart and Soul“-Akkorde oder „Stand by Me“-Wechsel. ' +
    'Wikipedia nennt unter anderem „Earth Angel“ von The Penguins, „Blue Moon“ von The Marcels und „Every Breath You Take“ von The Police. ' +
    'Laut Hooktheory steht sie auch im Pre-Chorus von „Perfect“ von Ed Sheeran.', { quelle: 'Wikipedia und Hooktheory' });
  f('poploop', 'Pop-Loop', 'I IV vi V', ['fröhlich', 'eingängig'],
    'Ein Klassiker in Pop und Pop-Rock, der nach der Moll-Stufe vi über die V wieder Schwung holt. ' +
    'Hooktheory findet ihn etwa im Refrain von „Shut Up and Dance“ von Walk The Moon und von „What Makes You Beautiful“ von One Direction, Wikipedia nennt „More Than a Feeling“ von Boston.', { quelle: 'Hooktheory und Wikipedia' });
  f('rocknroll', 'Rock’n’Roll-Loop', 'I IV V IV', ['fröhlich', 'kraftvoll'],
    'Drei Akkorde, die hin und zurück pendeln: das Gerüst vieler Rock’n’Roll- und Rocksongs, auch im Reggae-Pop. ' +
    'Laut Hooktheory trägt die Folge „Wild Thing“ von The Troggs, den Refrain von „Everybody Talks“ von Neon Trees und „Cheerleader“ von OMI.');
  f('heavensdoor', 'Heaven’s-Door-Folge', 'I V ii I V IV', ['entspannt', 'melancholisch'],
    'Bob Dylan schrieb „Knockin’ on Heaven’s Door“ 1973 für den Western „Pat Garrett and Billy the Kid“, Wikipedia ordnet den Song Folk-Rock und Gospel zu. ' +
    'Die Folge pendelt zweimal zwischen I und V und landet einmal auf der Moll-Stufe ii, einmal auf der IV: in G-Dur also G, D, Am und G, D, C. ' +
    'Bekannte Fassungen stammen von Eric Clapton (1975) und Guns N’ Roses (1992).', { quelle: 'Wikipedia und Hooktheory' });
  f('blues12', '12-Takt-Blues', 'I7 I7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7', ['groovig', 'entspannt'],
    'Das Grundschema des Blues: zwölf Takte, drei Septakkorde, ein Akkord pro Takt. ' +
    'Daraus wuchsen Rhythm and Blues, Boogie-Woogie, Rock’n’Roll und Blues-Rock, im Jazz ist es die Form vieler Bebop-Stücke wie „Billie’s Bounce“ von Charlie Parker. ' +
    'Ein bekanntes Rock’n’Roll-Beispiel ist „Johnny B. Goode“ von Chuck Berry.',
    { quelle: 'Wikipedia und MusicRadar', zeilen: 4, hinweis: 'Ein Akkord pro Takt, gelesen wie ein Text: drei Zeilen mit je vier Takten. Alle drei Akkorde sind Septakkorde, das gibt den typischen Blues-Klang.' });

  // ---------------------------------------------------------------- Tonart und Akkorde einer Folge
  function tonart(folge, pc) { var d = SC.key(pc); return { lesen: d, heim: d }; }
  function akkorde(folge, pc) {
    var k = SC.key(pc);
    return folge.stufen.map(function (s) { return SC.stufeZuAkkord(s, k); });
  }
  function stufenText(folge) { return folge.stufen.join(' – '); }

  return { folgen: folgen, tonart: tonart, akkorde: akkorde, stufenText: stufenText };
})();
