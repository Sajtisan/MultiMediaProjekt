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

        for (let hex of this.hexes) {
            if (hex.building === 'capital') {
                this.income += GameConfig.buildings['capital'].income;
                this.capitalHex = hex;
                this.gold = hex.gold || 0; 
            } else if (hex.building) {
                // Ha van épület, kiolvassuk a configból a bevételét
                this.income += GameConfig.buildings[hex.building].income;
            } else if (!hex.hasTree) {
                this.income += 1; // Üres terület alapbevétele
            }

            if (hex.unit) {
                // Zsold kiolvasása a configból
                this.upkeep += GameConfig.units[hex.unit.level].upkeep;
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

                // --- KETTÉSZAKADÁS ÉS EGYESÜLÉS KEZELÉSE ---
                // Megszámoljuk, hány Kocsma (főváros) van az új tartományban
                let capitals = newProvince.hexes.filter(h => h.building === 'capital');

                if (capitals.length === 0 && newProvince.hexes.length > 0) {
                    // 1. ESET: KETTÉSZAKADÁS (Nincs főváros)
                    // Keresünk egy alkalmas helyet az új szükség-fővárosnak
                    let newCapitalHex = newProvince.hexes.find(h => h.unit === null && h.building === null && !h.hasTree);
                    
                    if (!newCapitalHex) {
                        newCapitalHex = newProvince.hexes[0];
                        newCapitalHex.unit = null;
                        newCapitalHex.hasTree = false;
                    }

                    newCapitalHex.building = 'capital';
                    newCapitalHex.gold = 0; // Az új tartomány nulláról indul
                    console.log(`${newProvince.owner.name} területe kettészakadt! Új Kocsma jött létre.`);
                } 
                else if (capitals.length > 1) {
                    // 2. ESET: EGYESÜLÉS (Több kocsma lett egy tartományban)
                    // Az első Kocsmát megtartjuk, a többi aranyát beleöntjük, majd lebontjuk őket
                    let mainCapital = capitals[0];
                    for (let i = 1; i < capitals.length; i++) {
                        mainCapital.gold = (mainCapital.gold || 0) + (capitals[i].gold || 0);
                        capitals[i].building = null;
                        capitals[i].gold = 0;
                    }
                    console.log(`${newProvince.owner.name} tartományai egyesültek! Összesített vagyon: ${mainCapital.gold}G`);
                }

                // Gazdaság újraszámolása a frissített Kocsmával
                newProvince.calculateEconomy();
                this.provinces.push(newProvince);

            } else if (hex.owner === null) {
                // Semleges területnek nincs provinciája
                hex.province = null;
            }
        }

        console.log(`BFS lefutott! Kialakult Provinciák száma: ${this.provinces.length}`);
    }
    // js/core/ProvinceManager.js -> ProvinceManager osztály

    endTurnEconomy(player) {
        this.updateProvinces(); 
        
        let playerHasTerritory = false;

        for (let prov of this.provinces) {
            // Csak akkor vizsgáljuk, ha az adott játékosé a terület
            if (prov.owner === player) {
                
                // Mivel találtunk a nevén tartományt, biztosan életben marad a kör végén!
                playerHasTerritory = true; 

                const profit = prov.income - prov.upkeep;
                prov.gold += profit;

                // CSŐD ELLENŐRZÉSE: Ha az arany negatívba fordul
                if (prov.gold < 0) {
                    console.log(`${player.name} csődbe ment! Minden katona elhagyta a posztját.`);
                    
                    // Minden egység (troop) meghal a tartományban, de az épületek és mezők maradnak!
                    for (let hex of prov.hexes) {
                        hex.unit = null; 
                    }
                    
                    // Kincstár nullázása (nincs adósság a következő körre)
                    prov.gold = 0; 
                }
                
                // Akár volt csőd, akár nem, elmentjük a frissített kincstárat a Fővárosba
                if (prov.capitalHex) {
                    prov.capitalHex.gold = prov.gold;
                }
            }
        }
        
        // Visszaadjuk, hogy maradt-e egyáltalán területe (ha false, csak akkor esik ki a játékból)
        return playerHasTerritory; 
    }
}