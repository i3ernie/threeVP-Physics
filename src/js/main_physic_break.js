var root = '';

require.config({
    
    "paths": {
       
        "me"            : "../examples/PhysicLight",
       
        "img"           : "../img",
        "style"         : "css",

      
        "ammo"          :"vendor/ammo/ammo",
      
        "Mirror"      :"vendor/threejs/extras/Mirror",

        "plugin"        :"plugins/plugin",

        "PhysicWorld" : "extras/PhysicWorld"
    }
});

require(["./apps/physic_break/app"], function ( APP ) {

    var myApp = new APP();
     myApp.init();
     myApp.start();

});