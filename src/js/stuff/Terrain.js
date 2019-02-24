/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "lodash", "stuff/geometries/TerrainGeometry"], function( THREE, _, TerrainGeometry ){
    
    let defaults = {
        width : 100,
        depth : 100,
        
        widthSegments : 100,
        depthSegments : 100,
        
        minHeight : -2,
        maxHeight : 8,
        
        color : 0xC7C7C7
    };
    
    var Terrain = function( opt )
    {
        this.options = _.extend( {}, defaults, opt );
        
        var scope = this;
        
        let geometry = new TerrainGeometry ( this.options.width, this.options.depth, this.options );        
        let material = new THREE.MeshPhongMaterial( { color: this.options.color } );
        
        THREE.Mesh.call( this, geometry, material );
        
        let textureLoader = new THREE.TextureLoader();
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
