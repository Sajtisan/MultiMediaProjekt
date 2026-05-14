class GameController {
    /**
     * A játék központi agya. Inicializálja a játéktáblát, a játékosokat és az összes alrendszert.
     * @param {string} canvasId - A HTML canvas elem azonosítója.
     * @param {number} hexSize - A hatszögek sugara.
     * @param {number} playerCount - A résztvevő klánok száma.
     * @modifies {GameController.board, GameController.players, GameController.ui, GameController.renderer, stb.} - Létrehozza a teljes futtatókörnyezetet.
     * @calls {GameController.setupPlayers, GameBoard.setupPlayerStart, ProvinceManager.updateProvinces}
     */
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
        this.audio = new AudioManager();
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

    /**
     * Inicializálja a játékosokat a megadott létszám alapján, kiosztva a színeket és neveket.
     * Az első játékos mindig a humán (Te), a többi AI által vezérelt.
     * @param {number} numPlayers - A klánok (játékosok) teljes száma.
     * @modifies {GameController.players} - Létrehozza és feltölti a játékosokat tartalmazó tömböt.
     * @calls {Player}
     */
    setupPlayers(numPlayers) {
        const allColors = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#00bcd4", "#9b59b6"];
        const allNames = ["Kék (Te)", "Piros (AI)", "Zöld (AI)", "Sárga (AI)", "Cián (AI)", "Lila (AI)"];

        this.players = [];
        for (let i = 0; i < numPlayers; i++) {
            this.players.push(new Player(i, allNames[i], allColors[i], i !== 0));
        }
    }

    // ==========================================
    // HIDAK (FACADES) A HÍVÁSOKHOZ
    // ==========================================
    render() {
        if (this.renderer) this.renderer.render();
    }

    calculateReachableHexes(startHex) {
        if (this.pathfinder) this.pathfinder.calculateReachableHexes(startHex);
    }
    // ==========================================


    /**
     * A fő eseménykezelő a játéktérre (canvas) történő kattintásokhoz.
     * @param {MouseEvent} e - Az egérkattintás eseménye.
     * @modifies {GameController.selectedHex, GameController.reachableHexes, Hexagon} - Kezeli a kijelölést, mozgást, foglalást.
     * @calls {HistoryManager.saveState, GameBoard.getHexAt, ProvinceManager.updateProvinces, GameOverManager.checkGameState, UIManager.update, Renderer.render}
     */
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
            let hadCombat = false;

            for (let stepHex of routeData.path) {
                if (stepHex.owner !== this.currentPlayer && stepHex.owner !== null) {
                    stepHex.unit = null;
                    stepHex.building = null;
                    hadCombat = true;
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

            if (hadCombat) {
                this.audio.play('kill');
            }
            else {
                this.audio.play('move');
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

    /**
     * Lezárja az aktuális játékos körét és átadja az irányítást a következőnek.
     * @modifies {GameController.currentPlayerIdx, Player.isDead, Unit.currentMovement} - Lépteti a kört, kezeli a csődöt, visszaállítja a lépéspontokat.
     * @calls {GameController.saveGame, ProvinceManager.endTurnEconomy, GameBoard.spreadTrees, GameOverManager.checkGameState, AIController.takeTurn}
     */
    endTurn() {
        // Ha már vége a játéknak, senki ne csináljon semmit!
        if (this.gameOverManager.isGameOver) return;

        // MENTÉS: Minden kör végén elmentjük az állást
        this.saveGame();

        this.history.clear();
        const isStillAlive = this.provinceManager.endTurnEconomy(this.currentPlayer);

        if (!isStillAlive) {
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

    /**
     * Megvásárol egy egységet vagy épületet a kijelölt mezőre.
     * @param {string} type - A vásárlás típusa ('unit' vagy 'building').
     * @param {string|number} value - Az egység szintje vagy az épület azonosítója.
     * @param {number} cost - A levonandó arany mennyisége.
     * @modifies {Hexagon, Province.gold} - Lerakja az entitást és levonja az árát a kincstárból.
     * @calls {HistoryManager.saveState, ProvinceManager.updateProvinces, UIManager.update, Renderer.render}
     */
    buyItem(type, value, cost) {
        if (!this.selectedHex) {
            return;
        }
        if (!this.selectedHex.province) {
            return;
        }

        if (this.selectedHex.unit !== null || this.selectedHex.building !== null || this.selectedHex.hasTree) {
            return;
        }

        const prov = this.selectedHex.province;
        const capital = prov.hexes.find(h => h.building === 'capital');

        if (!capital) {
            return;
        }

        if (capital.gold >= cost) {
            this.history.saveState();
            capital.gold -= cost;
            prov.gold = capital.gold;

            this.audio.play('buy');

            if (type === 'unit') {
                this.selectedHex.unit = new Unit(this.currentPlayer, parseInt(value));
                this.selectedHex.unit.currentMovement = 0;
            } else if (type === 'building') {
                this.selectedHex.building = value;
            }

            this.provinceManager.updateProvinces();
            this.ui.update();
            this.render();
        }
    }

    /**
     * Megsemmisíti/eladja a kijelölt mezőn lévő épületet vagy egységet.
     * @modifies {Hexagon, Province.gold} - Törli az entitást és hozzáadja a visszatérítést a kincstárhoz.
     * @calls {HistoryManager.saveState, ProvinceManager.updateProvinces, UIManager.update, Renderer.render}
     */
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

    /**
     * Elmenti a játék aktuális állását a böngésző memóriájába (localStorage).
     * Rögzíti a pálya pontos felépítését (lyukak, fák), a gazdaságot és az egységek megmaradt mozgáspontjait.
     * @modifies {localStorage} - Felülírja a 'spid_savegame' kulcsot a JSON adattal.
     */
    saveGame() {
        const currentHexSize = this.board.hexList.length > 0 ? this.board.hexList[0].size : 35;
        const saveData = {
            hexSize: currentHexSize,
            playerCount: this.players.length,
            currentPlayerIdx: this.currentPlayerIdx,
            boardData: this.board.hexList.map(h => ({
                q: h.q, r: h.r,
                isPlayable: h.isPlayable,
                ownerId: h.owner ? h.owner.id : null,
                unitLevel: h.unit ? h.unit.level : null,
                unitMovement: h.unit ? h.unit.currentMovement : null,
                building: h.building,
                gold: h.gold || 0,
                hasTree: h.hasTree
            }))
        };
        localStorage.setItem('spid_savegame', JSON.stringify(saveData));
    }

    /**
     * Betölt egy mentett játékállást a localStorage-ból és felülírja a játékteret.
     * Pontosan visszaállítja az egységek mozgáspontjait is, így a játékos onnan folytathatja a kört, ahol abbahagyta.
     * @returns {boolean} Igaz, ha a betöltés sikeres volt, különben hamis.
     * @modifies {GameController.currentPlayerIdx, Hexagon} - Visszaállítja a mentett állapotokat.
     * @calls {ProvinceManager.updateProvinces, Renderer.render, UIManager.update}
     */
    loadGame() {
        const data = JSON.parse(localStorage.getItem('spid_savegame'));
        if (!data) {
            alert("Nincs mentett játék!");
            return false;
        }

        try {
            this.currentPlayerIdx = data.currentPlayerIdx;
            data.boardData.forEach(savedHex => {
                let hex = this.board.hexList.find(h => h.q === savedHex.q && h.r === savedHex.r);
                if (hex) {
                    hex.isPlayable = savedHex.isPlayable;
                    hex.hasTree = savedHex.hasTree;
                    hex.owner = savedHex.ownerId !== null ? this.players[savedHex.ownerId] : null;
                    hex.building = savedHex.building || null;
                    hex.gold = savedHex.gold || 0;
                    if (savedHex.unitLevel) {
                        hex.unit = new Unit(hex.owner, savedHex.unitLevel);
                        if (savedHex.unitMovement != null) {
                            hex.unit.currentMovement = savedHex.unitMovement;
                        }
                        else {
                            hex.unit.currentMovement = 0;
                        }
                    } else {
                        hex.unit = null; // Letöröljük a start-up során generált véletlen egységeket!
                    }
                }
            });

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