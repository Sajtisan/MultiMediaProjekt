class Unit {
    /**
     * Létrehoz egy új egységet (katonát).
     * @param {Player} owner - Az egység tulajdonosa.
     * @param {number} level - Az egység szintje (1: Csöves, 2: Egyetemista, 3: Delinquent, 4: Maffiás).
     */
    constructor(owner, level) {
        this.owner = owner;
        // Szintek: 1: Csöves, 2: Egyetemista, 3: Delinquent, 4: Maffiás
        this.level = level; 
        this.maxMovement = 5; // A megbeszéltek alapján 5 lépés
        this.currentMovement = this.maxMovement;
    }

    /**
     * Kirajzolja az egységet (szintikonnal és fáradtságjelzővel) a canvasra.
     * @param {CanvasRenderingContext2D} ctx - A rajzolási kontextus.
     * @param {number} x - Az X koordináta.
     * @param {number} y - Az Y koordináta.
     * @param {number} size - A skálázási méret.
     * @modifies {Canvas} - Rajzol a vászonra.
     */
    draw(ctx, x, y, size) {
        // Katona alapja (Játékos színe)
        ctx.fillStyle = this.owner.color; 
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Szint és Típus kiírása (C, E, D, M)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        let icon = "";
        switch(this.level) {
            case 1: icon = "C"; break; // Csöves
            case 2: icon = "E"; break; // Egyetemista
            case 3: icon = "D"; break; // Delinquent
            case 4: icon = "M"; break; // Maffiás
        }
        
        ctx.fillText(`${this.level}${icon}`, x, y);
        
        // Kimerültség indikátor (Ha már nem tud lépni ebben a körben)
        if (this.currentMovement <= 0) {
            // Szürke réteg
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.beginPath();
            ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Piros X karika
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

    /**
     * Visszaállítja az egység mozgáspontjait a maximumra (általában a kör elején).
     * @modifies {Unit.currentMovement} - Újratölti a lépéseket.
     */
    resetMovement() {
        this.currentMovement = this.maxMovement;
    }
}