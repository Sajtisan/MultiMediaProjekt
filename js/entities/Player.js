// js/entities/Player.js
class Player {
    constructor(id, name, color, isAI = false) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.isAI = isAI;
        // Az Antiyoy-ban a pénzt majd a Provinciák tárolják, de egy globális azonosító kell.
    }
}