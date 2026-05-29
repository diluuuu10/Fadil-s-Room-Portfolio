import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import Experience from "../Experience.js";
import { isMobile } from "../Utilts/Device.js";

const DEFAULT_SIZE = {
  width: 1024,
  height: 576,
};

const DEFAULT_TRANSFORM = {
  pxPerMeter: 1,
  offsetX: 0,
  offsetY: 0,
  push: 0,
  normalFlip: false,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  aspectX: 1,
  aspectY: 1,
  minScale: 0.0005,
  maxScale: 0.05,
};

export default class CssScreenFrame {
  constructor({
    roomModel,
    navigation,
    stage,
    screenName,
    url,
    title,
    size = DEFAULT_SIZE,
    transform = {},
    borderRadius = 18,
  }) {
    this.experience = new Experience();
    this.roomModel = roomModel;
    this.navigation = navigation;
    this.stage = stage;
    this.screenName = screenName;
    this.url = url;
    this.title = title;
    this.size = { ...DEFAULT_SIZE, ...size };
    this.transform = { ...DEFAULT_TRANSFORM, ...transform };
    this.borderRadius = borderRadius;

    this.camera = this.experience.camera.instance;
    this.canvas = this.experience.canvas;
    this.cssScene = this.experience.cssTvScene;
    this.cssContainer = this.experience.cssTvContainer;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.mesh = null;
    this.cssObj = null;
    this.wrapper = null;
    this.iframe = null;

    this._onPointerMove = this._onPointerMove.bind(this);
    window.addEventListener("pointermove", this._onPointerMove);

    this._setLayerInteractive(false);
    this.findScreenMesh();
    // On mobile we don't render the heavy CSS3D iframes — the mesh still
    // gets clicked/tapped for picking but the content opens as a
    // full-screen mobile overlay instead.
    if (this.mesh && !isMobile()) this.createIframe();
  }

  findScreenMesh() {
    const named = this.roomModel?.getObjectByName?.(this.screenName);
    if (named?.isMesh) {
      this.mesh = named;
      return;
    }

    if (named?.traverse) {
      named.traverse((child) => {
        if (!this.mesh && child?.isMesh) this.mesh = child;
      });
      if (this.mesh) return;
    }

    this.roomModel?.traverse?.((child) => {
      if (child?.isMesh && child.name === this.screenName) {
        this.mesh = child;
      }
    });

    if (!this.mesh) {
      console.warn(
        `[CssScreenFrame] ${this.screenName} mesh not found. Check your GLB names.`,
      );
    }
  }

  createIframe() {
    const wrapper = document.createElement("div");
    wrapper.dataset.screenStage = this.stage;
    wrapper.style.width = `${this.size.width}px`;
    wrapper.style.height = `${this.size.height}px`;
    wrapper.style.pointerEvents = "auto";
    wrapper.style.background = "transparent";
    wrapper.style.overflow = "hidden";
    wrapper.style.borderRadius = `${this.borderRadius}px`;
    wrapper.style.opacity = "0";
    wrapper.style.transition = "opacity 180ms ease";
    // Promote to its own GPU layer so iframe content scrolling
    // doesn't cause the wrapper to be repainted/re-transformed.
    // This prevents the "frame shifts when clicking inside" bug.
    wrapper.style.willChange = "transform";
    wrapper.style.backfaceVisibility = "hidden";
    wrapper.style.transformStyle = "preserve-3d";
    // Anchor the iframe wrapper to a stable contain-context so its
    // children's layout changes don't propagate up.
    wrapper.style.contain = "layout paint size style";

    const iframe = document.createElement("iframe");
    iframe.src = this.url;
    iframe.title = this.title;
    iframe.allow = "autoplay; clipboard-write";
    iframe.loading = "eager";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.display = "block";
    iframe.style.border = "0";
    iframe.style.borderRadius = "inherit";
    iframe.style.background = "transparent";
    // Same: prevent the iframe from triggering wrapper re-layout.
    iframe.style.contain = "layout paint size style";

    wrapper.appendChild(iframe);

    const cssObj = new CSS3DObject(wrapper);
    cssObj.visible = false;

    this.wrapper = wrapper;
    this.iframe = iframe;
    this.cssObj = cssObj;

    this.alignToMesh();
    this.cssScene.add(cssObj);
  }

  alignToMesh() {
    if (!this.mesh || !this.cssObj) return;

    this.mesh.updateWorldMatrix(true, false);

    const box = new THREE.Box3().setFromObject(this.mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const worldQuat = new THREE.Quaternion();
    this.mesh.getWorldQuaternion(worldQuat);

    const right = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(worldQuat)
      .normalize();
    const up = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(worldQuat)
      .normalize();
    let normal = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(worldQuat)
      .normalize();

    if (this.transform.normalFlip) normal.negate();

    this.cssObj.position.copy(center);
    this.cssObj.position.addScaledVector(right, this.transform.offsetX);
    this.cssObj.position.addScaledVector(up, this.transform.offsetY);
    this.cssObj.position.addScaledVector(normal, this.transform.push);

    this.cssObj.quaternion.copy(worldQuat);
    const qx = new THREE.Quaternion().setFromAxisAngle(
      right,
      this.transform.rotX,
    );
    const qy = new THREE.Quaternion().setFromAxisAngle(
      up,
      this.transform.rotY,
    );
    const qz = new THREE.Quaternion().setFromAxisAngle(
      normal,
      this.transform.rotZ,
    );
    this.cssObj.quaternion.multiply(qz).multiply(qy).multiply(qx);

    const baseWidth = this.transform.scaleBaseWidth ?? this.size.width;
    const baseHeight = this.transform.scaleBaseHeight ?? this.size.height;
    let sx = (size.x * this.transform.pxPerMeter) / baseWidth;
    let sy = (size.y * this.transform.pxPerMeter) / baseHeight;

    sx *= this.transform.aspectX;
    sy *= this.transform.aspectY;

    sx = THREE.MathUtils.clamp(
      sx,
      this.transform.minScale,
      this.transform.maxScale,
    );
    sy = THREE.MathUtils.clamp(
      sy,
      this.transform.minScale,
      this.transform.maxScale,
    );

    this.cssObj.scale.set(sx, sy, 1);
  }

  update() {
    if (!this.mesh || !this.cssObj || !this.cssContainer) return;

    const visible = this._isStageVisible();
    this.cssObj.visible = visible;
    if (this.wrapper) this.wrapper.style.opacity = visible ? "1" : "0";

    if (!this._isStageInteractive()) {
      this._setLayerInteractive(false);
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hovering = this.raycaster.intersectObject(this.mesh, true).length > 0;
    this._setLayerInteractive(hovering);
  }

  _isStageVisible() {
    return (
      this.navigation?.activeStage === this.stage &&
      ["entering", "focused", "exiting"].includes(this.navigation?.state)
    );
  }

  _isStageInteractive() {
    return (
      this.navigation?.activeStage === this.stage &&
      this.navigation?.state === "focused"
    );
  }

  _onPointerMove(event) {
    const rect = this.canvas?.getBoundingClientRect?.();
    if (!rect) {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.mouse.set(x, y);
      return;
    }

    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.mouse.set(x, y);
  }

  _setLayerInteractive(enabled) {
    if (!this.cssContainer) return;

    const rendererElement =
      this.experience.renderer?.cssTvRenderer?.domElement ?? null;

    if (enabled) {
      this.cssContainer.dataset.screenFrameOwner = this.stage;
      this.cssContainer.style.pointerEvents = "auto";
      if (rendererElement) rendererElement.style.pointerEvents = "auto";
      return;
    }

    if (
      this.cssContainer.dataset.screenFrameOwner &&
      this.cssContainer.dataset.screenFrameOwner !== this.stage
    ) {
      return;
    }

    delete this.cssContainer.dataset.screenFrameOwner;
    this.cssContainer.style.pointerEvents = "none";
    if (rendererElement) rendererElement.style.pointerEvents = "none";
  }

  destroy() {
    window.removeEventListener("pointermove", this._onPointerMove);
    this._setLayerInteractive(false);

    if (this.cssObj) this.cssScene.remove(this.cssObj);
    this.wrapper?.remove();
  }
}
