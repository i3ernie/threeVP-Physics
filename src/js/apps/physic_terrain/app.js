/**
 * Created by i3ernie on 27.10.15.
 */
define(["three", "lodash", "globals", "Viewport", "PhysicWorld", 
    "SkyBox", "lights/Sunlight", "stuff/Terrain", 
     "extras/objects/RandomObject"],
function (THREE, _, GLOBALS, Viewport, PhysicWorld,
              SkyBox, Sunlight, Floor, RandomObject)
{
    let VP, PW;
   
    var options;    
   
    let time = 0;
    var maxNumObjects = 30;
    var objectTimePeriod = 2;
    let objectSize = 3;
    
    let hemiLight;
    
    let defaults = {
        imagePath       : "../../img/",
        shadow          : true,
        exposure        : 0.68,
        terrainWidth    : 128,
        terrainDepth    : 128,
        terrainMaxHeight : 10
    };
    
    var timeNextSpawn = time + objectTimePeriod;
 

    var APP = function()
    {
        this.init = function( opt )
        {
            VP = GLOBALS.VP = new Viewport();
            PW = new PhysicWorld( VP );
            
            options = _.extend({}, defaults, opt);
        };

        this.start = function()
        {            
            //camera
            VP.camera.position.set( -60, 50, -60 );
            VP.camera.lookAt( new THREE.Vector3( 0, 1, 0 ) );


            //SkyBox
            VP.scene.add( new SkyBox( options ) );

            // directional light
            let dir_light = new Sunlight( {size : 15 , debug : false} );
            dir_light.position.set( 30, 40, -5 );
            dir_light.target.position.copy( VP.scene.position );
            VP.scene.add( dir_light );

            hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.02 );
            VP.scene.add( hemiLight );
         				
            // floor
            let floorMesh = new Floor( {width : options.terrainWidth, depth : options.terrainDepth} );
            floorMesh.position.set( 0, -5, 0 );

            PW.floorAddPhysic( floorMesh );
            VP.scene.add( floorMesh );

            VP.loop.add( function( delta ){ 
               
            	if ( PW.dynamicObjects.length < maxNumObjects && time > timeNextSpawn ) {
                    generateObject();
            		timeNextSpawn = time + objectTimePeriod;
            	}               
                time += delta;
            });
            
            VP.start();
        };
        
        function generateObject() 
        {
            let threeObject = new RandomObject({ objectSize : objectSize });             
            threeObject.position.set( ( Math.random() - 0.5 ) * options.terrainWidth * 0.6, options.terrainMaxHeight + objectSize + 2, ( Math.random() - 0.5 ) * options.terrainDepth * 0.6 );

            PW.primitivAddPhysic( threeObject );
            VP.scene.add( threeObject );
        }
    };
    return APP;
});