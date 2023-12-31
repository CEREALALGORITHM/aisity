var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0.864, -8.64, 12.96);
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.getElementById('graph').appendChild(renderer.domElement);

// add orbit controls
var controls = new THREE.OrbitControls(camera, renderer.domElement);

var stepCount = 0; // Step count 초기화

function f(x, y) {
    var A = 5;
    var x0 = 0;
    var y0 = 0;
    var sigmaX = 1;
    var sigmaY = 1;
    var noiseScale = 0.07;

    var gaussian = A * Math.exp(-(Math.pow(x - x0, 2) / (2 * sigmaX * sigmaX) + Math.pow(y - y0, 2) / (2 * sigmaY * sigmaY)));
    var noise = (Math.random() - 0.5) * noiseScale * gaussian; // 가우스 함수의 결과 값을 노이즈에 곱합니다.

    return gaussian + noise;
}

function gradient(position) {
    var A = 5;
    var x0 = 0;
    var y0 = 0;
    var sigmaX = 1;
    var sigmaY = 1;

    var x = position.x;
    var y = position.y;

    var dx = -(A / sigmaX / sigmaX) * (x - x0) * Math.exp(-(Math.pow(x - x0, 2) / (2 * sigmaX * sigmaX) + Math.pow(y - y0, 2) / (2 * sigmaY * sigmaY)));
    var dy = -(A / sigmaY / sigmaY) * (y - y0) * Math.exp(-(Math.pow(x - x0, 2) / (2 * sigmaX * sigmaX) + Math.pow(y - y0, 2) / (2 * sigmaY * sigmaY)));

    return new THREE.Vector3(dx, dy, 0);
}

var position = new THREE.Vector3(-0.1, -0.1, -f(0.1, 0.1));

function nextStep() {
    var learningRate = parseFloat(document.getElementById('learningRate').value);
    var direction = gradient(position);

    position.add(direction.multiplyScalar(-learningRate));
    position.z = f(position.x, position.y);

    if(direction.length() < 0.025){
        document.getElementById('message').innerText = "Mission Success!";
        document.getElementById('nextStep').disabled = true;
        return;
    }

    maxSphere.position.copy(position);

    drawArrows();  // Draw arrows at the new position

    renderer.render(scene, camera);

    stepCount += 1;
    document.getElementById('stepCount').innerText = "Steps: " + stepCount;
}


function parametricFunction(u, v, target) {
    var range = 2.5;
    var x = range * (2 * u - 1);
    var y = range * (2 * v - 1);
    var z = f(x, y);
    target.set(x, y, z);
}

var maxGeometry = new THREE.SphereGeometry(0.1, 32, 32);
var maxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
var maxSphere = new THREE.Mesh(maxGeometry, maxMaterial);
maxSphere.position.set(0.1, 0.1, f(0.1, 0.1));
scene.add(maxSphere);

var arrowHelpers = []; // 화살표들을 저장할 배열

function drawArrows() {
    // Remove existing arrows
    arrowHelpers.forEach(function(arrowHelper) {
        scene.remove(arrowHelper);
    });
    arrowHelpers = [];

    // Draw new arrows
    for (var i = 0; i < 8; i++) {
        var angle = i * Math.PI / 4;
        var direction =  new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
        var origin = maxSphere.position;
        var length = 1;
        var color = 0x000000;
        var arrowHelper = new THREE.ArrowHelper(direction, origin, length, color);
        arrowHelper.setLength(2, 0.5, 0.25);
        scene.add(arrowHelper);
        arrowHelpers.push(arrowHelper);
    }
}

drawArrows();  // 화살표 추가

// // Create the arrow helper at the maxSphere's position
// var direction = new THREE.Vector3(1, 0, 0);
// var origin = maxSphere.position;  
// var length = 10;
// var color = 0x000000;
// var arrowHelper = new THREE.ArrowHelper(direction.normalize(), origin, length, color);
// arrowHelper.setLength(2, 0.5, 0.25);  // Set the length to 2, the head length to 0.5, and the head width to 0.25
// scene.add(arrowHelper);


var geometry = new THREE.ParametricGeometry(parametricFunction, 50, 50);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
var mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

document.getElementById("nextStep").addEventListener("click", function() {
    var direction = gradient(position);
    nextStep(direction);
});

// 화살표 클릭이벤트 리스너
window.addEventListener('click', function(event) {
    // Create a raycaster
    var raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 0.8; // 값이 작을수록 정확도 높아짐

    var mouse = new THREE.Vector2();

    // Convert the mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    for (var i = 0; i < arrowHelpers.length; i++) {
        var intersects = raycaster.intersectObjects(arrowHelpers[i].children, true);

        if (intersects.length > 0) {
            nextStep();
            break;
        }
    }
}, false);

renderer.render(scene, camera);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();