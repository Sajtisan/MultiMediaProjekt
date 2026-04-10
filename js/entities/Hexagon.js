class Hexagon {
    /** Ha véletlen elfelejteném
     * @param x
     * @param y
     * @param size
     * @param colorInner
     * @param colorLine
     */

    constructor(x, y, size, colorInner, colorLine){
        this.x = x;
        this.y = y;
        this.size = size;
        this.colorInner = colorInner;
        this.colorLine = colorLine;
    }

    draw(ctx){
        ctx.beginPath();
        for(let i = 0; i < 6; i++){
            const angleRad = (Math.PI / 3) * i;

            const vertexX = this.x + this.size * Math.cos(angleRad);
            const vertexY = this.y + this.size * Math.cos(angleRad);

            if(i === 0){
                ctx.moveTo(vertexX, vertexY);
            } else{
                ctx.lineTo(vertexX, vertexY);
            }

            ctx.closePath();

            ctx.fillStyle = this.colorInner;
            ctx.fill();

            ctx.strokeStyle = this.colorLine;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

}