var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();

gulp.task('default', ['watch']);

gulp.task('watch', ['scripts', 'styles'], function() {
	browserSync.init({
		server: {
			baseDir: ['./app', './dist']
		}
	});

	gulp.watch('app/scripts/**/*.js', ['scripts']);
	gulp.watch('app/styles/**/*.scss', ['styles']);
	gulp.watch([
		'dist/**/*',
		'app/*.html'
		]).on('change', browserSync.reload)
});

gulp.task('styles', function() {
	return $.rubySass('app/styles', { sourcemap: true })
		.pipe($.plumber())
		.pipe($.sourcemaps.write('./', {
			includeContent: false,
			sourceRoot: '/app/styles'
		}))
		.pipe(gulp.dest('dist/styles'));
});

gulp.task('scripts', function() {
	return gulp.src('app/scripts/**/*.js')
		.pipe($.sourcemaps.init())
		.pipe($.eslint())
		.pipe($.eslint.format())
		//.pipe($.traceur())
		.pipe($.concat('ipa-input.js'))
		.pipe($.uglify())
		.pipe($.sourcemaps.write('./'))
		.pipe(gulp.dest('dist'));
});