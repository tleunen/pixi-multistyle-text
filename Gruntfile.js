module.exports = function(grunt) {
    'use strict';

    // load dependancies
    Object.keys(grunt.file.readJSON('package.json').devDependencies)
        .filter(function(taskName) { return taskName.indexOf('grunt-') === 0; })
        .forEach(function(taskName) { grunt.loadNpmTasks(taskName); });

    var banner = [
        '/**',
        ' * @license',
        ' * <%= pkg.name %> - v<%= pkg.version %>',
        ' * Copyright (c) 2014, <%= pkg.author %>',
        ' * Released under the <%= pkg.license %> license',
        ' * See <%= pkg.homepage %> for more details',
        ' */',
        ''
    ].join('\n');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: ['Gruntfile.js', 'pixi-multistyle-text.js']
        },

        uglify: {
            options: {
                banner: banner
            },
            dist: {
                src: 'pixi-multistyle-text.js',
                dest: 'pixi-multistyle-text.min.js'
            }
        }
    });

    grunt.registerTask('default', ['jshint', 'uglify']);
};