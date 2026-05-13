// js/entities/Player.js

class Player {
    constructor(id, name, color, isAI) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.isAI = isAI;
        this.isDead = false;
    }
}