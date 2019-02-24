/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["lodash", "ammo", "three", "extras/PhysicTerrain"], function( _, Ammo, THREE, PhysicTerrain ){
    
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
        
        let defaults = {
            density : 1,
            size    : 3,
            margin  : 0.05
        };
        
        let scope = this;
        
        let options = _.extend( {}, defaults, opt );
        
        var shape = null;

        let p = threeObject.geometry.toJSON();
        let v = options.size;
                
        switch ( threeObject.geometry.type ) 
        {
            case "SphereGeometry":
                // Sphere                 
                shape = new Ammo.btSphereShape( p.radius );
                v = 4/3 * Math.PI * p.radius*p.radius*p.radius;
                    
                break;
            
            case "BoxGeometry":
                // Box
                let sx = p.width* 0.5;
                let sy = p.height* 0.5;
                let sz = p.depth* 0.5;
                v = p.width*p.height*p.depth;

                shape = new Ammo.btBoxShape( new Ammo.btVector3( sx , sy , sz  ) );
                    
                break;
                
            case "CylinderGeometry":
                // Cylinder
                if ( p.radiusBottom === p.radiusTop ) {
                    v = p.height * Math.PI * p.radiusBottom*p.radiusBottom;
                    shape = new Ammo.btCylinderShape( new Ammo.btVector3( p.radiusBottom, p.height * 0.5, p.radiusBottom ) );
                }
                else {
                    v = 1/3 * p.height * Math.PI * p.radiusBottom*p.radiusBottom;
                    shape = new Ammo.btConeShape( p.radiusBottom, p.height );
                }
                    
                break;
                
            case "ConvexGeometry":
                shape = PhysicWorld.createConvexHullPhysicsShape( threeObject.geometry );
                v = this.calcVolume( threeObject.geometry );
                break;
            
            case "PlaneBufferGeometry":
                console.log("PlaneBufferGeometry", p );
                v = 0;
                shape = new Ammo.btBoxShape( new Ammo.btVector3( p.width * 0.5,  .1 * 0.5, p.height * 0.5 ) );
                
                break;
            
            default:
                // Cone
                v = p.height * 5;
                shape = PhysicWorld.createConvexHullPhysicsShape( threeObject.geometry.vertices );
                
                break;
        }
        shape.setMargin( options.margin );
        
        
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

        let mass = options.mass || v * options.density;
        let localInertia = new Ammo.btVector3( 0, 0, 0 );
        shape.calculateLocalInertia( mass, localInertia );

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        let pos = threeObject.position;
        transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

        let motionState = new Ammo.btDefaultMotionState( transform );
        threeObject._physiBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia ) );
        if( options.velocity ) threeObject._physiBody.setLinearVelocity( new Ammo.btVector3( options.velocity.x, options.velocity.y, options.velocity.z ) );
        
        threeObject.userData.ammo_mass = mass;
        threeObject.userData.ammo_density = options.density;
        threeObject.userData.physicsBody = threeObject._physiBody;
        
        _.each( this.plugins, function( plg ){
            plg.onPrimitivAddPhysic( threeObject );
        });
        
        return threeObject;
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
    
    return PhysicWorld;

});

