/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


define(["lodash", "ammo", "three"], function( _, Ammo, three )
{
    let defaults = {
        terrainWidthExtents : 100,
        terrainDepthExtents : 100
    };
    
    var heightScale = 1;
            
    // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
    var upAxis = 1;

    // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
    var hdt = "PHY_FLOAT";
    
    // Set this to your needs (inverts the triangles)
    var flipQuadEdges = false;
        
    let PhysicTerrain = function( obj )
    {    
        let options = _.extend( {}, defaults );
        
        var createTerrainShape = function( opt, vertices ) 
        {
            // This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored

            let heightData = [];
            var terrainMaxHeight = opt.maxHeight;
            var terrainMinHeight = opt.minHeight;
            
            for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
                // j + 1 because it is the y component that we modify
                heightData[ i ] = vertices[ j + 1 ];
            }    
            
            // Creates height data buffer in Ammo heap
            let ammoHeightData = Ammo._malloc( 4 * opt.width * opt.depth );
            
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
    
    PhysicTerrain.prototype = _.create( Ammo.btRigidBody.prototype, {
        constructor : PhysicTerrain.PhysicFloor
    });
    
    return PhysicTerrain;
});