'use strict';
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var notify = require('gulp-notify');
var bower = require('gulp-bower');
var concat = require('gulp-concat');

var JS_FILE_PATH = ['src/**/*.js', 'test/**/*.js'];
// list js files in order because they need to be loaded in this order
var JS_FILES_IN_ORDER = [
  'src/bluetooth_cod_mapper.js',
  'src/bluetooth_loader.js',
  'src/gatt_server_manager.js',
  'src/bluetooth_manager.js'
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

gulp.task('build', ['bower', 'jshint'], function() {
  return gulp.src(JS_FILES_IN_ORDER)
    .pipe(concat('index.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('default', ['build']);

gulp.task('watch', function() {
  gulp.watch(JS_FILE_PATH, ['build']);
});
