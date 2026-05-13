// js/core/Pathfinder.js

class Pathfinder {
    constructor(game) {
        this.game = game;
    }

    calculateReachableHexes(startHex) {
        const reachableHexes = new Map();
        
        // Biztonsági ellenőrzések
        if (!startHex || !startHex.unit || startHex.unit.owner !== this.game.currentPlayer) {
            this.game.reachableHexes = reachableHexes;
            return;
        }

        const unit = startHex.unit;
        const maxMovement = unit.currentMovement;
        if (maxMovement <= 0) {
            this.game.reachableHexes = reachableHexes;
            return;
        }

        let queue = [{ hex: startHex, cost: 0, path: [] }];
        reachableHexes.set(startHex, { cost: 0, path: [] });

        while (queue.length > 0) {
            queue.sort((a, b) => a.cost - b.cost);
            let current = queue.shift();

            let neighbors = this.game.board.getNeighbors(current.hex);
            for (let neighbor of neighbors) {
                
                let targetDefense = this.game.board.getHexDefense(neighbor);

                if (neighbor.owner !== this.game.currentPlayer) {
                    if (unit.level <= targetDefense) continue; 
                } else {
                    if (neighbor.building === 'capital') continue; 
                    
                    if (neighbor.unit !== null) {
                        // Max szint 4 (Maffiás)
                        if (unit.level + neighbor.unit.level <= 4) {
                            let stepCost = 1; 
                            let newCost = current.cost + stepCost;

                            if (newCost <= maxMovement) {
                                if (!reachableHexes.has(neighbor) || newCost < reachableHexes.get(neighbor).cost) {
                                    let newPath = [...current.path, neighbor];
                                    reachableHexes.set(neighbor, { cost: newCost, path: newPath });
                                }
                            }
                        }
                        continue; 
                    }
                }

                let stepCost = 1; 
                let newCost = current.cost + stepCost;

                if (newCost <= maxMovement) {
                    if (!reachableHexes.has(neighbor) || newCost < reachableHexes.get(neighbor).cost) {
                        let newPath = [...current.path, neighbor];
                        reachableHexes.set(neighbor, { cost: newCost, path: newPath });
                        queue.push({ hex: neighbor, cost: newCost, path: newPath });
                    }
                }
            }
        }
        
        // Eredmény visszaírása a fő játékba
        this.game.reachableHexes = reachableHexes;
    }
}