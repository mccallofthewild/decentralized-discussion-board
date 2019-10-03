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
  get(key) {
    return this.memory.get(key)
  }
  set(key, value) {
    const rtn = this.memory.set(key, value)
    this.emitter.emit(LoomCache.Events.MUTATION, [key, value])
    return rtn
  }
  delete(key) {
    const rtn = this.memory.delete(key)
    this.emitter.emit(LoomCache.Events.MUTATION, [key])
    return rtn
  }
  entries() {
    return [...this.memory.entries()]
  }
  static fromJSON(jsonString) {
    return new this(JSON.parse(jsonString))
  }
}
