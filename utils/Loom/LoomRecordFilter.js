export class LoomRecordFilter {
  static async manuallyCheckForFilterMatch({ filter, record, loom: app }) {
    if (!record) return false

    for (let prop in filter) {
      const expected = filter[prop]
      const actual = record[prop]
      // if system tag
      if (
        [
          'from',
          'to',
          'quantity',
          'reward',
          'block_height',
          'block_indep_hash'
        ].includes(prop)
      ) {
        switch (prop) {
          case 'from': {
            let address = await app.arweave.wallets.ownerToAddress(
              record.__tx.owner
            )
            if (expected != address) return false
            break
          }
          default: {
            const systemTagValue = app.getTagValueFromTx(prop, record.__tx)
            if (systemTagValue != expected) return false
          }
        }
        continue
      }
      if ((prop == 'AND' || prop == 'OR') && Array.isArray(expected)) {
        const recordMatchBools = await Promise.all(
          expected.map(f => {
            return this.manuallyCheckForFilterMatch({
              filter: f,
              record,
              loom: app
            })
          })
        )
        // if AND logical, expect all values to match
        if (prop == 'AND') {
          const allValuesMatch = expected.every((f, i) => recordMatchBools[i])
          if (!allValuesMatch) return false
        }
        // if OR logical, expect some values to match
        if (prop == 'OR') {
          const someValuesMatch = expected.some((f, i) => recordMatchBools[i])
          if (!someValuesMatch) return false
        }
        continue
      }
      // if expected is falsey, expect falsey actual
      if (expected == null || expected == undefined) {
        if (actual == null || actual == undefined) continue
        return false
      }
      if (actual != expected) return false
    }
    return true
  }
}
