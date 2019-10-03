import { LoomRecordFilter } from './LoomRecordFilter'

describe('LoomRecordFilter', () => {
  test('#manuallyCheckForRecordMatch', async () => {
    const mismatchDidMatch = await LoomRecordFilter.manuallyCheckForFilterMatch(
      {
        filter: { id: '1' },
        record: { id: '2' }
      }
    )
    const matchDidMatch = await LoomRecordFilter.manuallyCheckForFilterMatch({
      filter: { id: '1' },
      record: { id: '1' }
    })
    expect(mismatchDidMatch).toBe(false)
    expect(matchDidMatch).toBe(true)
  })
})
