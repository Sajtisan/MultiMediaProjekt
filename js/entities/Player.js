class Player {
    /**
     * Létrehoz egy új játékost/klánt.
     * @param {number} id - A játékos azonosítója.
     * @param {string} name - A játékos megjelenítendő neve.
     * @param {string} color - A játékos hexadecimális színe (pl. "#e74c3c").
     * @param {boolean} isAI - Igaz, ha a játékost az AI irányítja.
     */
    constructor(id, name, color, isAI) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.isAI = isAI;
        this.isDead = false;
    }
}