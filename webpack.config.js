const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const minify = ~process.argv.indexOf('-p');
const manifest = require('./package.json');

module.exports = {
  node: {
    global: false,
  },
  entry: './index',
  mode: 'development',
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: '/build/',
    filename: 'pay-with-amazon' + (minify ? '.min.js' : '.js'),
    library: 'PayWithAmazon',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              plugins: [
                '@babel/plugin-proposal-class-properties',
              ],
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: manifest.browserslist
                  }
                }]
              ]
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    modules: [
      path.join(__dirname),
      'node_modules'
    ]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
        extractComments: false
      })
    ]
  },
  devServer: {
    disableHostCheck: true,
    host: 'js.lvh.me'
  }
};
