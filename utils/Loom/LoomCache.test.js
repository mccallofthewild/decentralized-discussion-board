import { LoomCache } from './LoomCache'

describe(LoomCache.name, () => {
  const proto = LoomCache.prototype
  const data = {
    args: {
      set: ['keyName', 'valName']
    },
    expected: {
      entries: [['keyName', 'valName']]
    }
  }
  let cache
  test('#constructor', () => {
    cache = new LoomCache()
  })
  test('#emitter', () => {
    const autoReject = setTimeout(() => expect(false).toBe(true), 100)
    cache.emitter.on(LoomCache.Events.MUTATION, () => {
      clearTimeout(autoReject)
      expect(true).toBe(true)
    })
  })
  test('#set', () => {
    cache.set(...data.args.set)
  })

  test('#get', () => {
    expect(cache.get(data.args.set[0])).toBe(data.args.set[1])
  })
  test('#entries', () => {
    expect(cache.entries()).toBe(data.expected.entries)
  })
})
