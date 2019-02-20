var root = '';

require.config({
    
    "paths": {
       
        "me"            : "../examples/PhysicLight",
        "conf"          : "../conf",
       
        "img"           : "../img",
        "style"         : "css",

      
        "ammo"          :"vendor/ammo/ammo",
      
        "Mirror"      :"vendor/threejs/extras/Mirror",

        "plugin"        :"plugins/plugin",

        "PhysicWorld" : "extras/PhysicWorld"
    }
});

require(["./apps/app_break", "async"], function ( APP, async ) {

    var myApp = new APP();
    async.series([
        myApp.init,
        myApp.start
    ], function( err, res ){
        if ( err ) { console.log( err ); }
    }); 

});