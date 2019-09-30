import EventEmitter from 'eventemitter3'
export class LoomCache {
  constructor() {
    this.memory = new Map()
    this.emitter = new EventEmitter()
  }
  static get Events() {
    return {
      MUTATION: 'MUTATION'
    }
  }
  get(...args) {
    return this.memory.get(...args)
  }
  set(key, value) {
    this.emitter.emit(LoomCache.Events.MUTATION, [key, value])
    return this.memory.set(key, value)
  }
  delete(key) {
    this.emitter.emit(LoomCache.Events.MUTATION, [key])
    return this.memory.delete(key)
  }
  entries() {
    return [...this.memory]
  }
  static fromJSON(jsonString) {
    return new this(JSON.parse(jsonString))
  }
}
