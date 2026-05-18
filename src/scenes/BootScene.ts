import Phaser from "phaser";

/*
    BootScene: Load assets here
*/

export default class BootScene extends Phaser.Scene {
    constructor() {
        super("Boot");
    }

    preload() {
        //this.load.image('player', '/assets/sprites/player.png');
    }

    create() {
        this.scene.start('MainMenu');
    }
}