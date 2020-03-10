import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import * as GUI from 'babylonjs-gui';

export default class Character {
  constructor( config ) {
    this.scene = config.scene;
    this.camera = config.camera;
    this.light = {};
    this.character = config.character;
    this.skeleton = config.skeleton;
    this.animating = false;
    this.running = false;
    this.standing = false;
    this.sitting = false;    
    // this.animation = this.scene.beginAnimation(this.skeleton, 0, 30, true, 1.0);
    // ArmatureAction = Idle, ArmatureAction.001 = Sprint, ArmatureAction.002 = Run, ArmatureAction.003 = Sit up, 
    // this.idleAnim = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction"].from, this.skeleton._ranges["ArmatureAction"].to, true, 1.0);
    // this.sprintAnim = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction.001"].from, this.skeleton._ranges["ArmatureAction.001"].to, true, 1.0);
    // this.runAnimLoop = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction.002"].from, this.skeleton._ranges["ArmatureAction.002"].to, true, 1.0);
    this.runAnimLoop = {};
    this.sitUpAnim = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction.003"].from, this.skeleton._ranges["ArmatureAction.003"].to, true, 1.0);
    // this.sitUpAnim = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction.003"].to, this.skeleton._ranges["ArmatureAction.003"].from, true, 1.0);
    this.baseSpeed = config.speed;
    this.sprintSpeed = this.baseSpeed * 2.5; 
    this.charSpeed = this.baseSpeed;
    this.jumpImpulse = new BABYLON.Vector3(0,40,0);

    this.keydown = false;
    this.angled = false;
    this.linVel;

    // initialize char's position and scaling and create the physics
    this.character.position = new BABYLON.Vector3(-10.46, 0.21, -29.63);
    this.character.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

    this.camera.target = this.character;
    this.character.physicsImpostor = new BABYLON.PhysicsImpostor(this.character, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 10, restitution: 0, friction: 0 }, this.scene);
    // this.character.physicsImpostor.setDeltaPosition(new BABYLON.Vector3(0,-0.7, 0));
    this.character.physicsImpostor.setDeltaPosition(new BABYLON.Vector3(0,-0.7, 0));
    this.character.checkCollisions = true;
    this.sitUpAnim.goToFrame(this.skeleton._ranges["ArmatureAction.003"].from+2);
    this.sitUpAnim.pause();

    // debug options
    let dustOn = true;
    let footprintOn = true;

    let jumping = false;
    let physImpArr = [];
    this.scene.meshes.forEach((mesh) => {
      console.log(mesh.name);
      if (mesh.name == "Grass" || mesh.name == "House" || mesh.name == "Pier" || mesh.name == "sand_merged") {
        mesh.checkCollisions = true;
        physImpArr.push(mesh.physicsImpostor);
      }
    });
    this.character.physicsImpostor.registerOnPhysicsCollide(physImpArr, function(main, collided) {
        jumping = false;
    });

    //create the input map and action manager to detect keyboard input
    let inputMap = {};
    let flyMode = false;
    let running = false;
    let setFootPrint = true;
    let sitting = true;
    let paused = true;

    this.scene.actionManager = new BABYLON.ActionManager(this.scene);

    // GUI
    var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
    var stackPanel = new GUI.StackPanel();
    stackPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;   
    stackPanel.isVertical = true;
    //stackPanel.alpha = 1;
    advancedTexture.addControl(stackPanel);    
    
    /* possibly use for start menu

    var label = new GUI.Rectangle("label for " );
    label.background = "white"
    label.height = "200px";
    label.alpha = 1;
    label.width = "500px";
    label.cornerRadius = 10;
    label.thickness = 2;
    label.color = '#e74004';
    label.linkOffsetY = 10;
    label.top = "-10%";
    label.zIndex = 5;
    label.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM; 
    label.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;    
    advancedTexture.addControl(label); 
    */

    var text1 = new GUI.TextBlock();
    text1.text = "Press Enter to Begin";
    text1.color = "White";
    text1.fontSize = 24;
    text1.height = "45px";
    stackPanel.addControl(text1);  

    var blink = setInterval(() => {
        text1.text = (text1.text == "Press Enter to Begin" ? "" : "Press Enter to Begin");
    }, 1000);

    // control key press actions here
    // physics logic is handled after through the input map -- might be easier to handle it all here
    this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {	
      // paused currently handles the state at the very beginning of the game before the player has control
      // should be able to handle in game pause as well -- still needs to be implemented
      if(!paused) {  
        // allow the player to sit up by using wasd
        if(sitting && evt.sourceEvent.code !== "KeyR" && evt.sourceEvent.code !== "Enter" && evt.sourceEvent.code !== "KeyP" && evt.sourceEvent.code !== "ArrowLeft" && evt.sourceEvent.code !== "ArrowDown" && evt.sourceEvent.code !== "ArrowRight" && evt.sourceEvent.code !== "ArrowUp"){        
            setTimeout(async () => {
                var sitUpAnim = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction.003"].from+2, this.skeleton._ranges["ArmatureAction.003"].to, false, 1.0);
                this.character.physicsImpostor.setDeltaPosition(new BABYLON.Vector3(0,-0.6, 0));
                await sitUpAnim.waitAsync();
                sitting = false;
                this.running = false;
                this.standing = false;
            });
        }
        else {
          // set input map value for key as true when key is pressed
          inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
          inputMap[evt.sourceEvent.code] = evt.sourceEvent.type == "keydown";             
        }	
      }
      else {
        // this should only be triggered once at the very start of the game
        // TODO: figure out how to dispose of this action to allow for enter to be used elsewhere
        if(evt.sourceEvent.code == "Enter") {
          // dispose/clear the blink and stack panel
          clearInterval(blink);
          stackPanel.dispose();
          this.scene.getCameraByName("camera1").useAutoRotationBehavior = false;

          // makeshift camera animation to rotate and focus on the player
          let iterNum = 50
          let alphaChangeAmount = ((this.camera.alpha)%(2*Math.PI) - (-Math.PI/2))/iterNum;
          let betaChangeAmount = (this.camera.beta - 1.5)/iterNum;

          // update the alpha and beta linearly every 40 ms for 2 seconds then stop and sit up and give control of the scene to the player
          var startAnim = setInterval(() => {
            this.camera.alpha -= alphaChangeAmount;
            this.camera.beta -= betaChangeAmount;
          }, 40);
          setTimeout(() => {
            clearInterval(startAnim);

            setTimeout(async () => {
              var sitUpAnim = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction.003"].from+2, this.skeleton._ranges["ArmatureAction.003"].to, false, 1.0);
              this.character.physicsImpostor.setDeltaPosition(new BABYLON.Vector3(0,-0.6, 0));
              await sitUpAnim.waitAsync();
              sitting = false;
              this.running = false;
              this.standing = false;
              this.scene.activeCamera.attachControl(document.getElementById('renderCanvas'), true);
              paused = false;
              this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0,-9.81,0));
            });
          }, 2000);
        }
      }						
    }));

    // set input map values to false on key up
    this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {								
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        inputMap[evt.sourceEvent.code] = evt.sourceEvent.type == "keydown";
    }));

    // allow the player to jump
    // TODO: finish jump anim and implement sps cloud when you hit the ground
    this.scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
          {
              trigger: BABYLON.ActionManager.OnKeyUpTrigger,
              parameter: 32
          },
          () => {
              if(!jumping){
                jumping = true;
                this.character.physicsImpostor.applyImpulse(this.jumpImpulse, this.character.position);
                  
                  // setTimeout(async () => {
                  //     var sitDownAnim = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction.003"].to, this.skeleton._ranges["ArmatureAction.003"].from+2, false, -1.0);
                  //     this.character.physicsImpostor.setDeltaPosition(new BABYLON.Vector3(0,-0.7, 0));
                  //     console.log("before sit down");
                  //     await sitDownAnim.waitAsync();
                  //     console.log("after sit down");
                  //     sitting = true;
                  // });
              }
          }
      )
    );

    // allow the player to sit up and down using r
    this.scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                parameter: 'r'
            },
            () => {
                let linVel = this.character.physicsImpostor.getLinearVelocity();
                this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, linVel.y, 0));
                if(!sitting){
                    setTimeout(async () => {
                        var sitDownAnim = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction.003"].to, this.skeleton._ranges["ArmatureAction.003"].from+2, false, -1.0);
                        this.character.physicsImpostor.setDeltaPosition(new BABYLON.Vector3(0,-0.7, 0));
                        await sitDownAnim.waitAsync();
                        sitting = true;
                    });
                }
                else {
                    setTimeout(async () => {
                        var sitUpAnim = this.scene.beginAnimation(this.skeleton, this.skeleton._ranges["ArmatureAction.003"].from+2, this.skeleton._ranges["ArmatureAction.003"].to, false, 1.0);
                        this.character.physicsImpostor.setDeltaPosition(new BABYLON.Vector3(0,-0.6, 0));
                        await sitUpAnim.waitAsync();
                        sitting = false;
                        this.running = false;
                        this.standing = false;
                    });
                }
            }
        )
    );

    // allow fly mode to be turned on with u
    this.scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
          {
              trigger: BABYLON.ActionManager.OnKeyUpTrigger,
              parameter: 'u'
          },
          () => {
              if (flyMode) {
                  console.log("fly mode off");
                  this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0,-9.81,0));
                  flyMode = false;
              }
              else {
                  console.log("fly mode on");
                  this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0,0,0));
                  flyMode = true;
              } 
          }
      )
    );

    // console log whatever debugging info needed with p
    this.scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                parameter: 'p'
            },
            () => {
                console.log("\n \nPressed P\n \n");
                console.log("this.character\n");
                console.log(this.character);
                console.log("camera\n");
                console.log(this.camera);
                console.log("scene\n");
                console.log(this.scene);
                console.log("position" + "\n" + this.character.position + "\n");
                console.log("rotation" + "\n" + this.character.rotation + "\n");
            }
        )
    );


    if(dustOn) {

    // ray trace goes here if used
    var SPS = new BABYLON.SolidParticleSystem("SPS", this.scene);
    let boxSize = 0.1;
    var dust = BABYLON.MeshBuilder.CreateBox("dust", {size: boxSize},this.scene);
    SPS.addShape(dust, 5); // 20 spheres
    dust.dispose();

    var dustEmit = SPS.buildMesh();
    dustEmit.position = this.character.position;
    var dustMaterial = new BABYLON.StandardMaterial("dust", this.scene);
    dustMaterial.disableLighting = true;
    dustMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    dustEmit.material = dustMaterial;
    //dustEmit.material.freeze();
    //dustEmit.position.y -= 0.07;

    SPS.computeParticleRotation = false; // prevents from computing particle.rotation
    SPS.computeParticleTexture = false; // prevents from computing particle.uvs
    SPS.computeParticleColor = false; // prevents from computing particle.color
    SPS.computeParticleVertex = false; // prevents from calling the custom updateParticleVertex() function

      // SPS behavior definition
    var speed = 0.05;
    var gravity = -0.01;
    let char = this.character;

    // init
    SPS.initParticles = function() {
      // just recycle everything
      for (var p = 0; p < this.nbParticles; p++) {
          this.recycleParticle(this.particles[p]);
      }
    };

    // recycle
    SPS.recycleParticle = function(particle) {
      // Set particle new velocity, scale and rotation

      //particle.isVisible = false;
      particle.position.x = 0;
      particle.position.y = 0;
      particle.position.z = 0;
      let linVel = char.physicsImpostor.getLinearVelocity();
      //.velocity.x = (Math.random()*0.2 - 0.1) * speed;
      if (linVel.x >= -0.5 && linVel.x <= 0.5) {
        particle.velocity.x = (Math.random() * speed/2 - (speed/4));
      }
      else {
        particle.velocity.x = ((-linVel.x/3) * speed) + ((((-linVel.x/3) * speed)/1.5) - 2*(((-linVel.x/3) * speed)/1.5)*Math.random()); // shoot paticles directly behind with a variance of +- 10%
      }
      //console.log(particle.velocity.x);
      particle.velocity.y = Math.random() * speed;
      //particle.velocity.z = (Math.random()*0.3) * speed;
      if (linVel.z >= -0.5 && linVel.z <= 0.5) {
        particle.velocity.z = (Math.random() * speed/2 - (speed/4));
      }
      else {
        particle.velocity.z = ((-linVel.z/3) * speed) + ((((-linVel.z/3) * speed)/1.5) - 2*(((-linVel.z/3) * speed)/1.5)*Math.random()); // shoot paticles directly behind with a variance of +- 10%
      }
      var scale = (Math.random()*0.2 - 0.1) + 0.25;
      particle.scale.x = scale;
      particle.scale.y = scale;
      particle.scale.z = scale;

      particle.color.a = 1;
    };

    // update : will be called by setParticles()
    SPS.updateParticle = function(particle) {  
      //console.log(particle.color.a);
      // some physics here 
      if (running) {
        particle.isVisible = true;
        if (particle.position.y < -0.15) {
          //console.log("recycle particle");
          this.recycleParticle(particle);
        }
        else {
          particle.velocity.y += gravity;                         // apply gravity to y
          (particle.position).addInPlace(particle.velocity);      // update particle new position
          particle.position.y += speed / 2;
        }
      }
      // if youre not running then freeze the particles and scale them down to nothing
      else {
        if (particle.position.y < -0.15) {
          particle.velocity.x = 0;
          particle.velocity.y = 0;
          particle.velocity.z = 0;
          (particle.position).addInPlace(particle.velocity);  
          particle.isVisible = false;
        }
        else {
          particle.velocity.y += gravity;                         // apply gravity to y
          (particle.position).addInPlace(particle.velocity);      // update particle new position
          particle.position.y += speed / 2;
        }
      }

      // intersection
      // if (bboxesComputed && particle.intersectsMesh(sphere)) {
      //   particle.position.addToRef(mesh.position, tmpPos);                  // particle World position
      //   tmpPos.subtractToRef(sphere.position, tmpNormal);                   // normal to the sphere
      //   tmpNormal.normalize();                                              // normalize the sphere normal
      //   tmpDot = BABYLON.Vector3.Dot(particle.velocity, tmpNormal);            // dot product (velocity, normal)
      //   // bounce result computation
      //   particle.velocity.x = -particle.velocity.x + 2.0 * tmpDot * tmpNormal.x;
      //   particle.velocity.y = -particle.velocity.y + 2.0 * tmpDot * tmpNormal.y;
      //   particle.velocity.z = -particle.velocity.z + 2.0 * tmpDot * tmpNormal.z;
      //   particle.velocity.scaleInPlace(restitution);                      // aply restitution
      //   particle.rotation.x *= -1.0;
      //   particle.rotation.y *= -1.0;
      //   particle.rotation.z *= -1.0;
      // }
    };

    // init all particle values and set them once to apply textures, colors, etc
    SPS.initParticles();
    SPS.setParticles();

    } // end is dustOn

    //if(footprintOn) {


    
    // create a plane to act as a footprint when walking on sand and dirt
    let footPrint = BABYLON.Mesh.CreatePlane('footPrint', 0.19, this.scene);
    footPrint.scaling.x = 0.69;
    footPrint.rotation.x = Math.PI/2;
    footPrint.position.y += 1;
    footPrint.visibility = 0.45;
    let footPrintMaterial = new BABYLON.StandardMaterial('footPrint', this.scene);
    footPrintMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);
    footPrintMaterial.alpha = 1;
    footPrintMaterial.disableLighting = true;
    footPrint.material = footPrintMaterial;

    footPrint.setEnabled(false);
    

    //}

    let footPrintArr = [];
    
    // Check for movement input every frame before it is rendered
    this.scene.onBeforeRenderObservable.add(()=>{
      
      this.character.rotationQuaternion = null;
      this.keydown = false;
      this.angled = false;
      this.charSpeed = this.baseSpeed;
      let linVel = this.character.physicsImpostor.getLinearVelocity();
      if (inputMap["Shift"]) { 
        this.charSpeed = this.sprintSpeed;
      }

      if(inputMap["KeyW"] && inputMap["KeyA"] ){ 
        this.character.rotation = new BABYLON.Vector3(0, ((-this.camera.alpha)%(2*Math.PI))+(Math.PI/4), 0);
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(this.charSpeed * -Math.sin(this.character.rotation.y), linVel.y, this.charSpeed * -Math.cos(this.character.rotation.y)));
        this.keydown=true;
        this.angled = true;
      } 
      if(inputMap["KeyW"] && inputMap["KeyD"] ){ 
        this.character.rotation = new BABYLON.Vector3(0, ((-this.camera.alpha)%(2*Math.PI))+(3*Math.PI/4), 0);
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(this.charSpeed * -Math.sin(this.character.rotation.y), linVel.y, this.charSpeed * -Math.cos(this.character.rotation.y)));
        this.keydown=true;
        this.angled = true;
      } 
      if(inputMap["KeyS"] && inputMap["KeyA"] ){ 
        this.character.rotation = new BABYLON.Vector3(0, ((-this.camera.alpha)%(2*Math.PI))+(7*Math.PI/4), 0);
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(this.charSpeed * -Math.sin(this.character.rotation.y), linVel.y, this.charSpeed * -Math.cos(this.character.rotation.y)));
        this.keydown=true;
        this.angled = true;
      } 
      if(inputMap["KeyS"] && inputMap["KeyD"] ){ 
        this.character.rotation = new BABYLON.Vector3(0, ((-this.camera.alpha)%(2*Math.PI))+(5*Math.PI/4), 0);
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(this.charSpeed * -Math.sin(this.character.rotation.y), linVel.y, this.charSpeed * -Math.cos(this.character.rotation.y)));
        this.keydown=true;
        this.angled = true;
      } 
      if(inputMap["KeyW"] && !this.angled){ 
        this.character.rotation = new BABYLON.Vector3(0, ((-this.camera.alpha)%(2*Math.PI))+(Math.PI/2), 0);
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(this.charSpeed * -Math.sin(this.character.rotation.y), linVel.y, this.charSpeed * -Math.cos(this.character.rotation.y)));
        this.keydown=true;
      } 
      if(inputMap["KeyA"] && !this.angled){ 
        this.character.rotation = new BABYLON.Vector3(0, ((-this.camera.alpha)%(2*Math.PI)), 0);
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(this.charSpeed * -Math.sin(this.character.rotation.y), linVel.y, this.charSpeed * -Math.cos(this.character.rotation.y)));
        this.keydown=true;
      } 
      if(inputMap["KeyS"] && !this.angled){ 
        this.character.rotation = new BABYLON.Vector3(0, ((-this.camera.alpha)%(2*Math.PI))+(3*Math.PI/2), 0);
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(this.charSpeed * -Math.sin(this.character.rotation.y), linVel.y, this.charSpeed * -Math.cos(this.character.rotation.y)));
        this.keydown=true;
      } 
      if(inputMap["KeyD"] && !this.angled){ 
        this.character.rotation = new BABYLON.Vector3(0, ((-this.camera.alpha)%(2*Math.PI))+(2*Math.PI/2), 0);
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(this.charSpeed * -Math.sin(this.character.rotation.y), linVel.y, this.charSpeed * -Math.cos(this.character.rotation.y)));
        this.keydown=true;
      }
      if(inputMap["KeyI"]){ 
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(linVel.x, this.charSpeed, linVel.z));
        this.keydown=true;
      }
      if(inputMap["KeyO"]){ 
        this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(linVel.x, -this.charSpeed, linVel.z));
        this.keydown=true;
      }

      if(!sitting) {
        if(this.keydown){

            if(!this.running){ 
              this.running = true;
              this.standing = false;
              var runAnimStart = this.scene.beginAnimation(this.skeleton, 80, 86, false, 1.1);
              

              this. runAnimLoop = this.scene.beginAnimation(this.skeleton, 86, 98, true, 1.1);
              

            }
            else if(this.running) {

              if(footprintOn) {

              let currentFrame = this.runAnimLoop.getAnimations()[0].currentFrame;

              if (setFootPrint) {
                setFootPrint = false;
                if((currentFrame >= 86 && currentFrame <= 87) || (currentFrame >= 91.5 && currentFrame <= 92.5)) {
                  let left = ((currentFrame >= 86 && currentFrame <= 87) ? true : false);
                  let offsetX = (left == true ? (-Math.sin(this.character.rotation.y-Math.PI/2) * 0.1) : (-Math.sin(this.character.rotation.y+Math.PI/2) * 0.1));
                  let offsetZ = (left == true ? (-Math.cos(this.character.rotation.y-Math.PI/2) * 0.1) : (-Math.cos(this.character.rotation.y+Math.PI/2) * 0.1));
                  if (footPrintArr.length==20) {
                    footPrintArr[19].dispose();
                    footPrintArr.pop();
                  }
                  let clone = footPrint.clone(footPrint.name + "_" + footPrintArr.length, null, false, false);
                  clone.position = new BABYLON.Vector3(this.character.position.x+offsetX, this.character.position.y - 0.09, this.character.position.z+offsetZ);
                  clone.rotation.y = this.character.rotation.y;
                  clone.freezeWorldMatrix();
                  footPrintArr.unshift(clone);
                }
              }
              setTimeout(() =>{
                setFootPrint = true;
              }, 90); 

              }//end footprint on

            } // end the footprint clone creation
          }
          else{
            if (!this.standing) { 
                this.running = false;
                this.standing = true;
                this.scene.beginAnimation(this.skeleton, 4, 29, true); 
            }  
            if (flyMode) {
                this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
            }
            else {
                this.character.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, linVel.y, 0));
            }
          }
      } // end if !sitting

      // these are called every frame so handle things like fading the footprints
      // and emitting particles

      if(footprintOn) {


      if(footPrintArr.length>0) {
        footPrintArr.forEach((mesh, index) => {

          if(index < 9) {
            mesh.visibility -= 0.0005;
          }
          else {
            mesh.visibility -= 0.0015;
          }
          if (mesh.visibility <= 0) {
            mesh.dispose();
            footPrintArr.pop();
            //console.log(footPrintArr);
          }
        })
      }

      }

      if(dustOn) {

      running = this.running
      if(running) {
        dustEmit.unfreezeWorldMatrix();
        dustEmit._unFreeze();
        //dustEmit.material.unFreeze();
        let dustOffsetX = -Math.sin(this.character.rotation.y+Math.PI) * 0.2;
        let dustOffsetZ = -Math.cos(this.character.rotation.y+Math.PI) * 0.2;
        dustEmit.position = new BABYLON.Vector3(this.character.position.x+dustOffsetX, this.character.position.y, this.character.position.z+dustOffsetZ);
        SPS.setParticles();
      }
      else {
        dustEmit.freezeWorldMatrix();
        dustEmit._freeze();
        // dustEmit.material.freeze();
        //console.log(dustEmit);
        let dustOffsetX = -Math.sin(this.character.rotation.y+Math.PI) * 0.2;
        let dustOffsetZ = -Math.cos(this.character.rotation.y+Math.PI) * 0.2;
        dustEmit.position = new BABYLON.Vector3(this.character.position.x+dustOffsetX, this.character.position.y, this.character.position.z+dustOffsetZ);
        SPS.setParticles();
      }

      }

    }); // end on before render

  }// end of the constructor

  

  rayTrace() {
    // use to store the results of the ray trace
    var testhit;
    var hitmesh;

    // var tempGround = this.scene.getMeshByName("tempGround");
    // var tempFront = this.scene.getMeshByName("tempFront");
    // var tempCeiling = this.scene.getMeshByName("tempCeiling");

    var tempGround = BABYLON.MeshBuilder.CreateBox("tempGround",{ width: 0.5, height: 0.5, depth: 0.5 }, this.scene);
    tempGround.physicsImpostor = new BABYLON.PhysicsImpostor(
      tempGround,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0, friction: 1 },
      this.scene
    );     
    var tempFront = BABYLON.MeshBuilder.CreateBox("tempFront",{ width: 0.5, height: 0.5, depth: 0.5 }, this.scene);  
    tempFront.physicsImpostor = new BABYLON.PhysicsImpostor(
      tempFront,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0, friction: 1 },
      this.scene
    );   
    var tempCeiling = BABYLON.MeshBuilder.CreateBox("tempCeiling",{ width: 0.5, height: 0.5, depth: 0.5 }, this.scene); 
    tempCeiling.physicsImpostor = new BABYLON.PhysicsImpostor(
      tempCeiling,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0, friction: 1 },
      this.scene
    ); 
    
    var offsetX;
    var offsetY;
    var offsetZ;

    function vecToLocal(vector, mesh){
      var m = mesh.getWorldMatrix();
      var v = BABYLON.Vector3.TransformCoordinates(vector, m);
      return v;		 
    }
    function checkRay(x, y, z, type, batman) {
      // if (testhit != null && type == "front") {
      //   console.log("prevPos");
      //   console.log(prevPos);
      //   prevPos = testhit.pickedPoint;
      // }
      if (type == "front") {
        var origin = new BABYLON.Vector3(batman.position.x, batman.position.y+0.3, batman.position.z);
      }
      else {
        var origin = batman.position;
      }
      var vec = new BABYLON.Vector3(x,y,z);
      vec = vecToLocal(vec, batman);
      // console.log("vectolocal");
      // console.log(vec);
  
      var direction = vec.subtract(origin);
      direction = BABYLON.Vector3.Normalize(direction);

      var length = 3;
  
      var ray = new BABYLON.Ray(origin, direction, length);

      function predicate(mesh){
        if (mesh == batman || mesh == ray){ //|| mesh == ground1 || mesh == ground2 || mesh == tempGround
            return false;
        }
        return true;
      }

      testhit = batman._scene.pickWithRay(ray, predicate);
      // if (type == "front") {
      //   console.log("currPos");
      //   console.log(currPos);
      //   currPos = testhit.pickedPoint;
      // }
      hitmesh = testhit.pickedMesh;
      // uncomment below for ray trace debug
      // var rayHelp = new BABYLON.RayHelper(ray);
      // rayHelp.show(batman._scene);
      if (testhit.hit == true && hitmesh.name != "tempGround" && hitmesh.name != "tempFront" && hitmesh.name != "tempCeiling" && hitmesh.name != "ray") {
        if (type == "ground") {
          tempGround.position = new BABYLON.Vector3(batman.position.x, testhit.pickedPoint.y-0.25, batman.position.z);
          batman.physicsImpostor.registerOnPhysicsCollide(tempGround.physicsImpostor, function(main, collided) {
              jumping = false;
          });
        }
        if (type == "front") {
          // var rayHelp = new BABYLON.RayHelper(ray);
          // rayHelp.show(batman._scene);
          //rayHelp.show(batman._scene);
          // console.log("front test hit true");
          // console.log("mesh that was hit");
          // console.log(hitmesh.name);
          tempFront.scaling = new BABYLON.Vector3(1, 1, 1);
          tempFront.physicsImpostor.setScalingUpdated();
          var posX = -Math.sin(batman.rotation.z) * testhit.distance;
          var posZ = -Math.cos(batman.rotation.z) * testhit.distance;
          var incAng = (Math.atan(posZ/posX)*180)/Math.PI;
          if (testhit.distance - Math.abs(posX) <= testhit.distance - Math.abs(posZ)) { // if true, then we are looking at the object from the left or right and must set the x offset and remove the z offset
            if (posX >= 0) {
              offsetX = 0.25;
            }
            else if (posX < 0) {
              offsetX = -0.25;
            }
            if (incAng<45 && incAng>-45) { // range from -45 to +45 
              if (posZ >= 0) {
                offsetZ = 0.25;
              }
              else if (posZ < 0) {
                offsetZ = -0.25;
              }
            }
            else {
              offsetZ = 0;
            } 
          }
          else if (testhit.distance - Math.abs(posX) > testhit.distance - Math.abs(posZ)) { // if true, then we are looking at the object from the left or right and must set the x offset and remove the z offset
            if (posZ >= 0) {
              offsetZ = 0.25;
            }
            else if (posZ < 0) {
              offsetZ = -0.25;
            }
            if ((incAng>45 && incAng<90) || (incAng<-45 && incAng>-90)) { // range from -45 to -90 and +45 to +90
              if (posX >= 0) {
                offsetX = 0.25;
              }
              else if (posX < 0) {
                offsetX = -0.25;
              }
            }
            else {
              offsetX = 0;
            } 
          }
        tempFront.position = new BABYLON.Vector3(posX + batman.position.x + offsetX, batman.position.y+0.1, posZ + batman.position.z + offsetZ); //this.character.position.y - testhit.distance  testhit.pickedPoint.x+offsetX, testhit.pickedPoint.y+.1, testhit.pickedPoint.z+offsetZ
        }
        if (type == "ceiling") {
            tempCeiling.position = new BABYLON.Vector3(testhit.pickedPoint.x, testhit.pickedPoint.y+0.25, testhit.pickedPoint.z); //this.character.position.y - testhit.distance
        }
      } // end if (testhit == true)
      else {
        if (type == "front") {
          // var rayHelp = new BABYLON.RayHelper(ray);
          // rayHelp.show(batman._scene);
          //rayHelp.show(batman._scene);
          //console.log("about to scale");
          tempFront.scaling = new BABYLON.Vector3(0.3, 1, 0.3);
          tempFront.physicsImpostor.setScalingUpdated();
          //tempFront.position = new BABYLON.Vector3(this.character.position.x, this.character.position.y+3, this.character.position.z); 
        }
        else if (type == "ceiling") {
          tempCeiling.position = new BABYLON.Vector3(batman.position.x, batman.position.y+3, batman.position.z); 
        }
      }
    }//end of checkRay()

    this.scene.onBeforeRenderObservable.add(()=> {
      checkRay(0,0,-1, "ground", this.character);
      checkRay(0,13,0, "front", this.character);
      checkRay(0,0,1, "ceiling", this.character);
    });
  }
}
