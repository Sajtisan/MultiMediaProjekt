class GameOverManager {
    /**
     * Inicializálja a játék végét és a győzelmi/vereség kondíciókat figyelő rendszert.
     * @param {GameController} game - A központi játékvezérlő referenciája.
     */
    constructor(game) {
        this.game = game;
        this.isGameOver = false;
    }

    /**
     * Ellenőrzi a játék állapotát: megvizsgálja, hogy a játékos elvesztette-e minden területét, vagy ő maradt-e az egyetlen túlélő.
     * @modifies {Player.isDead} - A terület nélkül maradt játékosoknál igazra állítja a kiesés flaget.
     * @calls {GameOverManager.triggerGameEnd}
     */
    checkGameState() {
        if (this.isGameOver) return;

        let alivePlayers = [];
        
        // VALÓS IDEJŰ ELLENŐRZÉS: Nézzük meg a térképet!
        for (let p of this.game.players) {
            // Van még legalább egyetlen mezője a pályán?
            const hasTerritory = this.game.board.hexList.some(hex => hex.owner === p);
            
            // Ha elfoglalták az utolsó területét is, azonnal kiesett!
            if (!hasTerritory) {
                p.isDead = true;
            }
            
            // Ha él (és nem ment csődbe a kör végén)
            if (!p.isDead) {
                alivePlayers.push(p);
            }
        }

        const humanPlayer = this.game.players[0]; // Te vagy a nulladik

        // 1. VERESÉG
        if (humanPlayer.isDead) {
            this.triggerGameEnd(
                "Kiszorítottak...", 
                "Elvesztetted az összes területedet. A pénzed elfogyott, az embereid elhagytak, a birodalmad elbukott.", 
                "#e74c3c"
            );
            return;
        }

        // 2. GYŐZELEM
        if (alivePlayers.length === 1 && alivePlayers[0] === humanPlayer) {
            this.triggerGameEnd(
                "A Negyed Ura!", 
                "Gratulálok! Lenyomtad az összes rivális klánt, a kocsmák és italboltok már mind neked tejelnek.", 
                "#f1c40f"
            );
            return;
        }
    }

    /**
     * Aktiválja a játék vége (Game Over) képernyőt a megfelelő üzenettel és színnel.
     * @param {string} title - A megjelenő főcím (pl. "A Negyed Ura!").
     * @param {string} desc - A részletes leírás az eredményről.
     * @param {string} color - A cím szövegszíne (hexadecimális kód).
     * @modifies {GameOverManager.isGameOver, DOM} - Lezárja a játékot és megjeleníti a HTML/CSS panelt.
     */
    triggerGameEnd(title, desc, color) {
        this.isGameOver = true;
        $('#game-over-title').text(title).css('color', color);
        $('#game-over-desc').text(desc);
        $('#game-over-screen').css('display', 'flex').hide().fadeIn(1000);
    }
}