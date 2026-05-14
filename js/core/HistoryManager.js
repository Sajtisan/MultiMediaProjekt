class HistoryManager {
    /**
     * Létrehozza a visszavonási (undo) rendszert kezelő objektumot.
     * @param {GameController} game - A központi játékvezérlő referenciája.
     * @modifies {HistoryManager.turnHistory} - Inicializálja az üres előzménytömböt.
     */
    constructor(game) {
        this.game = game;
        this.turnHistory = [];
    }

    /**
     * Elmenti a pálya aktuális állapotát (tulajdonosok, egységek, épületek, arany) a visszavonási (undo) verembe.
     * @modifies {HistoryManager.turnHistory} - Egy új, JSON-be csomagolt állapotot ad a tömb végéhez.
     */
    saveState() {
        const state = {
            hexes: this.game.board.hexList.map(h => ({
                ownerId: h.owner ? h.owner.id : null, 
                unitLevel: h.unit ? h.unit.level : null,
                unitMovement: h.unit ? h.unit.currentMovement : null,
                building: h.building,
                gold: h.gold,
                hasTree: h.hasTree
            }))
        };
        this.turnHistory.push(JSON.stringify(state));
    }
    
    /**
     * Visszaállítja a játékteret a legutolsó elmentett állapotra (Undo funkció a játékos körén belül).
     * @modifies {HistoryManager.turnHistory, Hexagon} - Kiveszi az utolsó mentést a veremből, és felülírja a mezők tulajdonságait.
     * @calls {ProvinceManager.updateProvinces, Renderer.render, UIManager.update}
     */
    undo() {
        if (this.turnHistory.length === 0) return;

        const lastState = JSON.parse(this.turnHistory.pop());
        
        lastState.hexes.forEach((savedHex, index) => {
            const hex = this.game.board.hexList[index];
            
            hex.owner = savedHex.ownerId !== null ? this.game.players[savedHex.ownerId] : null;
            hex.building = savedHex.building;
            hex.gold = savedHex.gold;
            hex.hasTree = savedHex.hasTree;
            
            if (savedHex.unitLevel) {
                hex.unit = new Unit(hex.owner, savedHex.unitLevel);
                if (savedHex.unitMovement != null)
                hex.unit.currentMovement = savedHex.unitMovement;
            } else {
                hex.unit = null;
            }
        });
        this.game.selectedHex = null;
        this.game.reachableHexes = new Map();
        this.game.provinceManager.updateProvinces();
        this.game.render();
        this.game.ui.update();
    }

    /**
     * Teljesen törli az eddigi visszavonási előzményeket. (Általában a körök végén, az `endTurn` során hívódik meg).
     * @modifies {HistoryManager.turnHistory} - Kiüríti a tömböt.
     */
    clear() {
        this.turnHistory = [];
    }
}