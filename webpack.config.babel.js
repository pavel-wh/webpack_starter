import path from 'path';
import glob from 'glob';
import webpack from 'webpack';
import HTMLwebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import HtmlCriticalPlugin from 'html-critical-webpack-plugin';
import imagemin from 'imagemin-keep-folder';
import webp from 'imagemin-webp';
import BrotliPlugin from 'brotli-webpack-plugin';
import WorkboxPlugin from 'workbox-webpack-plugin';
import WebpackPwaManifest from 'webpack-pwa-manifest';
import Dotenv from 'dotenv';
import PurgecssPlugin from 'purgecss-webpack-plugin';
import RobotstxtPlugin from 'robotstxt-webpack-plugin';
import SitemapPlugin from 'sitemap-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import VueLoaderPlugin from 'vue-loader/lib/plugin';

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

Dotenv.config({
  path: path.join(__dirname, '.env'),
});

const filename = (extra) =>
  isProd ? `[name].[hash].${extra}` : `[name].${extra}`;

const optimization = () => {
  const config = {
    minimize: true,
    splitChunks: {
      chunks: 'all',
    },
  };

  if (isProd || isDev) {
    config.minimizer = [new OptimizeCSSAssetsPlugin(), new TerserPlugin()];
  }

  return config;
};

const cssLoaders = (extra) => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDev,
        reloadAll: true,
      },
    },
    'css-loader',
  ];
  if (extra) {
    loaders.push(extra);
  }
  return loaders;
};

const babelOptions = (preset) => {
  const opts = {
    presets: ['@babel/preset-env'],
    plugins: ['@babel/plugin-proposal-class-properties'],
  };

  if (preset) {
    opts.presets.push(preset);
  }
  return opts;
};

const jsLoaders = () => {
  const loaders = [
    {
      loader: 'babel-loader',
      options: babelOptions(),
    },
  ];

  if (isDev) {
    loaders.push('eslint-loader');
  }

  return loaders;
};

const plugins = () => {
  const base = [
    new BrotliPlugin({
      asset: '[path].br[query]',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new HTMLwebpackPlugin({
      title: process.env.APP_TITLE,
      template: path.resolve(__dirname, './src/templates/index.html'),
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
      cache: isProd,
    }),
    new FaviconsWebpackPlugin(
      path.resolve(__dirname, 'src/assets/images/icon.png')
    ),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/assets/images/**'),
          to: path.resolve(__dirname, 'build'),
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: filename('css'),
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
    new VueLoaderPlugin(),
  ];

  if (isProd) {
    base.push(
      new HtmlCriticalPlugin({
        base: path.resolve(__dirname, 'build'),
        src: 'index.html',
        dest: 'index.html',
        inline: true,
        minify: true,
        extract: true,
        width: 375,
        height: 565,
        penthouse: {
          blockJSRequests: false,
        },
      }),
      new WebpackPwaManifest({
        name: process.env.APP_TITLE,
        short_name: process.env.APP_SHORT_TITLE,
        display: 'standalone',
        start_url: process.env.APP_START_URL,
        description: process.env.APP_DESCRIPTION,
        theme_color: '#ffffff',
        background_color: '#f9c828',
        orientation: 'portrait',
        crossorigin: 'use-credentials', //can be null, use-credentials or anonymous
        inject: true,
        fingerprints: true,
        ios: true,
        icons: [
          {
            src: path.resolve(__dirname, 'src/assets/images/icon.png'),
            sizes: [120, 152, 167, 180, 1024],
            ios: true,
          },
          {
            src: path.resolve(__dirname, 'src/assets/images/icon.png'),
            size: '1024x1024', // you can also use the specifications pattern
            ios: 'startup',
          },
          {
            src: path.resolve(__dirname, 'src/assets/images/icon.png'),
            sizes: [96, 128, 192, 256, 384, 512], // multiple sizes
          },
        ],
      }),
      new WorkboxPlugin.GenerateSW({
        // these options encourage the ServiceWorkers to get in there fast
        // and not allow any straggling "old" SWs to hang around
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
      }),
      new PurgecssPlugin({
        paths: glob.sync(`./**/*`, { nodir: true }),
      }),
      new RobotstxtPlugin({
        policy: [
          {
            userAgent: '*',
            allow: '/',
            disallow: '/dashboard',
          },
        ],
        sitemap: `${process.env.APP_START_URL}/sitemap.xml`,
        host: process.env.APP_START_URL,
      }),
      new SitemapPlugin(process.env.APP_START_URL, ['/'], {
        filename: 'sitemap.xml',
      })
    );
  }

  return base;
};

//WebP generate
imagemin(['src/assets/images/**/*.{jpg,jpeg,png}'], {
  destination: 'src/assets/images/',
  plugins: [webp({ quality: 75 })],
});

export default {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: {
    main: ['@babel/polyfill', './index.js'],
  },
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'build'),
  },
  resolve: {
    extensions: ['.js', '.json', '.css', '.scss'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@nm': path.resolve(__dirname, 'node_modules'),
    },
  },
  optimization: optimization(),
  devServer: {
    contentBase: path.resolve(__dirname, 'src'),
    watchContentBase: true,
    port: process.env.APP_DEV_PORT,
    compress: true,
    hot: isDev,
  },
  devtool: isDev ? 'source-map' : '',
  plugins: plugins(),
  module: {
    rules: [
      {
        test: /\.css$/,
        use: cssLoaders(),
      },
      {
        test: /\.s[ac]ss$/i,
        use: cssLoaders('sass-loader'),
      },
      {
        test: /\.(png|jpg|jpeg|svg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          'webp-loader',
          'file-loader',
          {
            loader: 'image-webpack-loader',
          },
        ],
      },
      {
        test: /\.(ttf|woff|woff2|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: ['file-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: jsLoaders(),
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-typescript'),
        },
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-react'),
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
    ],
  },
};
