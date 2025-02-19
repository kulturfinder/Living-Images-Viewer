const fs = require('fs')

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/living-images/'
    : '/',
  css: {
    loaderOptions: {
      scss: {
        prependData: `@import "@/styles/variables.scss";`
      }
    }
  },
  configureWebpack: {
    devtool: process.env.NODE_ENV !== 'production' ? 'eval-source-map' : ''
  },
  productionSourceMap: process.env.NODE_ENV !== 'production',
  pluginOptions: {
    i18n: {
      locale: 'de',
      fallbackLocale: 'de',
      localeDir: 'locales',
      enableInSFC: false
    }
  },
  /* start server with https for dev (i.e. for living images) */
  devServer: {
    https: {
      key: fs.readFileSync('./certs/localhost-key.pem'),
      cert: fs.readFileSync('./certs/localhost.pem')
    },
    port: 8080,
    host: '0.0.0.0',
    headers: { 'Access-Control-Allow-Origin': 'https://kulturfindertest.dsecurecloud.de' }
  }
}
