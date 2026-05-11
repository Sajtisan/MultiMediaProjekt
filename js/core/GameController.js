// js/core/GameController.js

class GameController {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.players = [
            new Player(1, "Kék Birodalom", "#3498db", false), 
            new Player(2, "Piros Birodalom", "#e74c3c", true) 
        ];
        this.currentPlayerIdx = 0; // A Kék játékos (0) kezd
        
        this.board = new GameBoard(this.canvas.width, this.canvas.height, 25);
        this.board.setupPlayerStart(this.players[0]);
        this.board.setupPlayerStart(this.players[1]);

        // ÚJ: Állapotváltozó a kijelölt egységnek
        this.selectedHex = null;

        // ÚJ: Egérkattintás figyelése
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        this.provinceManager = new ProvinceManager(this.board);
        this.provinceManager.updateProvinces(); // Első számolás

        this.render();
        console.log("Játék inicializálva! Te jössz.");
    }

    get currentPlayer() {
        return this.players[this.currentPlayerIdx];
    }

    // js/core/GameController.js - Bővítések és cserék

    // ÚJ METÓDUS: Dijkstra algoritmus az elérhető mezők megkeresésére
    // js/core/GameController.js - calculateReachableHexes frissítése

    calculateReachableHexes(startHex) {
        this.reachableHexes = new Map();
        if (!startHex || !startHex.unit || startHex.unit.owner !== this.currentPlayer) return;

        const unit = startHex.unit;
        const maxMovement = unit.currentMovement;
        if (maxMovement <= 0) return;

        let queue = [{ hex: startHex, cost: 0, path: [] }];
        this.reachableHexes.set(startHex, { cost: 0, path: [] });

        while (queue.length > 0) {
            queue.sort((a, b) => a.cost - b.cost);
            let current = queue.shift();

            let neighbors = this.board.getNeighbors(current.hex);
            for (let neighbor of neighbors) {
                
                // HARCI ELLENŐRZÉS: Megnézzük a célmező védelmét
                let targetDefense = this.board.getHexDefense(neighbor);

                // Ha az ellenségé (vagy semleges), csak akkor léphetünk rá, 
                // ha a mi egységünk szintje NAGYOBB, mint a védelem.
                if (neighbor.owner !== this.currentPlayer) {
                    if (unit.level <= targetDefense) {
                        continue; // Túl erős a védelem, ez az irány lezárva
                    }
                } else {
                    // Saját területen belül: nem léphetünk olyan mezőre, amin már áll saját egység
                    // vagy a Fővárosunk van ott (hogy ne blokkoljuk le)
                    if (neighbor.unit !== null || neighbor.building === 'capital') {
                        continue;
                    }
                }

                let stepCost = 1; 
                let newCost = current.cost + stepCost;

                if (newCost <= maxMovement) {
                    if (!this.reachableHexes.has(neighbor) || newCost < this.reachableHexes.get(neighbor).cost) {
                        let newPath = [...current.path, neighbor];
                        this.reachableHexes.set(neighbor, { cost: newCost, path: newPath });
                        queue.push({ hex: neighbor, cost: newCost, path: newPath });
                    }
                }
            }
        }
    }

    // js/core/GameController.js - handleClick cseréje

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clickedHex = this.board.getHexAt(x, y);
        if (!clickedHex) return;

        // 1. ESET: LÉPÉS - Van kijelölt egységünk, és egy HIGHLIGHTOLT mezőre kattintunk
        if (this.selectedHex && this.selectedHex.unit && this.reachableHexes && this.reachableHexes.has(clickedHex) && clickedHex !== this.selectedHex) {
            const routeData = this.reachableHexes.get(clickedHex);
            const unit = this.selectedHex.unit;

            // Végigmegyünk az útvonalon
            for (let stepHex of routeData.path) {
                // Ha ellenséges területre lépünk, mindent le kell rombolni rajta
                if (stepHex.owner !== this.currentPlayer && stepHex.owner !== null) {
                    console.log("Ellenséges terület meghódítva!");
                    stepHex.unit = null;
                    stepHex.building = null;
                }
                stepHex.owner = this.currentPlayer;
                if (stepHex.hasTree) {
                    stepHex.hasTree = false;
                }
            }

            // Katona áthelyezése a végcélra
            clickedHex.unit = unit;
            this.selectedHex.unit = null;
            
            unit.currentMovement -= routeData.cost;

            this.selectedHex = clickedHex;
            this.provinceManager.updateProvinces(); 
            this.calculateReachableHexes(this.selectedHex); 
        } 
        // 2. ESET: SAJÁT MEZŐ KIJELÖLÉSE (akár van rajta egység, akár üres)
        else if (clickedHex.owner === this.currentPlayer) {
            this.selectedHex = clickedHex;
            
            // Ha katonára kattintottunk, kiszámoljuk, hova léphet
            if (clickedHex.unit) {
                this.calculateReachableHexes(this.selectedHex);
            } else {
                // Ha üres területre (vagy épületre) kattintottunk, töröljük a zöld highlightot
                this.reachableHexes = new Map(); 
            }
        } 
        // 3. ESET: Üres semleges / Ellenséges mező (ahova nem tudunk lépni)
        else {
            this.selectedHex = null;
            this.reachableHexes = new Map(); // Highlight törlése
        }

        // Grafika és UI frissítése
        this.render();
        this.updateUI(); // <-- EZ NAGYON FONTOS, HOGY ITT LEGYEN A VÉGÉN!
    }

    render() {
        this.ctx.fillStyle = "#f5f6fa";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.board.draw(this.ctx);

        // Katonák kirajzolása a hatszögek fölé
        for (let hex of this.board.hexList) {
            if (hex.unit) {
                hex.unit.draw(this.ctx, hex.x, hex.y, hex.size);
            }
        }

        // Kijelölés vizuális visszajelzése (fehér karika a bábu körül)
        if (this.selectedHex) {
            this.ctx.beginPath();
            this.ctx.arc(this.selectedHex.x, this.selectedHex.y, this.selectedHex.size * 0.8, 0, Math.PI * 2);
            this.ctx.strokeStyle = "#ffffff";
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        if (this.selectedHex && this.reachableHexes) {
            for (let [hex, data] of this.reachableHexes) {
                if (hex === this.selectedHex) continue; // Magát a kezdőmezőt ne színezze be
                
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angleRad = (Math.PI / 3) * i; 
                    const vertexX = hex.x + hex.size * Math.cos(angleRad);
                    const vertexY = hex.y + hex.size * Math.sin(angleRad);
                    if (i === 0) this.ctx.moveTo(vertexX, vertexY);
                    else this.ctx.lineTo(vertexX, vertexY);
                }
                this.ctx.closePath();
                
                // Áttetsző zöld szín
                this.ctx.fillStyle = "rgba(46, 204, 113, 0.4)"; 
                this.ctx.fill();
                
                // Opcionális: Kiírhatjuk a mezőre, hogy hány lépésbe kerül odajutni
                this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                this.ctx.font = "10px Arial";
                this.ctx.textAlign = "center";
                this.ctx.fillText(data.cost, hex.x, hex.y - hex.size * 0.5);
            }
        }
    }

    // js/core/GameController.js - Bővítés

    endTurn() {
        // 1. Az aktuális játékos megkapja a pénzét
        this.provinceManager.endTurnEconomy(this.currentPlayer);

        // 2. Mozgáspontok visszaállítása
        for (let hex of this.board.hexList) {
            if (hex.unit && hex.unit.owner === this.currentPlayer) {
                hex.unit.resetMovement();
            }
        }

        this.board.spreadTrees();

        // 3. Játékos váltás (Csak most váltunk!)
        this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
        this.selectedHex = null;
        
        console.log(`--- KÖR VÉGE --- Most jön: ${this.currentPlayer.name}`);

        if (this.currentPlayer.isAI) {
            setTimeout(() => this.handleAITurn(), 500);
        }

        this.render();
        this.updateUI();
    }

    // Frissíti a jobb oldali panelt a kijelölt mező adatai alapján
    updateUI() {
        if (this.selectedHex && this.selectedHex.owner === this.currentPlayer && this.selectedHex.province) {
            const prov = this.selectedHex.province;
            
            // Frissítjük a számítást, hogy az arany biztosan stimmeljen
            prov.calculateEconomy(); 

            // Kincstár panel megjelenítése és adatok betöltése
            $('#province-info').show();
            $('#ui-gold').text(prov.gold);
            
            const profit = prov.income - prov.upkeep;
            const profitText = (profit >= 0) ? `+${profit}` : profit;
            $('#ui-profit').text(profitText).css('color', (profit >= 0) ? '#2ecc71' : '#e74c3c');

            // VÁSÁRLÁS MENÜ: Csak üres mezőn jön fel (nincs egység, épület, fa)
            if (this.selectedHex.unit === null && this.selectedHex.building === null && !this.selectedHex.hasTree) {
                $('#build-menu').show();
                
                // Gombok engedélyezése/tiltása a pénzünk alapján
                $('.build-btn').each(function() {
                    const cost = parseInt($(this).data('cost'));
                    if (prov.gold >= cost) {
                        $(this).prop('disabled', false).css('opacity', '1');
                    } else {
                        $(this).prop('disabled', true).css('opacity', '0.5');
                    }
                });
            } else {
                $('#build-menu').hide();
            }

        } else {
            // Ha érvénytelen helyre kattintunk, minden eltűnik
            $('#province-info').hide();
            $('#build-menu').hide();
        }
    }

    // Kezeli a vásárlást
    buyItem(type, value, cost) {
        if (!this.selectedHex || !this.selectedHex.province) return;
        const prov = this.selectedHex.province;

        if (prov.gold >= cost) {
            prov.gold -= cost;
            if (type === 'unit') {
                this.selectedHex.unit = new Unit(this.currentPlayer, parseInt(value));
                this.selectedHex.unit.currentMovement = 0; // Vásárlás körében nem léphet
            } else if (type === 'building') {
                this.selectedHex.building = value;
            }
            
            this.provinceManager.updateProvinces(); // Gazdaság újraszámolása (zsold miatt)
            this.updateUI();
            this.render();
        }
    }

    buyItem(type, value, cost) {
        if (!this.selectedHex || !this.selectedHex.province) return;
        const prov = this.selectedHex.province;

        // Megkeressük a fővárost a tartományon belül
        const capital = prov.hexes.find(h => h.building === 'capital');

        // Ellenőrizzük, hogy van-e főváros és van-e elég pénz benne
        if (capital && capital.gold >= cost) {
            // 1. KÖZVETLENÜL a főváros kincstárából vonunk le
            capital.gold -= cost;
            
            // Frissítjük a tartomány lokális aranyát is a szinkron miatt
            prov.gold = capital.gold;

            // 2. Egység vagy épület létrehozása
            if (type === 'unit') {
                this.selectedHex.unit = new Unit(this.currentPlayer, parseInt(value));
                this.selectedHex.unit.currentMovement = 0; // Vásárláskor nem léphet
            } else if (type === 'building') {
                this.selectedHex.building = value;
            }

            // 3. Frissítés: Újraépítjük a tartományokat, hogy az új egység zsoldja is bekerüljön
            this.provinceManager.updateProvinces(); 
            this.updateUI();
            this.render();
            
            console.log(`Vásárlás sikeres! Levonva: ${cost}G. Maradt: ${capital.gold}G`);
        } else {
            console.log("Nincs elég arany vagy nem található főváros a tartományban!");
        }
    }

    handleAITurn() {
        console.log("AI gondolkodik... és egyelőre passzol.");
        // TODO: Később ide kötjük be az AIController-t
        
        // Az AI köre azonnal véget is ér, visszakapod az irányítást
        setTimeout(() => {
            this.endTurn();
        }, 1000);
    }
}