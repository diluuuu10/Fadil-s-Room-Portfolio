import Experience from "./Experience";
import * as THREE from "three";
import Environment from "./World/Environment";
import Room from "./World/Room";
import Navigation from "./Navigation";
import TVIframe from "./World/TVIframe.js";
import PCIframe from "./World/PCIframe.js";

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;

    this.resources = this.experience.resources;
    this.resources.on("ready", () => {
      // Setup
      this.room = new Room();
      this.environment = new Environment();

      this.navigation = new Navigation();
      this.navigation.setFromRoom(this.room.model);

      this.tvIframe = new TVIframe({
        roomModel: this.room.model, // your glb scene
        navigation: this.navigation, // your navigation instance
      });
      this.pcIframe = new PCIframe({
        roomModel: this.room.model,
        navigation: this.navigation,
      });
    });

    // this.resources.on;

    // Test mesh
    // const testMesh = new THREE.Mesh(
    //   new THREE.BoxGeometry(1, 1, 1),
    //   new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true }),
    // );
    // this.scene.add(testMesh);
  }
}
