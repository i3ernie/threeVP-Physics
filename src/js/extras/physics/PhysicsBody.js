/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define(["lodash", "ammo", "three"], function( _, Ammo, THREE ){
    let Physics = {};
    
    let PhysicsBody = function( mass ){
        this._physicsBody = {
            type: null,
            id: getObjectId(),
            mass: mass || 0,
            touches: [],
            linearVelocity: new THREE.Vector3,
            angularVelocity: new THREE.Vector3
        };
    };
    
    Object.assign( PhysicsBody.prototype, {
        applyCentralImpulse : function ( force ) {
            if ( this.world ) {
                this.world.execute( 'applyCentralImpulse', { id: this._physijs.id, x: force.x, y: force.y, z: force.z } );
            }
        },
        applyImpulse : function ( force, offset ) {
            if ( this.world ) {
		this.world.execute( 'applyImpulse', { id: this._physijs.id, impulse_x: force.x, impulse_y: force.y, impulse_z: force.z, x: offset.x, y: offset.y, z: offset.z } );
            }
        },
        applyTorque : function ( force ) {
            if ( this.world ) {
                    this.world.execute( 'applyTorque', { id: this._physijs.id, torque_x: force.x, torque_y: force.y, torque_z: force.z } );
            }
        },
        applyCentralForce : function ( force ) {
            if ( this.world ) {
                    this.world.execute( 'applyCentralForce', { id: this._physijs.id, x: force.x, y: force.y, z: force.z } );
            }
        },
        applyForce : function ( force, offset ) {
            if ( this.world ) {
                    this.world.execute( 'applyForce', { id: this._physijs.id, force_x: force.x, force_y : force.y, force_z : force.z, x: offset.x, y: offset.y, z: offset.z } );
            }
        },
        getAngularVelocity : function () {
		return this._physijs.angularVelocity;
        },
        setAngularVelocity : function ( velocity ) {
            if ( this.world ) {
                    this.world.execute( 'setAngularVelocity', { id: this._physijs.id, x: velocity.x, y: velocity.y, z: velocity.z } );
            }
        }

    }); 
    
    PhysicsBody.addPhysicsBody = function( threeObject, options ){
        let shape = null;
        let body = null;
        let p = threeObject.geometry.toJSON();
        let v;
        
        switch ( threeObject.geometry.type ) 
        {
            case "SphereGeometry":
                // Sphere                 
                shape = new Ammo.btSphereShape( p.radius );
                v = options.size || 4/3 * Math.PI * p.radius*p.radius*p.radius;
                    
                break;
            
            case "BoxGeometry":
                // Box
                let sx = p.width* 0.5;
                let sy = p.height* 0.5;
                let sz = p.depth* 0.5;
                v = options.size || p.width*p.height*p.depth;
                
                body = new Physics.BoxBody( threeObject, mass );

                shape = new Ammo.btBoxShape( new Ammo.btVector3( sx , sy , sz  ) );
                    
                break;
                
            case "CylinderGeometry":
                // Cylinder
                if ( p.radiusBottom === p.radiusTop ) {
                    v = options.size || p.height * Math.PI * p.radiusBottom*p.radiusBottom;
                    shape = new Ammo.btCylinderShape( new Ammo.btVector3( p.radiusBottom, p.height * 0.5, p.radiusBottom ) );
                }
                else {
                    v = 1/3 * p.height * Math.PI * p.radiusBottom*p.radiusBottom;
                    shape = new Ammo.btConeShape( p.radiusBottom, p.height );
                }
                    
                break;
                
            case "ConvexGeometry":
                shape = PhysicWorld.createConvexHullPhysicsShape( threeObject.geometry );
                v = options.size || this.calcVolume( threeObject.geometry );
                break;
            
            case "PlaneBufferGeometry":
                console.log("PlaneBufferGeometry", p );
                v = 0;
                shape = new Ammo.btBoxShape( new Ammo.btVector3( p.width * 0.5,  .1 * 0.5, p.height * 0.5 ) );
                
                break;
            
            default:
                // Cone
                v = options.size || p.height * 5;
                console.log("PhysicWorld::unkown type of geometry: ", p );
                shape = PhysicWorld.createConvexHullPhysicsShape( threeObject.geometry.vertices );
                
                break;
        }
            
        shape.setMargin( options.margin );
        
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
    
    Physics.BoxBody = function( threeObject, mass ) {
        let width, height, depth;

        PhysicsBody.call( this, mass);

        if ( !threeObject.geometry.boundingBox ) {
                threeObject.geometry.computeBoundingBox();
        }

        width = threeObject.geometry.boundingBox.max.x - threeObject.geometry.boundingBox.min.x;
        height = threeObject.geometry.boundingBox.max.y - threeObject.geometry.boundingBox.min.y;
        depth = threeObject.geometry.boundingBox.max.z - threeObject.geometry.boundingBox.min.z;
        
        shape = new Ammo.btBoxShape( new Ammo.btVector3( width*.5 , height*.5 , height*.5  ) );

        this._physijs.type = 'box';
        this._physijs.width = width;
        this._physijs.height = height;
        this._physijs.depth = depth;
        this._physijs.mass = (typeof mass !== 'number') ? width * height * depth : mass;
    };
    Physics.BoxMesh.prototype = Object.assign(Object.create(PhysicsBody.prototype), {
        constructor : Physics.BoxMesh
    });
    
    Physics.SphereMesh = function( threeObject, mass ) {
        PhysicsBody.call( this, mass );

        if ( !threeObject.geometry.boundingSphere ) {
                threeObject.geometry.computeBoundingSphere();
        }
        

        this._physijs.type = 'sphere';
        this._physijs.radius = threeObject.geometry.boundingSphere.radius;
        this._physijs.mass = (typeof mass === 'undefined') ? (4/3) * Math.PI * Math.pow( this._physijs.radius, 3 ) : mass;
    };

    
    return PhysicsBody;
});
