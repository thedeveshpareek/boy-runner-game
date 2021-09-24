var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, "", { preload: preload, create: create, update: update });

function preload() {
    game.time.advancedTiming = true; 
    // load all assets
    game.load.tilemap("map", "https://s3-us-west-2.amazonaws.com/s.cdpn.io/972918/level1.csv"); 
    game.load.image("tileset", "https://s3-us-west-2.amazonaws.com/s.cdpn.io/972918/tileset.png");
    game.load.spritesheet("player", "https://s3-us-west-2.amazonaws.com/s.cdpn.io/972918/player.png", 23.3, 26);
    // particle effects
    game.load.image("explosion", "https://s3-us-west-2.amazonaws.com/s.cdpn.io/972918/explosion.png");
    game.load.image("particles", "https://s3-us-west-2.amazonaws.com/s.cdpn.io/972918/particles.png");
    // sound effects
    game.load.audio("jump", "https://s3-us-west-2.amazonaws.com/s.cdpn.io/972918/jump.wav"); 
    game.load.audio("playerDiedSound", "https://s3-us-west-2.amazonaws.com/s.cdpn.io/972918/playerdiedsound.wav"); 
    game.load.audio("splash", "https://s3-us-west-2.amazonaws.com/s.cdpn.io/972918/splash.wav"); 
}

// variables
var map; 
var layers; 
var player;
var controls = {}; 
var playerSpeed = 105;
var playerJumpCount = 0;
var jumpTimer = 0; 
var running = true;
var burstFlag = false; 
var particlesFlag = false; 
var burst;
var particlesBurst;
var jump;
var splashSound;
var playerDiedSound; 
var score = 0; 
var scoreText; 
var winText;
var refreshIntervalId;

function create() {
    this.stage.backgroundColor = "#000"; 
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.physics.arcade.gravity.y = 1600; 
    map = this.add.tilemap("map", 64, 64); 
    map.addTilesetImage("tileset"); 
    layer = map.createLayer(0); 
    layer.resizeWorld();
    // Create a custom timer
    timer = game.time.create();
    // Create a delayed event 3 seconds from now
    timerEvent = timer.add(Phaser.Timer.MINUTE * 0 + Phaser.Timer.SECOND * 3, this.endTimer, this);
    // Create score text
    scoreText = game.add.text(this.game.width / 2,this.game.height - 35,"Score: ", {font: '32px Arial', fill:  '#fff'});
    scoreText.fixedToCamera = true; 

    // sound effect settings
    jump = this.game.add.audio("jump"); 
    jump.volume = 0.2; 
    playerDiedSound = this.game.add.audio("playerDiedSound"); 
    playerDiedSound.volume = 0.5; 
    splashSound = this.game.add.audio("splash");

    // player settings
    player = this.add.sprite(100, 1150, "player"); 
    player.anchor.setTo(0.5, 0.5);  
    player.animations.add("jump",[2], 1, true); 
    player.animations.add("run",[3,4,5,6,7,8], 9, true); 
    this.physics.arcade.enable(player); 
    this.camera.follow(player); 
    player.body.collideWorldBounds = true;

    // particle effect settings
    this.burst = this.add.emitter(0, 0, 60); 
    this.burst.minParticleScale = 0.4; 
    this.burst.maxParticleScale = 1.4; 
    this.burst.minParticleSpeed.setTo(-100, 100); 
    this.burst.maxParticleSpeed.setTo(100, -100); 
    this.burst.makeParticles("explosion");

    // particle effect settings
    this.particlesBurst = this.add.emitter(0, 0, 60); 
    this.particlesBurst.minParticleScale = 0.4; 
    this.particlesBurst.maxParticleScale = 1.4; 
    this.particlesBurst.minParticleSpeed.setTo(-100, 100); 
    this.particlesBurst.maxParticleSpeed.setTo(100, -100); 
    this.particlesBurst.makeParticles("particles");

    // set collision
    map.setCollisionBetween(0,0); 
    map.setCollisionBetween(3,4);
    map.setTileIndexCallback(1, resetPlayer, this); 
    map.setTileIndexCallback(2, getParticles, this); 
    map.setTileIndexCallback(7, speedBoost, this);

    // control settings
    controls = {
        right: this.input.keyboard.addKey(Phaser.Keyboard.D),
        left: this.input.keyboard.addKey(Phaser.Keyboard.A),
        up: this.input.keyboard.addKey(Phaser.Keyboard.W),
        shoot: this.input.keyboard.addKey(Phaser.Keyboard.UP), };
}

function update() {
    // set to true when player 
    // collects coins  or dies
    burstFlag = false; 
    particlesFlag = false;

    scoreText.text = "Score: " + score;

    this.physics.arcade.collide(player, layer);
    player.body.velocity.x = 0; 

    if (controls.up.isDown && (player.body.onFloor() || player.body.touching.down && this.now > jumpTimer)) {
        jump.play();
        player.body.velocity.y = -600; 
        jumpTimer = this.time.now + 750; 
        player.animations.play("jump"); 
    }

    if (running) {
        player.animations.play("run");
        player.scale.setTo(1, 1); 
        player.body.velocity.x += playerSpeed; 
    }

    if (burstFlag) {
        this.burst.x = player.x; 
        this.burst.y = player.y; 
        this.burst.start(true, 1000, null, 10);
    } 

    if (particlesFlag) {
        this.particlesBurst.x = player.x; 
        this.particlesBurst.y = player.y; 
        this.particlesBurst.start(true, 1000, null, 10);
    }
    // Did you win?
    if (player.x > 6384) {
        clearInterval(refreshIntervalId);    
        winText = this.game.add.text(this.game.width / 2, this.game.height / 2, "You Win!", {font: '32px Arial', fill:  '#fff'});
        winText.fixedToCamera = true;
    }
}

function resetPlayer() {
    score = 0; 
    timer.start();
    playerDiedSound.play();
    burstFlag = true;
    player.kill();
    setTimeout(function() {
                timer.stop();
                player.reset(player.x - 200, player.y - 100);
            }, 2000);  
}

function getParticles() {
    splashSound.play();
    map.putTile(-1, layer.getTileX(player.x), layer.getTileY(player.y));
    particlesFlag = true; 
    playerSpeed += 8;
    this.time.events.add(Phaser.Timer.SECOND * 0.5, function() {
        playerSpeed -= 8; 
    });  
}

function speedBoost() {
    splashSound.play();
    particlesFlag = true; 
    map.putTile(-1, layer.getTileX(player.x), layer.getTileY(player.y));
    playerSpeed += 50;

    this.time.events.add(Phaser.Timer.SECOND * 1, function() {
        playerSpeed -= 50; 
    });  
}

function touchStart(evt) {
    evt.preventDefault(); 
        if(player.body.onFloor() || player.body.touching.down && this.now > jumpTimer) {
            jump.play();
            playerJumpCount++;
            player.body.velocity.y = -600; 
            jumpTimer +=  750; 
            player.animations.play("jump"); 
        } else if(playerJumpCount < 2) {
            jump.play();
            playerJumpCount++;
            player.body.velocity.y = -400; 
            jumpTimer +=  750; 
            player.animations.play("jump");            
        } 
        // reset playerJumpCount to 0 after a 150 milliseconds of a second
        if(playerJumpCount > 2) {
        setTimeout(function() {
                    playerJumpCount = 0; 
                }, 150);
        } 
}
function timerStart() {
    refreshIntervalId = setInterval(function() { score++; }, 1000);       
}

window.addEventListener('load', timerStart, false);