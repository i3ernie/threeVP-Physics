/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["lodash", "ammo", "three"], function( _, Ammo, THREE ){
    
    let defaults = {
        gravity : [0, -6, 0]
    };
    let transformAux1 = new Ammo.btTransform();
    
    let PhysicWorld = function( VP, opt )
    {    
        this.VP = VP;
        this.plugins = {};
        this.options = _.extend({}, defaults, opt);

        var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
        var broadphase = new Ammo.btDbvtBroadphase();
        var solver = new Ammo.btSequentialImpulseConstraintSolver();
        
        this.world = new Ammo.btDiscreteDynamicsWorld( this.dispatcher, broadphase, solver, collisionConfiguration );
        this.world.setGravity( new Ammo.btVector3( this.options.gravity[0], this.options.gravity[1], this.options.gravity[2] ) ); 
        this.dynamicObjects = [];
        
        VP.loop.add( this.updatePhysics.bind(this) );
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
            size : 3,
            margin : 0.05
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
                //ToDo calc volume
                //shape = new Ammo.btBoxShape( new Ammo.btVector3( 1 , 1 , 1  ) );
                v = 1;
                break;
            
            case "PlaneBufferGeometry":
                console.log("PlaneBufferGeometry", p );
                v = 0;
                shape = new Ammo.btBoxShape( new Ammo.btVector3( p.width * 0.5,  .1 * 0.5, p.height * 0.5 ) );
                
                break;
            
            default:
                // Cone
                v = p.height * 5;
                shape = PhysicWorld.createConvexHullPhysicsShape( object.geometry.vertices );
                
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

        var mass = options.mass || v * options.density;
        var localInertia = new Ammo.btVector3( 0, 0, 0 );
        shape.calculateLocalInertia( mass, localInertia );

        var transform = new Ammo.btTransform();
        transform.setIdentity();
        var pos = threeObject.position;
        transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

        var motionState = new Ammo.btDefaultMotionState( transform );
        threeObject._physiBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, localInertia ) );
        if( options.velocity ) threeObject._physiBody.setLinearVelocity( new Ammo.btVector3( options.velocity.x, options.velocity.y, options.velocity.z ) );
        
        threeObject.userData.ammo_mass = mass;
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
        let plg = new Plg( this.VP, this, opts  );
        
        this.plugins[Plg.name] = plg;
        
        if ( typeof plg.updatePhysics === "function" ) {
            this.VP.loop.add( plg.updatePhysics );
        }
        
        return this;
    };
    
    
    PhysicWorld.createConvexHullPhysicsShape = function( points ) 
    {
        if( points instanceof THREE.Geometry ) { 
            points = points.vertices; 
        } 
        
        let tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );
        let shape = new Ammo.btConvexHullShape();
       
        for ( let i = 0, il = points.length; i < il; i++ ) {
                var p = points[ i ];
                tempBtVec3_1.setValue( p.x, p.y, p.z );
                var lastOne = ( i === ( il - 1 ) );
                shape.addPoint( tempBtVec3_1, lastOne );
        }
        //ToDo: debug
        console.log(shape);
        
        return shape;
    };

    PhysicWorld.prototype.floorAddPhysic = function( threeObject ){
        let scope = this;
        
        threeObject.userData.physicsBody = new PhysicWorld.PhysicFloor( threeObject );
        
        threeObject.addEventListener("added", function(){
            scope.add( threeObject );
        });
        
        return threeObject;
    };
    
    PhysicWorld.PhysicFloor = function( obj )
    {    
        let options = {
            terrainWidthExtents : 100,
            terrainDepthExtents : 100
        };
        
        var createTerrainShape = function( opt, vertices ) 
        {
            // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored

            var heightData = [];
            var terrainMaxHeight = opt.maxHeight;
            var terrainMinHeight = opt.minHeight;
            
            for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
                // j + 1 because it is the y component that we modify
                heightData[ i ] = vertices[ j + 1 ];
            }    

            var heightScale = 1;
            
            // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
            var upAxis = 1;
            
            // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
            var hdt = "PHY_FLOAT";
            
            // Set this to your needs (inverts the triangles)
            var flipQuadEdges = false;
            
            // Creates height data buffer in Ammo heap
            var ammoHeightData = Ammo._malloc( 4 * opt.width * opt.depth );
            
            // Copy the javascript height data array to the Ammo one.
            var p = 0;
            var p2 = 0;

            for ( let j = 0; j < opt.depth; j ++ ) {
                for ( let i = 0; i < opt.width; i ++ ) {
                        // write 32-bit float data to memory
                        Ammo.HEAPF32[ammoHeightData + p2 >> 2] = heightData[ p ];
                        p ++;
                        // 4 bytes/float
                        p2 += 4;
                }
            }
            // Creates the heightfield physics shape
            var heightFieldShape = new Ammo.btHeightfieldTerrainShape(
                    opt.width, opt.depth,
                    ammoHeightData,
                    heightScale,
                    terrainMinHeight, terrainMaxHeight,
                    upAxis,
                    hdt,
                    flipQuadEdges
            );
                // Set horizontal scale
                var scaleX = options.terrainWidthExtents / ( opt.width - 1 );
                var scaleZ = options.terrainDepthExtents / ( opt.depth - 1 );
                heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, 1, scaleZ ) );
                heightFieldShape.setMargin( 0.05 );
                return heightFieldShape;
        };
        
        // Create the terrain body
        var groundShape = createTerrainShape( obj.options, obj.geometry.attributes.position.array );
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        
        var pos = obj.position;
        
        // Shifts the terrain, since bullet re-centers it on its bounding box.
        transform.setOrigin( new Ammo.btVector3( pos.x, ( obj.options.maxHeight + obj.options.minHeight ) / 2 + pos.y, pos.z ) );
        let mass = 0;
        let groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
        let motionState = new Ammo.btDefaultMotionState( transform );
        Ammo.btRigidBody.call(this, new Ammo.btRigidBodyConstructionInfo( mass, motionState, groundShape, groundLocalInertia ) );
        obj.userData.ammo_mass = mass;
    };
    
    PhysicWorld.PhysicFloor.prototype = _.create( Ammo.btRigidBody.prototype, {
        constructor : PhysicWorld.PhysicFloor
    });
    
    return PhysicWorld;

});

