import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import * as Materials from 'babylonjs-materials'; 
import 'babylonjs-loaders';
import 'babylonjs-inspector';
// import "@babylonjs/core/Debug/debugLayer";
// import '@babylonjs/inspector';

// import Batman from '../meshes/Batman';
import Character from '../meshes/Character';

export default class IslandScene {
  constructor( config ){
    this.canvas = document.getElementById( config.canvasId );
    this.engine = config.engine;
    this.scene = new BABYLON.Scene(this.engine);
    this.camera = {};
    this.light = {};
    this.character = {};
    this.normals = {};

    //third-person cam - take care of all of this and set the active camera in here for the loading screen to play while the scene is built
    this.camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI/2, Math.PI/3, 8, new BABYLON.Vector3(0, 0, 0), this.scene);
    this.scene.activeCamera = this.camera;
    //this.scene.activeCamera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 2;
    this.camera.upperRadiusLimit = 8;
    this.camera.lowerBetaLimit = 0.1; // stops camera from going through the ground
    this.camera.upperBetaLimit = (Math.PI/2)-0.1; // stops camera from going through the ground
    this.camera.inputs.attached.keyboard.angularSpeed = .003;
    this.camera.useAutoRotationBehavior = true;
    this.camera.autoRotationBehavior.idleRotationSpeed *= 1.8;

    // create the loading screen
    BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = function () {
        if (document.getElementById("customLoadingScreenDiv")) {
            document.getElementById("customLoadingScreenDiv").style.display = "initial";
            // Do not add a loading screen if there is already one
            return;
        }
        
        this._loadingDiv = document.createElement("div");
        this._loadingDiv.id = "customLoadingScreenDiv";
        this._loadingDiv.innerHTML = "<img src='https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Loadingsome.gif/600px-Loadingsome.gif' />";
        var customLoadingScreenCss = document.createElement('style');
        customLoadingScreenCss.type = 'text/css';
        customLoadingScreenCss.innerHTML = `
        #customLoadingScreenDiv{
            background-color: #FFFFFFcc;
            color: white;
            font-size:50px;
            text-align:center;
        }
        `;
        document.getElementsByTagName('head')[0].appendChild(customLoadingScreenCss);
        this._resizeLoadingUI();
        window.addEventListener("resize", this._resizeLoadingUI);
        document.body.appendChild(this._loadingDiv);
    };
    
    BABYLON.DefaultLoadingScreen.prototype.hideLoadingUI = function(){
        document.getElementById("customLoadingScreenDiv").style.display = "none";
        console.log("scene is now loaded");
    }
  } //end constructor

  showNormals(mesh, size, color) {
    var normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    var positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    color = color || BABYLON.Color3.White();
    size = size || 1;

    var lines = [];
    for (var i = 0; i < normals.length; i += 3) {
        var v1 = BABYLON.Vector3.FromArray(positions, i);
        var v2 = v1.add(BABYLON.Vector3.FromArray(normals, i).scaleInPlace(size));
        lines.push([v1.add(mesh.position), v2.add(mesh.position)]);
    }
    var normalLines = BABYLON.MeshBuilder.CreateLineSystem("normalLines", {lines: lines}, this.scene);
    normalLines.color = color;
  }


  async initEnv() {
    // create and enable physics for the scene
    let gravityVector = new BABYLON.Vector3(0, 0, 0);
    let physicsPlugin = new BABYLON.CannonJSPlugin();
    this.scene.enablePhysics(gravityVector, physicsPlugin);
    this.scene.collisionsEnabled = true;
    let physicsViewer = new BABYLON.Debug.PhysicsViewer();
    let physicsHelper = new BABYLON.PhysicsHelper(this.scene);

    // create all lighting, lens flares, and the skybox
    this.light = new BABYLON.HemisphericLight("aHemiLight", new BABYLON.Vector3(0, 1, 0), this.scene);
    this.light.intensity = 0.9;
    
    var direcLight = new BABYLON.DirectionalLight("aDirectionalLight", new BABYLON.Vector3(25, -25, 30), this.scene);
    direcLight.position = new BABYLON.Vector3(-25, 25, -30);
    direcLight.intensity = 0.5;

    var light4 = new BABYLON.SpotLight("aspotLight2", new BABYLON.Vector3(-25, 25, -30), new BABYLON.Vector3(25, -25, 30), 6.6, 3, this.scene); //6.6 for sharp
    light4.intensity = 100;
    light4.diffuse = new BABYLON.Color3(0.49,0.49,0.49);
    
    // skybox sun is located at (-180, 120, -480)
    var lensFlareLight = new BABYLON.PointLight("lensFlareLight", new BABYLON.Vector3(-180, 120, -480), this.scene);
    lensFlareLight.intensity = 0;
    // create light sphere/"sun"
    var lensFlareLightSphere = BABYLON.Mesh.CreateSphere("Sphere0", 16, 0.5, this.scene);
    lensFlareLightSphere.material = new BABYLON.StandardMaterial("white", this.scene);
    lensFlareLightSphere.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    lensFlareLightSphere.material.specularColor = new BABYLON.Color3(0, 0, 0);
    lensFlareLightSphere.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    lensFlareLightSphere.position = lensFlareLight.position;
    
    // create the lens flare
    var lensFlareSystem = new BABYLON.LensFlareSystem("lensFlareSystem", lensFlareLight, this.scene);
    var flare00 = new BABYLON.LensFlare(0.2, 0, new BABYLON.Color3(1, 1, 1), "assets/textures/Flare2.png", lensFlareSystem);
    var flare01 = new BABYLON.LensFlare(0.5, 0.2, new BABYLON.Color3(0.5, 0.5, 1), "assets/textures/Flare3.png", lensFlareSystem);
    var flare02 = new BABYLON.LensFlare(0.2, 1.0, new BABYLON.Color3(1, 1, 1), "assets/textures/Flare3.png", lensFlareSystem);
    var flare03 = new BABYLON.LensFlare(0.4, 0.4, new BABYLON.Color3(1, 0.5, 1), "assets/textures/Flare.png", lensFlareSystem);
    var flare04 = new BABYLON.LensFlare(0.1, 0.6, new BABYLON.Color3(1, 1, 1), "assets/textures/Flare2.png", lensFlareSystem);
    var flare05 = new BABYLON.LensFlare(0.3, 0.8, new BABYLON.Color3(1, 1, 1), "assets/textures/Flare3.png", lensFlareSystem);

    // create the skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000, this.scene);
    skybox.position.y -= 60;
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/textures/TropicalSunnyDay", this.scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;

    let cascadingShadowMap = false;
    // create a shadow generator
    if (!cascadingShadowMap) {
        var shadowGenerator2 = new BABYLON.ShadowGenerator(512, direcLight);
        // shadowGenerator2.useBlurExponentialShadowMap = true;
        // shadowGenerator2.blurKernel = 32;
        shadowGenerator2.setDarkness(0);
        var shadowGenerator4 = new BABYLON.ShadowGenerator(1024, light4);
        shadowGenerator4.useBlurExponentialShadowMap = true;
        // shadowGenerator4.blurKernel = 32;
        shadowGenerator4.setDarkness(0);
    }
    
    //Water
    var waterMesh = BABYLON.Mesh.CreateGround("waterMesh", 100, 100, 32, this.scene, false);
    waterMesh.position.y = -0.12;
    // waterMesh.position.y = -0.5;
    waterMesh.position.z -= 8;
    waterMesh.rotation.y = Math.PI;
                      
    var water = new Materials.WaterMaterial("waterMaterial", this.scene, new BABYLON.Vector2(256, 256));
	water.backFaceCulling = true;
	water.bumpTexture = new BABYLON.Texture("assets/textures/Water/waterbump.png", this.scene);
	// water.windForce = -7;
	// water.waveHeight = 0.008;    
	// water.bumpHeight = 0.12;
    // water.waveLength = 0.15;
    // water.waveSpeed = 10.0;

    water.windForce = -3;
	water.waveHeight = 0.008;    
	//water.bumpHeight = 0.12;
    //water.waveLength = 0.15;
    water.waveSpeed = 50.0;

	water.waterColor = new BABYLON.Color3(0, 0.13, 0.239); //0.12, 0.7, 1
    water.colorBlendFactor = 0.2;
    waterMesh.material = water;
    water.addToRenderList(skybox);

    let sandArr = [];
    var sandMaterial = new BABYLON.PBRMaterial("sandMaterial", this.scene);
    sandMaterial.albedoTexture = new BABYLON.Texture("assets/textures/Sand/Sand_001_COLOR.png", this.scene);
    sandMaterial.bumpTexture = new BABYLON.Texture("assets/textures/Sand/Sand_001_NRM.png", this.scene);
    sandMaterial.ambientTexture = new BABYLON.Texture("assets/textures/Sand/Sand_001_OCC.png", this.scene);
    sandMaterial.albedoTexture.uScale = 20;
    sandMaterial.albedoTexture.vScale = 20;
    sandMaterial.bumpTexture.uScale = 20;
    sandMaterial.bumpTexture.vScale = 20;
    sandMaterial.ambientTexture.uScale = 20;
    sandMaterial.ambientTexture.vScale = 20;
    sandMaterial.roughness = 1;
    sandMaterial.metallic = 0.65;

    // create the base ground for the scene -- this will be sand to simulate an island beachfront with 4 polygons extruding into the sea
    var sand = BABYLON.MeshBuilder.CreateBox("sand", {
        width: 30,
        height: 1,
        depth: 30
    });
    sand.position.y -= 0.45;
    sand.position.z -= 8;
    sand.checkCollisions = false;
    sand.material = sandMaterial;
    sand.receiveShadows = true;
    //sand.alwaysSelectAsActiveMesh = true;
    sand.freezeWorldMatrix();
    sandArr.push(sand);

    let corners = [];
    let poly_tri = {};
    let lowSand = {};

    for (var i=1; i<6; i++) {
        if (i==1) {
            corners = [ 
                new BABYLON.Vector2(-25, -5),
                new BABYLON.Vector2(-15, 5),
                new BABYLON.Vector2(15, 5),
                new BABYLON.Vector2(25, -5),
            ];
            poly_tri = new BABYLON.PolygonMeshBuilder("polytri", corners, this.scene);
            lowSand = poly_tri.build(null, 0.1);
            lowSand.position.y-=0.45;
            lowSand.position.z-=27.95;
            lowSand.rotation.x-=0.1
        }
        else if (i==2) {
            corners = [ 
                new BABYLON.Vector2(-25, -5),
                new BABYLON.Vector2(-15, 5),
                new BABYLON.Vector2(15, 5),
                new BABYLON.Vector2(25, -5),
            ];
            poly_tri = new BABYLON.PolygonMeshBuilder("polytri", corners, this.scene);
            
            lowSand = poly_tri.build(null, 0.1);
            lowSand.position.y-=0.45;
            lowSand.position.x += 19.9;
            lowSand.position.z-=8;
            lowSand.rotation.x-=0.1
            lowSand.rotation.y-=Math.PI/2;
            //lowSand.checkCollisions = false;
        }
        else if (i==3) {
            corners = [ 
                new BABYLON.Vector2(-25, -5),
                new BABYLON.Vector2(-15, 5),
                new BABYLON.Vector2(15, 5),
                new BABYLON.Vector2(25, -5),
            ];
            poly_tri = new BABYLON.PolygonMeshBuilder("polytri", corners, this.scene);
            
            lowSand = poly_tri.build(null, 0.1);
            lowSand.position.y-=0.45;
            lowSand.position.x -= 19.9;//5
            lowSand.position.z-=8;
            lowSand.rotation.x-=0.1
            lowSand.rotation.y += Math.PI/2;
            //lowSand.checkCollisions = false;
        }
        else if (i==4) {
            corners = [ 
                new BABYLON.Vector2(-25, -5),
                new BABYLON.Vector2(-15, 5),
                new BABYLON.Vector2(15, 5),
                new BABYLON.Vector2(25, -5),
            ];
            poly_tri = new BABYLON.PolygonMeshBuilder("polytri", corners, this.scene);

            lowSand = poly_tri.build(null, 0.1);
            lowSand.position.y-=0.45;
            lowSand.position.z+=11.9
            lowSand.rotation.x-=0.1
            lowSand.rotation.y = Math.PI;
        }
        else if (i==5) {
            lowSand = BABYLON.Mesh.CreatePlane('bottomPlane', 100, this.scene);
            lowSand.position.y = -1.2;
            lowSand.position.z-=8;
            lowSand.rotation.x = Math.PI/2;
        }
            lowSand.material = sandMaterial;
            lowSand.receiveShadows = true;
            //lowSand.checkCollisions = false;
            //lowSand.alwaysSelectAsActiveMesh = true;
            //water.addToRenderList(lowSand);
            //lowSand.material.freeze();
            lowSand.freezeWorldMatrix();
            sandArr.push(lowSand);
    }
    let sandMesh = BABYLON.Mesh.MergeMeshes(sandArr);
    sandMesh.physicsImpostor = new BABYLON.PhysicsImpostor(sandMesh, BABYLON.PhysicsImpostor.MeshImpostor,{mass:0, friction:1, restitution: 0},this.scene);
    sandMesh.receiveShadows = true;
    sandMesh.checkCollisions = false;
    //pathEntrance.alwaysSelectAsActiveMesh = true;
    sandMesh.freezeWorldMatrix();
    water.addToRenderList(sandMesh);
    // this.engine.hideLoadingUI();

    // let footPrint = BABYLON.Mesh.CreatePlane('footPrint', 0.2, this.scene);
    // footPrint.position.y += 1;
}

  createScene() {
    this.engine.displayLoadingUI();

    this.initEnv();
    console.log("init Env");

    // set camFocusDebug to true to control camera focus with GUI
    var camFocusDebug = false;
    if (camFocusDebug == true) {
/*  Possible alternate method to create a pipeline  
        var parameters = {
            chromatic_aberration: 0.2,       // from 0 to x (1 for realism)
            edge_blur: 0.2,                // from 0 to x (1 for realism)
            distortion: 0.2,                 // from 0 to x (1 for realism)
            grain_amount: 0.2,               // from 0 to 1
            //grain_texture: BABYLON.Texture;     // texture to use for grain effect; if unset, use random B&W noise
            dof_focus_distance: 8,         // depth-of-field: focus distance; unset to disable (disabled by default)
            dof_aperture: 10,               // depth-of-field: focus blur bias (default: 1)
            dof_darken: 0,                 // depth-of-field: darken that which is out of focus (from 0 to 1, disabled by default)
            dof_pentagon: true,              // depth-of-field: makes a pentagon-like "bokeh" effect
            dof_gain: 1,                   // depth-of-field: highlights gain; unset to disable (disabled by default)
            dof_threshold: 1,             // depth-of-field: highlights threshold (default: 1)
            blur_noise: true                // add a little bit of noise to the blur (default: true)
        };

        var lensEffect = new BABYLON.LensRenderingPipeline('lensEffects', parameters, this.scene, 1.0, this.camera);
*/

        // Create default pipeline and enable dof with Medium blur level
        // var pipeline = new BABYLON.DefaultRenderingPipeline("default", true, this.scene, [this.scene.activeCamera]);
        // pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Medium;
        // pipeline.depthOfFieldEnabled = true;
        // pipeline.depthOfField.focalLength = 400;
        // pipeline.depthOfField.fStop = 8;
        // pipeline.depthOfField.focusDistance = 5000;
        //pipeline.imageProcessing.exposure = 2.5;
    

        var moveFocusDistance;

        //add UI to adjust pipeline.depthOfField.fStop, kernelSize, focusDistance, focalLength
        var bgCamera = new BABYLON.ArcRotateCamera("BGCamera", Math.PI / 2 + Math.PI / 7, Math.PI / 2, 100,
            new BABYLON.Vector3(0, 20, 0),
            this.scene
        );
        bgCamera.layerMask = 0x10000000;
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
        advancedTexture.layer.layerMask = 0x10000000;
        var UiPanel = new GUI.StackPanel();
        UiPanel.width = "220px";
        UiPanel.fontSize = "14px";
        UiPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        UiPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        advancedTexture.addControl(UiPanel);
        var params = [
            {name: "fStop", min:1.4,max:32},
            {name: "focusDistance", min:0,max:10000},
            {name: "focalLength", min:0,max:1000}
        ]
        params.forEach(function(param){
            var header = new GUI.TextBlock();
            header.text = param.name+":"+pipeline.depthOfField[param.name].toFixed(2);
            header.height = "40px";
            header.color = "black";
            header.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            header.paddingTop = "10px";
            UiPanel.addControl(header); 
            var slider = new GUI.Slider();
            slider.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            slider.minimum = param.min;
            slider.maximum = param.max;
            slider.color = "#636e72";
            slider.value = pipeline.depthOfField[param.name];
            slider.height = "20px";
            slider.width = "205px";
            UiPanel.addControl(slider); 
            slider.onValueChangedObservable.add(function(v){
                pipeline.depthOfField[param.name] = v;
                header.text = param.name+":"+pipeline.depthOfField[param.name].toFixed(2);
                moveFocusDistance = false;
            });
        });
        this.scene.activeCameras = [this.scene.activeCamera, bgCamera];
    }
    let shaderDebug = false;
    if (shaderDebug) {
        // Instrumentation
        var instrumentation = new BABYLON.EngineInstrumentation(this.engine);
        instrumentation.captureGPUFrameTime = true;
        instrumentation.captureShaderCompilationTime = true;
        
        // GUI
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
        var stackPanel = new GUI.StackPanel();
        stackPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;   
        stackPanel.isVertical = true;
        advancedTexture.addControl(stackPanel);     

        var text1 = new GUI.TextBlock();
        text1.text = "";
        text1.color = "white";
        text1.fontSize = 16;
        text1.height = "30px";
        stackPanel.addControl(text1);       

        var text2 = new GUI.TextBlock();
        text2.text = "";
        text2.color = "white";
        text2.fontSize = 16;
        text2.height = "30px";
        stackPanel.addControl(text2);       

        var text3 = new GUI.TextBlock();
        text3.text = "";
        text3.color = "white";
        text3.fontSize = 16;
        text3.height = "30px";
        stackPanel.addControl(text3);       

        var text4 = new GUI.TextBlock();
        text4.text = "";
        text4.color = "white";
        text4.fontSize = 16;
        text4.height = "30px";
        stackPanel.addControl(text4);        

        var text5 = new GUI.TextBlock();
        text5.text = "";
        text5.color = "white";
        text5.fontSize = 16;
        text5.height = "30px";
        stackPanel.addControl(text5);       

        var i = 0;
        this.scene.registerBeforeRender(function () {
            text1.text = "current frame time (GPU): " + (instrumentation.gpuFrameTimeCounter.current * 0.000001).toFixed(2) + "ms";
            text2.text = "average frame time (GPU): " + (instrumentation.gpuFrameTimeCounter.average * 0.000001).toFixed(2) + "ms";
            text3.text = "total shader compilation time: " + (instrumentation.shaderCompilationTimeCounter.total).toFixed(2) + "ms";
            text4.text = "average shader compilation time: " + (instrumentation.shaderCompilationTimeCounter.average).toFixed(2) + "ms";
            text5.text = "compiler shaders count: " + instrumentation.shaderCompilationTimeCounter.count;
        });
    }

    // import the meshes to use in the scene -- handle all of their uses in the executeWhenReady func
    // BABYLON.SceneLoader.ImportMesh("", "assets/batman/", "batanim5.babylon", this.scene);
    BABYLON.SceneLoader.ImportMesh("", "assets/character/", "fiddlerJoined.babylon", this.scene);
    BABYLON.SceneLoader.ImportMesh("", "assets/islandScene/", "grassAndFlowers.babylon", this.scene);
    BABYLON.SceneLoader.ImportMesh("", "assets/islandScene/", "smallWorld.babylon", this.scene);
    BABYLON.SceneLoader.ImportMesh("", "assets/islandScene/", "fishingRod.babylon", this.scene);
    //BABYLON.SceneLoader.ImportMesh("", "assets/islandScene/", "pier.babylon", this.scene);

    //BABYLON.SceneLoader.ImportMesh("", "assets/islandScene/", "simplifiedMesh.babylon", this.scene);

    // standard material versions
    // BABYLON.SceneLoader.ImportMesh("", "assets/character/", "fiddlerJoinedSimple.babylon", this.scene);
    // BABYLON.SceneLoader.ImportMesh("", "assets/islandScene/simple/", "grassAndFlowersSimple.babylon", this.scene);
    // BABYLON.SceneLoader.ImportMesh("", "assets/islandScene/simple/", "smallWorldSimple.babylon", this.scene);
    // BABYLON.SceneLoader.ImportMesh("", "assets/islandScene/simple/", "fishingRodSimple.babylon", this.scene);
    // BABYLON.SceneLoader.ImportMesh("", "assets/islandScene/simple/", "pierSimple.babylon", this.scene);

    //let dirtyMeshing = true;
    let cascadingShadowMap = false;

    let character = {};
    let grassArr = [];
    let physImpArr = [];
    let grassBladeAndFlowerArr = [];

    let pipeline = new BABYLON.DefaultRenderingPipeline("default", true, this.scene, [this.scene.activeCamera]);
    pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.High;
    pipeline.depthOfFieldEnabled = true;
    pipeline.imageProcessing.exposure = 1.5;
    pipeline.fxaaEnabled = true;
    this.scene.executeWhenReady(function (scene) {
        scene.getMaterialByName("waterMaterial").addToRenderList(scene.getMeshByName("Character"));
        scene.getMaterialByName("waterMaterial").addToRenderList(scene.getMeshByName("Pier"));
        scene.getMaterialByName("waterMaterial").addToRenderList(scene.getMeshByName("Fishing_Rod"));

        // scene.getLightByName("aspotLight2").includedOnlyMeshes = [scene.getMeshByName("Batman")];
        // scene.autoClear = false; // Color buffer
        // scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
        let cam = scene.getCameraByName("camera1");
        scene.onBeforeRenderObservable.add(() => {
            let charX = scene.getMeshByName("Character").position.x;
            let charY = scene.getMeshByName("Character").position.y;
            let charZ = scene.getMeshByName("Character").position.z;
            // scene.getLightByName("aspotLight").direction = new BABYLON.Vector3(batX+25, -25, batZ+30);
            scene.getLightByName("aspotLight2").position = new BABYLON.Vector3(charX-2, charY+5, charZ-4);
            scene.getLightByName("aspotLight2").direction = new BABYLON.Vector3(2, -5, 4);
            
            // camera radius calculation 
            if (cam.beta > Math.PI/3) {
                cam.radius = 8-(5*(cam.beta-Math.PI/3)/((Math.PI/2-Math.PI/3)-0.1));
                let targetOffsetY = (-0.5*(cam.beta-Math.PI/3)/((Math.PI/2-Math.PI/3)-0.1));
                cam.targetScreenOffset = new BABYLON.Vector2(0,targetOffsetY);
                pipeline.depthOfField.focalLength = cam.radius*50;
                pipeline.depthOfField.fStop = cam.radius+(1.2*(cam.beta-Math.PI/3)/((Math.PI/2-Math.PI/3)-0.1));
                pipeline.depthOfField.focusDistance = (cam.radius*1000)+(1200*(cam.beta-Math.PI/3)/((Math.PI/2-Math.PI/3)-0.1));
            }
            else {
                let targetOffsetY = 0.5-(0.5*(cam.beta/(Math.PI/3)));
                cam.targetScreenOffset = new BABYLON.Vector2(0,targetOffsetY);
                cam.radius = 8;
                pipeline.depthOfField.focalLength = cam.radius*50;
                pipeline.depthOfField.fStop = cam.radius;
                pipeline.depthOfField.focusDistance = cam.radius*1000;
            }
        });
        function showNormals(mesh, size, color) {
            var normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            var positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            color = color || BABYLON.Color3.White();
            size = size || 1;
        
            var lines = [];
            for (var i = 0; i < normals.length; i += 3) {
                var v1 = BABYLON.Vector3.FromArray(positions, i);
                var v2 = v1.add(BABYLON.Vector3.FromArray(normals, i).scaleInPlace(size));
                lines.push([v1.add(mesh.position), v2.add(mesh.position)]);
            }
            var normalLines = BABYLON.MeshBuilder.CreateLineSystem("normalLines", {lines: lines}, scene);
            normalLines.color = color;
        }

        //scene.getLightByName("DirectionalLight").getShadowGenerator().getShadowMap().renderList = receiveShadowsArray;
        scene.meshes.forEach((mesh) => {
            if (mesh.name.match(/Grass_3/g)
            ||  mesh.name.match(/Flower_Small_Pink/g) ||  mesh.name.match(/Flower_Small_Pink_\d/g)
            ||  mesh.name.match(/Flower_Small_Red/g) ||  mesh.name.match(/Flower_Small_Red_\d/g)
            ||  mesh.name.match(/Flower_Small_Sky_Blue/g) ||  mesh.name.match(/Flower_Small_Sky_Blue_\d/g)
            ||  mesh.name.match(/Flower_Small_Yellow/g) ||  mesh.name.match(/Flower_Small_Yellow_\d/g)) 
            {
                grassBladeAndFlowerArr.push(mesh);
                mesh.checkCollisions = false;
                mesh.freezeWorldMatrix();
                mesh.setEnabled(false);
                // mesh.isVisible = false;
            }
            else if (mesh.name.match(/Grass/g) || mesh.name.match(/House/g) || mesh.name.match(/Pier/g)) {
                mesh.position.y +=0.05
                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.MeshImpostor,{mass:0, friction:1, restitution: 0},scene);
                mesh.receiveShadows = true;
                mesh.checkCollisions = false;
                mesh.freezeWorldMatrix();
            }
            //mesh.material.maxSimultaneousLights = 16;
        });
        if(!cascadingShadowMap) {
            //scene.getLightByName("aspotLight").getShadowGenerator().addShadowCaster(scene.getMeshByName("Batman")); not used
            // scene.getLightByName("aspotLight2").getShadowGenerator().addShadowCaster(scene.getMeshByName("Batman"));
            scene.getLightByName("aspotLight2").getShadowGenerator().addShadowCaster(scene.getMeshByName("Character"));
            scene.getLightByName("aDirectionalLight").getShadowGenerator().addShadowCaster(scene.getMeshByName("House"));
        }
        
        // scene.getMeshByName("Batman").material.backFaceCulling = true;
        scene.getMeshByName("Character").material.backFaceCulling = true;

        // batman = new Batman({
        //     scene: scene,
        //     camera: scene.getCameraByName("camera1"),
        //     batman: scene.getMeshByName("Batman"),
        //     skeleton: scene.getSkeletonByName("Armature"),
        //     speed: 2.5
        // });

        // batman.batman.physicsImpostor.registerOnPhysicsCollide(physImpArr, function(main, collided) {
        //     console.log("collided!");
        //     jumping = false;
        // });

        character = new Character({
            scene: scene,
            camera: scene.getCameraByName("camera1"),
            character: scene.getMeshByName("Character"),
            skeleton: scene.getSkeletonByName("Armature"),
            speed: 2.5
        });

        // create grass using instances
        var offsetX;
        var offsetZ;
        let instanceNum = 0;

        grassBladeAndFlowerArr.forEach((mesh) => {
            //console.log(mesh.name);
            if (mesh.name.match(/Grass_\d/g)) {
                instanceNum = 15;
                for (var i = 0; i<7; i++) {
                    let targetMesh = scene.getMeshByName("Grass");
                    let clumpPositionX = targetMesh.position.x+6.5 - Math.random()*13;
                    let clumpPositionZ = targetMesh.position.z+6.5 - Math.random()*13;
                    for (var j = 0; j < instanceNum; j++) {
                        offsetX = 1 - Math.random() * 2; 
                        offsetZ = 1 - Math.random() * 2;
                        let instance = mesh.createInstance(mesh.name + "_" + i);
                        instance.scaling = (new BABYLON.Vector3(0.1, 0.1, 0.04));
                        instance.position.x = clumpPositionX + offsetX;
                        instance.position.y = targetMesh.position.y+0.08;
                        instance.position.z = clumpPositionZ + offsetZ;
                        //instance.ignoreNonUniformScaling = true;
                        //instance.alwaysSelectAsActiveMesh = true;
                        instance.checkCollisions = false;
                        instance.freezeWorldMatrix();
                        //scene.getLightByName("spotLight").getShadowGenerator().addShadowCaster(scene.getMeshByName("Grass_Blade_"+ i));
                    }
                }
            }
            else if (mesh.name.match(/Flower_Small_Pink/g) ||  mesh.name.match(/Flower_Small_Pink_\d/g)
                ||  mesh.name.match(/Flower_Small_Red/g) ||  mesh.name.match(/Flower_Small_Red_\d/g)
                ||  mesh.name.match(/Flower_Small_Sky_Blue/g) ||  mesh.name.match(/Flower_Small_Sky_Blue_\d/g)
                ||  mesh.name.match(/Flower_Small_Yellow/g) ||  mesh.name.match(/Flower_Small_Yellow_\d/g)) {
                instanceNum = 3;
                for (var i = 0; i < instanceNum; i++) {
                    let targetMesh = scene.getMeshByName("Grass");
                    offsetX = 6 - Math.random()*12;
                    offsetZ = 6 - Math.random()*12;
                    let instance = mesh.createInstance(mesh.name + "_" + i);
                    instance.scaling = (new BABYLON.Vector3(0.1, 0.1, 0.04));
                    instance.position.x = targetMesh.position.x + offsetX;
                    instance.position.y = targetMesh.position.y+0.15;
                    instance.position.z = targetMesh.position.z + offsetZ;
                    //instance.ignoreNonUniformScaling = true;
                    //instance.alwaysSelectAsActiveMesh = true;
                    instance.checkCollisions = false;
                    instance.freezeWorldMatrix();
                    //scene.getLightByName("spotLight").getShadowGenerator().addShadowCaster(scene.getMeshByName("Grass_Blade_"+ i));
                }
            }
            
        });

        scene.getLightByName("aDirectionalLight").getShadowGenerator().getShadowMap().refreshRate = 0;


        scene.getEngine().hideLoadingUI();
        document.getElementById('renderCanvas').focus();
    });

    
    //this.showNormals(batman, null, null);

    // this show the inspector, uncomment to use it
    this.scene.debugLayer.show({
        embedMode: true
    });
    
  }

  doRender() {
    // Run the render loop.
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    
    // The canvas/window resize event handler.
    window.addEventListener('resize', () => {
        this.engine.resize();
    });
  }

}

  // createClipPlanes() {
    // scene.onBeforeRenderObservable.add(function() {
    //     scene.clipPlane4 = new BABYLON.Plane(0,0,1,-(batman.batman.position.z+10)); //right
    //     scene.clipPlane3 = new BABYLON.Plane(1,0,0,-batman.batman.position.x-5); //right
    //     scene.clipPlane2 = new BABYLON.Plane(0,1,0,-batman.batman.position.y-5); //right
    //     scene.clipPlane = new BABYLON.Plane(-1,0,0,batman.batman.position.x-5); //right
    // });
    // ground.onAfterRenderObservable.add(function() {
    //     scene.clipPlane = null;
    //     scene.clipPlane2 = null;
    //     scene.clipPlane3 = null;
    //     scene.clipPlane4 = null;
    // });

    // // GUI
      // var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
      // console.log("advTex");
      // console.log(advancedTexture);
  
      // var panel = new GUI.StackPanel();
      // panel.width = "220px";
      // panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      // panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      // advancedTexture.addControl(panel);
  
      // var slider = new GUI.Slider();
      // slider.minimum = -35;
      // slider.maximum = 30;
      // slider.value = 0;
      // slider.height = "20px";
      // slider.width = "200px";
      // slider.color = "green";
      // slider.onValueChangedObservable.add(function(value) {
      //     scene.clipPlane4 = new BABYLON.Plane(0, -1, 0, value);
      // });
      // panel.addControl(slider);   
  
      // slider = new GUI.Slider();
      // slider.minimum = -30;
      // slider.maximum = 20;
      // slider.value = -30;
      // slider.paddingTop = "10px";
      // slider.height = "30px";
      // slider.width = "200px";
      // slider.color = "green";
      // slider.onValueChangedObservable.add(function(value) {
      //     scene.clipPlane3 = new BABYLON.Plane(1, 0, 0, value);
      // });
      // panel.addControl(slider); 
  // }
//}

