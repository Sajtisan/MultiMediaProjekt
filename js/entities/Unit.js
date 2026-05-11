// js/entities/Unit.js

class Unit {
    constructor(owner, level) {
        this.owner = owner;
        this.level = level; // 1: Paraszt, 2: Lándzsás, 3: Báró, 4: Lovag
        this.maxMovement = 5; // A megbeszéltek alapján legyen 5 lépésük
        this.currentMovement = this.maxMovement;
    }

    // Egyszerű pálcikaember/katona rajzolása a szint alapján
    // js/entities/Unit.js - draw() csere

    draw(ctx, x, y, size) {
        ctx.fillStyle = this.owner.color; 
        
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Szint és Típus kiírása
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        let icon = "";
        switch(this.level) {
            case 1: icon = "P"; break; // Paraszt
            case 2: icon = "L"; break; // Lándzsás
            case 3: icon = "B"; break; // Báró
            case 4: icon = "K"; break; // Lovag
        }
        
        ctx.fillText(`${this.level}${icon}`, x, y);

        // Kimerültség indikátor
        if (this.currentMovement <= 0) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.beginPath();
            ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "#e74c3c";
            ctx.beginPath();
            ctx.arc(x + size * 0.35, y - size * 0.35, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + size * 0.25, y - size * 0.45);
            ctx.lineTo(x + size * 0.45, y - size * 0.25);
            ctx.moveTo(x + size * 0.45, y - size * 0.45);
            ctx.lineTo(x + size * 0.25, y - size * 0.25);
            ctx.stroke();
        }
    }

    resetMovement() {
        this.currentMovement = this.maxMovement;
    }
}