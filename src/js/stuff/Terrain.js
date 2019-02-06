/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "lodash"], function( THREE, _ ){
    
    var defaults = {
        width : 128,
        depth : 128,
        minHeight : -2,
        maxHeight : 8
    };
    
    var generateHeight =function( opt, maxHeight, minHeight ) {
        // Generates the height data (a sinus wave)
        var size = opt.width * opt.depth;
        var data = new Float32Array( size );
        var hRange = maxHeight - minHeight;
        var w2 = opt.width / 2;
        var d2 = opt.depth / 2;
        var phaseMult = 12;
        var p = 0;
        
        for ( var j = 0; j < opt.depth; j ++ ) {
            for ( var i = 0; i < opt.width; i ++ ) {
                var radius = Math.sqrt(
                    Math.pow( ( i - w2 ) / w2, 2.0 ) +
                    Math.pow( ( j - d2 ) / d2, 2.0 ) 
                );
                var height = ( Math.sin( radius * phaseMult ) + 1 ) * 0.5  * hRange + minHeight;
                data[ p ] = height;
                p++;
            }
        }
        return data;
    };
    
    var Terrain = function( opt )
    {
        this.options = _.extend({}, defaults, opt);
        
        var scope = this;
        
        var geometry = new THREE.PlaneBufferGeometry( 100, 100, this.options.width - 1, this.options.depth - 1 );
        geometry.rotateX( - Math.PI / 2 );
        var vertices = geometry.attributes.position.array;
        var heightData = generateHeight( this.options, this.options.minHeight, this.options.maxHeight );
        
        for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
            // j + 1 because it is the y component that we modify
            vertices[ j + 1 ] = heightData[ i ];
        }
       
        geometry.computeVertexNormals();
        
        var material = new THREE.MeshPhongMaterial( { color: 0xC7C7C7 } );
        
        //terrainMesh = new THREE.Mesh( geometry, material );
        
        THREE.Mesh.call(this, geometry, material);
        //scene.add( terrainMesh );
        
        var textureLoader = new THREE.TextureLoader();
        textureLoader.load( "./textures/grid.png", function( texture ) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( scope.options.width - 1, scope.options.depth - 1 );
            material.map = texture;
            material.needsUpdate = true;
        } );
    };
    
    Terrain.prototype = _.create( THREE.Mesh.prototype, {
        constructor : Terrain
    });
    
    return Terrain;
});
