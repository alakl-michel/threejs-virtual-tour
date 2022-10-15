import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js";

// Three properties _name
// custom functions _Name()

const tooltip = document.querySelector(".tooltip");

class LoadModelDemo {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this._threejs = new THREE.WebGLRenderer({
            antialias: true
        });
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this._threejs.domElement);

        window.addEventListener(
            "resize",
            () => {
                this._OnWindowResize();
            },
            false
        );
        window.addEventListener(
            "click",
            (e) => {
                this._OnClick(e);
            },
            false
        );
        window.addEventListener(
            "mousemove",
            (e) => {
                this._OnMouseMove(e);
            },
            false
        );

        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 200;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(-0.1, 0, 0);

        this._scene = new THREE.Scene();

        const controls = new OrbitControls(
            this._camera,
            this._threejs.domElement
        );
        controls.target.set(0, 0, 0);
        controls.rotateSpeed = -0.2;
        // controls.minDistance = 0;
        // controls.maxDistance = 32;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.update();
        //on mousewheel inspect camera.zoom = 2
        this._CreateSphere({
            image: "resources/room1.jpeg"
        });

        this._rayCaster = new THREE.Raycaster();

        // static fixed tooltip for demo
        // every room should have its own metadata
        const position = new THREE.Vector3(32, -1.5, 37.6);
        this._AddToolTip({
            position,
            name: "room2",
            image: "resources/room2.jpeg"
        });

        this.activeSprite = null;
        this._RAF();
    }

    _CreateSphere({ image }) {
        const geometry = new THREE.SphereGeometry(50, 32, 32);
        const texture = new THREE.TextureLoader().load(image);
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = -1;
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        material.transparent = true;
        this._sphere = new THREE.Mesh(geometry, material);
        this._sphere.name = "sphere";
        this._scene.add(this._sphere);
    }

    _OnClick(e) {
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );
        this._rayCaster.setFromCamera(mouse, this._camera);
        // intersect one object
        /*
        const intersects = this._rayCaster.intersectObject(this._sphere)
        if (intersects.length > 0) {
          //console.log(intersects[0].point)
          //this._AddToolTip(intersects[0].point)
        }
        */
        const intersects = this._rayCaster.intersectObjects(
            this._scene.children
        );
        intersects.forEach((intersect) => {
            if (intersect.object.type === "Sprite") {
                gsap.to(this._sphere.material, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                        this._scene.remove(this._sphere);
                        this._CreateSphere({ image: intersect.object.image });
                        this._sphere.material.opacity = 0;
                        gsap.to(this._sphere.material, {
                            opacity: 1,
                            duration: 0.5
                        });
                    }
                });
            }
        });
    }

    _OnMouseMove(e) {
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );
        this._rayCaster.setFromCamera(mouse, this._camera);
        // intersect many objects
        const intersects = this._rayCaster.intersectObjects(this._scene.children);
        let intersected = false;
        intersects.forEach((intersect) => {
            if (intersect.object.type === "Sprite") {
                const p = intersect.object.position.clone().project(this._camera);
                tooltip.style.top = ((-1 * p.y + 1) * window.innerHeight) / 2 + "px";
                tooltip.style.left = ((p.x + 1) * window.innerWidth) / 2 + "px";
                tooltip.classList.add("is-active");
                tooltip.innerHTML = intersect.object.name;
                gsap.to(intersect.object.scale, 0.3, { x: 3, y: 3, z: 3 });
                this.activeSprite = intersect.object;
                intersected = true;
            }
        });
        if (!intersected) {
            tooltip.classList.remove("is-active");
            if (this.activeSprite)
                gsap.to(this.activeSprite.scale, 0.3, { x: 2, y: 2, z: 2 });
        }
    }

    _AddToolTip({ position, name, image }) {
        const spriteMap = new THREE.TextureLoader().load("resources/Information.png");
        const spriteMaterial = new THREE.SpriteMaterial({
            map: spriteMap
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.name = name;
        sprite.image = image;
        sprite.position.copy(position.clone().normalize().multiplyScalar(32));
        sprite.scale.multiplyScalar(2);
        this._scene.add(sprite);
    }

    _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }

    _RAF() {
        requestAnimationFrame(() => {
            this._threejs.render(this._scene, this._camera);
            this._RAF();
        });
    }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
    _APP = new LoadModelDemo();
});
