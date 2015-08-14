'use strict';
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var notify = require('gulp-notify');
var bower = require('gulp-bower');
var concat = require('gulp-concat');
var browserSync = require('browser-sync');
var del = require('del');
var shell = require('gulp-shell');
var runSequence = require('run-sequence');

var JS_FILE_PATH = ['src/**/*.js', 'test/**/*.js'];
// list js files in order because they need to be loaded in this order
var JS_FILES_IN_ORDER = [
  'src/bluetooth_cod_mapper.js',
  'src/bluetooth_loader.js',
  'src/fake_objects.js',
  'src/gatt_server_manager.js',
  'src/bluetooth_manager.js'
];

var TEST_DEPENDENCY = [
  'test/runner.html',
  'node_modules/should/should.min.js',
  'node_modules/sinon/pkg/sinon.js',
  'node_modules/mocha/mocha.js',
  'node_modules/mocha/mocha.css',
  'bower_components/**/*.js'
];

gulp.task('bower', function() {
  return bower();
});

gulp.task('jshint', function() {
  return gulp.src(JS_FILE_PATH)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .on('error', notify.onError(function (error) {
      return error.message;
    }));
});

gulp.task('docs', ['clean-docs'], function() {
  gulp.src(['README.md', 'src/**/*.js'], {read: false}).pipe(
    shell(['./node_modules/.bin/jsdoc -c ./jsdoc.json -d ./docs -r']));
});

gulp.task('clean-docs', del.bind(null, ['docs']));

gulp.task('build', ['bower', 'jshint'], function() {
  return gulp.src(JS_FILES_IN_ORDER)
    .pipe(concat('index.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('default', ['build']);

gulp.task('watch', function() {
  gulp.watch(JS_FILE_PATH, ['build']);
});

gulp.task('dependency-for-test', function() {
  return gulp.src(TEST_DEPENDENCY)
    .pipe(gulp.dest('.tmp'));
});

gulp.task('prepare-for-test', ['build', 'dependency-for-test'], function() {
  var files = JS_FILES_IN_ORDER;
  files.push('test/**/*.js');
  return gulp.src(JS_FILES_IN_ORDER)
    .pipe(concat('test.js'))
    .pipe(gulp.dest('.tmp'));
});

gulp.task('test', ['prepare-for-test'], function() {
  browserSync.init({
    server: {
      baseDir: '.tmp',
      index: 'runner.html'
    }
  });

  gulp.watch(['.tmp/**/*']).on('change', browserSync.reload);
  gulp.watch(['src/**/*', 'test/**/*'], ['prepare-for-test']);
});
