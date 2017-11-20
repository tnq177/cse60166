//COLORS
var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
};
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var BOX_WIDTH = 20;
var BOX_HEIGHTS = [10, 60];
var HERO_RADIUS = 5;
var JUMP_TIME = 500;
var nBlocs = 3 + Math.floor(WIDTH / BOX_WIDTH);

var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container;
var ground, hero;
var hemisphereLight, shadowLight;
var audioLand, audioDie;

var isRunning = false;
var isJumpTwice = false;
var isLanding = false;
var isHit = false;

function init() {
    // set up the scene, the camera and the renderer
    createScene();
    createLights();
    createSounds();

    // // add the objects
    createGround();
    createHero();
    render();
    document.addEventListener("keydown", function(event) {
        if (event.which == 32) {
            if (!isRunning) {
                isRunning = true;
                startGame();
            }
            else {
                var dstBox;
                if (isJumpTwice) {
                    dstBox = ground.mesh.children[Math.floor(nBlocs/2)+2];
                }
                else {
                    dstBox = ground.mesh.children[Math.floor(nBlocs/2)+1];
                }
                if (isLanding && hero.mesh.position.x >= dstBox.position.x - 10 && hero.mesh.position.x <= dstBox.position.x + 10){// && hero.position.y >= midBox.geometry.parameters.height / 2 + HERO_RADIUS && hero.position.y - midBox.geometry.parameters.height / 2 - HERO_RADIUS <= 10) {
                    isJumpTwice = true;
                    isHit = true;
                }
                else {
                    isHit = false;
                }
            }
        }
    });
}


function startGame(){
    jump();
    loop();
}

function loop() {
    TWEEN.update();
    if (isRunning) {
        requestAnimationFrame(loop);
        render();
        
    }
}

function render() {
    renderer.render(scene, camera);
}

function createScene() {
    // Get the width and the height of the screen,
    // use them to set up the aspect ratio of the camera 
    // and the size of the renderer.
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // Create the scene
    scene = new THREE.Scene();

    // Add a fog effect to the scene; same color as the
    // background color used in the style sheet
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // Create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    // Set the position of the camera
    camera.position.x = WIDTH/2;
    camera.position.z = 200;
    camera.position.y = 100;

    // Create the renderer
    renderer = new THREE.WebGLRenderer({
        // Allow transparency to show the gradient background
        // we defined in the CSS
        alpha: true,

        // Activate the anti-aliasing; this is less performant,
        // but, as our project is low-poly based, it should be fine :)
        antialias: true
    });

    // Define the size of the renderer; in this case,
    // it will fill the entire screen
    renderer.setSize(WIDTH, HEIGHT);

    // Enable shadow rendering
    renderer.shadowMap.enabled = true;

    // Add the DOM element of the renderer to the 
    // container we created in the HTML
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // Listen to the screen: if the user resizes it
    // we have to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
    // update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

function createLights() {
    // A hemisphere light is a gradient colored light; 
    // the first parameter is the sky color, the second parameter is the ground color, 
    // the third parameter is the intensity of the light
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

    // A directional light shines from a specific direction. 
    // It acts like the sun, that means that all the rays produced are parallel. 
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // Set the direction of the light  
    shadowLight.position.set(150, 350, 350);

    // Allow shadow casting 
    shadowLight.castShadow = true;

    // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better, 
    // but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // to activate the lights, just add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}

function createSounds() {
    audioLand = document.createElement('audio');
    var audioLandSource = document.createElement('source');
    audioLandSource.src = './landing.mp3';
    audioLand.appendChild(audioLandSource);

    audioDie = document.createElement('audio');
    var audioDieSource = document.createElement('source');
    audioDieSource.src = './die.mp3';
    audioDie.appendChild(audioDieSource);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function createBlock(isBad, x) {
    var mat = new THREE.MeshPhongMaterial({
        color: isBad ? Colors.red : Colors.blue,
        transparent: true,
        opacity: .6,
        flatShading: THREE.FlatShading,
    });    
    // var geom = new THREE.BoxGeometry(BOX_WIDTH - 5, getRandomInt(BOX_HEIGHTS[0], BOX_HEIGHTS[1]), 20);
    var geom = new THREE.CylinderGeometry((BOX_WIDTH - 5)/2, (BOX_WIDTH - 5)/2, getRandomInt(BOX_HEIGHTS[0], BOX_HEIGHTS[1]));
    var m = new THREE.Mesh(geom, mat);
    m.position.x = x;
    m.receiveShadow = true;
    m.isBad = isBad;

    return m;
}

Ground = function() {
    this.mesh = new THREE.Object3D();

    var mat = new THREE.MeshPhongMaterial({
        color: Colors.blue,
        transparent: true,
        opacity: .6,
        flatShading: THREE.FlatShading,
    });

    this.addBlock = function(x, isBad) {
        if (isBad === undefined) {
            isBad = getRandomInt(1, 10) == 1;
        }
        if (this.mesh.children.length > 0 && this.mesh.children[this.mesh.children.length-1].isBad) {
            isBad = false;
        }
        // var geom = new THREE.BoxGeometry(BOX_WIDTH - 5, getRandomInt(BOX_HEIGHTS[0], BOX_HEIGHTS[1]), 20);
        // var m = new THREE.Mesh(geom, mat);
        // m.position.x = x;
        // m.receiveShadow = true;

        this.mesh.add(createBlock(isBad, x));
    }

    for (var i = 0; i < nBlocs; i++) {
        var isBad = getRandomInt(1, 10) == 1;
        if (i == Math.floor(nBlocs / 2)) {
            isBad = false;
        }
        this.addBlock(i * BOX_WIDTH, isBad);
    }
}

// function createHero() {
//     var mat = new THREE.MeshPhongMaterial({
//         color: Colors.brownDark,
//         transparent: true,
//         opacity: 1.0,
//         flatShading: THREE.FlatShading,
//     });
//     var geom = new THREE.SphereGeometry( HERO_RADIUS, 32, 32 );
//     hero = new THREE.Mesh(geom, mat);
//     hero.castShadow = true;

//     var midBox = ground.mesh.children[Math.floor(nBlocs/2)];
//     hero.position.x = midBox.position.x;
//     hero.position.y = midBox.geometry.parameters.height / 2 + HERO_RADIUS;
//     scene.add(hero);
// }

Hero = function() {
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        transparent: true,
        opacity: 1.0,
        flatShading: THREE.FlatShading,
    });
    
    var midBox = ground.mesh.children[Math.floor(nBlocs/2)];
    var x = midBox.position.x;    
    var y = midBox.geometry.parameters.height / 2 + HERO_RADIUS;

    this.mesh = new THREE.Object3D();
    for (var i = 0; i < 6; i++) {
        var geom;
        if (i === 0) {
            geom = new THREE.SphereGeometry( HERO_RADIUS , 32, 32 );
            mat.opacity = 0.0;
        }
        else {
            geom = new THREE.SphereGeometry( HERO_RADIUS - 2, 32, 32 );
            mat.opacity = 1.0;
        }
        var circle = new THREE.Mesh(geom, mat);
        if (i === 0) {
            circle.position.x = x;
            circle.position.y = y;
        }
        else {
            circle.position.x = 2 * Math.cos(72 * (i-1) * Math.PI/180);
            circle.position.y = 2 * Math.sin(72 * (i-1) * Math.PI/180);
            this.mesh.add(circle);
        }
    }
    this.mesh.position.x = x;
    this.mesh.position.y = y;
}

function createHero() {
    hero = new Hero();
    scene.add(hero.mesh);
}

function createGround() {
    ground = new Ground();
    scene.add(ground.mesh);
}

function checkIfDead(playSound) {
    var midBox = ground.mesh.children[Math.floor(nBlocs/2)];
    if (midBox.isBad) {
        isRunning = false;
    }

    if (playSound) {
        if (isRunning) {
            audioLand.play();
        }
        else {
            audioDie.play();
        }
    }
}

function jump() {
    // var currY, nextY;
    // var midBox = ground.mesh.children[Math.floor(nBlocs/2)];
    // var prevBox = ground.mesh.children[Math.floor(nBlocs/2)-1];
    // var nextBox = ground.mesh.children[Math.floor(nBlocs/2)+1];
    // currY = midBox.geometry.parameters.height / 2 + HERO_RADIUS;
    // nextY = nextBox.geometry.parameters.height / 2 + HERO_RADIUS;

    // var midY = Math.max(currY, nextY) + HERO_RADIUS;
    isLanding = false;
    isHit = false;
    var oldBlockPositions = [];
    for (var i = 0; i < nBlocs; i++) {
        oldBlockPositions.push(ground.mesh.children[i].position.x);
    }
    var oldHeroPosition = hero.mesh.position.y;

    var update = function() {
        for (var i = 0; i < nBlocs; i++) {
            ground.mesh.children[i].position.x = oldBlockPositions[i] + displacement.dx;
        }
        hero.mesh.position.y = oldHeroPosition + displacement.dy;
        hero.mesh.rotation.z -= 0.05;
    }
    var displacement = {dx: 0, dy: 0};

    TWEEN.removeAll();

    var DX, DY1, DY2;
    if (isJumpTwice) {
        var currY, nextY, maxY;
        var midBox = ground.mesh.children[Math.floor(nBlocs/2)];
        var nextBox = ground.mesh.children[Math.floor(nBlocs/2)+1];
        var dstBox = ground.mesh.children[Math.floor(nBlocs/2)+2];
        currY = midBox.geometry.parameters.height / 2 + HERO_RADIUS;
        nextY = nextBox.geometry.parameters.height / 2 + HERO_RADIUS;
        dstY = dstBox.geometry.parameters.height / 2 + HERO_RADIUS;
        maxY = Math.max(Math.max(currY, nextY), dstY) + HERO_RADIUS;
        DY1 = maxY - currY + 2 * HERO_RADIUS;
        DY2 = dstY - currY;
        DX = -BOX_WIDTH * 2;
        var firstJump = new TWEEN.Tween(displacement)
                            .to({dx: -BOX_WIDTH, dy: DY1}, JUMP_TIME)
                            .easing(TWEEN.Easing.Sinusoidal.In)
                            .delay(100)
                            .onStart(function() {
                                isLanding = true;
                            })
                            .onUpdate(update);
        var secondJump = new TWEEN.Tween(displacement)
                            .to({dx: -BOX_WIDTH*2, dy: DY2}, JUMP_TIME)
                            .easing(TWEEN.Easing.Sinusoidal.Out)
                            .delay(10)
                            .onUpdate(update)
                            .onComplete(function() {
                                isJumpTwice = false;
                                if (isHit) {
                                    isJumpTwice = true;
                                }
                                isLanding = false;
                                ground.mesh.children.shift();
                                ground.mesh.children.shift();
                                ground.addBlock((nBlocs - 2) * BOX_WIDTH);
                                ground.addBlock((nBlocs - 1) * BOX_WIDTH);
                                checkIfDead(true);
                                TWEEN.removeAll();
                                jump();
                            });

        firstJump.chain(secondJump);
        firstJump.start();
    }
    else {
        var currY, nextY, midY;
        var midBox = ground.mesh.children[Math.floor(nBlocs/2)];
        var nextBox = ground.mesh.children[Math.floor(nBlocs/2)+1];
        currY = midBox.geometry.parameters.height / 2 + HERO_RADIUS;
        nextY = nextBox.geometry.parameters.height / 2 + HERO_RADIUS;
        midY = Math.max(currY, nextY) + HERO_RADIUS;
        DY1 = midY - currY + HERO_RADIUS;
        DY2 = nextY - currY;
        DX = -BOX_WIDTH;
        var firstJump = new TWEEN.Tween(displacement)
                            .to({dx: -BOX_WIDTH/2, dy: DY1}, JUMP_TIME)
                            .easing(TWEEN.Easing.Sinusoidal.In)
                            .delay(100)
                            .onStart(function() {
                                isLanding = true;
                            })
                            .onUpdate(update);
        var secondJump = new TWEEN.Tween(displacement)
                            .to({dx: -BOX_WIDTH, dy: DY2}, JUMP_TIME)
                            .easing(TWEEN.Easing.Sinusoidal.Out)
                            .delay(10)
                            .onUpdate(update)
                            .onComplete(function() {
                                isLanding = false;
                                ground.mesh.children.shift();
                                ground.addBlock((nBlocs - 1) * BOX_WIDTH);
                                checkIfDead(true);
                                TWEEN.removeAll();
                                jump();
                            });

        firstJump.chain(secondJump);
        firstJump.start();
    }

}

window.addEventListener('load', init, false);