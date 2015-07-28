'use strict';
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var notify = require('gulp-notify');
var bower = require('gulp-bower');
var concat = require('gulp-concat');

var JS_FILE_PATH = ['src/**/*.js', 'test/**/*.js'];

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
  return gulp.src('src/**/*.js')
    .pipe(concat('index.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('default', ['build']);
