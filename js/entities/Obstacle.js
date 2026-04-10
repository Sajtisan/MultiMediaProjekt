class Obstacle extends MapObject {
    constructor(hex, type, visualObject) {
        super(hex, false);
        this.type = type;
        this.visualObject = visualObject;
    }
    draw(ctx){

    }
}