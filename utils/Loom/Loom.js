import Arweave from 'arweave/web'
import { LoomModel } from './LoomModel'

// rename ?
export class Loom {
  /**
   *Creates an instance of Loom.
   * @param {{ arweave: Arweave, name: string, version: string, env: string, getWallet: Function }} { arweave, name, version, env, getWallet = async _ => {} }
   * @memberof Loom
   */
  constructor({
    arweaveConfig,
    name,
    version,
    env,
    getWallet = async _ => {}
  }) {
    this.arweave = Arweave.init(arweaveConfig)
    this.name = name
    this.version = version
    this.getWallet = getWallet
    this.env = env
  }
  createModel({
    name,
    timestamps,
    versions,
    props,
    immutable,
    reducer,
    validator
  }) {
    return new LoomModel({
      name,
      timestamps,
      versions,
      immutable,
      props,
      reducer,
      validator,
      app: this
    })
  }
}
