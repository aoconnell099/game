import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import * as GUI from 'babylonjs-gui';

import IslandScene from '../scenes/IslandScene.js';


export default class Game {
  constructor( canvasId ){
    this.canvas = document.getElementById( canvasId );
    this.engine = new BABYLON.Engine( this.canvas, true );
    this.scene = {};
    this.camera = {};
    this.light = {};
    this.fireScene = {};
  }

  createScene() {
    // this.fireScene = new FireScene({
    //   canvasId: 'renderCanvas',
    //   engine: this.engine
    // });

    // this.fireScene.createScene();
    // this.fireScene.doRender();

    // this.campScene = new CampScene({
    //   canvasId: 'renderCanvas',
    //   engine: this.engine
    // });
    
    // this.campScene.createScene();
    // this.campScene.doRender();

    this.islandScene = new IslandScene({
      canvasId: 'renderCanvas',
      engine: this.engine
    });

    this.islandScene.createScene();
    this.islandScene.doRender();

    // this.plazaScene = new PlazaScene({
    //   canvasId: 'renderCanvas',
    //   engine: this.engine
    // });
  }
}