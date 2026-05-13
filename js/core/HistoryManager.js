// js/core/HistoryManager.js

class HistoryManager {
    constructor(game) {
        this.game = game;
        this.turnHistory = [];
    }

    saveState() {
        const state = {
            hexes: this.game.board.hexList.map(h => ({
                ownerId: h.owner ? h.owner.id : null, 
                unitLevel: h.unit ? h.unit.level : null,
                building: h.building,
                gold: h.gold,
                hasTree: h.hasTree
            }))
        };
        this.turnHistory.push(JSON.stringify(state));
    }

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
            } else {
                hex.unit = null;
            }
        });

        this.game.provinceManager.updateProvinces();
        this.game.render();
        this.game.ui.update(); // Szólunk a UI managernek, hogy frissítsen
    }

    clear() {
        this.turnHistory = [];
    }
}