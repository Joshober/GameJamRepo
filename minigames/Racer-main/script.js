var SPEED = 0.004;
var CAMERA_LAG = 0.9;
var COLLISION = 1.1;
var BOUNCE = 0.7;
var mapscale = 5;
var BOUNCE_CORRECT = 0.01;
var WALL_SIZE = 1.2;
var MOUNTAIN_DIST = 250;
var OOB_DIST = 200;
var LAPS = 3;

var scene, renderer, cameras = [], players = [], gameStarted = false, gameSortaStarted = false;
var playerColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
var playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];
var powerups = [];
var playerSpeedBoosts = [0, 0, 0, 0]; // End time for each player's speed boost
var numPlayers = 4; // Default to 4 players
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
var selectedColor = 0xff0000; // Default red color

// Mobile controls per player (from host system)
var mobileControls = [
    { up: false, down: false, left: false, right: false }, // Player 1
    { up: false, down: false, left: false, right: false }, // Player 2
    { up: false, down: false, left: false, right: false }, // Player 3
    { up: false, down: false, left: false, right: false }  // Player 4
];

// Player controls
var keys = {
    // Player 1 - Arrow keys
    p1Left: false, p1Right: false, p1Up: false, p1Down: false,
    // Player 2 - WASD
    p2Left: false, p2Right: false, p2Up: false, p2Down: false,
    // Player 3 - IJKL
    p3Left: false, p3Right: false, p3Up: false, p3Down: false,
    // Player 4 - Numpad
    p4Left: false, p4Right: false, p4Up: false, p4Down: false
};

setTimeout(function(){
    document.getElementById("title").style.transform = "none";
}, 500);
setTimeout(function(){
    document.getElementsByClassName("menuitem")[0].style.transform = "none";
}, 1000);
setTimeout(function(){
    document.getElementsByClassName("controls-info")[0].style.transform = "none";
}, 1200);

function forceScroll(){
    requestAnimationFrame(forceScroll);
    window.scrollTo(0, 0);
}
forceScroll();

scene = new THREE.Scene();
renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var element = renderer.domElement;

var map, trees, signs, startc, main;

function loadMap(){
    var racedata = document.getElementById("trackcode").innerHTML.trim().split("|")[0].trim().split(" ");
    var material = new THREE.MeshLambertMaterial({color: new THREE.Color(0xf48342)});
    map = new THREE.Object3D();
    
    for(var i = 0; i < racedata.length; i++){
        if(racedata[i] == "") continue;
        var point1 = new THREE.Vector2(parseInt(racedata[i].split("/")[0].split(",")[0]), parseInt(racedata[i].split("/")[0].split(",")[1]));
        var point2 = new THREE.Vector2(parseInt(racedata[i].split("/")[1].split(",")[0]), parseInt(racedata[i].split("/")[1].split(",")[1]));
        var wall = new THREE.Mesh(
            new THREE.BoxBufferGeometry(point1.distanceTo(point2) * mapscale + 0.3, 1.5, 0.3),
            material
        );
        var angle = Math.atan2((point1.y - point2.y), (point1.x - point2.x));
        wall.position.set(-(point1.x + point2.x) / 2 * mapscale, 0.75, (point1.y + point2.y) / 2 * mapscale);
        wall.rotation.set(0, angle, 0, "YXZ");
        var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle));
        wall.plane = plane;
        wall.width = point1.distanceTo(point2) * mapscale;
        wall.p1 = point1.multiply(new THREE.Vector2(-mapscale, mapscale));
        wall.p2 = point2.multiply(new THREE.Vector2(-mapscale, mapscale));
        wall.castShadow = true;
        wall.receiveShadow = true;
        map.add(wall);
    }
    scene.add(map);

    trees = new THREE.Object3D();
    var stand = new THREE.Mesh(
        new THREE.BoxBufferGeometry(8, 3, 4),
        new THREE.MeshLambertMaterial({color: new THREE.Color("#8B4513")})
    );
    var fan = new THREE.Mesh(
        new THREE.BoxBufferGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({color: new THREE.Color("#FF6B6B")})
    );
    var treedata = document.getElementById("trackcode").innerHTML.trim().split("|")[2].trim().split(" ");
    for(var i = 0; i < treedata.length; i++){
        if(treedata[i] == "") continue;
        var s = stand.clone();
        s.position.set(-parseInt(treedata[i].split(",")[0]) * mapscale, 1.5, parseInt(treedata[i].split(",")[1]) * mapscale);
        s.castShadow = true;
        s.receiveShadow = true;
        trees.add(s);
        
        // Add 6 individual fan boxes on top
        for(var j = 0; j < 6; j++) {
            var f = fan.clone();
            f.position.set(
                -parseInt(treedata[i].split(",")[0]) * mapscale + (j - 2.5) * 1.2,
                3.5,
                parseInt(treedata[i].split(",")[1]) * mapscale
            );
            f.castShadow = true;
            f.receiveShadow = true;
            trees.add(f);
        }
    }
    scene.add(trees);

    // Remove signs section - commenting out the entire signs creation
    /*
    signs = new THREE.Object3D();
    var sign = new THREE.Mesh(
        new THREE.ConeBufferGeometry(0.7, 2, 5),
        new THREE.MeshLambertMaterial({color: new THREE.Color("#f00")})
    );
    var signdata = document.getElementById("trackcode").innerHTML.trim().split("|")[3].trim().split(" ");
    for(var i = 0; i < signdata.length; i++){
        if(signdata[i] == "") continue;
        var s = sign.clone();
        var da = signdata[i].split("/");
        s.position.set(-parseFloat(da[0].split(",")[0]) * mapscale, parseFloat(da[0].split(",")[1]) + 1, parseFloat(da[0].split(",")[2]) * mapscale);
        s.rotation.set(Math.PI / 2, parseInt(da[1]) / 180 * Math.PI, 0, "YXZ");
        s.castShadow = true;
        s.receiveShadow = true;
        signs.add(s);
    }
    scene.add(signs);
    */

    var startdata = document.getElementById("trackcode").innerHTML.trim().split("|")[1].trim().split(" ");
    startc = new THREE.Object3D();
    for(var i = 0; i < startdata.length; i++){
        if(startdata[i] == "" || i > 0) continue;
        var point1 = new THREE.Vector2(parseInt(startdata[i].split("/")[0].split(",")[0]), parseInt(startdata[i].split("/")[0].split(",")[1]));
        var point2 = new THREE.Vector2(parseInt(startdata[i].split("/")[1].split(",")[0]), parseInt(startdata[i].split("/")[1].split(",")[1]));
        
        var material;
        if(i == 0) {
            // Create striped texture for finish line
            var canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 8;
            var ctx = canvas.getContext('2d');
            for(var s = 0; s < 8; s++) {
                ctx.fillStyle = s % 2 === 0 ? '#000000' : '#ffffff';
                ctx.fillRect(s * 8, 0, 8, 8);
            }
            var stripeTexture = new THREE.CanvasTexture(canvas);
            stripeTexture.wrapS = THREE.RepeatWrapping;
            stripeTexture.repeat.x = 8;
            material = new THREE.MeshLambertMaterial({map: stripeTexture});
        } else {
            material = new THREE.MeshLambertMaterial({color: new THREE.Color("#db2525")});
        }
        
        var wall = new THREE.Mesh(
            new THREE.BoxBufferGeometry(point1.distanceTo(point2) * mapscale, 0.1, 1),
            material
        );
        var angle = Math.atan2((point1.y - point2.y), (point1.x - point2.x));
        wall.position.set(-(point1.x + point2.x) / 2 * mapscale, 0, (point1.y + point2.y) / 2 * mapscale);
        wall.rotation.set(0, angle, 0, "YXZ");
        var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle));
        wall.plane = plane;
        wall.width = point1.distanceTo(point2) * mapscale;
        wall.castShadow = true;
        wall.receiveShadow = true;
        startc.add(wall);
    }
    scene.add(startc);

    main = new THREE.Object3D();
    var stripes = new THREE.TextureLoader().load("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQYV2NgYGD4z/D/////AA/6BPwHejn9AAAAAElFTkSuQmCC");
    stripes.magFilter = THREE.NearestFilter;
    stripes.wrapS = THREE.RepeatWrapping;
    stripes.wrapT = THREE.RepeatWrapping;
    stripes.repeat.set(100, 100);
    var ground = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1000, 1000),
        new THREE.MeshLambertMaterial({color: new THREE.Color(0x333333), emissive: new THREE.Color(0x0f0f0f), emissiveMap: stripes})
    );
    ground.rotation.set(-Math.PI / 2, 0, 0);
    ground.receiveShadow = true;
    main.add(ground);

    for(var i = 0; i < 100; i++){
        var cube = new THREE.Mesh(
            new THREE.BoxBufferGeometry(100, 100, 100),
            new THREE.MeshLambertMaterial({color: new THREE.Color("#888"), side: THREE.DoubleSide})
        );
        var dist = Math.random() * MOUNTAIN_DIST + MOUNTAIN_DIST;
        var dir = Math.random() * Math.PI * 2;
        cube.position.set(dist * Math.sin(dir), 0, dist * Math.cos(dir));
        cube.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        main.add(cube);
    }
    scene.add(main);
    
    // Create powerups
    createPowerups();
}

function setPlayers(count) {
    numPlayers = count;
    startGame();
}

function mobileControl(direction, pressed) {
    // Legacy function for old mobile UI (only Player 1)
    mobileControls[0][direction] = pressed;
}

// Listen for mobile controls from host system
window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'MOBILE_CONTROL') {
        const { player, button, pressed } = e.data;
        if (player >= 1 && player <= 4) {
            const playerIndex = player - 1;
            if (mobileControls[playerIndex]) {
                mobileControls[playerIndex][button] = pressed;
            }
        }
    }
});

function createPowerups() {
    powerups = [];
    var positions = [
        {x: -5, z: 15}, {x: 5, z: 15}, {x: -15, z: 5}, {x: 15, z: 5},
        {x: -5, z: -15}, {x: 5, z: -15}, {x: -15, z: -5}, {x: 15, z: -5}
    ];
    for(var i = 0; i < 8; i++) {
        var powerup = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(1, 1, 0.5, 8),
            new THREE.MeshLambertMaterial({color: new THREE.Color(0xff00ff), emissive: new THREE.Color(0x440044)})
        );
        powerup.position.set(
            positions[i].x,
            0.25,
            positions[i].z
        );
        powerup.collected = false;
        powerup.castShadow = true;
        powerup.receiveShadow = true;
        scene.add(powerup);
        powerups.push(powerup);
    }
}

function createPlayer(index, x, y, color) {
    var player = {
        x: x, y: y, xv: 0, yv: 0, dir: 0, steer: 0,
        checkpoint: 1, lap: 0, name: playerNames[index], justCrossed: false
    };
    
    var model = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 2));
    model.position.set(x, 0.6, y);
    model.material = new THREE.MeshLambertMaterial({color: new THREE.Color(color)});
    
    var wheel = new THREE.Mesh(
        new THREE.CylinderBufferGeometry(0.5, 0.5, 0.2, 10),
        new THREE.MeshLambertMaterial({color: new THREE.Color("#222")})
    );
    
    for(var i = 0; i < 4; i++) {
        var w = wheel.clone();
        var x = i < 2 ? 0.6 : -0.6;
        var z = i % 2 == 0 ? 0.7 : -0.7;
        w.position.set(x, -0.1, z);
        w.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        model.add(w);
    }
    
    model.receiveShadow = true;
    model.castShadow = true;
    scene.add(model);
    
    return {data: player, model: model};
}

function startGame() {
    document.getElementById("fore").style.transform = "translate3d(0, -100vh, 0)";
    
    setTimeout(function() {
        document.getElementById("fore").innerHTML = "";
        document.getElementById("fore").appendChild(element);
        document.getElementById("fore").style.transform = "none";
        
        // Show mobile controls during game for single player on mobile devices
        if (numPlayers === 1 && isMobile) {
            var mobileDiv = document.createElement('div');
            mobileDiv.id = 'mobileControls';
            mobileDiv.innerHTML = '<button id="leftBtn" ontouchstart="mobileControl(\'left\', true)" ontouchend="mobileControl(\'left\', false)">◀</button><button id="upBtn" ontouchstart="mobileControl(\'up\', true)" ontouchend="mobileControl(\'up\', false)">▲</button><button id="rightBtn" ontouchstart="mobileControl(\'right\', true)" ontouchend="mobileControl(\'right\', false)">▶</button>';
            document.body.appendChild(mobileDiv);
        }
        
        loadMap();
        scene.background = new THREE.Color(0x7fb0ff);
        
        // Create cameras for selected number of players
        for(var i = 0; i < numPlayers; i++) {
            var camera = new THREE.PerspectiveCamera(90, (window.innerWidth/2) / (window.innerHeight/2), 1, 1000);
            camera.position.set(0, 3, 10);
            scene.add(camera);
            cameras.push(camera);
        }
        
        // Create selected number of players
        var startPositions = [{x: 0, y: 0}, {x: 2, y: 0}, {x: -2, y: 0}, {x: 0, y: -3}];
        for(var i = 0; i < numPlayers; i++) {
            players.push(createPlayer(i, startPositions[i].x, startPositions[i].y, playerColors[i]));
        }
        
        var light = new THREE.DirectionalLight(0xffffff, 0.7);
        light.position.set(3000, 2000, -2000);
        light.castShadow = true;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 3000;
        light.shadow.camera.far = 5000;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;
        light.shadow.camera.left = -100;
        light.shadow.camera.right = 120;
        light.shadow.bias = 0.00002;
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        
        gameStarted = true;
        gameSortaStarted = true;
        playerSpeedBoosts = new Array(numPlayers).fill(0);
        
        // Countdown
        var countDown = document.createElement("DIV");
        countDown.innerHTML = "3";
        countDown.className = "title";
        countDown.id = "countdown";
        document.getElementById("fore").appendChild(countDown);
        
        setTimeout(() => countDown.innerHTML = "2", 1000);
        setTimeout(() => countDown.innerHTML = "1", 2000);
        setTimeout(() => { countDown.innerHTML = "GO!"; gameSortaStarted = false; }, 3000);
        setTimeout(() => countDown.innerHTML = "", 4000);
        
        render();
    }, 1000);
}

function updatePlayer(player, leftKey, rightKey, upKey, downKey, warp, playerIndex) {
    if(!gameSortaStarted) {
        if(leftKey) player.data.steer = Math.PI / 6;
        if(rightKey) player.data.steer = -Math.PI / 6;
        if(!(leftKey ^ rightKey)) player.data.steer = 0;
        
        // Check if player has speed boost
        var hasSpeedBoost = playerSpeedBoosts[playerIndex] > Date.now();
        var currentSpeed = hasSpeedBoost ? SPEED * 2 : SPEED;
        
        player.data.dir += player.data.steer / 10 * warp;
        
        // Only move forward when up key is pressed
        if(upKey) {
            player.data.xv += Math.sin(player.data.dir) * currentSpeed * warp;
            player.data.yv += Math.cos(player.data.dir) * currentSpeed * warp;
        }
        if(downKey) {
            player.data.xv -= Math.sin(player.data.dir) * currentSpeed * 0.5 * warp;
            player.data.yv -= Math.cos(player.data.dir) * currentSpeed * 0.5 * warp;
        }
        player.data.xv *= Math.pow(0.99, warp);
        player.data.yv *= Math.pow(0.99, warp);
        player.data.x += player.data.xv * warp;
        player.data.y += player.data.yv * warp;
        
        player.model.position.x = player.data.x + player.data.xv;
        player.model.position.z = player.data.y + player.data.yv;
        player.model.rotation.y = player.data.dir;
        
        // Add glow effect for speed boost
        if(hasSpeedBoost) {
            player.model.material.emissive = new THREE.Color(0x444400);
        } else {
            player.model.material.emissive = new THREE.Color(0x000000);
        }
        
        player.model.children[0].rotation.z = Math.PI / 2 - player.data.steer;
        player.model.children[1].rotation.z = Math.PI / 2 - player.data.steer;
        
        // Wall collision
        for(var w in map.children) {
            var wall = map.children[w];
            if(Math.abs(wall.plane.distanceToPoint(player.model.position.clone().sub(wall.position))) < WALL_SIZE) {
                if(wall.position.clone().distanceTo(player.model.position) < wall.width / 2) {
                    var vel = new THREE.Vector3(player.data.xv, 0, player.data.yv);
                    vel.reflect(wall.plane.normal);
                    player.data.xv = vel.x + BOUNCE_CORRECT * wall.plane.normal.x;
                    player.data.yv = vel.z + BOUNCE_CORRECT * wall.plane.normal.z;
                    while(Math.abs(wall.plane.distanceToPoint(new THREE.Vector3(player.data.x, 0, player.data.y).sub(wall.position))) < WALL_SIZE) {
                        player.data.x += player.data.xv;
                        player.data.y += player.data.yv;
                    }
                    player.data.xv *= BOUNCE;
                    player.data.yv *= BOUNCE;
                }
            }
        }
        
        // Checkpoint detection
        for(var i in startc.children) {
            var cp = startc.children[i];
            if(Math.abs(cp.plane.distanceToPoint(player.model.position.clone().sub(cp.position))) < 1) {
                if(cp.position.clone().distanceTo(player.model.position) < cp.width / 2 + 1) {
                    if(i == 0 && !player.data.justCrossed) {
                        player.data.lap++;
                        player.data.justCrossed = true;
                        if(player.data.lap >= 6) {
                            endGame(playerIndex);
                            return;
                        }
                        setTimeout(function() {
                            player.data.justCrossed = false;
                        }, 1000);
                    }
                }
            }
        }
        
        // Out of bounds reset
        if(player.model.position.distanceTo(new THREE.Vector3()) > OOB_DIST) {
            player.data.x = 0;
            player.data.y = 0;
        }
        
        // Powerup collection
        for(var p = 0; p < powerups.length; p++) {
            var powerup = powerups[p];
            if(!powerup.collected && player.model.position.distanceTo(powerup.position) < 3) {
                powerup.collected = true;
                powerup.visible = false;
                playerSpeedBoosts[playerIndex] = Date.now() + 3000; // 3 seconds
                
                // Respawn powerup after 5 seconds
                setTimeout(function(pu, pos) {
                    pu.collected = false;
                    pu.visible = true;
                    pu.position.set(pos.x, 0.25, pos.z);
                }, 5000, powerup, positions[p]);
            }
        }
    }
}

function endGame(winnerIndex) {
    gameStarted = false;
    gameSortaStarted = true;
    
    var winMessage = document.createElement("DIV");
    winMessage.innerHTML = playerNames[winnerIndex] + " WINS!";
    winMessage.className = "title";
    winMessage.style.position = "absolute";
    winMessage.style.top = "50%";
    winMessage.style.left = "50%";
    winMessage.style.transform = "translate(-50%, -50%)";
    winMessage.style.zIndex = "1000";
    winMessage.style.color = "white";
    winMessage.style.fontSize = "48px";
    document.getElementById("fore").appendChild(winMessage);
    
    // Calculate scores based on finishing order (winner gets highest score)
    // For simplicity, winner gets 100, others get decreasing scores
    var scores = [0, 0, 0, 0];
    scores[winnerIndex] = 100;
    for (var i = 0; i < numPlayers; i++) {
        if (i !== winnerIndex) {
            scores[i] = Math.max(0, 100 - (i + 1) * 10);
        }
    }
    
    // Send result to parent window (host iframe)
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'RESULT',
            payload: {
                scores: scores,
                winner: winnerIndex,
                gameId: 'racer-main'
            }
        }, '*');
    }
}

var lastTime = performance.now();
function render() {
    requestAnimationFrame(render);
    var timestamp = performance.now();
    var timepassed = timestamp - lastTime;
    lastTime = timestamp;
    var warp = timepassed / 16;
    
    if(gameStarted) {
        // Update selected number of players
        for(var i = 0; i < numPlayers; i++) {
            var leftKey = false, rightKey = false, upKey = false, downKey = false;
            var mobile = mobileControls[i] || { up: false, down: false, left: false, right: false };
            
            if(i === 0) { 
                leftKey = keys.p1Left || mobile.left; 
                rightKey = keys.p1Right || mobile.right; 
                upKey = keys.p1Up || mobile.up; 
                downKey = keys.p1Down || mobile.down; 
            }
            else if(i === 1) { 
                leftKey = keys.p2Left || mobile.left; 
                rightKey = keys.p2Right || mobile.right; 
                upKey = keys.p2Up || mobile.up; 
                downKey = keys.p2Down || mobile.down; 
            }
            else if(i === 2) { 
                leftKey = keys.p3Left || mobile.left; 
                rightKey = keys.p3Right || mobile.right; 
                upKey = keys.p3Up || mobile.up; 
                downKey = keys.p3Down || mobile.down; 
            }
            else if(i === 3) { 
                leftKey = keys.p4Left || mobile.left; 
                rightKey = keys.p4Right || mobile.right; 
                upKey = keys.p4Up || mobile.up; 
                downKey = keys.p4Down || mobile.down; 
            }
            updatePlayer(players[i], leftKey, rightKey, upKey, downKey, warp, i);
        }
        
        // Player collision
        for(var i = 0; i < numPlayers; i++) {
            for(var j = i + 1; j < numPlayers; j++) {
                var p1 = players[i], p2 = players[j];
                if(p1.model.position.distanceTo(p2.model.position) < 2) {
                    var temp = new THREE.Vector2(p1.data.xv, p1.data.yv);
                    var temp2 = new THREE.Vector2(p2.data.xv, p2.data.yv);
                    p2.data.xv -= temp.x;
                    p2.data.yv -= temp.y;
                    p1.data.xv -= temp2.x;
                    p1.data.yv -= temp2.y;
                    var norm = (new THREE.Vector2(p1.data.x, p1.data.y)).sub(new THREE.Vector2(p2.data.x, p2.data.y));
                    norm = new THREE.Vector3(norm.x, 0, norm.y);
                    norm.normalize();
                    var vel = new THREE.Vector3(p1.data.xv, 0, p1.data.yv);
                    var vel2 = new THREE.Vector3(p2.data.xv, 0, p2.data.yv);
                    vel.reflect(norm);
                    vel2.reflect(norm);
                    p2.data.xv += COLLISION * vel2.x;
                    p2.data.yv += COLLISION * vel2.z;
                    p1.data.xv += COLLISION * vel.x;
                    p1.data.yv += COLLISION * vel.z;
                    p2.data.xv += temp.x;
                    p2.data.yv += temp.y;
                    p1.data.xv += temp2.x;
                    p1.data.yv += temp2.y;
                }
            }
        }
        
        // Update cameras and render split screen
        renderer.setScissorTest(true);
        
        for(var i = 0; i < numPlayers; i++) {
            var player = players[i];
            var camera = cameras[i];
            
            var target = new THREE.Vector3(
                player.model.position.x + Math.sin(-player.model.rotation.y) * 5,
                3,
                player.model.position.z + -Math.cos(-player.model.rotation.y) * 5
            );
            camera.position.set(
                camera.position.x * Math.pow(CAMERA_LAG, warp) + target.x * (1 - Math.pow(CAMERA_LAG, warp)),
                3,
                camera.position.z * Math.pow(CAMERA_LAG, warp) + target.z * (1 - Math.pow(CAMERA_LAG, warp))
            );
            camera.lookAt(player.model.position);
            
            var x, y, w, h;
            if(numPlayers === 1) {
                x = 0; y = 0;
                w = window.innerWidth; h = window.innerHeight;
            } else if(numPlayers === 2) {
                x = 0; y = i * window.innerHeight / 2;
                w = window.innerWidth; h = window.innerHeight / 2;
            } else {
                x = (i % 2) * window.innerWidth / 2;
                y = Math.floor(i / 2) * window.innerHeight / 2;
                w = window.innerWidth / 2; h = window.innerHeight / 2;
            }
            
            renderer.setViewport(x, y, w, h);
            renderer.setScissor(x, y, w, h);
            renderer.render(scene, camera);
            
            // Create HTML lap counter overlay
            var lapCounter = document.getElementById('lapCounter' + i);
            if(!lapCounter) {
                lapCounter = document.createElement('div');
                lapCounter.id = 'lapCounter' + i;
                lapCounter.style.position = 'absolute';
                lapCounter.style.color = 'white';
                lapCounter.style.fontSize = '48px';
                lapCounter.style.fontFamily = 'Arial';
                lapCounter.style.textAlign = 'center';
                lapCounter.style.pointerEvents = 'none';
                lapCounter.style.zIndex = '1000';
                document.body.appendChild(lapCounter);
            }
            lapCounter.style.left = (x + w/2 - 60) + 'px';
            lapCounter.style.top = (y + 20) + 'px';
            lapCounter.innerHTML = 'Lap: ' + player.data.lap;
        }
        
        renderer.setScissorTest(false);
    }
}

window.addEventListener("keydown", function(e) {
    switch(e.keyCode) {
        case 37: keys.p1Left = true; break;   // Left arrow
        case 39: keys.p1Right = true; break;  // Right arrow
        case 38: keys.p1Up = true; break;     // Up arrow
        case 40: keys.p1Down = true; break;   // Down arrow
        case 65: keys.p2Left = true; break;   // A
        case 68: keys.p2Right = true; break;  // D
        case 87: keys.p2Up = true; break;     // W
        case 83: keys.p2Down = true; break;   // S
        case 74: keys.p3Left = true; break;   // J
        case 76: keys.p3Right = true; break;  // L
        case 73: keys.p3Up = true; break;     // I
        case 75: keys.p3Down = true; break;   // K
        case 100: keys.p4Left = true; break;  // Numpad 4
        case 102: keys.p4Right = true; break; // Numpad 6
        case 104: keys.p4Up = true; break;    // Numpad 8
        case 98: keys.p4Down = true; break;   // Numpad 2
    }
});

window.addEventListener("keyup", function(e) {
    switch(e.keyCode) {
        case 37: keys.p1Left = false; break;
        case 39: keys.p1Right = false; break;
        case 38: keys.p1Up = false; break;
        case 40: keys.p1Down = false; break;
        case 65: keys.p2Left = false; break;
        case 68: keys.p2Right = false; break;
        case 87: keys.p2Up = false; break;
        case 83: keys.p2Down = false; break;
        case 74: keys.p3Left = false; break;
        case 76: keys.p3Right = false; break;
        case 73: keys.p3Up = false; break;
        case 75: keys.p3Down = false; break;
        case 100: keys.p4Left = false; break;
        case 102: keys.p4Right = false; break;
        case 104: keys.p4Up = false; break;
        case 98: keys.p4Down = false; break;
    }
});

window.addEventListener("resize", function() {
    for(var i = 0; i < cameras.length; i++) {
        cameras[i].aspect = (window.innerWidth/2) / (window.innerHeight/2);
        cameras[i].updateProjectionMatrix();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
});