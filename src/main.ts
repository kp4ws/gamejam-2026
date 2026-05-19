import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import MainMenuScene from "./scenes/MainMenuScene";
import GameScene from "./scenes/GameScene";
import SoundFX from "./SoundFX";

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1920,
    height: 1080,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {x: 0, y: 0},
            debug: false,
        },
    },
    scene: [BootScene, MainMenuScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        zoom: window.devicePixelRatio,
    },
    // pixelArt: true,
};

new Phaser.Game(config);