const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {}

  create() {
    this.createTexture('player_idle', 32, 40, 0xffd166);
    this.createTexture('player_dash', 32, 40, 0xf72585);
    this.createTexture('enemy_grunt', 30, 38, 0x4cc9f0);
    this.createTexture('enemy_mech', 46, 56, 0x94d2bd);
    this.createTexture('bullet', 12, 4, 0xffb703);
    this.createTexture('rocket', 10, 24, 0xe63946);
    this.createTexture('grenade', 12, 12, 0x8ecae6);
    this.createTexture('pickup_hp', 16, 16, 0x80ed99);
    this.scene.start('game');
  }

  createTexture(key, width, height, color) {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(0, 0, width, height, 6);
    gfx.generateTexture(key, width, height);
    gfx.destroy();
  }
}

const HERO_CONFIG = {
  accel: 800,
  maxSpeed: 280,
  jump: 420,
  dashSpeed: 520,
  dashCooldown: 1.2,
  grenadeCooldown: 0.8,
  rocketCooldown: 1.8,
  rateOfFire: 0.12,
};

class Hero extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDragX(900);
    this.setMaxVelocity(HERO_CONFIG.maxSpeed, 900);
    this.body.setSize(26, 38);
    this.body.setOffset(3, 1);
    this.resetState();
  }

  resetState() {
    this.hp = 5;
    this.fireTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.grenadeCooldown = 0;
    this.rocketCooldown = 0;
    this.invulnerable = 0;
    this.combo = 1;
  }
}

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, speed) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.allowGravity = false;
    this.speed = speed;
  }

  fire(x, y, dir) {
    this.setActive(true).setVisible(true);
    this.setPosition(x, y);
    this.setVelocityX(this.speed * dir);
  }
}

class MetalBlitzScene extends Phaser.Scene {
  constructor() {
    super('game');
    this.keys = {};
  }

  create() {
    this.createParallax();
    this.createWorld();
    this.hero = new Hero(this, 120, 350);
    this.cameras.main.startFollow(this.hero, true, 0.08, 0.08, -200, 150);
    this.cameras.main.setBounds(0, 0, 3200, GAME_HEIGHT);

    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 40,
      runChildUpdate: false,
    });
    this.rockets = this.physics.add.group({ classType: Bullet, maxSize: 10 });
    this.grenades = this.physics.add.group();

    this.enemies = this.physics.add.group();
    this.spawnTimeline();

    this.pickups = this.physics.add.group();

    this.physics.add.collider(this.hero, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.pickups, this.platforms);
    this.physics.add.collider(this.grenades, this.platforms, (gren) => {
      gren.body.setVelocityX(0);
    });

    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitsEnemy, undefined, this);
    this.physics.add.overlap(this.rockets, this.enemies, this.explodeProjectile, undefined, this);
    this.physics.add.overlap(this.grenades, this.enemies, this.grenadeHitsEnemy, undefined, this);
    this.physics.add.overlap(this.hero, this.enemies, this.heroHit, undefined, this);
    this.physics.add.overlap(this.hero, this.pickups, this.collectPickup, undefined, this);

    this.createHUD();
    this.bindInput();
  }

  createParallax() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b2b40, 0x0b2b40, 0x040d12, 0x040d12, 1);
    bg.fillRect(0, 0, 5000, GAME_HEIGHT);
    this.bg = bg;
    const ground = this.add.rectangle(0, GAME_HEIGHT - 80, 5000, 80, 0x13251e).setOrigin(0, 0);
  }

  createWorld() {
    this.physics.world.setBounds(0, 0, 3200, GAME_HEIGHT);
    const platforms = this.physics.add.staticGroup();
    for (let i = 0; i < 80; i++) {
      const block = this.add.rectangle(i * 40, GAME_HEIGHT - 40, 40, 40, 0x1d3557).setOrigin(0, 0);
      this.physics.add.existing(block, true);
      platforms.add(block);
    }
    // floating ledges
    [400, 900, 1500, 2100].forEach((x) => {
      const ledge = this.add.rectangle(x, GAME_HEIGHT - 180, 120, 20, 0x274060).setOrigin(0, 0);
      this.physics.add.existing(ledge, true);
      platforms.add(ledge);
    });
    this.platforms = platforms;
  }

  createHUD() {
    this.hud = this.add.text(20, 20, 'HP 5  Score 0', {
      fontFamily: 'Space Grotesk',
      fontSize: 20,
      color: '#f1faee',
    }).setScrollFactor(0);
  }

  bindInput() {
    const add = this.input.keyboard.addKeys;
    this.keys = add({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      fire: Phaser.Input.Keyboard.KeyCodes.J,
      rocket: Phaser.Input.Keyboard.KeyCodes.K,
      grenade: Phaser.Input.Keyboard.KeyCodes.L,
    });
  }

  spawnTimeline() {
    this.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => this.spawnWave(),
    });
    this.time.addEvent({
      delay: 15000,
      loop: true,
      callback: () => this.spawnMech(),
    });
  }

  spawnWave() {
    for (let i = 0; i < 4; i++) {
      const grunt = this.physics.add.sprite(800 + i * 60, 320, 'enemy_grunt');
      grunt.setCollideWorldBounds(true);
      grunt.hp = 2;
      grunt.body.setSize(24, 36);
      grunt.direction = -1;
      grunt.fireTimer = Phaser.Math.FloatBetween(1.2, 2.2);
      grunt.speed = Phaser.Math.Between(80, 120);
      this.enemies.add(grunt);
    }
  }

  spawnMech() {
    const mech = this.physics.add.sprite(1800, 260, 'enemy_mech');
    mech.hp = 10;
    mech.body.setSize(40, 54);
    mech.direction = -1;
    mech.speed = 40;
    mech.fireTimer = 1.5;
    mech.isMech = true;
    this.enemies.add(mech);
  }

  bulletHitsEnemy(bullet, enemy) {
    bullet.disableBody(true, true);
    this.damageEnemy(enemy, 1);
  }

  explodeProjectile(projectile, enemy) {
    projectile.disableBody(true, true);
    this.damageEnemy(enemy, 3);
  }

  grenadeHitsEnemy(grenade, enemy) {
    grenade.disableBody(true, true);
    this.damageEnemy(enemy, 2);
  }

  damageEnemy(enemy, amount) {
    enemy.hp -= amount;
    if (enemy.hp <= 0) {
      this.hero.combo = Math.min(this.hero.combo + 0.2, 5);
      this.score = (this.score || 0) + 100 * this.hero.combo;
      this.spawnPickup(enemy.x, enemy.y);
      enemy.destroy();
    }
  }

  spawnPickup(x, y) {
    if (Phaser.Math.FloatBetween(0, 1) < 0.25) {
      const pickup = this.physics.add.sprite(x, y - 20, 'pickup_hp');
      pickup.type = 'hp';
      this.pickups.add(pickup);
    }
  }

  collectPickup(hero, pickup) {
    if (pickup.type === 'hp') {
      hero.hp = Math.min(hero.hp + 1, 5);
    }
    pickup.destroy();
  }

  heroHit(hero, enemy) {
    if (hero.invulnerable > 0) return;
    hero.hp -= 1;
    hero.invulnerable = 1.2;
    if (hero.hp <= 0) {
      hero.setTint(0xff0000);
      hero.disableBody(true, false);
      this.time.delayedCall(2000, () => this.scene.restart());
    }
  }

  fireBullet() {
    if (this.hero.fireTimer > 0) return;
    const bullet = this.bullets.get(this.hero.x + 20, this.hero.y, 'bullet', 200);
    if (bullet) {
      bullet.fire(this.hero.x + 20, this.hero.y, 1);
      this.hero.fireTimer = HERO_CONFIG.rateOfFire;
    }
  }

  fireRocket() {
    if (this.hero.rocketCooldown > 0) return;
    const rocket = this.rockets.get(this.hero.x, this.hero.y, 'rocket', 260);
    if (rocket) {
      rocket.fire(this.hero.x, this.hero.y, 1);
      this.hero.rocketCooldown = HERO_CONFIG.rocketCooldown;
    }
  }

  throwGrenade() {
    if (this.hero.grenadeCooldown > 0) return;
    const grenade = this.physics.add.sprite(this.hero.x, this.hero.y - 10, 'grenade');
    grenade.body.setBounce(0.5);
    grenade.body.setCollideWorldBounds(true);
    grenade.body.setVelocity(200, -280);
    grenade.body.setDrag(40, 0);
    grenade.timer = 1.6;
    this.grenades.add(grenade);
    this.hero.grenadeCooldown = HERO_CONFIG.grenadeCooldown;
  }

  update(time, delta) {
    const dt = delta / 1000;
    const hero = this.hero;
    hero.fireTimer = Math.max(hero.fireTimer - dt, 0);
    hero.dashCooldown = Math.max(hero.dashCooldown - dt, 0);
    hero.dashTimer = Math.max(hero.dashTimer - dt, 0);
    hero.rocketCooldown = Math.max(hero.rocketCooldown - dt, 0);
    hero.grenadeCooldown = Math.max(hero.grenadeCooldown - dt, 0);
    hero.invulnerable = Math.max(hero.invulnerable - dt, 0);

    if (this.keys.left.isDown) hero.setAccelerationX(-HERO_CONFIG.accel);
    else if (this.keys.right.isDown) hero.setAccelerationX(HERO_CONFIG.accel);
    else hero.setAccelerationX(0);

    if ((this.keys.up.isDown || this.keys.jump.isDown) && hero.body.onFloor()) {
      hero.setVelocityY(-HERO_CONFIG.jump);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.dash) && hero.dashCooldown <= 0) {
      hero.setVelocityX(HERO_CONFIG.dashSpeed);
      hero.dashCooldown = HERO_CONFIG.dashCooldown;
      hero.dashTimer = 0.2;
      hero.setTexture('player_dash');
      this.time.delayedCall(180, () => hero.setTexture('player_idle'));
    }

    if (this.keys.fire.isDown) this.fireBullet();
    if (Phaser.Input.Keyboard.JustDown(this.keys.rocket)) this.fireRocket();
    if (Phaser.Input.Keyboard.JustDown(this.keys.grenade)) this.throwGrenade();

    this.enemies.children.each((enemy) => {
      enemy.setVelocityX(enemy.speed * enemy.direction);
      if (enemy.body.blocked.left || enemy.body.blocked.right) {
        enemy.direction *= -1;
      }
      enemy.fireTimer -= dt;
      if (enemy.fireTimer <= 0 && enemy.active) {
        this.enemyFire(enemy);
        enemy.fireTimer = enemy.isMech ? 1.6 : 2.5;
      }
    });

    this.grenades.children.each((gren) => {
      gren.timer -= dt;
      if (gren.timer <= 0) {
        this.createExplosion(gren.x, gren.y, 120, 4);
        gren.destroy();
      }
    });

    this.updateHUD();
  }

  enemyFire(enemy) {
    const bullet = this.physics.add.sprite(enemy.x - 20, enemy.y, 'bullet');
    bullet.body.allowGravity = false;
    bullet.setVelocityX(-200);
    this.physics.add.overlap(this.hero, bullet, () => {
      bullet.destroy();
      this.heroHit(this.hero);
    });
    this.time.delayedCall(4000, () => bullet.destroy());
  }

  createExplosion(x, y, radius, damage) {
    const circle = this.add.circle(x, y, radius, 0xffafcc, 0.2);
    this.physics.world.enable(circle);
    const body = circle.body;
    body.setCircle(radius);
    body.setAllowGravity(false);
    this.time.delayedCall(200, () => circle.destroy());
    this.physics.add.overlap(circle, this.enemies, (circ, enemy) => {
      this.damageEnemy(enemy, damage);
    });
    this.physics.add.overlap(circle, this.hero, () => {
      this.heroHit(this.hero);
    });
  }

  updateHUD() {
    this.hud.setText(
      `HP ${this.hero.hp}  Score ${Math.floor(this.score || 0)}  Combo ${this.hero.combo.toFixed(1)}x`
    );
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#02060b',
  parent: 'game',
  scene: [BootScene, MetalBlitzScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);
