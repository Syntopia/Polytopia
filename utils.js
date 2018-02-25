function createLine(from, to, width, color, arrowWidth, arrowLength) {
    var m = new THREE.MeshStandardMaterial({
        color: color,
    });
    var dist = from.distanceTo(to);
    if (dist < 0.0001) return;

    var geometry = new THREE.CylinderGeometry(width, width, dist, 10, 1);
    var mesh = new THREE.Mesh(geometry, m);
    var axis = new THREE.Vector3(0, 1, 0);

    if (arrowWidth != undefined) {
        var geometry2 = new THREE.CylinderGeometry(0, arrowWidth, arrowLength, 10, 1);
        geometry2.translate(0, (dist - arrowLength) / 2, 0);
        geometry.merge(geometry2);
    }

    var vector = (new THREE.Vector3()).subVectors(to, from);


    mesh.quaternion.setFromUnitVectors(axis, vector.clone().normalize());
    mesh.position.copy(from.clone().addScaledVector(vector, 0.5));

    return mesh;
}

function createOrigoPlane(v1, v2, color) {
    var n = new THREE.Vector3();
    n.sub(v1).sub(v2);
    return createPlane(n, v1.clone().sub(v2), v2.clone().sub(v1), color);
}

function createPlane(v1, v2, v4, color) {
    var m = new THREE.MeshStandardMaterial({
        opacity: 0.8,
        transparent: true,
        side: THREE.DoubleSide,
        color: color,
    });

    var g = new THREE.Geometry();

    var d1 = new THREE.Vector3().addScaledVector(v2, 1).addScaledVector(v1, -1);
    var d2 = new THREE.Vector3().addScaledVector(v4, 1).addScaledVector(v1, -1);

    var divs = 2;
    var offset = 0;
    for (var i = 0; i < divs; i++) {
        for (var j = 0; j < divs; j++) {
            var x1 = new THREE.Vector3().addScaledVector(v1, 1).addScaledVector(d1, i / divs).addScaledVector(d2, j / divs);
            var x2 = new THREE.Vector3().addScaledVector(v1, 1).addScaledVector(d1, (i + 1) / divs).addScaledVector(d2, j / divs);
            var x3 = new THREE.Vector3().addScaledVector(v1, 1).addScaledVector(d1, i / divs).addScaledVector(d2, (j + 1) / divs);
            var x4 = new THREE.Vector3().addScaledVector(v1, 1).addScaledVector(d1, (i + 1) / divs).addScaledVector(d2, (j + 1) / divs);
            g.vertices.push(x1, x2, x4, x3);
            g.faces.push(new THREE.Face3(offset, offset + 1, offset + 2), new THREE.Face3(offset + 2, offset + 3, offset));
            offset += 4;
        }
    }
    g.computeFlatVertexNormals();
    return new THREE.Mesh(g, m);
}


function getStandard3DView(container, w, h) {
    var camera = new THREE.PerspectiveCamera(40, w / h, 1, 2000);
    camera.position.set(0.0, 1.4, 1.4 * 3.5);
    var scene2 = new THREE.Scene({ antialias: true });
    //scene2.background = new THREE.Color(0xffffff);
    scene2.add(camera);

    var ambientLight = new THREE.AmbientLight(0xffffff);
    camera.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 2, 9);
    camera.add(directionalLight);

    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', function () { renderer.render(scene2, camera); });
    scene2.doRender = function () { renderer.render(scene2, camera) };
    setTimeout(function () { renderer.render(scene2, camera) });
    return scene2;
}

function mid(v1, v2) {
    return new THREE.Vector3().addScaledVector(v1, 0.5).addScaledVector(v2, 0.5);
}

function sub(v1, v2) {
    return new THREE.Vector3().subVectors(v1, v2);
}


function cross(v1, v2) {
    return (new THREE.Vector3()).crossVectors(v1, v2);
}

function getReflectionMatrix(nx, ny, nz) {
    //https://en.wikipedia.org/wiki/Transformation_matrix#Reflection_2
    var m = new THREE.Matrix3();
    m.set(
        1 - 2 * nx * nx, -2 * nx * ny, -2 * nx * nz,
        -2 * nx * ny, 1 - 2 * ny * ny, -2 * ny * nz,
        -2 * nx * nz, -2 * ny * nz, 1 - 2 * nz * nz);
    return m;
}


function gramSchmidt(vs) {
    var out = [];

    for (var i = 0; i < vs.length; i++) {
        var v = vs[i].clone();

        for (var j = 0; j < out.length; j++) {
            v.projectOnPlane(out[j]);
        }

        out.push(v.normalize());
    }

    return out;
}

function add(v1, v2) {
    return new THREE.Vector3().addVectors(v1, v2);
}

function getSideWidth() {
    return 300;
}

function getContainer(offset) {
    var container = document.createElement('div');
    container.style.position = "absolute";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.zOrder = "-1";



    var inner = document.createElement('div');
    inner.style.position = "relative";
    inner.style.left = (document.getElementById("main").getBoundingClientRect().width) + "px";
    inner.style.top = offset + "px";
    inner.style.width = (getSideWidth()) + "px";
    container.appendChild(inner);
    document.getElementById("main").appendChild(container);
    return inner;
}
if (!Detector.webgl) Detector.addGetWebGLMessage();

function getVertices() {
    var v = [new THREE.Vector3(-1, -1, -1), new THREE.Vector3(-1, 1, -1), new THREE.Vector3(1, 1, -1), new THREE.Vector3(1, -1, -1),
    new THREE.Vector3(-1, -1, 1), new THREE.Vector3(-1, 1, 1), new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, -1, 1)];
    return v;
};

function getEdges() {
    var v = getVertices();
    var e = [];
    e.push(v[0], v[1], v[1], v[2], v[2], v[3], v[3], v[0]);
    e.push(v[4], v[5], v[5], v[6], v[6], v[7], v[7], v[4]);
    e.push(v[0], v[4], v[1], v[5], v[2], v[6], v[3], v[7]);
    return e;
};

// Coxeter diagram. Cube will have relations=[4,3]
function insertCoxeter(container, relations, col) {

    //	var container = document.createElement('div');
    //	document.getElementById("main").appendChild(container);
    var cx = 7;
    var spacingY = 20;
    var y = 13;
    var radius = 8;
    var gens = relations.length + 1;

    var draw = SVG(container).size(cx + spacingY * gens - 4, 25);

    var colors = (col == undefined ? ['black', 'black', 'black', 'black'] : col);
    draw.line(cx, y + radius / 2, cx + (gens - 1) * spacingY, y + radius / 2).stroke({ width: 1 });

    draw.circle(12).x(cx - 2).y(y - 2).stroke({ width: 1 }).fill('none');


    for (var i = 0; i < gens; i++) {
        //s += '<circle cx="' + cx + '" cy="15" r="4" stroke="black" stroke-width="1" fill="' + colors[i] + '" />';
        draw.circle(8).x(cx).y(y).stroke({ width: 1 });
        cx += spacingY;
        if (i < gens - 1 && relations[i] > 3)
            draw.text(relations[i] + "").x(cx - 11).y(y - 10).font({ size: 12 });
    }
}


// Based on https://stackoverflow.com/questions/4878145/javascript-and-webgl-external-scripts
function loadFile(url, data, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            if (request.status == 200 || (request.status == 0 && request.responseText != "")) {
                callback(request.responseText, data)
            } else {
                console.log(request);
                throw "Failed to download:" + url;
            }
        }
    };

    request.send(null);
}

function loadFiles(urls, callback) {
    var numUrls = urls.length;
    var numComplete = 0;
    var result = [];

    function partialCallback(text, urlIndex) {
        result[urlIndex] = text;
        numComplete++;
        if (numComplete == numUrls) {
            callback(result);
        }
    }

    for (var i = 0; i < numUrls; i++) {
        loadFile(urls[i], i, partialCallback);
    }
}


function createFragmentShader(container, w, h, vertexShader, fragmentShader) {
    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    /*
    window.addEventListener('resize', function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
        material.uniforms.resolution.value.set(canvas.width, canvas.height);
        material.uniforms.cameraProjectionMatrixInverse.value.getInverse(camera.projectionMatrix);
    });
    */

    // Scene
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, w / h, 1, 2000);
    camera.position.z = 4;
    scene.add(camera);
    scene.getCamera = function () {
        return camera;
    };

    var geometry = new THREE.PlaneBufferGeometry(2.0, 2.0);
    var material = new THREE.RawShaderMaterial({
        uniforms: {
            resolution: { value: new THREE.Vector2(w, h) },
            cameraWorldMatrix: { value: camera.matrixWorld },
            cameraProjectionMatrixInverse: { value: new THREE.Matrix4().getInverse(camera.projectionMatrix) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // Controls
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    scene.doRender = function () {
        renderer.render(scene, camera)
    };
    scene.controls = controls;

    controls.addEventListener('change', function () { scene.doRender() });

    setTimeout(function () { scene.doRender(); });
    return scene;
}