module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            'js/hoge.all.js': [
                'js/hoge.js',
                'js/hoge.model.js',
                'js/hoge.view.js'
            ]
        },
        watch: {
            files: [
                'js/hoge.js',
                'js/hoge.model.js',
                'js/hoge.view.js'
            ],
            tasks: 'concat min'
        },
        min: {
            'js/hoge.min.js': ['js/hoge.all.js']
        }
    });

    grunt.registerTask('default', 'concat min');
};
