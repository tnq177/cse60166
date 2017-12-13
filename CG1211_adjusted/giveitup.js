//COLORS
var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
};
/*
var Poles = {
    lowgood: 1,
    highgood: 2,
    lowbad: -1,
    highbad: -2,
};*/

var Patters = {
    Pone: [1, 1, 1],//0.6cr
    Ptwo: [1, 2, 1],//0.1
    Pthree: [1, -1, 1],//0.1
    Pfour: [1, 2, 1, 2, 1],//0.1
    Pfive: [1, 2,2, -1, 2,2, 1],//0.1
};

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var BOX_WIDTH = 20;
var BOX_HEIGHTS = [20, 40];
var HERO_RADIUS = 5;
var JUMP_TIME = 166;
var nBlocs = 3 + Math.floor(WIDTH / BOX_WIDTH);

var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container;
var ground, hero;
var hemisphereLight, shadowLight;
// var audioLand, audioDie;
var Sounds = {
    all: ['GIU','die']
  };

//fire

var fire;
var fireWidth  = 1000;
var fireHeight = 2000;
var fireDepth  = 3;
var sliceSpacing = 1.0;
var clock;


var isRunning = false;
var isJumpTwice = false;
var isLanding = false;
var isHit = false;
var difficulty = 0.0;
var count = 0;
var ctx;
var hud;
var polePIndex = [];
var cpoleIndex = 0;

// For modifying the middle block (jumped on) and make it scatter
THREE.ExplodeModifier = function () {
};
function draw2D(ctx, string) {//On canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.font = '100px "Time New Roman"';
    ctx.fillstyle = 'rgba(255, 255, 255, 1)';
    ctx.fillText(string, WIDTH/2-80/2, HEIGHT/2);
}
THREE.ExplodeModifier.prototype.modify = function ( geometry ) {

    var vertices = [];

    for ( var i = 0, il = geometry.faces.length; i < il; i ++ ) {

        var n = vertices.length;

        var face = geometry.faces[ i ];

        var a = face.a;
        var b = face.b;
        var c = face.c;

        var va = geometry.vertices[ a ];
        var vb = geometry.vertices[ b ];
        var vc = geometry.vertices[ c ];

        vertices.push( va.clone() );
        vertices.push( vb.clone() );
        vertices.push( vc.clone() );

        face.a = n;
        face.b = n + 1;
        face.c = n + 2;

    }

    geometry.vertices = vertices;

};

var explodeModifier = new THREE.ExplodeModifier();

function init() {
    // set up the scene, the camera and the renderer
    createPatters();
    //console.log(polePIndex);
    createScene();
    createLights();

    Sounds.all.forEach(function(sound) {
    Sounds[sound] = new Sound(sound);});

    // // add the objects
    createGround();
    createHero();
    VolumetricFire.texturePath = './textures/';
    clock = new THREE.Clock();
    //camera = new THREE.PerspectiveCamera(60, width / height, .1, 1000);
    //camera.position.set(0, 0, 3);
    fire = new VolumetricFire(fireWidth,fireHeight,fireDepth,sliceSpacing,camera);
    scene.add( fire.mesh );
    fire.mesh.position.set( hero.mesh.position.x - 100, hero.mesh.position.y, -8000);
    //console.log("success!")

    //scene.add( new THREE.AxesHelper(1000) );

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
                if (hero.mesh.position.x >= dstBox.position.x - 20 && hero.mesh.position.x <= dstBox.position.x + 20){// && hero.position.y >= midBox.geometry.parameters.height / 2 + HERO_RADIUS && hero.position.y - midBox.geometry.parameters.height / 2 - HERO_RADIUS <= 10) {
                    isJumpTwice = true;
                    isHit = true;
                }
                else {
                    isHit = false;
                }
            }
        }
        if(event.which == 13)
        {
            console.log('Enter');
            isRunning = true;
            count = 0;
            cpoleIndex = Math.floor(nBlocs / 2);
            console.log(cpoleIndex);
            startGame();

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
   
    //camera.position.set(WIDTH/2, 200, 100);
    //camera.lookAt(0, 0, -8e20000000);
    fire.update(clock.getElapsedTime());
    renderer.render(scene, camera);
    hud = document.getElementById("head-up-display");
    ctx = hud.getContext('2d');
    count1 = Math.max(0, count - 1);
    draw2D(ctx, count1);
    if (count == 0)
    {
        checkIfDead(false);
    }
    else
    {
        checkIfDead(true);
    }
    

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

    camera.position.set(WIDTH/2, 100, 200);

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

    /*var loader = new THREE.TextureLoader();
    var clothTexture = loader.load( 'circuit_pattern.png' );
    clothTexture.anisotropy = 16;

    var clothMaterial = new THREE.MeshLambertMaterial( {
        map: clothTexture,
        side: THREE.DoubleSide,
        alphaTest: 0.2
    } );

    // cloth geometry

    clothGeometry = new THREE.ParametricGeometry( clothFunction, cloth.w, cloth.h );

    // cloth mesh

    object = new THREE.Mesh( clothGeometry, clothMaterial );
    object.position.set( 500, 200, 10 );
    object.castShadow = true;
    scene.add( object );
    console.log('cloth');
    object.customDepthMaterial = new THREE.MeshDepthMaterial( {

        depthPacking: THREE.RGBADepthPacking,
        map: clothTexture,
        alphaTest: 0.5
    });*/


}

function handleWindowResize() {
    // update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

function createPatters()
{
    for (var i =0;i<Math.floor(nBlocs/2)+5;i++)
    {
        polePIndex.push(1);//The first 20 are good ones to adapt to the situations
    }
    var pnumber = 1000;
    for (var i=0; i<pnumber; i++)
    {
        var p1 = 0.4 - i * 0.4 / pnumber;
        p2 = (1 - p1) /4; 
        var indicator = Math.random()
        if (indicator < p1) {
            polePIndex.push(Patters.Pone[0]);
            polePIndex.push(Patters.Pone[1]);
            polePIndex.push(Patters.Pone[2]);

        }
        else if(indicator < p1+p2){
            polePIndex.push(Patters.Ptwo[0]);
            polePIndex.push(Patters.Ptwo[1]);
            polePIndex.push(Patters.Ptwo[2]);
            
        }
        else if (indicator < p1 + 2*p2) {
            polePIndex.push(Patters.Pthree[0]);
            polePIndex.push(Patters.Pthree[1]);
            polePIndex.push(Patters.Pthree[2]);

        }
        else if (indicator < p1 + 3 * p2) {
            polePIndex.push(Patters.Pfour[0]);
            polePIndex.push(Patters.Pfour[1]);
            polePIndex.push(Patters.Pfour[2]);
            polePIndex.push(Patters.Pfour[3]);
            polePIndex.push(Patters.Pfour[4]);

        }
        else
        {
            polePIndex.push(Patters.Pfive[0]);
            polePIndex.push(Patters.Pfive[1]);
            polePIndex.push(Patters.Pfive[2]);
            polePIndex.push(Patters.Pfive[3]);
            polePIndex.push(Patters.Pfive[5]);
            polePIndex.push(Patters.Pfive[4]);
        }
    }
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

/*
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
*/


function Sound(name) {
    this.name = name;
    this.audio = document.createElement('audio');
    var source = document.createElement('source');
    source.src = './sounds/' + name + '.mp3';
    //console.log(source.src)
    this.audio.appendChild(source);
  }


Sound.prototype.play = function() {
    this.stop();
    this.audio.play();
  };


Sound.prototype.stop = function() {
    this.audio.repeat = false;
    this.audio.currentTime = 0;
    this.audio.pause();
  };

Sound.prototype.repeat = function() {
    this.audio.loop = true;
    this.audio.play();
  };




function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function createBlock(x) {

    
    // var geom = new THREE.BoxGeometry(BOX_WIDTH - 5, getRandomInt(BOX_HEIGHTS[0], BOX_HEIGHTS[1]), 20);
    /*var indicator = Math.random()
    if (indicator > difficulty)
    {
        var height = BOX_HEIGHTS[1];
    }
    else {
        var height = BOX_HEIGHTS[0];
    }*/
    var curPattern = polePIndex[cpoleIndex];
    //console.log(curPattern);
    switch (curPattern) {
        case 1:
            var height = BOX_HEIGHTS[0];
            isBad = false;
            break;
        case 2:
            var height = BOX_HEIGHTS[1];
            isBad = false;
            break;
        case -1:
            var height = BOX_HEIGHTS[0];
            isBad = true;
            break;
        case -2:
            var height = BOX_HEIGHTS[1];
            isBad = true;
            break;
    }
    var mat = new THREE.MeshPhongMaterial({
        color: isBad ? Colors.red : Colors.blue,
        transparent: true,
        opacity: .8,
        flatShading: THREE.FlatShading,
    });
    cpoleIndex = cpoleIndex + 1;
    cpoleIndex = cpoleIndex % polePIndex.length;
    var geom = new THREE.CylinderGeometry((BOX_WIDTH - 5)/2, (BOX_WIDTH - 5)/2, height, 5, 2);
    var m = new THREE.Mesh(geom, mat);
    m.position.x = x;
    m.receiveShadow = true;
    m.isBad = isBad;
    m.height = height;

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

    this.addBlock = function(x) {
        
        // var geom = new THREE.BoxGeometry(BOX_WIDTH - 5, getRandomInt(BOX_HEIGHTS[0], BOX_HEIGHTS[1]), 20);
        // var m = new THREE.Mesh(geom, mat);
        // m.position.x = x;
        // m.receiveShadow = true;
        
        this.mesh.add(createBlock(x));
    }

    for (var i = 0; i < nBlocs; i++) {
        isBad = getRandomInt(1, 10) == 1;
        if (i == Math.floor(nBlocs / 2)) {
            isBad = false;
        }
        this.addBlock(i * BOX_WIDTH);
    }
}

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
    for (var i = 0; i < 5; i++) {
        var geom = new THREE.SphereGeometry( HERO_RADIUS - 2, 32, 32 );
        var circle = new THREE.Mesh(geom, mat);
        circle.position.x = 2 * Math.cos(72 * (i-1) * Math.PI/180);
        circle.position.y = 2 * Math.sin(72 * (i-1) * Math.PI/180);
        this.mesh.add(circle);
    }

    var geom = new THREE.SphereGeometry(HERO_RADIUS - 0.7, 32, 32);
    var circle = new THREE.Mesh(geom, mat);
    circle.position.x = 0;
    circle.position.y = 0;
    this.mesh.add(circle);



    var mat1 = new THREE.MeshPhongMaterial({
        color: Colors.white,
        transparent: true,
        opacity: 1.0,
        flatShading: THREE.FlatShading,
    });

    geom = new THREE.SphereGeometry(1.0, 32, 32);
    circle = new THREE.Mesh(geom, mat1);
    circle.position.x = -1.;
    circle.position.y = 3;
    circle.position.z = 2;
    this.mesh.add(circle);
    geom = new THREE.SphereGeometry(1.0, 32, 32);
    circle = new THREE.Mesh(geom, mat1);
    circle.position.x = 1.;
    circle.position.y = 3;
    circle.position.z = 2;
    this.mesh.add(circle);
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
    
    
    var midBox = ground.mesh.children[Math.floor(nBlocs / 2)];
    //console.log(hero.mesh.position.y);
    //midBox.geometry.parameters.height / 2 + HERO_RADIUS;
    //console.log(midBox.height / 2 + HERO_RADIUS);
    var nextBox = ground.mesh.children[Math.floor(nBlocs / 2) + 1];
    
    if (midBox.isBad) {// && hero.mesh.position.y < midBox.height / 2 + 2*HERO_RADIUS + 0.1) {
        isRunning = false;
    }
    if (hero.mesh.position.x > nextBox.position.x - 12 + 1 && hero.mesh.position.y < nextBox.height / 2 + HERO_RADIUS - 0.1) {
        isRunning = false;
        //console.log('THE SECOND ONE!!');
    }


    if (playSound) {
        if (isRunning) {
            Sounds.GIU.repeat();
        }
        else {
            Sounds.die.repeat();
            setTimeout(function(){Sounds.GIU.stop();}, 0);
            setTimeout(function(){Sounds.die.stop();}, 2000);
        }
    }
    console.log(isRunning);
}

function jump() {
    isLanding = false;
    isHit = false;

    var midBlockIdx = Math.floor(nBlocs/2);
    var blocks = ground.mesh.children;
    var oldBlockPositions = [];
    for (var i = 0; i < nBlocs; i++) {
        oldBlockPositions.push(blocks[i].position.x);
    }
    var oldHeroPosition = hero.mesh.position.y;
    var midBlockHeight = blocks[midBlockIdx].geometry.parameters.height + HERO_RADIUS * 2;

    // Make the center block (to be jumped on) scatter-able
    explodeModifier.modify(blocks[midBlockIdx].geometry);
    var orgMidBlockVertXs = [];
    var midBlockVertXDisplacements = [];
    var midBlockVertices = blocks[midBlockIdx].geometry.vertices;
    for (var i = 0; i < midBlockVertices.length; i++) {
        orgMidBlockVertXs.push(midBlockVertices[i].x);
        midBlockVertXDisplacements.push(getRandomArbitrary(-BOX_WIDTH/2, BOX_WIDTH/2));
    }

    var update = function() {
        for (var i = 0; i < nBlocs; i++) {
            blocks[i].position.x = oldBlockPositions[i] + displacement.dx;
        }
        hero.mesh.position.y = oldHeroPosition + displacement.dy;
        hero.mesh.rotation.z -= 0.05;

        // slowly pull down the jumped block 
        blocks[midBlockIdx].position.y = displacement.dh;
        // and explode it
        for (var i = 0; i < midBlockVertices.length; i++) {
            midBlockVertices[i].x = orgMidBlockVertXs[i] + displacement.dx_vertex * midBlockVertXDisplacements[i];
        }
        blocks[midBlockIdx].geometry.elementsNeedUpdate = true; // important
    }
    var displacement = {dx: 0, dy: 0, dh: 0, dx_vertex: 0.};

    TWEEN.removeAll();

    var DX, DY1, DY2;
    if (isJumpTwice) {
        var currY, nextY, maxY;
        var midBox = blocks[midBlockIdx];
        var nextBox = blocks[midBlockIdx+1];
        var dstBox = blocks[midBlockIdx+2];
        currY = midBox.geometry.parameters.height / 2 + HERO_RADIUS;
        nextY = nextBox.geometry.parameters.height / 2 + HERO_RADIUS;
        dstY = dstBox.geometry.parameters.height / 2 + HERO_RADIUS;
        maxY = Math.max(Math.max(currY, nextY), dstY) + HERO_RADIUS;
        DY1 = maxY - currY + 2 * HERO_RADIUS;
        DY2 = dstY - currY;
        var twoornot = false;
        if (nextY > currY)
        {
            DX = -BOX_WIDTH / 2;
            DY1 = nextY - currY + 2 * HERO_RADIUS;
            DY2 = nextY - currY;
            twoornot = false;
        }
        if (nextY <= currY)
        {
            DX = -BOX_WIDTH;
            DY1 = 10;
            DY2 = 0;
            if (dstY < currY)
            {
                DY2 = dstY - currY;
            }
            
            
            twoornot = true;
        }
        
        
        
        var firstJump = new TWEEN.Tween(displacement)
                            .to({dx: DX, dy: DY1, dh: -midBlockHeight/2, dx_vertex: 0.5}, JUMP_TIME)
                            .easing(TWEEN.Easing.Sinusoidal.In)
                            .delay(0)
                            .onStart(function() {
                                isLanding = true;
                            })
                            .onUpdate(update);
        checkIfDead(true);
        var secondJump = new TWEEN.Tween(displacement)
                            .to({dx: 2*DX, dy: DY2, dh: -midBlockHeight, dx_vertex: 1.0}, JUMP_TIME)
                            .easing(TWEEN.Easing.Sinusoidal.Out)
                            .delay(0)
                            .onUpdate(update)
                            .onComplete(function() {
                                isJumpTwice = false;
                                if (isHit) {
                                    isJumpTwice = true;
                                }
                                isLanding = false;
                                if (twoornot == true)
                                {
                                    scene.remove(blocks[midBlockIdx]);
                                    scene.remove(blocks[0]);
                                    scene.remove(blocks[1]);
                                    blocks.shift();
                                    blocks.shift();
                                    ground.addBlock((nBlocs - 2) * BOX_WIDTH);
                                    ground.addBlock((nBlocs - 1) * BOX_WIDTH);
                                    checkIfDead(true);
                                    TWEEN.removeAll();
                                    jump();
                                }
                                else {
                                    scene.remove(blocks[midBlockIdx]);
                                    scene.remove(blocks[0]);
                                    ground.mesh.children.shift();
                                    ground.addBlock((nBlocs - 1) * BOX_WIDTH);
                                    checkIfDead(true);
                                    TWEEN.removeAll();
                                    jump();

                                }
                                
                            });
        

        firstJump.chain(secondJump);
        firstJump.start();
        count = count + 2;
    }
    else {
        var currY, nextY, midY;
        var midBox = blocks[midBlockIdx];
        var nextBox = blocks[midBlockIdx+1];
        currY = midBox.geometry.parameters.height / 2 + HERO_RADIUS;
        nextY = nextBox.geometry.parameters.height / 2 + HERO_RADIUS;
        midY = Math.max(currY, nextY) + HERO_RADIUS;
        DY1 = midY - currY + HERO_RADIUS;
        DY2 = 0;
        DX = -BOX_WIDTH;
        if (nextY < currY)
        {
            DY2 = nextY - currY;
        }
        var firstJump = new TWEEN.Tween(displacement)
                            .to({dx: -BOX_WIDTH/2, dy: 10, dh: -midBlockHeight/2, dx_vertex: 0.5}, JUMP_TIME)
                            .easing(TWEEN.Easing.Sinusoidal.In)
                            .delay(100)
                            .onStart(function() {
                                isLanding = true;
                            })
                            .onUpdate(update);
        checkIfDead(true);
        var secondJump = new TWEEN.Tween(displacement)
                            .to({dx: -BOX_WIDTH, dy: DY2, dh: -midBlockHeight, dx_vertex: 1.0}, JUMP_TIME)
                            .easing(TWEEN.Easing.Sinusoidal.Out)
                            .delay(0)
                            .onUpdate(update)
                            .onComplete(function() {
                                isLanding = false;
                                scene.remove(blocks[midBlockIdx]);
                                scene.remove(blocks[0]);
                                ground.mesh.children.shift();
                                ground.addBlock((nBlocs - 1) * BOX_WIDTH);
                                checkIfDead(true);
                                TWEEN.removeAll();
                                jump();
                            });
        

        firstJump.chain(secondJump);
        firstJump.start();
        count = count + 1;
    }

}

window.addEventListener('load', init, false);