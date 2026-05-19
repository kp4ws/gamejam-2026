import Phaser from "phaser";

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.scale;

    //TODO init audio

    this.cameras.main.setBackgroundColor("#1a1a2e");

    //Title
    this.add
      .text(width / 2, height / 2 - 100, "MY GAME", {
        fontFamily: "monospace",
        fontSize: "80px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    //Start Button
    const startButton = this.add
      .text(width / 2, height / 2 + 20, "START", {
        fontFamily: "monospace",
        fontSize: "64px",
        color: "#00ffcc",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerdown", () => {
      this.scene.start("Game");
    });

    startButton.on("pointerover", () => {
      startButton.setStyle({ color: "#ffffff" });
    });

    startButton.on("pointerout", () => {
      startButton.setStyle({ color: "#00ffcc" });
    });

    //Start button blink effect
    this.tweens.add({
        targets: startButton,
        alpha: 0.5,
        duration: 600,
        yoyo: true,
        repeat: -1,
    });
  }
}
