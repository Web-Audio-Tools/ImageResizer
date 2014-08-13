module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        nodemon: {
            dev: {
                script: 'app.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-nodemon');
    
    grunt.registerTask('default', ['nodemon']);

};