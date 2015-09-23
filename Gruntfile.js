module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    umd: {
        'default': {
            src: 'src/group.js',
            dest: 'dest/group.js',
            objectToExport: 'Grp',
            indent: 4
        },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: {
            'build/group.min.js': ['dest/group.js'],
        }
      },
      
    },
    jasmine : {
      src : 'dest/group.js',
      options: {
        specs: 'test/specs/*Spec.js',
        helpers: 'spec/*Helper.js'
      },
    },
    watch: {
      all: {
        files: ['test/specs/*Spec.js', 'dest/group.js'],
        tasks: ['jasmine'],
        options: {
          spawn: false,
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-umd');
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['umd', 'uglify']);
  grunt.registerTask('test', ['jasmine']);
};