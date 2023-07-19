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

function nextStep() {
    var learningRate = parseFloat(document.getElementById('learningRate').value);
    var grad = gradient(position);

    position.add(grad.multiplyScalar(-learningRate));
    position.z = f(position.x, position.y);

    if (grad.length() < 0.025) {
        document.getElementById('message').innerText = "Mission Success!";
        document.getElementById('nextStep').disabled = true;
    }

    maxSphere.position.copy(position);

    renderer.render(scene, camera);

    stepCount += 1;
    document.getElementById('stepCount').innerText = "Steps: " + stepCount;
}

var position = new THREE.Vector3(0.1, 0.1, f(0.1, 0.1));

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

var geometry = new THREE.ParametricGeometry(parametricFunction, 50, 50);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
var mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

document.getElementById("nextStep").addEventListener("click", nextStep);

renderer.render(scene, camera);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();