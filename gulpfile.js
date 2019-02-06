/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var gulp = require('gulp');
var fs = require('fs');

gulp.task('default', function () {
    // place code for your default task here
});

gulp.task('init', function ( done ){
    
    var fnc = function( src, dest, mod )
    {
        var end = '';
        
        fs.readFile(src, 'utf8', function( err, content ){
            if ( err ) { console.log( err ); done(); return; }
            if ( typeof mod === "string" ) { end = ' return ' + mod + ';'  }
            var ret = 'define(["three"], function(THREE){' + content + end + '});';
            fs.writeFile(dest, ret, 'utf8', ( err ) => {
                if ( err ) { console.log( err ); }
            });
        });
    };
    
    var modules = require( "./node_modules.json" );
    
    _.each(modules, ( el ) =>{
        fnc(el.src, el.dest, el.req , el.name, el.mod);
    });
    
    var src = '';
    var dest = '';
    var mod = '';
    
    
    src = './node_modules/three/examples/js/utils/ShadowMapViewer.js';
    dest = './src/js/vendor/threejs/utils/ShadowMapViewer.js';
    fnc(src, dest);
    
    if ( done ) done();
});
