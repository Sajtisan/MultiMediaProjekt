let game;

$(document).ready(function () {
    // Kezdeti állapot: Játéktér és Súgó elrejtése
    $('#game-container').hide();
    $('#guide-panel').hide();

    // ==========================================
    // 1. INDÍTÁSI ÉS BETÖLTÉSI LOGIKA
    // ==========================================

    /**
     * Eseménykezelő: Új játék indítása a kiválasztott beállításokkal.
     * @modifies {DOM} - Kinyeri a beállításokat a menüből.
     * @calls {startGame}
     */
    $('#start-game-btn').click(function() {
        const hexSize = parseInt($('#map-size').val());
        const playerCount = parseInt($('#player-count').val());
        startGame(hexSize, playerCount, false);
    });

    /**
     * Eseménykezelő: Mentett játék folytatása a localStorage-ból.
     * @modifies {DOM} - Hibaüzenetet dob, ha nincs mentés.
     * @calls {startGame}
     */
    $('#load-game-btn').click(function() {
        const savedData = JSON.parse(localStorage.getItem('spid_savegame'));
        
        if (savedData && savedData.boardData) {
            const hexSize = savedData.hexSize || 35;
            const playerCount = savedData.playerCount || 2;
            
            startGame(hexSize, playerCount, true);
        } else {
            alert("Nincs elmentett hódításod! Kezdj egy új játékot.");
        }
    });

    /**
     * Elindítja a játékot, példányosítja a fő vezérlőt és elvégzi a menü-játék áttűnést.
     * Továbbá inicializálja az AudioManager-t: feloldja a böngészős hang-blokkolást és elindítja a háttérzenét.
     * @param {number} hexSize - A játéktér hatszögeinek mérete.
     * @param {number} playerCount - A résztvevő játékosok (klánok) száma.
     * @param {boolean} [isLoad=false] - Igaz, ha a játékot mentésből kell visszaállítani.
     * @modifies {DOM, window.game} - Elrejti a menüt, megjeleníti a canvas-t, globálissá teszi a game objektumot.
     * @calls {AudioManager.unlockAll, AudioManager.startMusic, GameController.loadGame, ProvinceManager.updateProvinces}
     */
    function startGame(hexSize, playerCount, isLoad = false) {
        $('#main-menu').fadeOut(300, function() {
            $('#game-container').css('display', 'flex').hide().fadeIn(500);
        });

        game = new GameController("gameCanvas", hexSize, playerCount);
        
        // --- ÚJ RÉSZ: HANGOK FELOLDÁSA ÉS ZENE INDÍTÁSA ---
        game.audio.unlockAll();
        game.audio.startMusic();
        // --------------------------------------------------

        if (isLoad) {
            game.loadGame();
        } else {
            game.provinceManager.updateProvinces();
            game.render();
            game.ui.update();
        }
    }

    // ==========================================
    // 2. UI GOMBOK ÉS INTERAKCIÓK
    // ==========================================

    /**
     * Eseménykezelő: Kör befejezése gomb.
     * @calls {GameController.endTurn} - Csak akkor hívódik meg, ha humán játékos van soron.
     */
    $(document).on('click', '#end-turn-btn', function () {
        if (game && !game.currentPlayer.isAI) {
            game.endTurn();
        }
    });

    /**
     * Eseménykezelő: Visszavonás (Undo) gomb.
     * @calls {HistoryManager.undo} - Visszaállítja az előző lépést a körön belül.
     */
    $(document).on('click', '#undo-btn', function () {
        if (game && !game.currentPlayer.isAI) {
            game.history.undo();
        }
    });

    /**
     * Eseménykezelő: Eladás / Leszerelés gomb.
     * @calls {GameController.sellItem, UIManager.update} - Törli a kiválasztott entitást és frissíti a felületet.
     */
    $(document).on('click', '#sell-btn', function () {
        if (game && !game.currentPlayer.isAI) {
            game.sellItem();
            game.ui.update();
        }
    });

    /**
     * Eseménykezelő: Vásárlás / Toborzás gombok (dinamikusan generált elemek).
     * @modifies {DOM} - Kinyeri a gomb data-attribútumait (típus, szint/azonosító, ár).
     * @calls {GameController.buyItem, UIManager.update}
     */
    $(document).on('click', '.build-btn', function () {
        if (game && !game.currentPlayer.isAI) {
            const type = $(this).data('type');
            const cost = parseInt($(this).data('cost'));
            const value = type === 'unit' ? $(this).data('level') : $(this).data('id');

            game.buyItem(type, value, cost);
            game.ui.update();
        }
    });

    // ==========================================
    // 3. SÚGÓ (GUIDE) PANEL KEZELÉSE
    // ==========================================

    /**
     * Eseménykezelő: Súgó panel megnyitása.
     * @modifies {DOM} - Megjeleníti a #guide-panel div-et (fadeIn).
     */
    $(document).on('click', '.text-link, #open-guide-btn', function (e) {
        e.preventDefault();
        $('#guide-panel').fadeIn(200);
    });

    /**
     * Eseménykezelő: Súgó panel bezárása.
     * @modifies {DOM} - Elrejti a #guide-panel div-et (fadeOut).
     */
    $(document).on('click', '#close-guide-btn, #close-guide', function () {
        $('#guide-panel').fadeOut(200);
    });
});