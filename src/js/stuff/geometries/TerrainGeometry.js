/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "lodash"], function( THREE, _ ){
    
    const defaults = {
        width : 100,
        depth : 100,
        
        widthSegments : 100,
        depthSegments : 100,
        
        minHeight : -2,
        maxHeight : 8
    };
    
    const generateHeight = function( opt ) 
    {
        // Generates the height data (a sinus wave)
        let size = opt.width * opt.depth;
        let data = new Float32Array( size );
        let hRange = opt.maxHeight - opt.minHeight;
        
        let w2 = opt.width / 2;
        let d2 = opt.depth / 2;
        
        let phaseMult = 12;
        let p = 0;
        
        for ( let j = 0; j < opt.depth; j ++ ) 
        {
            for ( let i = 0; i < opt.width; i ++ ) 
            {
                let radius = Math.sqrt(
                    Math.pow( ( i - w2 ) / w2, 2.0 ) +
                    Math.pow( ( j - d2 ) / d2, 2.0 ) 
                );
                let height = ( Math.sin( radius * phaseMult ) + 1 ) * 0.5  * hRange + opt.minHeight;
                data[ p ] = height;
                p++;
            }
        }
        return data;
    };
    
    let Terrain = function( width, depth, opts ){
        
        this.options = _.extend({}, defaults, opts);
        
        THREE.PlaneBufferGeometry.call( this, width, depth, this.options.widthSegments -1, this.options.depthSegments - 1 );
        this.rotateX( - Math.PI / 2 );
        
        let  vertices = this.attributes.position.array;
        let  heightData = generateHeight( this.options );
        
        for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
            // j + 1 because it is the y component that we modify
            vertices[ j + 1 ] = heightData[ i ];
        }
       
        this.computeVertexNormals();
    };
    
    Terrain.prototype = Object.create( THREE.PlaneBufferGeometry.prototype );
    
    return Terrain;
});

