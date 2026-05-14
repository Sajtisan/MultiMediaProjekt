class GameBoard {
    /**
     * Létrehozza a játéktáblát és elindítja a procedurális térképgenerálást.
     * @param {number} canvasWidth - A vászon szélessége pixelben.
     * @param {number} canvasHeight - A vászon magassága pixelben.
     * @param {number} hexSize - A hatszögek sugara.
     * @modifies {GameBoard.hexagons, GameBoard.hexList} - Feltölti a pálya belső adatszerkezeteit.
     * @calls {GameBoard.generateMap}
     */
    constructor(canvasWidth, canvasHeight, hexSize) {
        this.hexagons = new Map();
        this.hexList = [];
        this.generateMap(canvasWidth, canvasHeight, hexSize);
    }


    /**
     * Legenerálja a kezdeti hatszögrácsot, a lyukakat és az erdőket.
     * @param {number} width - A játéktér (canvas) szélessége.
     * @param {number} height - A játéktér (canvas) magassága.
     * @param {number} hexSize - Egyetlen hatszög mérete.
     * @modifies {GameBoard.hexagons, GameBoard.hexList} - Feltölti a pálya adatszerkezeteit.
     * @calls {Hexagon, GameBoard.generateForests}
     */
    generateMap(width, height, hexSize) {
        const cols = Math.floor(width / (hexSize * 1.5));
        const rows = Math.floor(height / (hexSize * Math.sqrt(3)));
        const startX = hexSize;
        const startY = hexSize * Math.sqrt(3) / 2;

        // 1. Alap rács legenerálása
        for (let q = 0; q < cols; q++) {
            for (let r = 0; r < rows; r++) {
                let x = startX + q * (hexSize * 1.5);
                let y = startY + r * (hexSize * Math.sqrt(3));
                if (q % 2 !== 0) y += (hexSize * Math.sqrt(3)) / 2;

                const hex = new Hexagon(q, r, x, y, hexSize);
                this.hexagons.set(`${q},${r}`, hex);
                this.hexList.push(hex);
            }
        }
        // 2. Lyukak fúrása a pályába (kb 10% eséllyel)
        for (let hex of this.hexList) {
            if (Math.random() < 0.10) {
                hex.isPlayable = false;
            }
        }
        // 3. Erdők (fák) generálása
        this.generateForests();
    }

    /**
     * Lekéri egy adott hatszög érvényes, játszható szomszédait.
     * @param {Hexagon} hex - A vizsgált hatszög.
     * @returns {Hexagon[]} A szomszédos hatszögek tömbje.
     */
    getNeighbors(hex) {
        // Megnézzük, hogy páros (0) vagy páratlan (1) oszlopban van-e a hatszög
        const parity = hex.q & 1;
        // Relatív koordináta eltolások táblázata (dq, dr)
        // Az irányok sorrendje: jobb-le, jobb-fel, fel, bal-fel, bal-le, le
        const offsets = [
            // Páros oszlopok (q % 2 == 0) eltolásai
            [[+1, 0], [+1, -1], [0, -1], [-1, -1], [-1, 0], [0, +1]],
            // Páratlan oszlopok (q % 2 != 0) eltolásai
            [[+1, +1], [+1, 0], [0, -1], [-1, 0], [-1, +1], [0, +1]]
        ];
        const neighbors = [];
        const currentOffsets = offsets[parity];
        for (let [dq, dr] of currentOffsets) {
            const nq = hex.q + dq;
            const nr = hex.r + dr;
            const neighbor = this.hexagons.get(`${nq},${nr}`);
            if (neighbor && neighbor.isPlayable) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }

    /**
     * Véletlenszerű erdő-klasztereket generál a pálya inicializálásakor.
     * @modifies {Hexagon.hasTree} - Beállítja a fát a kiválasztott mezőkön.
     * @calls {GameBoard.getNeighbors}
     */
    generateForests() {
        // Véletlenszerű magpontok, amik köré erdő nő
        const numForests = Math.floor(this.hexList.length * 0.05);

        for (let i = 0; i < numForests; i++) {
            let startHex = this.hexList[Math.floor(Math.random() * this.hexList.length)];
            if (!startHex.isPlayable) continue;

            startHex.hasTree = true;
            // Klaszteres növekedés: a szomszédok is esélyt kapnak
            let neighbors = this.getNeighbors(startHex);
            for (let n of neighbors) {
                if (Math.random() < 0.6) n.hasTree = true;
            }
        }
    }

    /**
     * Kiosztja egy játékos kezdőterületét (Kocsma + 4 szomszédos mező + 1 katona).
     * @param {Player} player - A játékos, akinek a területet osztjuk.
     * @modifies {Hexagon} - Módosítja a tulajdonost, épületet, aranyat és a fákat.
     * @calls {GameBoard.getNeighbors, Unit}
     */
    setupPlayerStart(player) {
        let validStart = false;
        let capitalHex = null;
        let attempts = 0;

        // Keresünk egy érvényes középpontot (max 1000 próbálkozás)
        while (!validStart && attempts < 1000) {
            attempts++;
            capitalHex = this.hexList[Math.floor(Math.random() * this.hexList.length)];

            // Ha a mező nem játszható, vagy már valakié, keresünk tovább
            if (!capitalHex.isPlayable || capitalHex.owner !== null) continue;

            let neighbors = this.getNeighbors(capitalHex);
            let freeNeighbors = neighbors.filter(n => n.owner === null);

            // Ha van 4 szabad hely, VAGY ha már 500-szor próbálkoztunk és van legalább 2 szabad hely (kicsi pálya esetén)
            if (freeNeighbors.length >= 4 || (attempts > 500 && freeNeighbors.length >= 2)) {
                validStart = true;

                // Beállítjuk a fővárost
                capitalHex.owner = player;
                capitalHex.building = 'capital';
                capitalHex.hasTree = false; // Kivágjuk a fát a főváros alatt
                capitalHex.gold = 10;
                // Elfoglaljuk a szabad szomszédokat (amennyi épp van, max 4-et)
                let toClaim = Math.min(4, freeNeighbors.length);
                for (let i = 0; i < toClaim; i++) {
                    freeNeighbors[i].owner = player;
                    freeNeighbors[i].hasTree = false;
                }
                // Kezdő katona lerakása
                if (toClaim > 0) {
                    let randomSpawnHex = freeNeighbors[Math.floor(Math.random() * toClaim)];
                    randomSpawnHex.unit = new Unit(player, 1);
                }
            }
        }
    }

    /**
     * Kirajzolja a pálya összes hatszögét a megadott canvas kontextusra.
     * @param {CanvasRenderingContext2D} ctx - A rajzolási kontextus (2D).
     * @modifies {Canvas} - Vizuálisan frissíti a vásznat (játékállapotot nem módosít).
     * @calls {Hexagon.draw}
     */
    draw(ctx) {
        for (let hex of this.hexList) {
            hex.draw(ctx);
        }
    }

    /**
     * Megkeresi a megadott pixel-koordinátán található játszható hatszöget.
     * @param {number} px - Az egér X koordinátája.
     * @param {number} py - Az egér Y koordinátája.
     * @returns {Hexagon|null} A megtalált hatszög, vagy null, ha nincs ott érvényes mező.
     * @calls {Hexagon.isPointInside}
     */
    getHexAt(px, py) {
        for (let hex of this.hexList) {
            if (hex.isPlayable && hex.isPointInside(px, py)) {
                return hex;
            }
        }
        return null;
    }

    /**
     * Kiszámolja egy mező maximális védelmi értékét a saját és szomszédos egységek/épületek alapján.
     * @param {Hexagon} hex - A vizsgált hatszög.
     * @returns {number} A mező védelmi pontszáma.
     * @calls {GameBoard.getNeighbors}
     */
    getHexDefense(hex) {
        if (hex.owner === null) return 0;
        let maxDef = 0;

        const checkDef = (h) => {
            let d = 0;
            if (h.unit) d = Math.max(d, h.unit.level);
            if (h.building && GameConfig.buildings[h.building]) {
                d = Math.max(d, GameConfig.buildings[h.building].defense);
            }
            return d;
        };

        maxDef = Math.max(maxDef, checkDef(hex));

        let neighbors = this.getNeighbors(hex);
        for (let n of neighbors) {
            if (n.owner === hex.owner) {
                maxDef = Math.max(maxDef, checkDef(n));
            }
        }
        return maxDef;
    }

    /**
     * Véletlenszerűen terjeszti a fákat a pálya üres mezőin (a körök végén hívódik meg).
     * @modifies {Hexagon.hasTree} - Beállítja az új fák helyét.
     * @calls {GameBoard.getNeighbors}
     */
    spreadTrees() {
        let newTrees = [];
        for (let hex of this.hexList) {
            if (hex.hasTree) {
                let neighbors = this.getNeighbors(hex);
                for (let n of neighbors) {
                    // Feltételek: 10% esély, játszható mező, nincs rajta fa, épület, se egység
                    if (!n.hasTree && n.unit === null && n.building === null && Math.random() < 0.1) {
                        newTrees.push(n);
                    }
                }
            }
        }
        for (let hex of newTrees) {
            hex.hasTree = true;
        }
    }
}