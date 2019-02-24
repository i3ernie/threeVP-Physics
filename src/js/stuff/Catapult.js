/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["lodash", "three", "ammo"], function(_, THREE, Ammo){
    var defaults = {
        shadow : true,
        autoLoad : true,
        
        ballMass : 35,
        ballRadius : 0.4
    };
    
    var catapult = function( VP, PW, opt)
    {
        if ( opt && opt.load ) this.load = opt.load;
        let scope = this;

        this.options = _.extend( {}, defaults, opt );

        this.bullet = this.load();

        VP.DomEvents.addEventListener( VP.scene, "click", function( obj ) 
        {
            let ray = VP.raycaster.getRay( obj.origDomEvent );
            let pos = new THREE.Vector3();
            let quat = new THREE.Quaternion();

            let ball = scope.bullet;

            pos.copy( ray.direction );
            pos.add( ray.origin );
            quat.set( 0, 0, 0, 1 );

            ball.position.copy( pos );
            ball.quaternion.copy( quat ); 

            pos.copy( ray.direction );
            pos.multiplyScalar( 24 );
            PW.primitivAddPhysic( ball, {mass : scope.options.ballMass, velocity : pos} );

            VP.scene.add( ball );
            
            if( scope.options.autoLoad ) scope.bullet = scope.load();
        });
    };
    
    catapult.prototype.load = function()
    {
        let ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020 } );
        let ball = new THREE.Mesh( new THREE.SphereGeometry( this.options.ballRadius, 14, 10 ), ballMaterial );
        
        ball.castShadow     = this.options.shadow;
        ball.receiveShadow  = this.options.shadow;
        
        return ball;
    };
    
    return catapult;
});

