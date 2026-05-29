import Experience from "./Experience";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mobileness, isMobile } from "./Utilts/Device.js";

// Desktop framing (unchanged)
const DESKTOP_FOV = 23;
const DESKTOP_POS = new THREE.Vector3(6, 3, 10);

// Mobile framing: wider FOV to fit the room, camera pulled back slightly
const MOBILE_FOV = 42;
const MOBILE_POS = new THREE.Vector3(5.8, 3.4, 11);

export default class Camera {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;
    this.aspectRatio = this.sizes.width / this.sizes.height;

    this.setInstance();
    this.setControls();
  }

  setInstance() {
    const { fov, pos } = this._computeFraming();
    this.instance = new THREE.PerspectiveCamera(fov, this.aspectRatio, 0.1, 100);
    this.instance.position.copy(pos);
    this.scene.add(this.instance);
  }

  _computeFraming() {
    const t = mobileness();
    const fov = THREE.MathUtils.lerp(DESKTOP_FOV, MOBILE_FOV, t);
    const pos = new THREE.Vector3().lerpVectors(DESKTOP_POS, MOBILE_POS, t);
    return { fov, pos };
  }

  setControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = true;

    if (isMobile()) {
      this.controls.enablePan = false;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 14;
      this.canvas.style.touchAction = "none";
    }
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    const { fov } = this._computeFraming();
    this.instance.fov = fov;
    this.instance.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }
}
