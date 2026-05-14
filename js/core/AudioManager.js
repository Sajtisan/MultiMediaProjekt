class AudioManager {
    /**
     * Betölti a játék hangeffektjeit és beállítja a háttérzenét.
     * @modifies {AudioManager.sounds} - Inicializálja az Audio objektumokat.
     */
    constructor() {
        this.sounds = {
            bgMusic: new Audio('audio/background_music.mp3'),
            buy: new Audio('audio/cash_register.mp3'),
            kill: new Audio('audio/fight_impact.mp3'),
            move: new Audio('audio/footsteps.mp3'),
            win: new Audio('audio/victory_fanfare.mp3'),
            lose: new Audio('audio/defeat_melancholy.mp3')
        };

        this.sounds.bgMusic.loop = true;
        this.sounds.bgMusic.volume = 0.4;
        this.isUnlocked = false;
    }

    /**
     * Feloldja a böngésző szigorú Autoplay blokkolását azáltal, hogy a legelső 
     * felhasználói kattintáskor (főmenü) némítva betölti és megállítja az összes hangot.
     * @modifies {Audio, AudioManager.isUnlocked} - Engedélyezteti a hangfájlokat a rendszer számára.
     */
    unlockAll() {
        if (this.isUnlocked) return;

        for (let key in this.sounds) {
            let sound = this.sounds[key];
            sound.muted = true;
            let playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    sound.pause();
                    sound.currentTime = 0;
                    sound.muted = false;
                }).catch(e => console.warn(`Autoplay feloldása sikertelen: ${key}`, e));
            }
        }
        this.isUnlocked = true;
        console.log("Audio motor sikeresen feloldva!");
    }

    /**
     * Lejátszik egy specifikus hangeffektust az elejétől. 
     * Dinamikusan klónozza a hang-node-ot, így gyors egymásutáni kattintásoknál (pl. sorozatos támadás) az effektek nem vágják el egymást.
     * @param {string} key - A hang azonosítója (pl. 'buy', 'kill', 'move').
     * @calls {Audio.cloneNode, Audio.play}
     */
    play(key) {
        if (this.sounds[key]) {
            if (key === 'bgMusic') return;
            let soundClone = this.sounds[key].cloneNode();
            soundClone.volume = this.sounds[key].volume;
            soundClone.play().catch(e => console.log(`Audio blokkolva (${key}):`, e.message));
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