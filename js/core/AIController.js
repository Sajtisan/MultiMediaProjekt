class AIController {
    /**
     * Létrehozza a gépi ellenfelek vezérléséért felelős egységet.
     * @param {GameController} gameController - A központi játékvezérlő referenciája.
     */
    constructor(gameController) {
        this.game = gameController;
    }

    /**
     * Végrehajtja az AI játékos logikáját (Mozgás, Támadás, Építés, Toborzás).
     * @param {Player} player - Az aktuális AI játékos objektuma.
     * @modifies {Hexagon, Province} - Egységeket mozgat, területeket foglal, aranyat von le/ad hozzá.
     * @calls {Pathfinder.calculateReachableHexes, ProvinceManager.updateProvinces, Renderer.render, GameController.endTurn}
     */
    takeTurn(player) {
        // ==========================================
        // 1. FÁZIS: MOZGATÁS ÉS TÁMADÁS
        // ==========================================
        for (let hex of this.game.board.hexList) {
            // Ha a mi egységünk és tud még lépni
            if (hex.owner === player && hex.unit && hex.unit.currentMovement > 0) {
                
                this.game.pathfinder.calculateReachableHexes(hex);
                
                if (this.game.reachableHexes && this.game.reachableHexes.size > 0) {
                    let bestTarget = null;
                    let bestScore = -1;
                    for (let [targetHex, data] of this.game.reachableHexes) {
                        let score = 0;
                        if (targetHex.owner !== player) {
                            if (targetHex.owner === null) {
                                score = 40;
                            } else {
                                score = 80;
                                if (targetHex.building === 'capital') score = 300;
                                if (targetHex.building && targetHex.building.startsWith('tower')) score = 120;
                                if (targetHex.building === 'house') score = 100;
                            }
                            if (targetHex.hasTree) score += 15;
                        } else if (targetHex.unit && targetHex.unit !== hex.unit) {
                            if (hex.unit.level + targetHex.unit.level <= 4) {
                                score = 20; 
                            }
                        }
                        if (score > bestScore) {
                            bestScore = score;
                            bestTarget = { hex: targetHex, path: data.path, cost: data.cost };
                        }
                    }
                    if (bestTarget && bestScore > 0) {
                        const unit = hex.unit;
                        for (let stepHex of bestTarget.path) {
                            if (stepHex.owner !== player && stepHex.owner !== null) {
                                if (stepHex.building === 'capital' && hex.province) {
                                    const loot = stepHex.gold || 0;
                                    hex.province.gold += loot;
                                    if (hex.province.capitalHex) hex.province.capitalHex.gold += loot;
                                }
                                stepHex.unit = null;
                                stepHex.building = null;
                            }
                            stepHex.owner = player;
                            stepHex.hasTree = false;
                        }
                        if (bestTarget.hex.unit && bestTarget.hex.owner === player) {
                            bestTarget.hex.unit.level += unit.level;
                            bestTarget.hex.unit.currentMovement = 0;
                        } else {
                            bestTarget.hex.unit = unit;
                           bestTarget.hex.unit.currentMovement -= bestTarget.cost;
                        }
                        hex.unit = null;
                    }
                }
                this.game.reachableHexes = new Map();
            }
        }
        // ==========================================
        // 2. FÁZIS: GAZDASÁG ÉS VÁSÁRLÁS
        // ==========================================
        for (let prov of this.game.provinceManager.provinces) {
            if (prov.owner === player && prov.capitalHex) {
                prov.calculateEconomy();
                while (prov.capitalHex.gold >= 10) {
                    if (prov.income - prov.upkeep < -5) break; 
                    let boughtSomething = false;
                    let gold = prov.capitalHex.gold;
                    let internalHexes = prov.hexes.filter(h => 
                        h.unit === null && h.building === null && !h.hasTree &&
                        !this.game.board.getNeighbors(h).some(n => n.owner !== player)
                    );
                    if (internalHexes.length > 0 && gold >= 12 && Math.random() < 0.4) {
                        let target = internalHexes[Math.floor(Math.random() * internalHexes.length)];
                        target.building = 'house';
                        prov.capitalHex.gold -= 12;
                        boughtSomething = true;
                    }
                    // --- 2. Védelem (Kidobó/ZH/Rendőr) a határokra ---
                    if (!boughtSomething) {
                        let borderHexes = prov.hexes.filter(h => 
                            h.unit === null && h.building === null && !h.hasTree &&
                            this.game.board.getNeighbors(h).some(n => n.owner !== player)
                        );
                        if (borderHexes.length > 0 && gold >= 15) {
                            let target = borderHexes[Math.floor(Math.random() * borderHexes.length)];
                            if (gold >= 70 && Math.random() < 0.1) {
                                target.building = 'tower3'; prov.capitalHex.gold -= 70; boughtSomething = true;
                            } else if (gold >= 35 && Math.random() < 0.15) {
                                target.building = 'tower2'; prov.capitalHex.gold -= 35; boughtSomething = true;
                            } else if (gold >= 15 && Math.random() < 0.25) {
                                target.building = 'tower1'; prov.capitalHex.gold -= 15; boughtSomething = true;
                            }
                        }
                    }
                    // --- 3. Katona toborzása (Csöves vagy Egyetemista) ---
                    if (!boughtSomething) {
                        let borderHexes = prov.hexes.filter(h => 
                            h.unit === null && h.building === null && !h.hasTree &&
                            this.game.board.getNeighbors(h).some(n => n.owner !== player)
                        );
                        if (borderHexes.length > 0) {
                            let target = borderHexes[Math.floor(Math.random() * borderHexes.length)];
                            let level = 1;
                            let cost = 10;
                            if (gold >= 20 && (prov.income - prov.upkeep > 10)) {
                                level = 2; cost = 20;
                            }
                            target.unit = new Unit(player, level);
                            target.unit.currentMovement = 0;
                            prov.capitalHex.gold -= cost;
                            boughtSomething = true;
                        }
                    }
                    if (!boughtSomething) break;
                    prov.calculateEconomy(); 
                }
            }
        }
        this.game.provinceManager.updateProvinces();
        this.game.render();
        setTimeout(() => {
            this.game.endTurn();
        }, 500);
    }
}