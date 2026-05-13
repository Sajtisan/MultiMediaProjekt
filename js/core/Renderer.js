class Renderer {
    /**
     * Inicializálja a grafikus megjelenítőt és elindítja az animációs ciklust.
     * @param {GameController} game - A központi játékvezérlő referenciája.
     * @param {CanvasRenderingContext2D} ctx - A rajzolási kontextus.
     * @param {HTMLCanvasElement} canvas - A canvas elem.
     * @modifies {Renderer.animTimer} - Beállítja az animációs időzítőt.
     * @calls {Renderer.startAnimationLoop}
     */
    constructor(game, ctx, canvas) {
        this.game = game;
        this.ctx = ctx;
        this.canvas = canvas;
        this.animTimer = 0;
        this.startAnimationLoop();
    }

    /**
     * Elindítja a folyamatos rajzolási ciklust (60 FPS) az animációkhoz (pl. lebegés).
     * @modifies {Renderer.animTimer} - Folyamatosan növeli az animációs időzítőt.
     * @calls {Renderer.render, requestAnimationFrame}
     */
    startAnimationLoop() {
        const loop = () => {
            this.animTimer += 0.1;
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    /**
     * Kirajzolja a teljes játékteret: a hátteret, a pályát, az egységeket és az interaktív rétegeket (kijelölés, útvonalak).
     * @modifies {Canvas} - Felülírja a HTML5 Canvas tartalmát.
     * @calls {GameBoard.draw, Hexagon.unit.draw}
     */
    render() {
        this.ctx.fillStyle = "#1a1a2e";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.game.board.draw(this.ctx);
        for (let hex of this.game.board.hexList) {
            if (hex.unit) {
                let yOffset = 0;
                if (this.game.selectedHex === hex) {
                    yOffset = Math.sin(this.animTimer) * 5; 
                }
                hex.unit.draw(this.ctx, hex.x, hex.y + yOffset, hex.size);
            }
        }
        if (this.game.selectedHex) {
            this.ctx.beginPath();
            this.ctx.arc(this.game.selectedHex.x, this.game.selectedHex.y, this.game.selectedHex.size * 0.8, 0, Math.PI * 2);
            this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        if (this.game.selectedHex && this.game.reachableHexes) {
            for (let [hex, data] of this.game.reachableHexes) {
                if (hex === this.game.selectedHex) continue; 
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angleRad = (Math.PI / 3) * i; 
                    const vertexX = hex.x + hex.size * Math.cos(angleRad);
                    const vertexY = hex.y + hex.size * Math.sin(angleRad);
                    if (i === 0) this.ctx.moveTo(vertexX, vertexY);
                    else this.ctx.lineTo(vertexX, vertexY);
                }
                this.ctx.closePath();
                this.ctx.fillStyle = "rgba(46, 204, 113, 0.4)"; 
                this.ctx.fill();
                this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                this.ctx.font = "10px Arial";
                this.ctx.textAlign = "center";
                this.ctx.fillText(data.cost, hex.x, hex.y - hex.size * 0.5);
            }
        }
    }
}