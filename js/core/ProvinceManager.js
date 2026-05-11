// js/core/ProvinceManager.js

class Province {
    constructor(owner) {
        this.owner = owner;
        this.hexes = [];
        this.gold = 0;
        this.income = 0;
        this.upkeep = 0;
        this.capitalHex = null;
    }

    calculateEconomy() {
        this.income = 0;
        this.upkeep = 0;
        this.capitalHex = null;

        // Először megkeressük a fővárost, hogy beolvassuk az aranyat
        for (let hex of this.hexes) {
            if (hex.building === 'capital') {
                this.capitalHex = hex;
                // A fővárosban tárolt aranyat átemeljük a tartományba
                this.gold = hex.gold || 0; 
                this.income += 5;
            } else if (!hex.hasTree) {
                this.income += 1;
            }

            if (hex.unit) {
                const upkeepCosts = { 1: 2, 2: 6, 3: 18, 4: 54 };
                this.upkeep += upkeepCosts[hex.unit.level] || 0;
            }
        }
    }
}

class ProvinceManager {
    constructor(board) {
        this.board = board;
        this.provinces = [];
    }

    // A "Mágia": Szélességi keresés (BFS) a területek feltérképezésére
    updateProvinces() {
        this.provinces = [];
        let visited = new Set();

        for (let hex of this.board.hexList) {
            // Csak a játékosok által birtokolt, még nem vizsgált mezőkből indulunk
            if (hex.owner !== null && !visited.has(hex)) {
                
                let newProvince = new Province(hex.owner);
                let queue = [hex];
                visited.add(hex);

                // BFS bejárás (Megkeresi az összes összefüggő azonos színű mezőt)
                while (queue.length > 0) {
                    let currentHex = queue.shift();
                    newProvince.hexes.push(currentHex);
                    currentHex.province = newProvince; // Ráakasztjuk a hexára is a provinciáját

                    // Szomszédok vizsgálata
                    let neighbors = this.board.getNeighbors(currentHex);
                    for (let neighbor of neighbors) {
                        // Ha azonos színű és még nem láttuk, betesszük a sorba
                        if (neighbor.owner === hex.owner && !visited.has(neighbor)) {
                            visited.add(neighbor);
                            queue.push(neighbor);
                        }
                    }
                }

                // Gazdaság kiszámolása az új provinciára
                newProvince.calculateEconomy();
                this.provinces.push(newProvince);
            } else if (hex.owner === null) {
                // Semleges területnek nincs provinciája
                hex.province = null;
            }
        }

        console.log(`BFS lefutott! Kialakult Provinciák száma: ${this.provinces.length}`);
    }
    // js/core/ProvinceManager.js -> ProvinceManager osztályon belül

    // js/core/ProvinceManager.js -> ProvinceManager osztályon belül

    endTurnEconomy(player) {
        // 1. Frissítjük a tartományokat és beolvassuk a jelenlegi aranyat
        this.updateProvinces(); 
        
        for (let prov of this.provinces) {
            if (prov.owner === player && prov.capitalHex) {
                // 2. Hozzáadjuk a tiszta profitot
                const profit = prov.income - prov.upkeep;
                prov.gold += profit;
                
                // 3. Csődkezelés
                if (prov.gold < 0) {
                    for (let hex of prov.hexes) { hex.unit = null; }
                    prov.gold = 0;
                }

                // 4. KRITIKUS LÉPÉS: Elmentjük a mezőre, különben elveszik!
                prov.capitalHex.gold = prov.gold;
            }
        }
    }
}