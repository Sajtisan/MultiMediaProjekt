# Spíd

## Gyoker konyvtar
- index.html: A jatek alapveto HTML szerkezete es a felhasznaloi felulet elemeinek definialasa.
- README.md: A projekt altalanos leirasa es a fajlok feladatai.

## CSS konyvtar
- css/style.css: A vizualis megjelenesert, a menuk es a jatekfelulet stilusaert felelos fajl.

## JavaScript konyvtar (js/)
- js/main.js: A JavaScript belepesi pontja, az esemenykezelok es a jatek inicializalasa.

### Core rendszerek (js/core/)
- js/core/GameConfig.js: Konfiguracios adatok, az egysegek es epuletek statisztikai beallitasai.
- js/core/GameController.js: A jatek kozponti vezerloje, amely osszehangolja a kulonbozo alrendszereket.
- js/core/GameBoard.js: A palya generalasa, a hatszogracs kezelese es a szomszedsagi kapcsolatok logikaja.
- js/core/ProvinceManager.js: Az osszefuggo teruletek keresese (BFS), a tartomanyok kezelese es a gazdasag szamitasa.
- js/core/Pathfinder.js: Az utvonaltervezo algoritmus, amely kiszamitja az egysegek lephetoseget.
- js/core/Renderer.js: A grafikus megjelenitesert, a Canvas rajzolasaert es az animaciokert felelos motor.
- js/core/AudioManager.js: A hangeffektusok es a hatterzene kezelese, valamint a bongeszo audio-blokkolasanak feloldasa.
- js/core/HistoryManager.js: A visszavonas (Undo) rendszer, amely menti es visszaallitja a kor korabbi allapotait.
- js/core/GameOverManager.js: A jatek vegenek (gyozelem vagy vereseg) detektalasa es kezelese.

### Entitasok (js/entities/)
- js/entities/Player.js: A jatekosok es klanok adatait tarolo osztaly.
- js/entities/Unit.js: Az egysegek (katonak) tulajdonsagai, szintjei es megjelenitese.
- js/entities/Building.js: Az epuletek (kocsmak, italboltok, tornyok) kirajzolasaert felelos osztaly.
- js/entities/Hexagon.js: Egy hatszog mezo adatait, a rajta levo targyakat es az alapveto rajzolast kezelo fajl.

## Audio konyvtar:
* [Win sfx](https://www.youtube.com/watch?v=idA7RsiOpqA)
* [Lose sfx](https://www.youtube.com/watch?v=fmFZRcUl5jE)
* [Footsteps sfx](https://www.youtube.com/watch?v=oAmDyjtuzjo)
* [Kill sfx](https://www.youtube.com/watch?v=eOqNYENo4VA)
* [Item bought sfx](https://www.youtube.com/watch?v=uiBkqnBh-B0)
* [Background music](https://www.youtube.com/watch?v=3OfGhUM-BCQ&list=RD3OfGhUM-BCQ&start_radio=1)
* [Punch](https://www.youtube.com/watch?v=KZcC1oK291I)