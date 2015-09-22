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
      
    }
  });

  grunt.loadNpmTasks('grunt-umd');
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['umd', 'uglify']);

};