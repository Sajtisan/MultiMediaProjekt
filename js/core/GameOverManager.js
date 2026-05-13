// js/core/GameOverManager.js

class GameOverManager {
    constructor(game) {
        this.game = game;
        this.isGameOver = false;
    }

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

    triggerGameEnd(title, desc, color) {
        this.isGameOver = true;
        $('#game-over-title').text(title).css('color', color);
        $('#game-over-desc').text(desc);
        $('#game-over-screen').css('display', 'flex').hide().fadeIn(1000);
    }
}