// js/core/GameController.js

class GameController {
    constructor(canvasId, hexSize, playerCount) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.board = new GameBoard(this.canvas.width, this.canvas.height, hexSize);
        this.setupPlayers(playerCount);

        for (let player of this.players) {
            this.board.setupPlayerStart(player);
        }

        this.currentPlayerIdx = 0;
        this.selectedHex = null;
        this.reachableHexes = new Map();

        // --- MANAGEREK ÉS RENDSZEREK INICIALIZÁLÁSA ---
        this.ui = new UIManager(this);
        this.history = new HistoryManager(this);
        this.aiController = new AIController(this);
        this.provinceManager = new ProvinceManager(this.board);
        this.pathfinder = new Pathfinder(this);
        this.renderer = new Renderer(this, this.ctx, this.canvas);
        this.gameOverManager = new GameOverManager(this);

        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        this.provinceManager.updateProvinces();
        this.render();
    }

    get currentPlayer() {
        if (!this.players || this.players.length === 0) return null;
        return this.players[this.currentPlayerIdx];
    }

    setupPlayers(numPlayers) {
        const allColors = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#00bcd4", "#9b59b6"];
        const allNames = ["Kék (Te)", "Piros (AI)", "Zöld (AI)", "Sárga (AI)", "Cián (AI)", "Lila (AI)"];

        this.players = [];
        for (let i = 0; i < numPlayers; i++) {
            this.players.push(new Player(i, allNames[i], allColors[i], i !== 0));
        }
    }

    // ==========================================
    // HIDAK (FACADES) A RÉGI HÍVÁSOKHOZ
    // ==========================================
    render() {
        if (this.renderer) this.renderer.render();
    }

    calculateReachableHexes(startHex) {
        if (this.pathfinder) this.pathfinder.calculateReachableHexes(startHex);
    }
    // ==========================================

    handleClick(e) {
        this.history.saveState();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clickedHex = this.board.getHexAt(x, y);
        if (!clickedHex) return;

        if (this.selectedHex && this.selectedHex.unit && this.reachableHexes && this.reachableHexes.has(clickedHex) && clickedHex !== this.selectedHex) {
            const routeData = this.reachableHexes.get(clickedHex);
            const unit = this.selectedHex.unit;

            for (let stepHex of routeData.path) {
                if (stepHex.owner !== this.currentPlayer && stepHex.owner !== null) {
                    stepHex.unit = null;
                    stepHex.building = null;
                }
                stepHex.owner = this.currentPlayer;
                if (stepHex.hasTree) {
                    stepHex.hasTree = false;
                }
            }

            if (clickedHex.unit && clickedHex.unit.owner === this.currentPlayer) {
                clickedHex.unit.level += unit.level;
                clickedHex.unit.currentMovement = 0;
            } else {
                clickedHex.unit = unit;
                unit.currentMovement -= routeData.cost;
            }

            this.selectedHex.unit = null;
            this.selectedHex = clickedHex;
            this.provinceManager.updateProvinces();
            this.calculateReachableHexes(this.selectedHex);
            if (this.gameOverManager) this.gameOverManager.checkGameState();
        }
        else if (clickedHex.owner === this.currentPlayer) {
            this.selectedHex = clickedHex;
            if (clickedHex.unit) {
                this.calculateReachableHexes(this.selectedHex);
            } else {
                this.reachableHexes = new Map();
            }
        }
        else {
            this.selectedHex = null;
            this.reachableHexes = new Map();
        }

        this.render();
        this.ui.update();
    }

    endTurn() {
        // Ha már vége a játéknak, senki ne csináljon semmit!
        if (this.gameOverManager.isGameOver) return; 

        // MENTÉS: Minden kör végén elmentjük az állást
        this.saveGame();

        this.history.clear();
        const isStillAlive = this.provinceManager.endTurnEconomy(this.currentPlayer);

        if (!isStillAlive) {
            console.log(`${this.currentPlayer.name} kiszorult a negyedből!`); // alert() helyett csak logolunk
            this.currentPlayer.isDead = true;
        }

        if (!this.currentPlayer.isDead) {
            for (let hex of this.board.hexList) {
                if (hex.unit && hex.unit.owner === this.currentPlayer) {
                    hex.unit.resetMovement();
                }
            }
        }

        this.board.spreadTrees();

        // JÁTÉK VÉGÉNEK ELLENŐRZÉSE! (Győzelem / Vereség)
        this.gameOverManager.checkGameState();

        // Ha az ellenőrzés során vége lett a játéknak, azonnal megállítjuk a kört
        if (this.gameOverManager.isGameOver) return;

        // Következő ÉLŐ játékos keresése
        this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
        while (this.players[this.currentPlayerIdx].isDead) {
            this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
        }

        this.selectedHex = null;
        this.render();
        this.ui.update();

        // AI indítása ha ő jön
        if (this.currentPlayer.isAI && !this.currentPlayer.isDead) {
            setTimeout(() => this.aiController.takeTurn(this.currentPlayer), 500);
        }
    }

    // js/core/GameController.js -> buyItem metódus frissítése

    buyItem(type, value, cost) {
        if (!this.selectedHex) {
            console.warn("Nincs kijelölt mező a vásárláshoz!");
            return;
        }
        if (!this.selectedHex.province) {
            console.warn("Ez a mező nem tartozik érvényes tartományhoz!");
            return;
        }

        if (this.selectedHex.unit !== null || this.selectedHex.building !== null || this.selectedHex.hasTree) {
            console.log("Ez a mező már foglalt!");
            return;
        }

        const prov = this.selectedHex.province;
        const capital = prov.hexes.find(h => h.building === 'capital');

        if (!capital) {
            console.error("Hiba: Ebben a tartományban nincs Kocsma!");
            return;
        }

        if (capital.gold >= cost) {
            this.history.saveState();
            capital.gold -= cost;
            prov.gold = capital.gold;

            if (type === 'unit') {
                this.selectedHex.unit = new Unit(this.currentPlayer, parseInt(value));
                this.selectedHex.unit.currentMovement = 0;
            } else if (type === 'building') {
                this.selectedHex.building = value;
            }

            this.provinceManager.updateProvinces();
            this.ui.update();
            this.render();
        } else {
            console.log(`Nincs elég pénz! Szükséges: ${cost}G, Van: ${capital.gold}G`);
        }
    }

    sellItem() {
        this.history.saveState();
        if (!this.selectedHex || !this.selectedHex.province) return;
        const prov = this.selectedHex.province;
        const capital = prov.hexes.find(h => h.building === 'capital');

        const refund = parseInt($('#sell-btn').data('refund')) || 0;

        if (capital) {
            capital.gold += refund;
            prov.gold = capital.gold;
        }

        if (this.selectedHex.unit) {
            this.selectedHex.unit = null;
        } else if (this.selectedHex.building && this.selectedHex.building !== 'capital') {
            this.selectedHex.building = null;
        }

        this.reachableHexes = new Map();
        this.provinceManager.updateProvinces();
        this.ui.update();
        this.render();
    }

    saveGame() {
        const saveData = {
            players: this.players,
            currentPlayerIdx: this.currentPlayerIdx,
            boardData: this.board.hexList.map(h => ({
                q: h.q, r: h.r,
                ownerId: h.owner ? h.owner.id : null,
                unitLevel: h.unit ? h.unit.level : null,
                building: h.building,
                gold: h.gold || 0,
                hasTree: h.hasTree
            }))
        };
        localStorage.setItem('spid_savegame', JSON.stringify(saveData));
        console.log("Játék mentve!");
    }

    loadGame() {
        const data = JSON.parse(localStorage.getItem('spid_savegame'));
        if (!data) {
            alert("Nincs mentett játék!");
            return false;
        }

        try {
            // Visszaállítjuk a köradatokat
            this.currentPlayerIdx = data.currentPlayerIdx;

            // Visszaállítjuk a hexákat
            data.boardData.forEach(savedHex => {
                let hex = this.board.hexList.find(h => h.q === savedHex.q && h.r === savedHex.r);
                if (hex) {
                    hex.owner = savedHex.ownerId !== null ? this.players[savedHex.ownerId] : null;
                    hex.building = savedHex.building;
                    hex.hasTree = savedHex.hasTree;
                    hex.gold = savedHex.gold;
                    if (savedHex.unitLevel) {
                        hex.unit = new Unit(hex.owner, savedHex.unitLevel);
                    } else {
                        hex.unit = null;
                    }
                }
            });

            // Újraépítjük a tartományi rendszert a betöltött adatok alapján
            this.provinceManager.updateProvinces();
            this.render();
            this.ui.update();
            return true;
        } catch (e) {
            console.error("Hiba a betöltés során:", e);
            return false;
        }
    }
}