class Building {

    /**
     * Statikus metódus: Kirajzolja az adott típusú épületet a canvasra a megadott koordinátákon.
     * @param {CanvasRenderingContext2D} ctx - A rajzolási kontextus.
     * @param {string} type - Az épület típusa ('capital', 'house', 'tower1', stb.).
     * @param {number} x - Az épület X koordinátája.
     * @param {number} y - Az épület Y koordinátája.
     * @param {number} size - A hatszög mérete (skálázáshoz).
     * @modifies {Canvas} - Rajzol a vászonra.
     */
    static draw(ctx, type, x, y, size) {
        if (!type) return;
        ctx.save();
        ctx.translate(x, y);
        if (type === 'capital') {
            ctx.fillStyle = "#8e44ad";
            ctx.fillRect(-size * 0.4, -size * 0.3, size * 0.8, size * 0.6);
            ctx.fillStyle = "#f1c40f";
            ctx.fillRect(-size * 0.15, -size * 0.1, size * 0.3, size * 0.4);
            ctx.strokeStyle = "#2c3e50";
            ctx.strokeRect(-size * 0.4, -size * 0.3, size * 0.8, size * 0.6);
        } else if (type === 'house') {
            ctx.fillStyle = "#27ae60";
            ctx.fillRect(-8, -8, 16, 16);
            ctx.strokeStyle = "#2ecc71";
            ctx.strokeRect(-8, -8, 16, 16);
        } else if (type === 'tower1') {
            ctx.fillStyle = "#2c3e50";
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ecf0f1";
            ctx.font = "bold 10px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("K", 0, 0);
        } else if (type === 'tower2') {
            ctx.fillStyle = "#ecf0f1";
            ctx.fillRect(-10, -12, 20, 24);
            ctx.strokeStyle = "#bdc3c7";
            ctx.lineWidth = 1;
            ctx.strokeRect(-10, -12, 20, 24);
            ctx.fillStyle = "#e74c3c";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("F", 0, 0);
        } else if (type === 'tower3') {
            ctx.fillStyle = "#2980b9";
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#c0392b";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = "#ecf0f1";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("R", 0, 0);
        }
        ctx.restore();
    }
}