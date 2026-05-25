import Phaser from "phaser";
import Colors from "../enums/Colors";

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private towers!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private graphics!: Phaser.GameObjects.Graphics;
  private energyBar!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private healthIcons!: Phaser.GameObjects.Graphics;

  //Player
  private readonly maxPlayerHealth: number = 3;
  private readonly playerRadius: number = 20;
  private readonly playerSpeed: number = 500;
  private readonly connectionRange: number = 400;

  //Player Energy
  private readonly energyDrainRate: number = 50;
  private readonly energyGainRate: number = 40;
  private readonly energyBarWidth: number = 400;
  private readonly energyBarHeight: number = 24;

  //Player Discharge Attack
  private readonly dischargeCooldownTime: number = 3000;
  private readonly dischargeRadius: number = 300;
  private readonly dischargeEnergyCost: number = 20;

  //Enemy
  private readonly enemyRadius: number = 14;
  private readonly enemySpeed: number = 200;
  private readonly maxEnemies: number = 15;
  private readonly enemyDamageRadius: number = 24;

  //Tower
  private readonly towerRadius: number = 16;
  private readonly maxTowers: number = 24;
  private readonly towerDrainRate: number = 100;

  //World
  private readonly worldWidth: number = 3840;
  private readonly worldHeight: number = 2160;

  //Game state
  private gameOverTriggered: boolean = false;


  private playerHealth: number = 3;
  private energy: number = 100;
  private score: number = 0;
  private survivalTime: number = 0;
  private dischargeCooldown: number = 0;

  constructor() {
    super("Game");
  }

  private reset() {
    this.playerHealth = this.maxPlayerHealth;
    this.energy = 100;
    this.score = 0;
    this.survivalTime = 0;
    this.dischargeCooldown = 0;
    this.gameOverTriggered = false;
  }

  create() {
    this.reset();
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

    this.input
      .keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .on("down", () => {
        this.discharge();
      });

    //World bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    //Player
    this.player = this.physics.add.image(
      this.worldWidth / 2,
      this.worldHeight / 2,
      "__DEFAULT",
    );
    this.player.setCircle(this.playerRadius);
    this.player.setCollideWorldBounds(true);
    this.healthIcons = this.add.graphics();
    this.healthIcons.setScrollFactor(0);

    //Camera
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBackgroundColor("#1a1a2e");

    //Towers
    this.towers = this.physics.add.staticGroup();
    for (let i = 0; i < this.maxTowers; i++) {
      const x = Phaser.Math.Between(50, this.worldWidth - 50);
      const y = Phaser.Math.Between(50, this.worldHeight - 50);
      this.towers.create(x, y, "__DEFAULT").setData("energy", 100);
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

    //Score
    this.scoreText = this.add
      .text(10, 44, "SCORE: 0", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setScrollFactor(0);

    //Timer
    this.timerText = this.add
      .text(10, 70, "SURVIVAL TIME: 0s", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setScrollFactor(0);
  }

  update(_time: number, delta: number) {
    this.graphics.clear();

    this.graphics.fillStyle(Colors.PLAYER);
    this.graphics.fillCircle(this.player.x, this.player.y, this.playerRadius);

    this.towers.getChildren().forEach((tower) => {
      const t = tower as Phaser.Physics.Arcade.Image;

      const towerEnergyPercent = t.getData("energy") / 100;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(Colors.TOWER_DEPLETED),
        Phaser.Display.Color.ValueToColor(Colors.TOWER),
        100,
        towerEnergyPercent * 100,
      );

      this.graphics.fillStyle(
        Phaser.Display.Color.GetColor(color.r, color.g, color.b),
      );
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

        //Drain tower energy
        const towerEnergy =
          t.getData("energy") - this.towerDrainRate * (delta / 1000);
        t.setData("energy", towerEnergy);

        //Give player energy
        this.energy += this.energyGainRate * (delta / 1000); //TODO: If connected to multiple towers, too much energy may be gained.

        //Tower depleted
        if (towerEnergy <= 0) {
          t.destroy();
          this.score += 200;
        }
      }
    });

    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as Phaser.Physics.Arcade.Image;

      this.graphics.fillStyle(Colors.ENEMY);
      this.graphics.fillCircle(e.x, e.y, this.enemyRadius);
      this.graphics.lineStyle(2, Colors.ENEMY, 0.4);
      this.graphics.lineBetween(e.x, e.y, this.player.x, this.player.y);

      //Chase player
      this.physics.moveToObject(e, this.player, this.enemySpeed);

      // Damage player on contact
      const distToPlayer = Phaser.Math.Distance.Between(
        e.x,
        e.y,
        this.player.x,
        this.player.y,
      );
      if (distToPlayer < this.playerRadius + this.enemyDamageRadius) {
        this.takeDamage();
        e.destroy();
      }
    });

    // this.energy -= this.energyDrainRate * (delta / 1000);
    this.energy = Phaser.Math.Clamp(this.energy, 0, 100);

    //Lose condition
    if (this.playerHealth <= 0 && !this.gameOverTriggered) {
      this.gameOverTriggered = true;
      this.time.delayedCall(1000, () => {
        this.scene.start("MainMenu");
      });
    }

    //Player Movement
    const vx =
      (this.cursors.right.isDown || this.wasd["right"].isDown ? 1 : 0) -
      (this.cursors.left.isDown || this.wasd["left"].isDown ? 1 : 0);

    const vy =
      (this.cursors.down.isDown || this.wasd["down"].isDown ? 1 : 0) -
      (this.cursors.up.isDown || this.wasd["up"].isDown ? 1 : 0);

    const vec = new Phaser.Math.Vector2(vx, vy).normalize();

    if (!this.gameOverTriggered) {
      this.player.setVelocity(
        vec.x * this.playerSpeed,
        vec.y * this.playerSpeed,
      );
    }

    if (this.dischargeCooldown > 0) {
      this.dischargeCooldown -= delta;
    }

    this.survivalTime += delta / 1000;
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.timerText.setText(`SURVIVAL TIME: ${Math.floor(this.survivalTime)}s`);
    this.drawEnergyBar();
    this.drawHealth();
  }

  private drawEnergyBar() {
    this.energyBar.clear();

    //Background color
    this.energyBar.fillStyle(Colors.ENERGY_BAR);
    this.energyBar.fillRect(10, 10, this.energyBarWidth, this.energyBarHeight);

    //Fill color (energy level)
    this.energyBar.fillStyle(0x00ffcc);
    this.energyBar.fillRect(
      10,
      10,
      this.energyBarWidth * (this.energy / 100),
      this.energyBarHeight,
    );
  }

  private dischargeEffect() {
    const circle = this.add.circle(
      this.player.x,
      this.player.y,
      this.dischargeRadius,
      0x00ffcc,
      0.3,
    );

    this.tweens.add({
      targets: circle,
      // scaleX: 1.5,
      // scaleY: 1.5,
      alpha: 0,
      duration: 400,
      ease: "Power2",
      onComplete: () => circle.destroy(),
    });

    //Screen shake
    this.cameras.main.shake(200, 0.01);
  }

  private discharge() {
    // if(this.dischargeCooldown > 0) return;
    if (this.gameOverTriggered) return;
    if (this.energy < this.dischargeEnergyCost) return;

    this.dischargeEffect();

    this.energy -= this.dischargeEnergyCost;
    this.dischargeCooldown = this.dischargeCooldownTime;

    //Destroy enemies in radius
    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as Phaser.Physics.Arcade.Image;
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        e.x,
        e.y,
      );

      if (dist < this.dischargeRadius) {
        e.destroy();
        this.score += 100;
      }
    });
  }

  private drawHealth() {
    this.healthIcons.clear();

    for (let i = 0; i < this.maxPlayerHealth; i++) {
      this.healthIcons.fillStyle(
        i < this.playerHealth ? Colors.PLAYER : 0x333333,
      );
      this.healthIcons.fillCircle(this.scale.width - 40 - i * 40, 24, 12);
    }
  }

  private takeDamage() {
    this.playerHealth--;
    this.cameras.main.shake(300, 0.2);
  }
}
