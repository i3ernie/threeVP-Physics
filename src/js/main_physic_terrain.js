var root = '';
require.config({
    
    "paths": {
       
        "me"            : "../examples/PhysicLight",
       
        "img"           : "../img",
        "style"         : "css",

        "es6"           :"vendor/requirejs/es6",
        "babel"         :"vendor/requirejs/babel.min",
      
        "ammo"          :"vendor/ammo/ammo",
      
        "Mirror"      :"vendor/threejs/extras/Mirror",
        "plugin"      :"plugins/plugin",

        "PhysicWorld" : "extras/PhysicWorld"
    }
});

require(["./apps/physic_terrain/app"], function ( APP ) {

    let myApp = new APP();
    myApp.init();
    myApp.start();

});