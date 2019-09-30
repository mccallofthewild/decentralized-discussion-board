import { Loom } from '../utils/Loom'

export const loomApp = new Loom({
  arweaveConfig: process.env.arweaveConfig,
  name: 'loom-chat-test',
  version: process.env.version,
  env: process.env.NODE_ENV == 'production' ? 'production' : 'test',
  getWallet: async _ => {
    const wallet = window.localStorage.getItem(
      process.env.storageKeys.auth.wallet
    )
    try {
      return JSON.parse(wallet)
    } catch (e) {
      return null
    }
  }
})
