// js/core/GameBoard.js

class GameBoard {
    constructor(canvasWidth, canvasHeight, hexSize) {
        this.hexagons = new Map(); // Gyorsabb keresés koordináta alapján ("q,r" kulccsal)
        this.hexList = []; // Sorrendi bejáráshoz
        
        this.generateMap(canvasWidth, canvasHeight, hexSize);
    }

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

    // Segédfüggvény: egy hatszög összes szomszédjának lekérése
    getNeighbors(hex) {
        // Megnézzük, hogy páros (0) vagy páratlan (1) oszlopban van-e a hatszög
        const parity = hex.q & 1; 
        
        // Relatív koordináta eltolások táblázata (dq, dr)
        // Az irányok sorrendje: jobb-le, jobb-fel, fel, bal-fel, bal-le, le
        const offsets = [
            // Páros oszlopok (q % 2 == 0) eltolásai
            [[+1,  0], [+1, -1], [0, -1], [-1, -1], [-1,  0], [0, +1]],
            // Páratlan oszlopok (q % 2 != 0) eltolásai
            [[+1, +1], [+1,  0], [0, -1], [-1,  0], [-1, +1], [0, +1]]
        ];

        const neighbors = [];
        const currentOffsets = offsets[parity];

        for (let [dq, dr] of currentOffsets) {
            const nq = hex.q + dq;
            const nr = hex.r + dr;
            
            const neighbor = this.hexagons.get(`${nq},${nr}`);
            // Csak akkor adjuk hozzá, ha létezik a mező és játszható (nem lyuk)
            if (neighbor && neighbor.isPlayable) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }

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

    // Játékos kezdőterületének (5 hex) kiosztása
    setupPlayerStart(player) {
        let validStart = false;
        let capitalHex = null;

        // Keresünk egy érvényes középpontot
        while (!validStart) {
            capitalHex = this.hexList[Math.floor(Math.random() * this.hexList.length)];
            
            // Ha a mező nem játszható, vagy már valakié, keresünk tovább
            if (!capitalHex.isPlayable || capitalHex.owner !== null) continue;

            let neighbors = this.getNeighbors(capitalHex);
            
            // Csak akkor jó a bázis, ha van legalább 4 szabad szomszédja (így meglesz az 5 kezdőterület)
            let freeNeighbors = neighbors.filter(n => n.owner === null);
            if (freeNeighbors.length >= 4) {
                validStart = true;
                
                // Beállítjuk a fővárost
                capitalHex.owner = player;
                capitalHex.building = 'capital';
                capitalHex.hasTree = false; // Kivágjuk a fát a főváros alatt
                capitalHex.gold = 10;

                // Elfoglaljuk a 4 szomszédot
                for (let i = 0; i < 4; i++) {
                    freeNeighbors[i].owner = player;
                    freeNeighbors[i].hasTree = false; // Kezdőterületen nincsenek fák
                }

                let randomSpawnHex = freeNeighbors[Math.floor(Math.random() * 4)];
                randomSpawnHex.unit = new Unit(player, 1);
            }
        }
    }

    draw(ctx) {
        for (let hex of this.hexList) {
            hex.draw(ctx);
        }
    }

    // GameBoard.js bővítése
    getHexAt(px, py) {
        for (let hex of this.hexList) {
            if (hex.isPlayable && hex.isPointInside(px, py)) {
                return hex;
            }
        }
        return null;
    }


    getHexDefense(hex) {
        // Ha semleges terület, nincs védelme
        if (hex.owner === null) return 0;

        let maxDef = 0;

        // 1. Saját maga vizsgálata
        if (hex.unit) maxDef = Math.max(maxDef, hex.unit.level);
        if (hex.building === 'capital') maxDef = Math.max(maxDef, 1);
        if (hex.building === 'tower') maxDef = Math.max(maxDef, 2);

        // 2. Szomszédok vizsgálata (A Védőháló)
        let neighbors = this.getNeighbors(hex);
        for (let n of neighbors) {
            // Csak a saját színű szomszédok tudnak védeni
            if (n.owner === hex.owner) {
                if (n.unit) maxDef = Math.max(maxDef, n.unit.level);
                if (n.building === 'capital') maxDef = Math.max(maxDef, 1);
                if (n.building === 'tower') maxDef = Math.max(maxDef, 2);
            }
        }

        return maxDef;
    }

    spreadTrees() {
        let newTrees = []; // Ebbe gyűjtjük az új fákat, hogy ne szaporodjanak duplán egy körben
        
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
        
        // Az új fák "elültetése"
        for (let hex of newTrees) {
            hex.hasTree = true;
        }
        
        if (newTrees.length > 0) {
            console.log(`${newTrees.length} új fa nőtt ki a térképen!`);
        }
    }
}