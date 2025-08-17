//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
  target: 'node', // VS Code 扩展运行在 Node.js 环境中
  mode: 'none', // 开发时用 'none' 或 'development'，发布时用 'production'

  entry: './src/extension.ts', // 扩展的入口点
  output: {
    // 打包后的文件输出位置
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // vscode 模块是外部依赖，不打包进去
  },
  resolve: {
    // 支持读取 TypeScript 和 JavaScript 文件
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map', // 生成 source map 用于调试
  infrastructureLogging: {
    level: "log", // 启用日志
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/resources', to: 'resources' }
      ]
    })
  ]
};

module.exports = [ extensionConfig ];