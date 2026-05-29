// src/Experience/Navigation.js
import * as THREE from "three";
import Experience from "./Experience.js";
import { isMobile } from "./Utilts/Device.js";
import { showMobileOverlay } from "./Mobile/MobileOverlay.js";

export default class Navigation {
  constructor() {
    this.experience = new Experience();

    this.scene = this.experience.scene;
    this.camera = this.experience.camera.instance;
    this.controls = this.experience.camera.controls;
    this.canvas = this.experience.canvas;
    this.time = this.experience.time;

    // --- raycast ---
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.down = new THREE.Vector2(999, 999);

    // --- room model ---
    this.roomModel = null;

    // --- state machine ---
    // idle | entering | focused | exiting
    this.state = "idle";
    this.activeStage = null;
    this.pendingStage = null; // when switching stages via UI

    // --- home camera pose ---
    this.home = {
      saved: false,
      pos: new THREE.Vector3(),
      target: new THREE.Vector3(),
      fov: 23,
    };

    // --- animation ---
    this.anim = {
      t: 0,
      duration: 1.0,
      fromPos: new THREE.Vector3(),
      midPos: new THREE.Vector3(),
      fromTarget: new THREE.Vector3(),
      toPos: new THREE.Vector3(),
      toTarget: new THREE.Vector3(),
      fromFov: 23,
      toFov: 23,
    };

    // --- TV stage ---
    this.tv = {
      rootName: "TV_Third",
      screenName: "TV_Screen",
      root: null,
      screen: null,

      // tune these
      distance: 0.8,
      side: 2,
      up: 0.35,
      targetUp: 0.05,

      durationIn: 1.1,
      durationOut: 0.9,
      focusFov: 20,
      arcHeight: 0.42,
      arcSide: 0.12,
    };

    // --- COMPUTER stage ---
    this.computer = {
      rootName: "Computer_Second",
      screenName: "Comp_Screen",
      root: null,
      screen: null,

      // tune these (start values, adjust later)
      distance: 1.1,
      side: 0.05,
      up: 0.0,
      targetUp: 0.04,

      durationIn: 1.0,
      durationOut: 0.9,
      focusFov: 19,
      arcHeight: 0.32,
      arcSide: -0.1,
    };

    this._bind();
  }

  // -------------------- public API (UI buttons) --------------------
  focusTV() {
    this._requestStage("tv");
  }

  focusComputer() {
    this._requestStage("computer");
  }

  _requestStage(stage) {
    if (!this.roomModel) return;

    // MOBILE PATH: skip the camera zoom-in entirely. Tapping a screen
    // mesh opens a full-screen overlay with the same content.
    if (isMobile()) {
      showMobileOverlay(stage, () => {
        // overlay closed — nothing to do, room stays as it was
      });
      return;
    }

    if (this.state === "entering" || this.state === "exiting") {
      this.pendingStage = stage;
      return;
    }

    // from idle -> go in
    if (this.state === "idle") {
      const obj = this._defaultFocusObjForStage(stage);
      this.enterStage(stage, obj);
      return;
    }

    // focused: same stage => exit, different => exit then go to other
    if (this.state === "focused") {
      if (this.activeStage === stage) {
        this.exitStage();
      } else {
        this.pendingStage = stage;
        this.exitStage();
      }
    }
  }

  _defaultFocusObjForStage(stage) {
    if (stage === "tv") return this.tv.screen || this.tv.root;
    if (stage === "computer") return this.computer.screen || this.computer.root;
    return null;
  }

  // Call this after the room glb is in the scene (World.js)
  setFromRoom(roomModel) {
    this.roomModel = roomModel || null;
    if (!this.roomModel) return;

    this._saveHomeOnce();

    // TV
    this.tv.root = this.roomModel.getObjectByName(this.tv.rootName) || null;
    this.tv.screen = this.roomModel.getObjectByName(this.tv.screenName) || null;
    console.log("[Navigation] TV root:", this.tv.root?.name);
    console.log("[Navigation] TV screen:", this.tv.screen?.name);

    // COMPUTER
    this.computer.root =
      this.roomModel.getObjectByName(this.computer.rootName) || null;
    this.computer.screen =
      this.roomModel.getObjectByName(this.computer.screenName) || null;
    console.log("[Navigation] Computer root:", this.computer.root?.name);
    console.log("[Navigation] Computer screen:", this.computer.screen?.name);
  }

  // -------------------- events --------------------
  _bind() {
    window.addEventListener("pointermove", this._onMove);
    window.addEventListener("pointerdown", this._onDown);
    window.addEventListener("pointerup", this._onUp);
    window.addEventListener("keydown", this._onKeyDown);
  }

  _onKeyDown = (e) => {
    if (e.key === "Escape") {
      if (this.state === "focused" && this.activeStage) {
        this.exitStage();
      }
    }
  };

  _onMove = (e) => {
    this._setMouseNDC(e);

    if (!this.roomModel || this.state !== "idle") {
      this.canvas.style.cursor = "auto";
      return;
    }

    const hit = this._pickStage();
    this.canvas.style.cursor = hit ? "pointer" : "auto";
  };

  _onDown = (e) => {
    this._setMouseNDC(e);
    this.down.copy(this.mouse);
  };

  _onUp = (e) => {
    this._setMouseNDC(e);

    // Drag threshold: looser for touch since fingers wobble more than mice.
    const isTouch = e.pointerType === "touch" || isMobile();
    const dragThreshold = isTouch ? 0.012 : 0.001;
    if (this.down.distanceTo(this.mouse) > dragThreshold) return;
    if (!this.roomModel) return;

    // On mobile we always allow tap (the overlay path handles state),
    // on desktop only allow clicks when idle.
    if (!isMobile() && this.state !== "idle") return;

    const hit = this._pickStage();
    if (!hit) return;

    // Route through _requestStage so mobile gets the overlay path.
    this._requestStage(hit.stage);
  };

  _setMouseNDC(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    this.mouse.set(x, y);
  }

  // -------------------- picking --------------------
  _pickStage() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.roomModel, true);
    if (!hits.length) return null;

    for (const h of hits) {
      const o = h.object;

      // ----- TV -----
      if (
        this.tv.screen &&
        (o === this.tv.screen || o.name === this.tv.screen.name)
      ) {
        return { stage: "tv", focusObj: this.tv.screen };
      }
      if (this.tv.root && this._isDescendantOf(o, this.tv.root)) {
        return { stage: "tv", focusObj: this.tv.screen || this.tv.root || o };
      }

      // ----- COMPUTER -----
      if (
        this.computer.screen &&
        (o === this.computer.screen || o.name === this.computer.screen.name)
      ) {
        return { stage: "computer", focusObj: this.computer.screen };
      }
      if (this.computer.root && this._isDescendantOf(o, this.computer.root)) {
        return {
          stage: "computer",
          focusObj: this.computer.screen || this.computer.root || o,
        };
      }
    }

    return null;
  }

  _isDescendantOf(obj, ancestor) {
    let cur = obj;
    while (cur) {
      if (cur === ancestor) return true;
      cur = cur.parent;
    }
    return false;
  }

  // -------------------- stage controls --------------------
  enterStage(stage, focusObj) {
    if (this.state !== "idle") return;

    this._saveHomeOnce();
    this.activeStage = stage;

    // lock orbit while animating in
    if (this.controls) {
      this.controls.enabled = false;
      this.controls.enableDamping = false;
    }

    const view = this._computeStageView(stage, focusObj);

    this._startAnim({
      toPos: view.pos,
      toTarget: view.target,
      duration: view.duration,
      toFov: view.fov,
      arcHeight: view.arcHeight,
      arcSide: view.arcSide,
    });

    this.state = "entering";
  }

  exitStage() {
    if (!this.home.saved) return;
    if (this.state !== "focused") return;

    const dur =
      this.activeStage === "tv"
        ? this.tv.durationOut
        : this.activeStage === "computer"
          ? this.computer.durationOut
          : 0.9;

    this._startAnim({
      toPos: this.home.pos,
      toTarget: this.home.target,
      duration: dur,
      toFov: this.home.fov,
      arcHeight:
        this.activeStage === "tv"
          ? this.tv.arcHeight * 0.55
          : this.computer.arcHeight * 0.55,
      arcSide:
        this.activeStage === "tv"
          ? -this.tv.arcSide * 0.45
          : -this.computer.arcSide * 0.45,
    });

    this.state = "exiting";
  }

  _startAnim({ toPos, toTarget, duration, toFov, arcHeight = 0, arcSide = 0 }) {
    this.anim.t = 0;
    this.anim.duration = duration ?? 1.0;

    this.anim.fromPos.copy(this.camera.position);
    this.anim.fromTarget.copy(this.controls?.target ?? new THREE.Vector3());
    this.anim.fromFov = this.camera.fov;

    this.anim.toPos.copy(toPos);
    this.anim.toTarget.copy(toTarget);
    this.anim.toFov = toFov ?? this.camera.fov;

    this.anim.midPos
      .copy(this.anim.fromPos)
      .add(this.anim.toPos)
      .multiplyScalar(0.5);

    const travel = this.anim.toPos.clone().sub(this.anim.fromPos);
    const sideAxis = new THREE.Vector3().crossVectors(
      travel,
      new THREE.Vector3(0, 1, 0),
    );
    if (sideAxis.lengthSq() < 0.000001) sideAxis.set(1, 0, 0);
    else sideAxis.normalize();

    this.anim.midPos.y += arcHeight;
    this.anim.midPos.addScaledVector(sideAxis, arcSide);
  }

  _computeStageView(stage, focusObj) {
    if (stage === "tv") return this._computeViewFor(this.tv, focusObj);
    if (stage === "computer")
      return this._computeViewFor(this.computer, focusObj);

    // fallback
    return {
      pos: this.camera.position.clone(),
      target: (this.controls?.target ?? new THREE.Vector3()).clone(),
      duration: 1.0,
      fov: this.camera.fov,
      arcHeight: 0,
      arcSide: 0,
    };
  }

  // -------------------- generic view computation (TV + Computer) --------------------
  _computeViewFor(cfg, pickedObj) {
    const focusObj = pickedObj || cfg.screen || cfg.root;

    if (!focusObj) {
      console.warn(
        "[Navigation] Stage not found. Check names:",
        cfg.rootName,
        cfg.screenName,
      );
      return {
        pos: this.camera.position.clone(),
        target: (this.controls?.target ?? new THREE.Vector3()).clone(),
        duration: cfg.durationIn,
        fov: cfg.focusFov ?? this.camera.fov,
        arcHeight: cfg.arcHeight ?? 0,
        arcSide: cfg.arcSide ?? 0,
      };
    }

    // Bounding box center to ignore bad pivots
    const box = new THREE.Box3().setFromObject(focusObj);
    const focusPos = new THREE.Vector3();
    box.getCenter(focusPos);

    // World orientation axes
    const q = new THREE.Quaternion();
    focusObj.getWorldQuaternion(q);

    let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q).normalize();

    // ensure forward points toward camera
    const toCam = this.camera.position.clone().sub(focusPos).normalize();
    if (forward.dot(toCam) < 0) forward.negate();

    const camPos = focusPos
      .clone()
      .addScaledVector(forward, cfg.distance)
      .addScaledVector(right, cfg.side)
      .addScaledVector(up, cfg.up);

    const targetPos = focusPos.clone().addScaledVector(up, cfg.targetUp);

    return {
      pos: camPos,
      target: targetPos,
      duration: cfg.durationIn,
      fov: cfg.focusFov ?? this.camera.fov,
      arcHeight: cfg.arcHeight ?? 0,
      arcSide: cfg.arcSide ?? 0,
    };
  }

  // -------------------- update loop --------------------
  update() {
    if (!this.roomModel) return;
    if (this.state !== "entering" && this.state !== "exiting") return;

    const dt = (this.time?.delta ?? 16) / 1000;
    this.anim.t += dt;

    const u = THREE.MathUtils.clamp(this.anim.t / this.anim.duration, 0, 1);
    const eased = this._easeInOutCubic(u);

    this.camera.position.copy(
      this._quadraticBezier(
        this.anim.fromPos,
        this.anim.midPos,
        this.anim.toPos,
        eased,
      ),
    );
    this.camera.fov = THREE.MathUtils.lerp(
      this.anim.fromFov,
      this.anim.toFov,
      eased,
    );
    this.camera.updateProjectionMatrix();

    if (this.controls) {
      this.controls.target.lerpVectors(
        this.anim.fromTarget,
        this.anim.toTarget,
        eased,
      );
      this.controls.update();
    } else {
      this.camera.lookAt(this.anim.toTarget);
    }

    if (u >= 1) {
      if (this.state === "entering") {
        this.state = "focused";
        this.camera.position.copy(this.anim.toPos);
        this.camera.fov = this.anim.toFov;
        this.camera.updateProjectionMatrix();
        if (this.controls) {
          this.controls.target.copy(this.anim.toTarget);
          this.controls.update();
        }
        if (this.pendingStage && this.pendingStage !== this.activeStage) {
          this.exitStage();
        } else {
          this.pendingStage = null;
          // keep controls disabled while focused
        }
      } else {
        this.state = "idle";
        this.activeStage = null;
        this.camera.position.copy(this.home.pos);
        this.camera.fov = this.home.fov;
        this.camera.updateProjectionMatrix();
        if (this.controls) {
          this.controls.target.copy(this.home.target);
          this.controls.update();
        }

        if (this.controls) {
          this.controls.enabled = true;
          this.controls.enableDamping = true;
        }

        // If user clicked another stage from the navbar while focused,
        // we queued it and we can enter it now.
        if (this.pendingStage) {
          const next = this.pendingStage;
          this.pendingStage = null;
          const obj = this._defaultFocusObjForStage(next);
          this.enterStage(next, obj);
        }
      }
    }
  }

  // -------------------- helpers --------------------
  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  _quadraticBezier(a, b, c, t) {
    const inv = 1 - t;
    return new THREE.Vector3()
      .addScaledVector(a, inv * inv)
      .addScaledVector(b, 2 * inv * t)
      .addScaledVector(c, t * t);
  }

  _saveHomeOnce() {
    if (this.home.saved) return;
    this.home.saved = true;
    this.home.pos.copy(this.camera.position);
    this.home.target.copy(this.controls?.target ?? new THREE.Vector3());
    this.home.fov = this.camera.fov;
  }

  destroy() {
    window.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("pointerdown", this._onDown);
    window.removeEventListener("pointerup", this._onUp);
    window.removeEventListener("keydown", this._onKeyDown);
  }
}
