/*
    Web audio engine
*/

let ctx: AudioContext | null = null;

function init() {
    if (!ctx) {
        ctx = new AudioContext();
    }

    if(ctx.state === "suspended") {
        ctx.resume();
    }
}

function tone(freq: number, type: OscillatorType, vol: number, duration: number, delay = 0) {
    init();
    if(!ctx) {
        return;
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration + 0.05);
}

const SoundFX = {
    //TODO: fill out
};

export default SoundFX;