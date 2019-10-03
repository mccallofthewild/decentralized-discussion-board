const HtmlWebpackPlugin = require('html-webpack-plugin')
var HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
import webpack from 'webpack'
const isNotProduction = process.env.NODE_ENV !== 'production'
export default {
  mode: 'spa',
  router: {
    mode: 'hash'
  },
  /*
   ** Headers of the page
   */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: ['@/assets/styles/global.styl'],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    '@/plugins/apollo',
    '@/plugins/global',
    '@/plugins/format-vuex-names'
  ],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [],
  /*
   ** Nuxt.js modules
   */
  modules: ['@nuxtjs/pwa', '@nuxtjs/style-resources'],
  styleResources: {
    stylus: ['~assets/styles/variables.styl']
  },

  // render: {
  //   resourceHints: false
  // },
  /*
   ** Build configuration
   */
  build: {
    // minimize: true,
    // splitChunks: {
    //   name: false
    // },
    // plugins: [],
    /*
     ** You can extend webpack config here
     */
    // extend(config, ctx) {
    //   config.plugins.push(
    //     new webpack.optimize.LimitChunkCountPlugin({
    //       maxChunks: 1
    //     }),
    //     new HtmlWebpackPlugin({
    //       inlineSource: '.(js|css)$' // embed all javascript and css inline
    //     }),
    //     new HtmlWebpackInlineSourcePlugin()
    //   )
    // }
  },

  env: {
    version: '0.0.1',
    storageKeys: {
      auth: {
        wallet: 'ar-wallet',
        activeAccountId: 'active-account-id'
      }
    },
    voteCostInAr: '0.10',
    isDevelopment: ['development', 'test'].includes(process.env.NODE_ENV),
    arweaveConfig: isNotProduction
      ? {
          // find hosts @ http://arweave.net/peers
          host: 'arweave.net' || '84.54.149.140' || '127.0.0.1',
          // port: 1984,
          protocol: 'http',
          timeout: 200000
        }
      : {
          host: 'arweave.net', // Hostname or IP address for a Arweave node
          port: 1984,
          // port: 80, // Port, defaults to 1984
          protocol: 'https', // Network protocol http or https, defaults to http
          timeout: 200000, // Network request timeouts in milliseconds
          logging: false // Enable network request logging
        }
  }
}
