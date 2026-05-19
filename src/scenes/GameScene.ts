import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private towers!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private graphics!: Phaser.GameObjects.Graphics;
  private energyBar!: Phaser.GameObjects.Graphics;
  private energy: number = 100;

  //Player
  private readonly playerRadius: number = 20;
  private readonly playerSpeed: number = 500;
  private readonly connectionRange: number = 400;

  //Enemy
  private readonly enemyRadius: number = 14;
  private readonly enemySpeed: number = 200;
  private readonly maxEnemies: number = 15;

  //Tower
  private readonly towerRadius: number = 16;
  private readonly maxTowers: number = 24;

  private readonly energyDrainRate: number = 50;
  private readonly energyGainRate: number = 40;
  private readonly energyBarWidth: number = 400;
  private readonly energyBarHeight: number = 24;

  private readonly worldWidth: number = 3840;
  private readonly worldHeight: number = 2160;

  constructor() {
    super("Game");
  }

  create() {
    // const { width, height } = this.scale;
    this.graphics = this.add.graphics();

    //Input controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    //World bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    //Player: TODO consider adding as a sprite
    this.player = this.physics.add.image(
      this.worldWidth / 2,
      this.worldHeight / 2,
      "__DEFAULT",
    );
    this.player.setCircle(this.playerRadius);
    this.player.setCollideWorldBounds(true);

    //Camera
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBackgroundColor("#1a1a2e");

    //Towers
    this.towers = this.physics.add.staticGroup();
    for (let i = 0; i < this.maxTowers; i++) {
      const x = Phaser.Math.Between(50, this.worldWidth - 50);
      const y = Phaser.Math.Between(50, this.worldHeight - 50);
      this.towers.create(x, y, "__DEFAULT");
    }

    //Enemy
    this.enemies = this.physics.add.group();
    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        if (this.enemies.countActive() < this.maxEnemies) {
          const x = Phaser.Math.Between(50, this.worldWidth - 50);
          const y = Phaser.Math.Between(50, this.worldHeight - 50);
          this.enemies.create(x, y, "__DEFAULT");
        }
      },
    });

    //Energy Bar
    this.energyBar = this.add.graphics();
    this.energyBar.setScrollFactor(0);
  }

  update(time: number, delta: number) {
    this.graphics.clear();

    this.graphics.fillStyle(0x00ffcc);
    this.graphics.fillCircle(this.player.x, this.player.y, this.playerRadius);

    this.towers.getChildren().forEach((tower) => {
      const t = tower as Phaser.Physics.Arcade.Image;
      this.graphics.fillStyle(0xffffff);
      this.graphics.fillCircle(t.x, t.y, this.towerRadius);

      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        t.x,
        t.y,
      );

      if (dist < this.connectionRange) {
        const alpha = Phaser.Math.Clamp(
          1 - dist / this.connectionRange,
          0.1,
          1,
        );
        this.graphics.lineStyle(6, 0x00ffcc, alpha);
        this.graphics.lineBetween(this.player.x, this.player.y, t.x, t.y);
        this.energy += this.energyGainRate * (delta / 1000); //TODO: If connected to multiple towers, too much energy may be gained.
      }
    });

    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as Phaser.Physics.Arcade.Image;

      this.graphics.fillStyle(0xff0000);
      this.graphics.fillCircle(e.x, e.y, this.enemyRadius);
      this.graphics.lineStyle(2, 0xff0000, 0.4);
      this.graphics.lineBetween(e.x, e.y, this.player.x, this.player.y);

      //Chase player
      this.physics.moveToObject(e, this.player, this.enemySpeed);
    });

    this.energy -= this.energyDrainRate * (delta / 1000);
    this.energy = Phaser.Math.Clamp(this.energy, 0, 100);

    //Lose condition
    if (this.energy <= 0) {
      this.scene.start("MainMenu");
    }

    //Player Movement
    const vx =
      (this.cursors.right.isDown || this.wasd["right"].isDown ? 1 : 0) -
      (this.cursors.left.isDown || this.wasd["left"].isDown ? 1 : 0);

    const vy =
      (this.cursors.down.isDown || this.wasd["down"].isDown ? 1 : 0) -
      (this.cursors.up.isDown || this.wasd["up"].isDown ? 1 : 0);

    const vec = new Phaser.Math.Vector2(vx, vy).normalize();
    this.player.setVelocity(vec.x * this.playerSpeed, vec.y * this.playerSpeed);

    this.drawEnergyBar();
  }

  private drawEnergyBar() {
    this.energyBar.clear();

    //Background
    this.energyBar.fillStyle(0x333333);
    this.energyBar.fillRect(10, 10, this.energyBarWidth, this.energyBarHeight);

    //Fill (energy level)
    this.energyBar.fillStyle(0x00ffcc);
    this.energyBar.fillRect(
      10,
      10,
      this.energyBarWidth * (this.energy / 100),
      this.energyBarHeight,
    );
  }
}
