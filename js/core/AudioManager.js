class AudioManager {
    /**
     * Betölti a játék hangeffektjeit és beállítja a háttérzenét.
     * @modifies {AudioManager.sounds} - Inicializálja az Audio objektumokat.
     */
    constructor() {
        this.sounds = {
            bgMusic: new Audio('audio/background_night_vibes.mp3'),
            buy: new Audio('audio/cash_register.mp3'),
            kill: new Audio('audio/fight_impact.mp3'),
            move: new Audio('audio/footsteps.mp3'),
            win: new Audio('audio/victory_fanfare.mp3'),
            lose: new Audio('audio/defeat_melancholy.mp3')
        };

        this.sounds.bgMusic.loop = true;
        this.sounds.bgMusic.volume = 0.4;
    }

    /**
     * Lejátszik egy specifikus hangeffektust az elejétől.
     * @param {string} key - A hang azonosítója (pl. 'buy', 'move').
     * @modifies {Audio} - Visszaállítja a hangfájl idejét 0-ra és elindítja.
     */
    play(key) {
        if (this.sounds[key]) {
            this.sounds[key].currentTime = 0;
            this.sounds[key].play().catch(e => console.log("Audio play blocked by browser"));
        }
    }

    /**
     * Elindítja a háttérzenét végtelenítve (loop).
     * @modifies {Audio} - Elindítja a bgMusic lejátszását.
     */
    startMusic() {
        this.sounds.bgMusic.play().catch(e => console.log("Music blocked until interaction"));
    }
}