import { LoomProp } from './LoomProp'
import { requireArguments } from './utils/requireArguments'
import { MutationTypes, SharedTagNames } from './constants'
import { concatObjects } from './utils'
import { LoomCache } from './LoomCache'
import { PersistedCache } from './PersistedCache'
import Transaction from 'arweave/web/lib/transaction'
import { Loom } from './Loom'
import { LoomRecordFilter } from './LoomRecordFilter'

const config = {
  get tagPropertyPrefix() {
    return 'Data-Prop-'
  }
}

export class LoomModel {
  /**
   *Creates an instance of LoomModel.
   * @param {Object} arg
   * @param {string} arg.name
   * @param {Object.<string, { required: boolean, storage: boolean }>} arg.props
   * @param {Loom} arg.app
   * @param {boolean} arg.timestamps - whether to dynamically add `createdAt` and `updatedAt` timestamps
   * @param {boolean} arg.versions - whether to dynamically add a record's history as `versions`
   * @param {function} arg.reducer - merges chronological array of recordVersions into one object. Can include permissions/auth logic
   * @memberof LoomModel
   */
  constructor({
    name,
    app,
    props,
    timestamps = false,
    immutable = false,
    reducer = this.defaultReducer,
    // should throw error when invalid
    validator = async record => true
  }) {
    requireArguments(
      { name, app, props },
      { caller: LoomModel.name + '#constructor' }
    )

    this.app = app
    this.name = name
    this.props = Object.entries(props).map(
      ([name, prop]) => new LoomProp({ name, ...prop })
    )
    // add id by default
    this.props.push(
      new LoomProp({
        name: 'id',
        required: true,
        storage: false
      })
    )
    this.hasTimestamps = timestamps
    this.isImmutable = immutable
    this.recordVersionReducer = reducer
    this.customRecordValidator = validator
    this.memoryCache = {
      txs: {},
      records: {}
    }
    this.requestCache = new LoomCache()
    this.optimisticRecordCache = PersistedCache.loadFromStorage({
      storageNamespace: 'Optimistic-Response-Cache--' + this.name,
      entryFromJSON(r) {
        r.__tx = new Transaction(r.__tx)
        return r
      }
    })

    for (let method of Object.getOwnPropertyNames(this.__proto__)) {
      const original = this.__proto__[method]
      try {
        this[method] = (...args) => {
          const warn = e =>
            console.warn(
              `Error in ${this.__proto__.constructor.name}/${this.name}#${method}`,
              e
            )
          try {
            let rtn = original.bind(this)(...args)
            if (rtn instanceof Promise) {
              return (async () => {
                try {
                  await rtn
                  return rtn
                } catch (e) {
                  warn(e)
                  throw e
                }
              })()
            }
            return rtn
          } catch (e) {
            warn(e)
            throw e
          }
        }
      } catch (e) {
        // expected to fail on getters
      }
    }
  }

  get defaultReducer() {
    return versions => concatObjects(versions)
  }

  propsToTags(obj) {
    return Object.entries(obj).map(([prop, value]) => [
      config.tagPropertyPrefix + prop,
      JSON.stringify(value || null)
    ])
  }

  tagsToProps(tags) {
    const entries = tags
      .filter(({ name, value }) => {
        try {
          JSON.parse(value)
          return true
        } catch (e) {
          return false
        }
      })
      .map(({ name, value }) => [
        name.replace(config.tagPropertyPrefix, ''),
        JSON.parse(value)
      ])
    return Object.fromEntries(entries)
  }

  fromTransaction({ transaction }) {
    const tags = transaction.get('tags').map(tag => {
      let name = tag.get('name', { decode: true, string: true })
      let value = tag.get('value', { decode: true, string: true })
      return { name, value }
    })
    const data = transaction.get('data', { decode: true, string: true })
    const dataTags = tags.filter(({ name }) =>
      name.includes(config.tagPropertyPrefix)
    )
    let record = {
      ...this.tagsToProps(dataTags),
      ...JSON.parse(data),
      __tx: transaction
    }
    if (this.hasTimestamps) {
      const time = this.getDateTime(transaction)
      record = {
        ...record,
        createdAt: time,
        updatedAt: time
      }
    }
    return record
  }

  get errorTypes() {
    class ArweaveError extends Error {}
    class RecordValidationError extends ArweaveError {}
    return {
      RecordValidationError
    }
  }

  getDateTime(tx) {
    const tags = tx.get('tags')
    for (const tag of tags) {
      const key = tag.get('name', { decode: true, string: true })
      if (key == SharedTagNames.DATE_TIME) {
        const value = tag.get('value', { decode: true, string: true })
        return value
      }
    }
  }

  findMissingRequiredProps(obj) {
    return this.props.filter(prop => prop.isRequired && !obj[prop.name])
  }

  cleanseProperties(recordDraft) {
    return this.props.reduce((prev, prop) => {
      return {
        ...prev,
        [prop.name]: recordDraft[prop.name]
      }
    }, {})
  }

  async validateRecord(record) {
    const missingProps = this.findMissingRequiredProps(record)
    if (missingProps.length) {
      throw new this.errorTypes.RecordValidationError(
        `Missing required props: ${missingProps
          .map(p => p.name)
          .join(', ')} on ${this.name} Record No. ${
          record.id
        } (${this.getDateTime(record.__tx)})!`
      )
    }
    let result = await this.customRecordValidator(record)
    return result
  }

  async toTransaction(data, txOptions = {}) {
    let recordMutationType = MutationTypes.UPDATE
    let existingVersions = []

    if (data.id && !this.isImmutable) {
    } else {
      data = {
        ...data,
        id: this.uuidv4()
      }
      recordMutationType = MutationTypes.CREATE
    }
    data = this.cleanseProperties(data)
    const storageProps = this.props
      .filter(prop => prop.isStorage)
      .map(prop => prop.name)
    const wallet = await this.app.getWallet()
    if (!wallet) throw new Error('getWallet did not return wallet')
    const tagData = { ...data }
    const storageData = {}
    for (let prop of storageProps) {
      storageData[prop] = tagData[prop]
      delete tagData[prop]
    }
    const txData = JSON.stringify({ ...storageData })

    const tx = await this.app.arweave.createTransaction(
      {
        ...txOptions,
        data: txData
      },
      wallet
    )

    const tagEntries = this.propsToTags({ ...tagData })

    for (const [name, value] of tagEntries) tx.addTag(name, value)

    const {
      APP_NAME,
      APP_VERSION,
      APP_ENV,
      DATE_TIME,
      CONTENT_TYPE,
      DATA_MODEL,
      MUTATION_TYPE
    } = SharedTagNames

    tx.addTag(APP_NAME, this.app.name)
    tx.addTag(DATA_MODEL, this.name)
    tx.addTag(APP_ENV, this.app.env)
    tx.addTag(APP_VERSION, this.app.version)
    tx.addTag(CONTENT_TYPE, 'application/json')
    tx.addTag(DATE_TIME, new Date().toISOString())
    tx.addTag(MUTATION_TYPE, recordMutationType)

    const cacheTimestamp = Date.now()
    const address = await this.app.arweave.wallets.jwkToAddress(wallet)
    const balance = await this.app.arweave.wallets.getBalance(address)
    if (balance < tx.reward) {
      throw new Error('not enough funds!')
    }
    await this.app.arweave.transactions.sign(tx, wallet)
    const isVerified = await this.app.arweave.transactions.verify(tx)
    if (!isVerified) {
      throw new Error('Failed to sign transaction')
    }
    const res = await this.app.arweave.transactions.post(tx)

    const { ...rawRecord } = this.fromTransaction({ transaction: tx })

    const record = this.addDynamicProps(rawRecord, {
      versions: [],
      transaction: tx
    })
    // if (record.versions) {
    //   // record.versions.push(...existingVersions)
    //   record.versions.unshift(record)
    // }
    await this.validateRecord(record)

    // set optimistic record before, so the actual record will be newer
    this.optimisticRecordCache.set(record.id, record)
    this.optimisticRecordCache.recordTimestamps.set(record.id, cacheTimestamp)

    switch (res.status) {
      case 200: {
        // only add to cache if it's successful (don't add the transaction because it's only needed when we load all of them)
        return record
      }
      default: {
        // if failed, delete cached version
        this.optimisticRecordCache.delete(record.id)
        switch (res.status) {
          case 400: {
            console.error(400, 'INVALID TRANSACTION')
            throw new Error('invalid transaction')
          }
          case 500: {
            console.error(500, 'TRANSACTION ERROR')
            throw new Error('transaction error')
          }
        }
      }
    }
  }

  addToMemoryCache(item) {
    requireArguments({ item }, { caller: 'addToMemoryCache' })
    const isRecord = !!item.__tx
    this.memoryCache[isRecord ? 'records' : 'txs'][item.id] = item
  }

  getFromMemoryCache(itemId, { record = false } = {}) {
    return this.memoryCache[record ? 'records' : 'txs'][itemId]
  }

  tryOptimisticResponse(id, record) {
    const optimisiticRecord = this.optimisticRecordCache.get(id)
    if (record) {
      // if optimistic record is newer, use it
      if (
        new Date(this.getDateTime(record.__tx)).getTime() <
        this.optimisticRecordCache.recordTimestamps.get(id)
      ) {
        console.log(`Optimistic ${this.name} Record is newer`)
        return optimisiticRecord
      } else {
        // if it's older or the same age, remove the optimistic record
        this.optimisticRecordCache.delete(id)
      }
    } else {
      // if there is no record, return optimistic record
      return optimisiticRecord
    }
    return record
  }

  async find(filter, { withVersions = false } = {}) {
    const { id } = filter
    requireArguments({ id }, { caller: `LoomModel(${this.name})#find` })
    let record = this.getFromMemoryCache(id, { record: true })
    if (!!record) {
      try {
        await this.validateRecord(record)
      } catch (e) {
        record = null
      }
    }

    const logStatus = (record, { id }) =>
      record && record.id != id
        ? console.log('#FIND ERROR', this.name, record.id, id)
        : null
    logStatus(record, filter)
    // if there wasn't a valid version in the cache
    if (!record) {
      ;[record] = await this.findAll({ filter, first: 1, withVersions })
    }
    logStatus(record, filter)
    record = this.tryOptimisticResponse(id, record)
    logStatus(record, filter)
    return record
  }

  getTagValueFromTx(tagName, tx) {
    let tag = tx.get('tags').find(tag => {
      if (tagName == tag.get('name', { decode: true, string: true })) {
        return true
      }
    })
    if (!tag) return null
    return tag.get('value', { decode: true, string: true })
  }

  async manuallyCheckForFilterMatch(filter, record) {
    return await LoomRecordFilter.manuallyCheckForFilterMatch({
      filter,
      record,
      loom: this.app
    })
  }

  async findAll({ filter = {} }) {
    const txIds = await this.findAllTransactionIds({})
    const rawRecords = await this.loadRecordsByTxIds(txIds)
    const optimisticRecords = this.optimisticRecordCache
      .entries()
      .map(([key, val]) => val)
    const formattedRecords = rawRecords.map(r =>
      this.addDynamicProps(r, { versions: [], transaction: r.__tx })
    )
    const combinedRecords = [...formattedRecords, ...optimisticRecords]
    const areValid = await Promise.all(
      combinedRecords.map(async r => {
        try {
          await this.validateRecord(r)
          return await this.manuallyCheckForFilterMatch(filter, r)
        } catch (e) {
          return false
        }
      })
    )
    const filteredRecords = combinedRecords.filter((r, i) => areValid[i])
    const sortedRecords = filteredRecords
      .sort((a, b) => {
        const [aTime, bTime] = [
          this.getDateTime(a.__tx),
          this.getDateTime(b.__tx)
        ]
        return aTime > bTime ? 1 : aTime == bTime ? 0 : aTime < bTime ? -1 : 0
      })
      .reverse()
    const uniqueRecords = Object.values(
      sortedRecords.reduce((prev, r) => {
        prev[r.id] = r
        return prev
      }, {})
    )
    const versionedRecords = uniqueRecords.map(r => {
      r.versions = sortedRecords.filter(v => v.id == r.id)
      return r
    })
    return versionedRecords
  }

  async findAll2({
    filter = {},
    first = -1,
    skip = 0,
    withOptimistic = true,
    withVersions = false
  }) {
    console.log('TEMP DISABLING ARQL FILTERS IN FAVOR OF CLIENT SIDE FILTERING')
    filter = {}
    let findAllQuery = filter
    if (this.isImmutable) {
      findAllQuery = {
        ...filter,
        [SharedTagNames.MUTATION_TYPE]: MutationTypes.CREATE
      }
    }
    let txIds = await this.findAllTransactionIds({
      ...findAllQuery
      /* 
        querying *only* CREATE mutations is tempting, but invalidates the search,
        as parameters may have been updated since creation. 
        However, if there is no search filter, or the model is immutable, this 
        won't make a difference.
      */
    })

    txIds = txIds || []

    /*
      Cannot use Array#slice directly for pagination, as it would only slice off the first 
      X transactions, not the first X unique transactions
    */
    const txRecordIdsSet = new Set()
    let sliceStart = skip
    // if amount selector is default...
    let sliceEnd = first == -1 ? txIds.length : first + skip
    // do while in case first == -1 (only one iteration needed)
    do {
      // take all query result id's from where we started off last time to
      const slicedIds = txIds.slice(sliceStart, sliceEnd)
      // load each record
      try {
        const records = await this.loadRecordsByTxIds(slicedIds)
        // add each id to the unique id's Set
        records.forEach(r => txRecordIdsSet.add(r.id))
      } catch (e) {
        console.error(e)
      }

      // next iteration, start where we left off
      sliceStart = sliceEnd
      sliceEnd = sliceEnd + first
    } while (sliceStart < txIds.length && txRecordIdsSet.size < first)

    const txRecordIds = [...txRecordIdsSet]
    // array of unique ID's
    const uniqueRecords = await Promise.all(
      txRecordIds.map(async (txRecordId, index) => {
        const cached = this.getFromMemoryCache(txRecordId, { record: true })
        if (cached) return cached

        // at least one item exists because that's what we're mapping over
        let recordVersionsTxIds = await this.findAllTransactionIds({
          id: txRecordId
        })

        if (!recordVersionsTxIds.length) return null

        if (this.isImmutable) {
          // immutable means only the first record is valid
          let [first] = recordVersionsTxIds
          recordVersionsTxIds = [first]
        }
        // if no versions
        if (!withVersions) {
          /*
             if it has versions, we *do* need to load every transaction.
             Otherwise, we only need the last valid record, 
             as it is the most recent update, and the first record, 
             as a basis to validate the last record
          */
          const [first] = recordVersionsTxIds
          let lastValidRecord = null
          let i = 1
          while (recordVersionsTxIds.length - i) {
            const recordTxId =
              recordVersionsTxIds[recordVersionsTxIds.length - i]
            const [record] = await this.loadRecordsByTxIds([recordTxId])
            try {
              await this.validateRecord(record)
              lastValidRecord = record
              break
            } catch (e) {}
            i++
          }
          recordVersionsTxIds = !lastValidRecord
            ? [first]
            : [first, lastValidRecord.__tx.id]
        }
        const txRecordVersions = await this.loadRecordsByTxIds(
          recordVersionsTxIds
        )

        let prevFilterRecordTime = 0

        let recordVersions = txRecordVersions
          // filtering out non-sequential transactions
          .filter(({ id, createdAt, __tx: tx }) => {
            const time = new Date(this.getDateTime(tx)).getTime()
            /* 
              saved record times must be sequential.
              If record times don't indicate the same chronological order as 
              the transactions, someone is tampering with them
            */
            if (prevFilterRecordTime <= time) {
              prevFilterRecordTime = time
              return true
            }
            return false
          })

        // ensure that record actually matches filter (not just a previous update record)
        if (1 < recordVersions.length) {
          const finalRecordVerion = [...recordVersions].pop()
          const filteredRecordExists = txIds.includes(finalRecordVerion.id)
          if (!filteredRecordExists) return null
        }
        // if it's immutable only the first version is needed and/or valid
        if (this.isImmutable) {
          recordVersions = recordVersions.length ? [recordVersions[0]] : []
        }

        const validRecordVersions = []
        if (withVersions) {
          // time travel up through each record version
          await recordVersions.reduce(async (cumulative, recordVersion) => {
            cumulative = await cumulative
            cumulative = [...cumulative, recordVersion]
            const version = await this.recordVersionReducer(cumulative)
            const alreadyAdded = validRecordVersions.find(
              v => v.__tx.id == version.__tx.id
            )
            if (!alreadyAdded) {
              try {
                await this.validateRecord(version)
                validRecordVersions.push(version)
              } catch (e) {}
            }
            return cumulative
          }, [])
        } else {
          // else, only push the final version
          const final = await this.recordVersionReducer(recordVersions)
          validRecordVersions.push(final)
        }
        if (!validRecordVersions.length) return null
        let finalRecordVersion =
          validRecordVersions[validRecordVersions.length - 1]

        return this.addDynamicProps(finalRecordVersion, {
          versions: validRecordVersions,
          transaction: finalRecordVersion.__tx
        })
      })
    )
    // remove null records and add records to memory cache
    let finalRecords = uniqueRecords
      .filter(record => {
        if (!record) return false
        return true
      })
      .map(record => {
        this.addToMemoryCache(record)
        return this.tryOptimisticResponse(record.id, record)
      })
    // prepend optimisitic records
    if (withOptimistic || !Object.values(filter).length) {
      const optimisiticRecords = this.optimisticRecordCache
        .entries()
        .map(([key, val]) => val)
        .filter(r => !!r)

      finalRecords = [...optimisiticRecords, ...finalRecords]
    }
    const finalRecordsSet = new Set([...finalRecords])
    for (let r of finalRecords) {
      const isMatch = await this.manuallyCheckForFilterMatch(filter, r)
      if (!isMatch) finalRecordsSet.delete(r)
    }
    finalRecords = [...finalRecordsSet]
    finalRecords = Object.values(
      finalRecords.reduce((prev, r) => {
        prev[r.id] = r
        return prev
      }, {})
    )
    return finalRecords.sort((a, b) => {
      const [aTime, bTime] = [
        this.getDateTime(a.__tx),
        this.getDateTime(b.__tx)
      ]
      return aTime > bTime ? 1 : aTime == bTime ? 0 : aTime < bTime ? -1 : 0
    })
  }

  addDynamicProps(
    finalRecordVersion,
    { versions: recordVersions = [], transaction }
  ) {
    finalRecordVersion = { ...finalRecordVersion }
    if (!finalRecordVersion.__tx) {
      finalRecordVersion.__tx = transaction
    }
    if (this.hasTimestamps) {
      const updatedAt = this.getDateTime(finalRecordVersion.__tx)
      const createdAt = recordVersions.length
        ? this.getDateTime(recordVersions[0].__tx)
        : updatedAt
      finalRecordVersion = {
        ...finalRecordVersion,
        updatedAt,
        createdAt
      }
    }

    finalRecordVersion = {
      ...finalRecordVersion,
      versions: recordVersions
    }

    return finalRecordVersion
  }

  async loadRecordsByTxIds(txIds) {
    const nullifiableRecords = await Promise.all(
      txIds.map(async id => {
        try {
          if (!id) return null
          const tx = await this.loadTransactionById(id)
          return await this.fromTransaction({ transaction: tx })
        } catch (e) {
          console.log(this.name + '#loadRecordsByTxIds (ERROR!)', e.message)
          return null
        }
      })
    )
    return nullifiableRecords.filter(r => !!r)
  }
  async loadTransactionById(id) {
    const cachedTx = this.getFromMemoryCache(id)
    const tx = cachedTx ? cachedTx : await this.app.arweave.transactions.get(id)
    this.addToMemoryCache(tx)
    return tx
  }

  async findAllTransactionIds(filter = {}) {
    const {
      APP_NAME,
      APP_VERSION,
      APP_ENV,
      DATA_MODEL,
      MUTATION_TYPE
    } = SharedTagNames
    const query = this.objToArql({
      [APP_NAME]: this.app.name,
      [APP_ENV]: this.app.env,
      [DATA_MODEL]: this.name,
      ...filter
      // We want all data from all versions
      // [APP_VERSION]: this.app.version,
    })

    const queryJsonStr = JSON.stringify(query)
    const cached = this.requestCache.get(queryJsonStr)
    if (cached) return cached
    let txIds = await this.app.arweave.arql(query)
    txIds = txIds || []
    this.requestCache.set(queryJsonStr, txIds)
    return txIds
  }

  objToArql(obj, { isProp = false, isPropValue = false } = {}) {
    const sharedTagNames = Object.values(SharedTagNames)
    // (recursive call) process filter values
    if (typeof obj != 'object' || obj == null || obj instanceof Array) {
      // (recursive call) return formatted property
      if (isProp) return config.tagPropertyPrefix + obj
      // (recursive call) return stringified record property value (un-stringified on record load)
      if (isPropValue) return JSON.stringify(obj)
      return obj
    }
    // filter out undefined values
    const entries = Object.entries(obj).filter(([key, val]) => {
      return val !== undefined
    })

    // turn top level queries into flat array of queries and recursively process sub-queries
    const queries = entries.map(([prop, val]) => {
      /*
        when OR statement, need to take this:
        OR: [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}]
        and turn it into a recursive arql structure
      */
      const isLogical = ['AND', 'OR'].includes(prop)
      const isMetadata = sharedTagNames.includes(obj)
      const isProp = !!this.props.find(p => p.name == prop)
      const isPropValue = isProp
      if (isLogical) {
        const logicalQueries = val.map(filter => this.objToArql(filter))
        return this.buildArqlTree(logicalQueries, {
          operator: prop.toLowerCase()
        })
      }
      return {
        op: 'equals',
        expr1: this.objToArql(prop, {
          isProp
        }),
        expr2: this.objToArql(val, {
          isPropValue
        })
      }
    })
    return queries.length == 1 ? queries[0] : this.buildArqlTree(queries)
  }

  buildArqlTree(queries, { operator = 'and' } = {}) {
    // because arql queries are limited to two parameters, every query
    const depth = Math.ceil(queries.length ** (1 / 2))
    const buildTree = (currentDepth = 0) => {
      const nextDepth = currentDepth + 1
      let expr1, expr2
      if (nextDepth == depth || queries.length <= 2) {
        expr1 = queries.pop()
        expr2 = queries.pop()
      } else {
        expr1 = buildTree(nextDepth)
        expr2 = buildTree(nextDepth)
      }
      return expr2
        ? {
            op: operator,
            expr1,
            expr2
          }
        : {
            op: 'or',
            expr1,
            expr2: expr1
          }
    }
    return buildTree()
  }
  uuidv4() {
    const goodUUID = _ =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    const bestUUID = _ =>
      ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      )
    return window.crypto ? bestUUID() : goodUUID()
  }
}
