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
        this.unit = null;       // A rajta álló egység (Paraszt, Lovag, stb.)
        this.building = null;   // A rajta álló épület ('capital', 'farm', 'tower')
        this.province = null;   // Melyik provinciához tartozik (később a BFS állítja be)
    }

    // Flat Design rajzolás
    draw(ctx) {
        // Ha lyuk a pályán, nem rajzoljuk ki
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
        
        // Színezés logika
        if (this.owner) {
            ctx.fillStyle = this.owner.color; // A játékos pasztell színe
        } else {
            ctx.fillStyle = "#e0e0e0"; // Semleges terület (világosszürke)
        }
        ctx.fill();

        // Letisztult keret
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fa rajzolása (Egyszerű fenyőfa ikon)
        if (this.hasTree) {
            this.drawTree(ctx);
        }

        // Főváros rajzolása (Ideiglenes egyszerű ház ikon)
        if (this.building === 'capital') {
            this.drawCapital(ctx);
        }

        // Torony rajzolása
        if (this.building === 'tower') {
            this.drawTower(ctx);
        }
    }

    drawTree(ctx) {
        ctx.fillStyle = "#2ecc71"; // Fűzöld
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size * 0.5); // Csúcs
        ctx.lineTo(this.x - this.size * 0.4, this.y + this.size * 0.3); // Bal alja
        ctx.lineTo(this.x + this.size * 0.4, this.y + this.size * 0.3); // Jobb alja
        ctx.closePath();
        ctx.fill();
        
        // Törzs
        ctx.fillStyle = "#795548";
        ctx.fillRect(this.x - this.size * 0.1, this.y + this.size * 0.3, this.size * 0.2, this.size * 0.3);
    }

    drawCapital(ctx) {
        ctx.fillStyle = "#ecf0f1"; // Fehér fal
        ctx.fillRect(this.x - this.size * 0.4, this.y - this.size * 0.2, this.size * 0.8, this.size * 0.5);
        ctx.fillStyle = "#e74c3c"; // Piros tető
        ctx.beginPath();
        ctx.moveTo(this.x - this.size * 0.5, this.y - this.size * 0.2);
        ctx.lineTo(this.x, this.y - this.size * 0.6);
        ctx.lineTo(this.x + this.size * 0.5, this.y - this.size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    drawTower(ctx) {
        ctx.fillStyle = "#7f8c8d";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth = 2;
        ctx.stroke();
        // Bástya teteje (egyszerű lőrések)
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(this.x - 5, this.y - this.size * 0.3, 10, 5);
    }

    // Hexagon.js bővítése
    isPointInside(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        // Gyors, kör alapú távolságmérés, ami tökéletes a kattintás érzékeléshez
        return (dx * dx + dy * dy) <= (this.size * 0.9) * (this.size * 0.9);
    }
}