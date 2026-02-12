// src/Experience/Utilts/Resource.js
import EventEmitter from "./EventEmitter";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class Resources extends EventEmitter {
  constructor(sources) {
    super();
    this.sources = sources;

    this.items = {};
    this.toLoad = this.sources.length;
    this.loaded = 0;

    // {dayMat, nightMat} pairs for ThemeToggle
    this.bakedPairs = [];

    // nodes controlled by console (SHOP* except SHOP_OUT*)
    this.shopNodes = [];

    this.setLoaders();
    this.startLoading();
  }

  setLoaders() {
    this.loaders = {};

    this.loaders.dracoLoader = new DRACOLoader();
    this.loaders.dracoLoader.setDecoderPath("/draco/");

    this.loaders.textureLoader = new THREE.TextureLoader();

    this.loaders.gltfLoader = new GLTFLoader();
    this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader);
  }

  startLoading() {
    for (const source of this.sources) {
      if (source.type === "gltfModel") {
        this.loaders.gltfLoader.load(
          source.path,
          (gltf) => this.sourceLoaded(source, gltf),
          undefined,
          (err) => {
            console.error(`Failed to load ${source.name}:`, err);
            // still count it so app doesn't hang forever
            this.sourceLoaded(source, null);
          },
        );
      }

      if (source.type === "texture") {
        this.loaders.textureLoader.load(
          source.path,
          (texture) => {
            // ✅ only configure AFTER it's actually loaded
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            this.sourceLoaded(source, texture);
          },
          undefined,
          (err) => {
            console.error(`Failed to load ${source.name}:`, err);
            // still count it so app doesn't hang forever
            this.sourceLoaded(source, null);
          },
        );
      }
    }
  }

  sourceLoaded(source, file) {
    this.items[source.name] = file;
    this.loaded++;

    // ✅ progress event for loader UI
    this.trigger("progress", {
      loaded: this.loaded,
      toLoad: this.toLoad,
      progress: this.toLoad ? this.loaded / this.toLoad : 1,
      name: source.name,
      type: source.type,
    });

    if (this.loaded === this.toLoad) {
      this.assignTextures();
      this.trigger("ready");
    }
  }

  assignTextures() {
    const model = this.items.roomModel?.scene;

    if (!model) {
      console.error("[Resources] roomModel.scene missing");
      return;
    }

    // reset for HMR
    this.bakedPairs.length = 0;
    this.shopNodes.length = 0;

    const texMap = {
      First: { day: this.items.bakedDay1, night: this.items.bakedNight1 },
      Second: { day: this.items.bakedDay2, night: this.items.bakedNight2 },
      Third: { day: this.items.bakedDay3, night: this.items.bakedNight3 },
      Fourth: { day: this.items.bakedDay4, night: this.items.bakedNight4 },
    };

    model.traverse((child) => {
      if (!child.isMesh) return;

      const name = child.name || "";
      const isShop = name.startsWith("SHOP");
      const isShopOut = name.startsWith("SHOP_OUT"); // ✅ always visible

      // ✅ choose texture set
      let set = null;

      // SHOP* always uses Fourth
      if (isShop) {
        set = texMap.Fourth;
      } else {
        for (const key of Object.keys(texMap)) {
          if (name.includes(key)) {
            set = texMap[key];
            break;
          }
        }

        // your special case
        if (!set && name.includes("Three")) {
          set = texMap.Third;
        }
      }

      // fallback material
      if (!set || !set.day || !set.night) {
        child.material = new THREE.MeshBasicMaterial({
          color: "#081021",
          transparent: true,
        });
        return;
      }

      // ----- DAY material on original mesh -----
      const dayMat = new THREE.MeshBasicMaterial({
        map: set.day,
        transparent: true,
        opacity: 1,
      });
      dayMat.depthWrite = true;
      child.material = dayMat;

      // ----- NIGHT overlay mesh -----
      const nightMat = new THREE.MeshBasicMaterial({
        map: set.night,
        transparent: true,
        opacity: 0,
      });
      nightMat.depthWrite = false;

      const nightOverlay = new THREE.Mesh(child.geometry, nightMat);
      nightOverlay.name = `${name}__NightOverlay`;

      nightOverlay.position.copy(child.position);
      nightOverlay.quaternion.copy(child.quaternion);
      nightOverlay.scale.copy(child.scale);

      nightOverlay.renderOrder = (child.renderOrder || 0) + 1;
      if (child.parent) child.parent.add(nightOverlay);

      this.bakedPairs.push({ dayMat, nightMat });

      // ✅ Visibility rules
      // - SHOP_OUT* stays visible forever
      // - other SHOP* start hidden
      if (isShop && !isShopOut) {
        child.visible = false;
        nightOverlay.visible = false;
        this.shopNodes.push(child, nightOverlay); // console control group
      }
    });

    // ✅ Console controls for hidden SHOP group (SHOP_OUT excluded)
    window.SHOP = {
      show: () => {
        this.shopNodes.forEach((o) => (o.visible = true));
        console.log("[SHOP] shown:", this.shopNodes.length);
      },
      hide: () => {
        this.shopNodes.forEach((o) => (o.visible = false));
        console.log("[SHOP] hidden:", this.shopNodes.length);
      },
      toggle: () => {
        const next = !(this.shopNodes[0]?.visible ?? false);
        this.shopNodes.forEach((o) => (o.visible = next));
        console.log("[SHOP] toggle ->", next ? "shown" : "hidden");
      },
      list: () => {
        console.log("[SHOP] nodes (console-controlled, excludes SHOP_OUT):");
        this.shopNodes.forEach((o) => console.log(" -", o.name));
        console.log("count:", this.shopNodes.length);
      },
    };
  }
}
