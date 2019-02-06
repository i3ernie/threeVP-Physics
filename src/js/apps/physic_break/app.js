/**
 * Created by bernie on 27.10.15.
 */
define(["three", "lodash", "globals", "cmd", "Viewport", "PhysicWorld", "extras/FragilWorld",
    "SkyBox", "lights/Sunlight", "stuff/Terrain", "stuff/Floor", "stuff/Catapult",
     "extras/objects/RandomObject", "ammo"],
function (THREE, _, GLOBALS, CMD, Viewport, PhysicWorld, FragilWorld,
              SkyBox, Sunlight, Terrain, Floor, Catapult, RandomObject, Ammo)
{
    var VP, PW;
    var options;
    var terrainWidth = 128;
    var terrainDepth = 128;
    var terrainMaxHeight = 10;
   
    var catapult;
    
    var defaults = {
        imagePath : "../../img/",
        shadow : true
    };
    		
   
    let time = 0;
    var maxNumObjects = 30;
    var objectTimePeriod = 2;
    var timeNextSpawn = time + objectTimePeriod;
    
    var hemiLight, object, loader;
 

    var APP = function()
    {
        this.init = function()
        {
            VP = GLOBALS.VP = new Viewport();
            PW = new PhysicWorld( VP );
            PW.addPlugin( "Fragil", FragilWorld );
            
            options = _.extend({}, defaults);
        };

        this.start = function()
        {  
            
            //camera
            VP.camera.position.set( -60, 50, -60 );
            VP.camera.lookAt( new THREE.Vector3( 0, 1, 0 ) );


            //SkyBox
            var skybox = new SkyBox( options );
            VP.scene.add( skybox );


            // directional light
            var dir_light = new Sunlight( {size : 15 , debug:false} );
            dir_light.position.set( 30, 40, -5 );
            dir_light.target.position.copy( VP.scene.position );
            VP.scene.add( dir_light );

            hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.02 );
            VP.scene.add( hemiLight );
         			
				
            //floor
            var floorMesh = new Terrain( {width : 128, depth : 128} );
            floorMesh.position.set( 0, -5, 0 );

            floorMesh.userData.physicsBody = new PhysicWorld.PhysicFloor( floorMesh );
            VP.scene.add( floorMesh );
            PW.add( floorMesh );
            
            var floor = new THREE.Mesh( new THREE.BoxGeometry(35,1,35) ); // new Floor({width:35, depth:30});
            floor.position.set(0,4,0);
            PW.primitivAddPhysic( floor, {mass:0} );

            VP.scene.add( floor );
            
            
            catapult = new Catapult( VP, PW );
            
            
            var material = new THREE.MeshPhongMaterial( { color: 0x202020 } );
            
            //Tower
            var t1 = new THREE.Mesh( new THREE.BoxGeometry( 4, 10, 4 ), material );
            t1.position.set( 0, 10, 0 );
            t1.userData.breakable = true;
            
            PW.primitivAddPhysic( t1 );
            
            VP.scene.add( t1 );
            
            
            //Tower2
            var t2 = new THREE.Mesh( new THREE.BoxGeometry( 4, 10, 4 ), material );
            t2.position.set( 10, 10, 0 );
            t2.userData.breakable = true;
            
            PW.primitivAddPhysic( t2 );
            
            VP.scene.add( t2 );

            
            VP.loop.add( function( delta ){ 
               
            	if ( PW.dynamicObjects.length < maxNumObjects && time > timeNextSpawn ) {
                    generateObject();
            		timeNextSpawn = time + objectTimePeriod;
            	}               
                time += delta;
            });
            //VP.loop.add( FW.updatePhysics );


            function generateObject() 
            {            		
            	var objectSize = 3;

                var threeObject = new RandomObject({ objectSize : objectSize });             
                threeObject.position.set( ( Math.random() - 0.5 ) * terrainWidth * 0.6, terrainMaxHeight + objectSize + 2, ( Math.random() - 0.5 ) * terrainDepth * 0.6 );
                
                PW.primitivAddPhysic( threeObject );
                VP.scene.add( threeObject );
            }
            
            VP.start();
        };
    };
    
    
    return APP;
});