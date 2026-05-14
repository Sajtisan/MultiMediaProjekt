class Hexagon {
    /**
     * Létrehoz egy hatszöget (mezőt) a játéktéren.
     * @param {number} q - Rács koordináta oszlop.
     * @param {number} r - Rács koordináta sor.
     * @param {number} x - Fizikai X pixel koordináta a canvas-en.
     * @param {number} y - Fizikai Y pixel koordináta a canvas-en.
     * @param {number} size - A hatszög mérete (sugara).
     */
    constructor(q, r, x, y, size) {
        this.q = q;
        this.r = r;
        this.x = x;
        this.y = y;
        this.size = size;
        this.isPlayable = true;
        this.hasTree = false;
        this.owner = null;
        this.unit = null;
        this.building = null;
        this.province = null;
    }

    /**
     * Kirajzolja magát a hatszöget, a fát és delegálja az egység/épület rajzolását.
     * @param {CanvasRenderingContext2D} ctx - A rajzolási kontextus.
     * @modifies {Canvas} - Rajzol a vászonra.
     * @calls {Hexagon.drawTree, Building.draw}
     */
    draw(ctx) {
        if (!this.isPlayable) return;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angleRad = (Math.PI / 3) * i;
            const vertexX = this.x + this.size * Math.cos(angleRad);
            const vertexY = this.y + this.size * Math.sin(angleRad);
            if (i === 0) ctx.moveTo(vertexX, vertexY);
            else ctx.lineTo(vertexX, vertexY);
        }
        ctx.closePath();
        if (this.owner) {
            ctx.fillStyle = this.owner.color;
        } else {
            ctx.fillStyle = "#e0e0e0";
        }
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();
        if (this.hasTree) {
            this.drawTree(ctx);
        }
        if (this.building) {
            Building.draw(ctx, this.building, this.x, this.y, this.size);
        }
    }

    /**
     * Kirajzol egy fenyőfát a hatszögön.
     * @param {CanvasRenderingContext2D} ctx - A rajzolási kontextus.
     * @modifies {Canvas} - Rajzol a vászonra.
     */
    drawTree(ctx) {
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size * 0.5); // Csúcs
        ctx.lineTo(this.x - this.size * 0.4, this.y + this.size * 0.3); // Bal alja
        ctx.lineTo(this.x + this.size * 0.4, this.y + this.size * 0.3); // Jobb alja
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#795548";
        ctx.fillRect(this.x - this.size * 0.1, this.y + this.size * 0.3, this.size * 0.2, this.size * 0.3);
    }

    /**
     * Ellenőrzi, hogy egy adott (x, y) pixel pont a hatszög területén belül van-e (gyorsított kör alapú becslés).
     * @param {number} px - Az egér X koordinátája.
     * @param {number} py - Az egér Y koordinátája.
     * @returns {boolean} Igaz, ha a pont a hatszögön belül van.
     */
    isPointInside(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        return (dx * dx + dy * dy) <= (this.size * 0.9) * (this.size * 0.9);
    }
}