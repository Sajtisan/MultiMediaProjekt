class ResourceObject extends MapObject {
    constructor(hex, resourceType, amount, isCapturable, visualComponent) {
        super(hex, true);
        this.resourceType = resourceType;
        this.amount = amount;
        this.visualComponent = visualComponent;
        this.isCapturable = isCapturable;
        this.owner = null;
    }
}