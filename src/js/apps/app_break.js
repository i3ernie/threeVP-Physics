/**
 * Created by bernie on 27.10.15.
 */
define(["three", "lodash", "globals", "cmd", "Viewport", "PhysicWorld", "extras/FragilWorld",
    "SkyBox", "lights/Sunlight", "stuff/Terrain", "stuff/Floor", "stuff/Catapult",
     "extras/objects/RandomObject", "require"],
function (THREE, _, GLOBALS, CMD, Viewport, PhysicWorld, FragilWorld,
              SkyBox, Sunlight, Terrain, Floor, Catapult, RandomObject, require)
{
    var VP, PW;
    var options;
    
    let terrainMaxHeight = 10;
   
    let catapult;
    
    let defaults = {
        "conf" : "conf_break",
        
        "imagePath" : "../../img/",
        "shadow" : true,

        "objectSize"    : 3,
        "maxNumObjects" : 30,
        
        "terrainWidth" : 128,
        "terrainDepth" : 128
    };
   
    let time = 0;
    let objectTimePeriod = 2;
    let timeNextSpawn = time + objectTimePeriod;
    
    let hemiLight;
 

    var APP = function( opt )
    { 
        options = _.extend( {}, defaults, opt );

        this.init = function( done )
        {
            VP = GLOBALS.VP = new Viewport();
            PW = new PhysicWorld( VP );
            PW.addPlugin( FragilWorld );

            require( ["json!conf/" + options.conf+".json"], function( obj ){
                options = _.extend( options, obj);
                if ( typeof done === "function" ) done( null, this );
            } );
        };

        this.start = function( done )
        {  
            //camera
            VP.camera.position.set( -60, 50, -60 );
            VP.camera.lookAt( new THREE.Vector3( 0, 1, 0 ) );


            //SkyBox
            VP.scene.add( new SkyBox( options ) );


            // directional light
            let dir_light = new Sunlight( {size : 15 , debug:false} );
            dir_light.position.set( 30, 40, -5 );
            dir_light.target.position.copy( VP.scene.position );
            VP.scene.add( dir_light );

            hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.02 );
            VP.scene.add( hemiLight );
         			
				
            //floor
            let floorMesh = new Terrain( {width : options.terrainWidth, depth : options.terrainDepth} );
            floorMesh.position.set( 0, -5, 0 );
            
            PW.floorAddPhysic( floorMesh );
            VP.scene.add( floorMesh );
            
            let floor = new THREE.Mesh( new THREE.BoxGeometry(35, 1, 35) ); // new Floor({width:35, depth:30});
            floor.position.set( 0, 4, 0 );
            //floor.userData.breakable = true;
            PW.primitivAddPhysic( floor, {mass:0} );

            VP.scene.add( floor );
            
            catapult = new Catapult( VP, PW );
            
            
            let material = new THREE.MeshPhongMaterial( { color: 0x303060 } );
            
            //Tower
            let t1 = new THREE.Mesh( new THREE.BoxGeometry( 4, 10, 4 ), material );
            t1.position.set( 0, 9.5, 10 );
            t1.userData.breakable = true;
            
            PW.primitivAddPhysic( t1 );
            
            VP.scene.add( t1 );
            
            
            //Tower2
            let t2 = new THREE.Mesh( new THREE.BoxGeometry( 4, 10, 4 ), material );
            t2.position.set( 10, 9.5, 0 );
            t2.userData.breakable = true;
            
            PW.primitivAddPhysic( t2 );
            
            VP.scene.add( t2 );

            VP.loop.add( function( delta )
            {    
            	if ( PW.dynamicObjects.length < options.maxNumObjects && time > timeNextSpawn ) {
                    generateObject();
            		timeNextSpawn = time + objectTimePeriod;
            	}               
                time += delta;
            });

            VP.start();
            if ( typeof done === "function" ) done( null, this );
        };

        function generateObject() 
        {            		
            let threeObject = new RandomObject({ objectSize : options.objectSize });             
            threeObject.position.set( ( Math.random() - 0.5 ) * options.terrainWidth * 0.6, terrainMaxHeight + options.objectSize + 2, ( Math.random() - 0.5 ) * options.terrainDepth * 0.6 );

            PW.primitivAddPhysic( threeObject );
            VP.scene.add( threeObject );
        }
    };
    
    return APP;
});