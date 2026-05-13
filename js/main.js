// js/main.js

let game; // Globális változó, hogy a gombok hozzáférjenek

$(document).ready(function () {
    // 1. Induláskor elrejtjük a játékot (csak a menü látszik)
    $('#game-container').hide();

    // ÚJ JÁTÉK INDÍTÁSA
    $('#start-game-btn').click(function() {
        const hexSize = parseInt($('#map-size').val());
        const playerCount = parseInt($('#player-count').val());
        startGame(hexSize, playerCount);
    });

    // JÁTÉK FOLYTATÁSA (Betöltés)
    $('#load-game-btn').click(function() {
        const savedData = JSON.parse(localStorage.getItem('spid_savegame'));
        
        if (savedData) {
            // Először elindítjuk a motort a mentett méretekkel
            startGame(savedData.hexSize, savedData.playerCount, true);
        } else {
            alert("Nincs elmentett hódításod!");
        }
    });

    function startGame(hexSize, playerCount, isLoad = false) {
        $('#main-menu').hide();
        $('#game-container').css('display', 'flex');

        game = new GameController("gameCanvas", hexSize, playerCount);
        
        if (isLoad) {
            game.loadGame();
        } else {
            game.provinceManager.updateProvinces();
            game.render();
            game.ui.update();
        }
    }

    // 2. UI GOMBOK BEKÖTÉSE (Delegált eseménykezelők a dinamikus elemekhez)

    $(document).on('click', '#end-turn-btn', function () {
        if (game && !game.currentPlayer.isAI) {
            game.endTurn();
        }
    });

    $(document).on('click', '#undo-btn', function () {
        if (game && !game.currentPlayer.isAI) {
            game.history.undo();
        }
    });

    $(document).on('click', '#sell-btn', function () {
        if (game && !game.currentPlayer.isAI) {
            game.sellItem();
            // Biztosítjuk a UI frissülését eladás után
            game.ui.update();
        }
    });

    $(document).on('click', '.build-btn', function () {
        if (game && !game.currentPlayer.isAI) {
            const type = $(this).data('type');
            const cost = parseInt($(this).data('cost'));
            // Ha egység, a level-t olvassuk, ha épület, az id-t
            const value = type === 'unit' ? $(this).data('level') : $(this).data('id');

            game.buyItem(type, value, cost);

            // Frissítjük a kijelzést, hogy a levont arany azonnal látszódjon
            game.ui.update();
        }
    });

    // main.js-be:
    $(document).on('click', '.text-link', function () {
        $('#guide-panel').fadeIn();
    });

    // A guide panel bezárása (ha van rajta gomb)
    $(document).on('click', '#close-guide', function () {
        $('#guide-panel').fadeOut();
    });
});