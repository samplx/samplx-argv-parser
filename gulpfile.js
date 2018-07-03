'use strict';

const gulp = require('gulp');
const jshint = require('gulp-jshint');
const jest = require('gulp-jest').default;

const jshintConfig = {
    esversion: 6,
    node: true
};

const jestConfig = {

};

const coverageConfig = () => {
    return {
        collectCoverage: true,
        coverageReporters: [ "json", "lcov", "html", "text"]
    }
};

gulp.task('test', () => {
    return gulp.src('__tests__')
        .pipe(jest(jestConfig));
});

gulp.task('coverage', () => {
    return gulp.src('__tests__')
        .pipe(jest(coverageConfig()));
});

gulp.task('lint', () => {
    return gulp.src('./lib/*.js', './__tests__/*.js', './__mocks__/*.js')
        .pipe(jshint(jshintConfig))
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('default', gulp.series(['lint', 'test']));
