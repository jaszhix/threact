import gulp from 'gulp';
import path from 'path';
import cache from 'gulp-cached';
import { log, PluginError, colors } from 'gulp-util';
import { Server as KarmaServer } from 'karma';
import minimist from 'minimist';

function emptyTask(done) {
  done();
}

function karma(options) {
  return function karmaTask(done) {
    new KarmaServer({
      configFile: path.resolve('tests/karma.conf.js'),
      options,
    }, done).start();
  };
}

function karmaSingle(options) {
  return function karmaSingleTask(done) {
    new KarmaServer({
      configFile: path.resolve('tests/karma.conf.js'),
      singleRun: true,
      options,
    }, done).start();
  };
}

const originalNodeEnv = process.env.NODE_ENV;

function envProd(done) {
  process.env.NODE_ENV = 'production';

  done();
}

function restoreNodeEnv(done) {
  process.env.NODE_ENV = originalNodeEnv;

  done();
}

gulp.task('karma-src', karmaSingle({
  type: 'src',
}));

gulp.task('karma', gulp.series('karma-src'), emptyTask);

gulp.task('test', gulp.series(
  'karma',
), emptyTask);

function runTdd(done) {
  const argv = minimist(process.argv.slice(2), {
    grep: '',
  });

  if (argv.grep !== '' && argv.grep !== undefined) {
    log(`Using test filter: '${argv.grep}'`);
  }

  karma({
    tdd: true,
    type: 'src',
    mocha: {
      grep: argv.grep,
    },
  })(done);
}

gulp.task('tdd', runTdd);

gulp.task('tdd-prod', gulp.series(envProd, runTdd, restoreNodeEnv), emptyTask);

gulp.task('cover', karmaSingle({
  type: 'src',
  coverage: true,
}));
