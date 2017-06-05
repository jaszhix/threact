const webpack = require('webpack');
const path = require('path');
const externals = require('./package.json').dependencies;

const webpackConfig = {
  externals: Object.keys(externals),
  entry: path.join(__dirname, 'src/index'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [
      path.resolve('node_modules'),
      path.join(__dirname, 'src'),
    ],
  },
  context: path.resolve(__dirname, 'src'),
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: [
              'add-module-exports',
              'dynamic-import-webpack',
              'transform-decorators-legacy',
              'transform-class-properties',
              'transform-object-rest-spread',
              'transform-es2015-classes',
              ['transform-runtime', {helpers: false, polyfill: true, regenerator: true}]
            ],
            ignore: [
              './dist/index.js'
            ]
          }
        }
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
  ]
};

module.exports = webpackConfig;
