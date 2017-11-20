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
var nBlocs = 3 + Math.floor(WIDTH / BOX_WIDTH);

var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container;
var ground, hero;
var hemisphereLight, shadowLight;

var fps, fpsInterval, startTime, now, then, elapsed;

function init() {
    // set up the scene, the camera and the renderer
    createScene();

    // add the lights
    createLights();

    // // add the objects
    createGround();
    createHero();
    // createSky();

    // start a loop that will update the objects' positions 
    // and render the scene on each frame
    jump();
    loop();
}

function loop() {
    TWEEN.update();
    requestAnimationFrame(loop);
    render();
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

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

Ground = function() {
    this.mesh = new THREE.Object3D();

    var mat = new THREE.MeshPhongMaterial({
        color: Colors.blue,
        transparent: true,
        opacity: .6,
        flatShading: THREE.FlatShading,
    });

    this.addBlock = function(x) {
        var geom = new THREE.BoxGeometry(BOX_WIDTH, getRandomInt(BOX_HEIGHTS[0], BOX_HEIGHTS[1]), 20);
        var m = new THREE.Mesh(geom, mat);
        m.position.x = x;
        m.receiveShadow = true;
        this.mesh.add(m);
    }
    for (var i = 0; i < nBlocs; i++) {
        this.addBlock(i * BOX_WIDTH);
    }
}

function createHero() {
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        transparent: true,
        opacity: 1.0,
        flatShading: THREE.FlatShading,
    });
    // var geom = new THREE.BoxGeometry(BOX_WIDTH, getRandomInt(BOX_HEIGHTS[0], BOX_HEIGHTS[1]), 20);
    var geom = new THREE.SphereGeometry( HERO_RADIUS, 32, 32 );
    hero = new THREE.Mesh(geom, mat);

    var midBox = ground.mesh.children[Math.floor(nBlocs/2)];
    hero.position.x = midBox.position.x;
    hero.position.y = midBox.geometry.parameters.height / 2 + HERO_RADIUS;
    scene.add(hero);
}

function createGround() {
    ground = new Ground();
    scene.add(ground.mesh);
}

function jump() {
    var currY, nextY;
    var midBox = ground.mesh.children[Math.floor(nBlocs/2)];
    var prevBox = ground.mesh.children[Math.floor(nBlocs/2)-1];
    var nextBox = ground.mesh.children[Math.floor(nBlocs/2)+1];
    currY = midBox.geometry.parameters.height / 2 + HERO_RADIUS;
    nextY = nextBox.geometry.parameters.height / 2 + HERO_RADIUS;

    var midY = Math.max(currY, nextY) + HERO_RADIUS;
    
    var oldBlockPositions = [];
    for (var i = 0; i < nBlocs; i++) {
        oldBlockPositions.push(ground.mesh.children[i].position.x);
    }
    var oldHeroPosition = hero.position.y;

    var update = function() {
        // hero.position.x = current.x;
        // hero.position.y = current.y;
        for (var i = 0; i < nBlocs; i++) {
            ground.mesh.children[i].position.x = oldBlockPositions[i] + displacement.dx;
        }
        hero.position.y = oldHeroPosition + displacement.dy;
    }
    var displacement = {dx: 0, dy: 0};

    TWEEN.removeAll();

    var firstJump = new TWEEN.Tween(displacement)
                        .to({dx: -BOX_WIDTH/2, dy: midY - currY}, 250)
                        .easing(TWEEN.Easing.Sinusoidal.In)
                        .delay(10)
                        .onUpdate(update);
    var secondJump = new TWEEN.Tween(displacement)
                        .to({dx: -BOX_WIDTH, dy: nextY - currY}, 250)
                        .easing(TWEEN.Easing.Sinusoidal.Out)
                        .delay(10)
                        .onUpdate(update)
                        .onComplete(function() {
                            ground.mesh.children.shift();
                            ground.addBlock((nBlocs - 1) * BOX_WIDTH);
                            TWEEN.removeAll();
                            jump();
                        });

    firstJump.chain(secondJump);
    firstJump.start();

}

window.addEventListener('load', init, false);