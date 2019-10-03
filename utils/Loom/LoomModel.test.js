describe('LOOM MODEL', () => {
  const { LoomModel } = require('./LoomModel')
  const { Loom } = require('./Loom')
  const loomApp = new Loom({
    name: 'Example',
    version: '0.0.1',
    getWallet() {},
    arweaveConfig: {
      // find hosts @ http://arweave.net/peers
      host: 'arweave.net' || '84.54.149.140' || '127.0.0.1',
      // port: 1984,
      protocol: 'http',
      timeout: 200000
    }
  })
  const model = loomApp.createModel({
    name: 'EXAMPLE',
    timestamps: true,
    props: {},
    immutable: true
  })
  test('#constructor', () => {})
})
