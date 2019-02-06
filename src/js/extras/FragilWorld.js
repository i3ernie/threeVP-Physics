/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define(["lodash", "ammo", "three", "vendor/threejs/extras/ConvexObjectBreaker"], function( _, Ammo, THREE, ConvexObjectBreaker ){
    
    let defaults = {
        gravity : [0, -6, 0]
    };
    
    var impactPoint     = new THREE.Vector3();
    var impactNormal    = new THREE.Vector3();
    var objectsToRemove = [];
    var numObjectsToRemove = 0;
    
    var FragilWorld = function( VP, PW, opt ){
        
        this.options = _.extend( {}, defaults, opt );
        this.PW = PW;
        this.VP = VP;
        
        this.convexBreaker = new THREE.ConvexObjectBreaker();
        
        var scope = this;
        
        //init array
        for ( let i = 0; i < 500; i++ ) {
		objectsToRemove[ i ] = null;
        }
        
        this.updatePhysics = function(){ scope._updatePhysics.apply(scope, arguments); }; 
        
        this.onPrimitivAddPhysic = function( obj ){
            if ( obj.userData.breakable ) this.prepareBreakableObject( obj );
        };
        this.onAdd = function(){
            
        };
        
        this.prepareBreakableObject = function( obj ){
            this.convexBreaker.prepareBreakableObject( obj, 1000, new THREE.Vector3(), new THREE.Vector3(), true );
            
            var btVecUserData = new Ammo.btVector3( 0, 0, 0 );
            btVecUserData.threeObject = obj;
            obj._physiBody.setUserPointer( btVecUserData );
        };
        
        function removeDebris( object ) {
            VP.scene.remove( object );
	}
        
        function createDebrisFromBreakableObject( obj )
        {
            obj.castShadow = true;
            obj.receiveShadow = true;

            PW.primitivAddPhysic( obj );

            // Set pointer back to the three object only in the debris objects
            var btVecUserData = new Ammo.btVector3( 0, 0, 0 );
            btVecUserData.threeObject = obj;
            obj._physiBody.setUserPointer( btVecUserData );
        }
        
        this._updatePhysics = function ( deltaTime ) 
        {		
            for ( let i = 0, il = this.PW.dispatcher.getNumManifolds(); i < il; i ++ ) 
            {
                let contactManifold = this.PW.dispatcher.getManifoldByIndexInternal( i );
                let rb0 = contactManifold.getBody0();
                let rb1 = contactManifold.getBody1();
                var threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
                var threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;
                    
                if ( ! threeObject0 && ! threeObject1 ) {
                    continue;
                }
                
                var userData0  = threeObject0 ? threeObject0.userData   : null;
                var userData1  = threeObject1 ? threeObject1.userData   : null;
                var breakable0 = userData0 ?    userData0.breakable     : false;
                var breakable1 = userData1 ?    userData1.breakable     : false;
                var collided0  = userData0 ?    userData0.collided      : false;
                var collided1  = userData1 ?    userData1.collided      : false;

                    if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {
                        continue;
                    }

                    var contact = false;
                    var maxImpulse = 0;
                    
                    for ( let j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {
                        var contactPoint = contactManifold.getContactPoint( j );
                        if ( contactPoint.getDistance() < 0 ) {
                            contact = true;
                            var impulse = contactPoint.getAppliedImpulse();
                            if ( impulse > maxImpulse ) {
                                maxImpulse = impulse;
                                var pos = contactPoint.get_m_positionWorldOnB();
                                var normal = contactPoint.get_m_normalWorldOnB();
                                impactPoint.set( pos.x(), pos.y(), pos.z() );
                                impactNormal.set( normal.x(), normal.y(), normal.z() );
                            }
                            break;
                        }
                    }
                    // If no point has contact, abort
                    if ( ! contact ) {
                        continue;
                    }

                    // Subdivision
                    var fractureImpulse = 250;
                    if ( breakable0 && !collided0 && maxImpulse > fractureImpulse ) {
                        var debris = this.convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal , 1, 2, 1.5 );

                        var numObjects = debris.length;
                        for ( var j = 0; j < numObjects; j++ ) {
                            debris[ j ].geometry.computeBoundingBox();
                            debris[ j ].geometry.computeBoundingSphere ();
                            createDebrisFromBreakableObject( debris[ j ] );
                            this.VP.scene.add( debris[ j ] );
                        }
                        objectsToRemove[ numObjectsToRemove++ ] = threeObject0;
                        userData0.collided = true;
                    }
                    if ( breakable1 && !collided1 && maxImpulse > fractureImpulse ) {
                        var debris = this.convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal , 1, 2, 1.5 );
                        var numObjects = debris.length;
                        for ( var j = 0; j < numObjects; j++ ) {
                            debris[ j ].geometry.computeBoundingBox();
                            debris[ j ].geometry.computeBoundingSphere ();
                            createDebrisFromBreakableObject( debris[ j ] );
                            this.VP.scene.add( debris[ j ] );
                        }
                        objectsToRemove[ numObjectsToRemove++ ] = threeObject1;
                        userData1.collided = true;
                    }
            }
            for ( var i = 0; i < numObjectsToRemove; i++ ) {
                removeDebris( objectsToRemove[ i ] );
            }
            numObjectsToRemove = 0;
        };
    };
    
    return FragilWorld;
    
});
