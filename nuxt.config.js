const isNotProduction = process.env.NODE_ENV !== 'production'
export default {
  mode: 'spa',
  // router: {
  //   mode: 'hash'
  // },
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
  css: [],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    '@/plugins/global',
    '@/plugins/format-vuex-names',
    '@/plugins/apollo'
  ],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [],
  /*
   ** Nuxt.js modules
   */
  modules: ['@nuxtjs/pwa'],
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {}
  },

  env: {
    version: '0.0.1',
    authWalletStorageKey: 'ar-wallet',
    arweaveConfig: isNotProduction
      ? {
          host: '127.0.0.1',
          port: 1984
        }
      : {
          host: 'arweave.net', // Hostname or IP address for a Arweave node
          port: 443, // Port, defaults to 1984
          protocol: 'https', // Network protocol http or https, defaults to http
          timeout: 20000, // Network request timeouts in milliseconds
          logging: false // Enable network request logging
        }
  }
}