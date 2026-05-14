class UIManager {
    /**
     * Létrehozza a felhasználói felület frissítéséért felelős menedzsert.
     * @param {GameController} game - A központi játékvezérlő referenciája.
     */
    constructor(game) {
        this.game = game;
    }

    /**
     * Frissíti a jobb oldali HTML UI panelt (kincstár, építkezés, toborzás) a kijelölt mező állapotának megfelelően.
     * @modifies {DOM} - Megjeleníti/elrejti a gombokat, frissíti az arany/profit szövegeket és a gombok disabled állapotát.
     * @calls {Province.calculateEconomy}
     */
    update() {
        const selectedHex = this.game.selectedHex;
        const currentPlayer = this.game.currentPlayer;
        if (selectedHex && selectedHex.owner === currentPlayer && selectedHex.province) {
            const prov = selectedHex.province;
            prov.calculateEconomy();
            $('#province-info').show();
            $('#ui-gold').text(prov.gold);
            const profit = prov.income - prov.upkeep;
            const profitText = (profit >= 0) ? `+${profit}` : profit;
            $('#ui-profit').text(profitText).css('color', (profit >= 0) ? '#2ecc71' : '#e74c3c');
            if (selectedHex.unit === null && !selectedHex.hasTree && selectedHex.building === null) {
                $('#build-menu').show();
                $('.build-btn').each(function () {
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
            if ((selectedHex.unit !== null || (selectedHex.building !== null && selectedHex.building !== 'capital')) && selectedHex.owner === currentPlayer) {
                $('#action-menu').show();
                let itemName = "";
                let refund = 0;
                if (selectedHex.unit) {
                    const unitInfo = GameConfig.units[selectedHex.unit.level];
                    itemName = unitInfo.name;
                    refund = Math.floor(unitInfo.cost / 2);
                } else if (selectedHex.building) {
                    const bldInfo = GameConfig.buildings[selectedHex.building];
                    itemName = bldInfo.name;
                    refund = Math.floor(bldInfo.cost / 2);
                }
                $('#selected-info').text(itemName);
                $('#sell-btn').text(`Leszerelés (+${refund}G)`).data('refund', refund);
            } else {
                $('#action-menu').hide();
            }
        } else {
            $('#province-info').hide();
            $('#build-menu').hide();
            $('#action-menu').hide();
        }
    }
}