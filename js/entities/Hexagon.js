// js/entities/Hexagon.js

class Hexagon {
    constructor(q, r, x, y, size) {
        // Koordináták (q, r a rácslogikához, x, y a rajzoláshoz)
        this.q = q;
        this.r = r;
        this.x = x;
        this.y = y;
        this.size = size;
        
        // Antiyoy logikai változók
        this.isPlayable = true; // Ha false, akkor ez egy "lyuk" a pályán
        this.hasTree = false;   // Van-e rajta erdő
        this.owner = null;      // Játékos referencia (null = semleges)
        this.unit = null;       // A rajta álló egység (Unit objektum)
        this.building = null;   // A rajta álló épület ('capital', 'house', 'tower1', stb.)
        this.province = null;   // Melyik provinciához tartozik
    }

    draw(ctx) {
        // Ha lyuk a pályán, nem rajzoljuk ki
        if (!this.isPlayable) return;

        // Hatszög formájának megrajzolása
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angleRad = (Math.PI / 3) * i; 
            const vertexX = this.x + this.size * Math.cos(angleRad);
            const vertexY = this.y + this.size * Math.sin(angleRad);
            if (i === 0) ctx.moveTo(vertexX, vertexY);
            else ctx.lineTo(vertexX, vertexY);
        }
        ctx.closePath();
        
        // Színezés (Játékos színe, vagy semleges szürke)
        if (this.owner) {
            ctx.fillStyle = this.owner.color; 
        } else {
            ctx.fillStyle = "#e0e0e0"; 
        }
        ctx.fill();

        // Letisztult keret
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fa rajzolása
        if (this.hasTree) {
            this.drawTree(ctx);
        }

        // Épület rajzolásának DELEGÁLÁSA a Building osztálynak
        if (this.building) {
            Building.draw(ctx, this.building, this.x, this.y, this.size);
        }
    }

    drawTree(ctx) {
        // Fenyőfa zöld lombja
        ctx.fillStyle = "#2ecc71"; 
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size * 0.5); // Csúcs
        ctx.lineTo(this.x - this.size * 0.4, this.y + this.size * 0.3); // Bal alja
        ctx.lineTo(this.x + this.size * 0.4, this.y + this.size * 0.3); // Jobb alja
        ctx.closePath();
        ctx.fill();
        
        // Barna törzs
        ctx.fillStyle = "#795548";
        ctx.fillRect(this.x - this.size * 0.1, this.y + this.size * 0.3, this.size * 0.2, this.size * 0.3);
    }

    isPointInside(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        // Gyors, kör alapú távolságmérés, ami tökéletes a kattintás érzékeléshez
        return (dx * dx + dy * dy) <= (this.size * 0.9) * (this.size * 0.9);
    }
}