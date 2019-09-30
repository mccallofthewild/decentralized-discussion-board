import { LoomCache } from './LoomCache'
import PropTypes from 'prop-types'
/*
  Should:
  1. Save data to storage as it is saved to cache
  2. Load saved data on instantiation 
  3. Expire data that is too old
*/
export class PersistedCache extends LoomCache {
  constructor(arg) {
    PropTypes.checkPropTypes(
      {
        storageNamespace: PropTypes.string.isRequired,
        entryFromJSON: PropTypes.func
      },
      args,
      '#constructor',
      'PersistedCache'
    )
    super()
    // expire a record after one day
    this.millisecondsUntilExpiration = 24 * 60 * 60 * 1000
    this.storageNamespace = 'Optimistic-Response-Cache--' + storageNamespace
    this.entryFromJSON = entryFromJSON || (r => r)
    this.recordTimestamps = new Map()
    this.emitter.on(LoomCache.Events.MUTATION, ([key, value]) => {
      if (value) {
        this.recordTimestamps.set(key, Date.now())
      }
      this.saveToStorage()
    })
  }
  static loadFromStorage({ storageNamespace, entryFromJSON }) {
    const instance = new this({ storageNamespace, entryFromJSON })
    const json = localStorage.getItem(instance.storageNamespace)
    try {
      let { entries, recordTimestamps } = JSON.parse(json)
      recordTimestamps = new Map(recordTimestamps)
      for (let [key, val] of entries) {
        try {
          const timestamp = recordTimestamps.get(key)
          // ignore expired records (will be deleted next update)
          if (instance.millisecondsUntilExpiration < Date.now() - timestamp) {
            continue
          }
          instance.recordTimestamps.set(key, timestamp || Date.now())
          instance.set(key, instance.entryFromJSON(val))
        } catch (e) {
          console.warn(
            `Error thrown while fetching key, ${key} from ${instance.storageNamespace}`,
            e
          )
        }
      }
    } catch (e) {
      // fails when storage item isn't valid JSON
    }
    return instance
  }

  saveToStorage() {
    const data = {
      entries: this.entries(),
      recordTimestamps: this.recordTimestamps.entries()
    }
    localStorage.setItem(this.storageNamespace, JSON.stringify(data))
  }
}
