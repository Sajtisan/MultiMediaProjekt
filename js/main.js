// js/main.js

$(document).ready(function() {
    const game = new GameController('gameCanvas');

    $('#end-turn-btn').click(function() {
        if (!game.currentPlayer.isAI) {
            game.endTurn();
        }
    });

    // Vásárlás gombok kezelése
    $('.build-btn').click(function() {
        if (!game.currentPlayer.isAI) {
            const type = $(this).data('type');
            // Egységnél a 'level', toronynál az 'id' (tower) adatot nézzük
            const value = type === 'unit' ? $(this).data('level') : $(this).data('id');
            const cost = parseInt($(this).data('cost'));
            game.buyItem(type, value, cost);
        }
    });
});