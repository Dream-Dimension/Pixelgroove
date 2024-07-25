const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  {
    mode: 'development',
    entry: './src/main.ts',
    target: 'electron-main',
    devtool: 'source-map',
    module: {
      rules: [{
        test: /\.ts$/,
        include: /src/,
        use: [{ loader: 'ts-loader' }]
      }]
    },
    output: {
      path: __dirname + '/dist',
      filename: 'main.js'
    }
  },
  {
    mode: 'development',
    entry: './src/renderer.ts',
    target: 'electron-renderer',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: path.resolve(
            __dirname,
            "node_modules/p5/lib/addons/p5.sound.js"
          ),
          loader: "imports-loader",
          options: {
            type: "module",
            imports: "p5",
          },
        },
        {
          test: path.resolve(
            __dirname,
            "node_modules/p5/lib/addons/p5.sound.min.js"
          ),
          loader: "imports-loader",
          options: {
            type: "module",
            imports: "p5",
          },
        },
        {
          test: /\.ts(x?)$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }],
          exclude: /node_modules/
        }
      ]
    },
    output: {
      path: __dirname + '/dist',
      filename: 'renderer.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html'
      })
    ],  
    resolve: {
      extensions: ['.ts', '.js'],
    }
  }
];