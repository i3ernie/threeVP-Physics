/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["lodash", "ammo", "three", "extras/PhysicTerrain", "physics/PhysicsBody"], function( _, Ammo, THREE, PhysicTerrain, PhysicsBody ){
    
    let defaults = {
        gravity : [0, -6, 0]
    };
    let transformAux1 = new Ammo.btTransform();
    
    let PhysicWorld = function( VP, opt )
    {    
        this.VP = VP;
        this.plugins = {};
        this.options = _.extend({}, defaults, opt);

        let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration();
        let broadphase              = new Ammo.btDbvtBroadphase();
        let solver                  = new Ammo.btSequentialImpulseConstraintSolver();
        
        this.dispatcher     = new Ammo.btCollisionDispatcher( collisionConfiguration );
        this.world          = new Ammo.btDiscreteDynamicsWorld( this.dispatcher, broadphase, solver, collisionConfiguration );
        this.world.setGravity( new Ammo.btVector3( this.options.gravity[0], this.options.gravity[1], this.options.gravity[2] ) ); 
        this.dynamicObjects = [];
        
        VP.loop.add( this.updatePhysics.bind(this) );
    };
    
    PhysicWorld.prototype.calcVolume = function( geometry ){
        if ( typeof geometry !== "object" ) { 
            return 0; 
        }
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        
        let sBox = geometry.boundingBox.getSize();
        let rSphere = geometry.boundingSphere.radius;
        
        let volumeBox = sBox.x * sBox.y * sBox.z;
        let volumeSphere = (4/3) * Math.PI * rSphere * rSphere * rSphere
        
        return ( volumeBox < volumeSphere ) ? volumeBox : volumeSphere;
    };
    
    PhysicWorld.prototype.updatePhysics = function ( deltaTime ) {
        this.world.stepSimulation( deltaTime, 10 );

        // Update objects
        for ( let i = 0, il = this.dynamicObjects.length; i < il; i++ ) 
        {
            let objThree = this.dynamicObjects[ i ];
            let objPhys = objThree.userData.physicsBody;
            let ms = objPhys.getMotionState();
            
            if ( ms ) {
                ms.getWorldTransform( transformAux1 );
                let p = transformAux1.getOrigin();
                let q = transformAux1.getRotation();
                objThree.position.set( p.x(), p.y(), p.z() );
                objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
                objThree.userData.collided = false;
            }
        }
    };
    
    PhysicWorld.prototype.primitivAddPhysic = function( threeObject, opt )
    {
        if ( !threeObject || typeof threeObject !== "object" ) return;
        
        const defaults = {
            density : 1,
            margin  : 0.05
        };
        
        let scope = this;
        
        let options = _.extend( {}, defaults, opt );
        
        PhysicsBody.addPhysicsBody( threeObject, options );
                
        threeObject.addEventListener("added", function(){
            if ( threeObject.userData.ammo_mass ) { 
                scope.dynamicObjects.push( threeObject ); 
            }
            scope.world.addRigidBody( threeObject._physiBody );
            
        });
        
        threeObject.addEventListener("removed", function(){
            if ( threeObject.userData.ammo_mass ) {
                _.pull( scope.dynamicObjects, threeObject );
            }
            scope.world.removeRigidBody( threeObject._physiBody );
        });
    }; 
    
    PhysicWorld.prototype.add = function( threeObject ){ 
        if ( threeObject.userData.ammo_mass ) {
            this.dynamicObjects.push( threeObject );
            threeObject.userData.physicsBody.setActivationState( 4 );
        }
        this.world.addRigidBody( threeObject.userData.physicsBody );
    };
    
    /**
     * 
     * @param {type} name
     * @param {type} Plg
     * @param {type} opts
     * @returns {PhysicWorld}
     */
    PhysicWorld.prototype.addPlugin = function( Plg, opts ){
        let plg = new Plg( this, opts  );
        
        this.plugins[Plg.name] = plg;
        
        if ( typeof plg.updatePhysics === "function" ) {
            this.VP.loop.add( plg.updatePhysics );
        }
        
        return this;
    };
    
    
    /**
     * 
     * @param {type} points
     * @returns {PhysicWorldL#6.Ammo.btConvexHullShape}
     */
    PhysicWorld.createConvexHullPhysicsShape = function( points ) 
    {
        if( points instanceof THREE.Geometry ) { 
            points = points.vertices; 
        } 
        
        let tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );
        let shape = new Ammo.btConvexHullShape();
       
        for ( let i = 0, il = points.length; i < il; i++ ) {
                let p = points[ i ];
                tempBtVec3_1.setValue( p.x, p.y, p.z );
                let lastOne = ( i === ( il - 1 ) );
                shape.addPoint( tempBtVec3_1, lastOne );
        }
        //ToDo: debug
        console.log( shape );
        
        return shape;
    };

    /**
     * 
     * @param {type} threeObject
     * @returns {unresolved}
     */
    PhysicWorld.prototype.terrainAddPhysic = function( threeObject )
    {
        let scope = this;
        
        threeObject.userData.physicsBody = new PhysicTerrain( threeObject );
        
        threeObject.addEventListener("added", function(){
            scope.add( threeObject );
        });
        
        return threeObject;
    };
    
    PhysicWorld.init = function( APP, done ){
        if ( !APP.VP ) {
            console.error();
            done({err:"PhysicWorld:: Need VP"}, null);
        }
        APP.PW = new PhysicWorld( APP.VP );
        done( null, APP );
    };
    
    return PhysicWorld;
});

