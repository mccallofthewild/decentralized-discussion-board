import Arweave from 'arweave/web'
import { AR__SET_WALLET } from '../store-names/mutations'
import {
  AR__ADD_APP_TX_TAGS,
  AR__LOGIN,
  AR__LOGOUT
} from '../store-names/actions'

const arweave = Arweave.init(process.env.arweaveConfig)

export const state = _ => ({
  wallet: null
})
export const mutations = {
  [AR__SET_WALLET](state, payload) {
    state.wallet = payload
  }
}

export const actions = {
  [AR__LOGIN]({ commit }, { wallet } = {}) {
    const authWalletStorageKey = process.env.authWalletStorageKey
    const extractWalletFromStorage = () => {
      const storedWalletString = window.localStorage.getItem(
        authWalletStorageKey
      )
      if (storedWalletString) {
        try {
          const storedWalletJson = JSON.parse(storedWalletString)
          return storedWalletJson
        } catch (e) {
          window.localStorage.removeItem(authWalletStorageKey)
          return null
        }
      }
      return null
    }
    wallet = wallet || extractWalletFromStorage()
    if (wallet) {
      const formattedWallet = JSON.stringify(wallet)
      window.localStorage.setItem(authWalletStorageKey, formattedWallet)
      commit(AR__SET_WALLET, wallet)
    }
  },
  [AR__LOGOUT]({ commit }) {
    window.localStorage.removeItem(process.env.authWalletStorageKey)
    commit(AR__SET_WALLET, null)
  },
  [AR__ADD_APP_TX_TAGS]({ commit }, arweaveTx) {
    return arweaveTx
  }
}
