class Province {
    /**
     * Létrehoz egy új, összefüggő tartományt.
     * @param {Player} owner - A tartomány tulajdonosa.
     * @modifies {Province.hexes, Province.gold} - Inicializálja a tartomány adatait.
     */
    constructor(owner) {
        this.owner = owner;
        this.hexes = [];
        this.gold = 0;
        this.income = 0;
        this.upkeep = 0;
        this.capitalHex = null;
    }

    /**
     * Kiszámolja a tartomány aktuális bevételét, kiadását, és frissíti a főváros referenciáját.
     * @modifies {Province.income, Province.upkeep, Province.capitalHex, Province.gold} - Frissíti a gazdasági mutatókat.
     */
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
                this.income += GameConfig.buildings[hex.building].income;
            } else if (!hex.hasTree) {
                this.income += 1;
            }
            if (hex.unit) {
                this.upkeep += GameConfig.units[hex.unit.level].upkeep;
            }
        }
    }
}

class ProvinceManager {
    /**
     * Inicializálja a tartományok kezeléséért felelős rendszert.
     * @param {GameBoard} board - A játéktábla referenciája.
     */
    constructor(board) {
        this.board = board;
        this.provinces = [];
    }

    /**
     * Szélességi keresés (BFS) a területek feltérképezésére. Egyesíti az összeérő tartományokat, 
     * és újat hoz létre, ha egy terület kettészakad.
     * @modifies {ProvinceManager.provinces, Hexagon.province, Hexagon.building, Hexagon.gold} - Újraépíti a tartomány-hálózatot.
     * @calls {Province.calculateEconomy}
     */
    updateProvinces() {
        this.provinces = [];
        let visited = new Set();
        for (let hex of this.board.hexList) {
            if (hex.owner !== null && !visited.has(hex)) {
                let newProvince = new Province(hex.owner);
                let queue = [hex];
                visited.add(hex);
                while (queue.length > 0) {
                    let currentHex = queue.shift();
                    newProvince.hexes.push(currentHex);
                    currentHex.province = newProvince;
                    let neighbors = this.board.getNeighbors(currentHex);
                    for (let neighbor of neighbors) {
                        if (neighbor.owner === hex.owner && !visited.has(neighbor)) {
                            visited.add(neighbor);
                            queue.push(neighbor);
                        }
                    }
                }
                let capitals = newProvince.hexes.filter(h => h.building === 'capital');
                if (capitals.length === 0 && newProvince.hexes.length > 0) {
                    let newCapitalHex = newProvince.hexes.find(h => h.unit === null && h.building === null && !h.hasTree);
                    if (!newCapitalHex) {
                        newCapitalHex = newProvince.hexes[0];
                        newCapitalHex.unit = null;
                        newCapitalHex.hasTree = false;
                    }
                    newCapitalHex.building = 'capital';
                    newCapitalHex.gold = 0;
                }
                else if (capitals.length > 1) {
                    let mainCapital = capitals[0];
                    for (let i = 1; i < capitals.length; i++) {
                        mainCapital.gold = (mainCapital.gold || 0) + (capitals[i].gold || 0);
                        capitals[i].building = null;
                        capitals[i].gold = 0;
                    }
                }
                newProvince.calculateEconomy();
                this.provinces.push(newProvince);
            } else if (hex.owner === null) {
                hex.province = null;
            }
        }
    }

    /**
     * A kör végi gazdasági elszámolást végzi: hozzáadja a profitot és kezeli a csődöt.
     * @param {Player} player - Az éppen kört befejező játékos.
     * @returns {boolean} Igaz, ha a játékosnak maradt még területe, különben hamis.
     * @modifies {Province.gold, Hexagon.unit, Hexagon.gold} - Növeli a kincstárat, vagy csőd esetén törli a katonákat.
     * @calls {ProvinceManager.updateProvinces}
     */
    endTurnEconomy(player) {
        this.updateProvinces();
        let playerHasTerritory = false;
        for (let prov of this.provinces) {
            if (prov.owner === player) {
                playerHasTerritory = true;
                const profit = prov.income - prov.upkeep;
                prov.gold += profit;
                if (prov.gold < 0) {
                    for (let hex of prov.hexes) {
                        hex.unit = null;
                    }
                    prov.gold = 0;
                }
                if (prov.capitalHex) {
                    prov.capitalHex.gold = prov.gold;
                }
            }
        }
        return playerHasTerritory;
    }
}