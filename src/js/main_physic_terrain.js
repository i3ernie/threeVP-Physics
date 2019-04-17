var root = '';
require.config({
    
    "paths": {
       
        "img"           : "../img",
        "style"         : "css",

        "es6"           :"vendor/requirejs/es6",
        "babel"         :"vendor/requirejs/babel.min",

        "ammo"          :"vendor/ammo/ammo",

        "Mirror"      :"vendor/threejs/extras/Mirror",
        "plugin"      :"plugins/plugin",

        "physics"       : "extras/physics",
        "PhysicWorld"   : "extras/physics/PhysicWorld"
    }
});

require(["./apps/app_terrain", "async"], function ( APP, async ) {

    let myApp = new APP();
    
    async.series([
        myApp.init,
        myApp.start
    ], function( err, res ){
        if ( err ) { console.log( err ); }
    } );
});