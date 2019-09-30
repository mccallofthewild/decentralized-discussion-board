import { LoomProp } from './LoomProp'
import { requireArguments } from './utils/requireArguments'
import { MutationTypes, SharedTagNames } from './constants'
import { concatObjects } from './utils'
import { LoomCache } from './LoomCache'
import { PersistedCache } from './PersistedCache'
import Transaction from 'arweave/web/lib/transaction'

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
    versions = false,
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
    this.hasVersions = versions
    this.isImmutable = immutable
    this.recordVersionReducer = reducer
    this.customRecordValidator = validator
    this.memoryCache = {
      txs: {},
      records: {}
    }
    this.requestCache = new LoomCache()
    this.optimisticRecordCache = PersistedCache.loadFromStorage({
      storageNamespace: this.name,
      entryFromJSON(r) {
        r.__tx = new Transaction(r.__tx)
      }
    })
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
          .join(', ')} on ${this.name} Record!`
      )
    }
    await this.customRecordValidator(record)
    return true
  }

  async toTransaction(data, txOptions = {}) {
    let recordMutationType = MutationTypes.UPDATE
    let existingVersions = []
    if (data.id) {
      if (this.hasVersions) {
        console.log('loading versions')
        const existingRecord = await this.find({ id: data.id })
        if (existingRecord) existingVersions = existingRecord.versions
      }
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
    if (this.isImmutable) {
      const { id } = data
      const existing = await this.findAll({ filter: { id }, first: 1 })
      if (existing.length) {
        throw new Error(`Update cancelled! "${this.name}" Model is immutable!`)
      }
    }
    const uInt8ArrayStorageData = new TextEncoder().encode(
      JSON.stringify({ ...storageData })
    )

    const tx = await this.app.arweave.createTransaction(
      {
        ...txOptions,
        data: uInt8ArrayStorageData
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

    await this.app.arweave.transactions.sign(tx, wallet)
    const { ...rawRecord } = this.fromTransaction({ transaction: tx })
    const record = this.addDynamicProps(rawRecord, {
      versions: [],
      transaction: tx
    })
    if (record.versions) {
      // record.versions.push(...existingVersions)
      record.versions.unshift(record)
    }
    await this.validateRecord(record)
    const res = await this.app.arweave.transactions.post(tx)

    switch (res.status) {
      case 200: {
        // only add to cache if it's successful (don't add the transaction because it's only needed when we load all of them)
        console.log('added tx to cache')
        this.optimisticRecordCache.set(record.id, record)
        console.log('added record to cache')
        return record
      }
      case 400: {
        throw new Error('invalid transaction')
      }
      case 500: {
        throw new Error('transaction error')
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

  async find(filter) {
    const { id } = filter
    const cached = this.getFromMemoryCache(id, { record: true })
    if (!!cached) return cached
    let [record] = await this.findAll({ filter, first: 1 })
    if (record) {
      this.optimisticRecordCache.delete(id)
    } else {
      return this.optimisticRecordCache.get(id)
    }
    return record
  }
  async findAll({ filter = {}, first = -1, skip = 0, withOptimistic = false }) {
    let findAllQuery = filter
    if (this.isImmutable || !Object.values(filter).length) {
      findAllQuery = {
        ...filter,
        [SharedTagNames.MUTATION_TYPE]: MutationTypes.CREATE
      }
    }
    const txIds = await this.findAllTransactionIds({
      ...findAllQuery
      /* 
        querying *only* CREATE mutations is tempting, but invalidates the search,
        as parameters may have been updated since creation. 
        However, if there is no search filter, or the model is immutable, this 
        won't make a difference.
      */
    })
    if (!txIds.length) return []

    /*
      Cannot use Array#slice directly for pagination, as it would only slice off the first 
      X transactions, not the first X unique transactions
    */
    const txRecordIdsSet = new Set()
    let sliceStart = skip
    // if amount selector is default...
    let sliceEnd = first == -1 ? txIds.length : first + skip
    // do while in case first == -1 (only one iteration needed)
    console.log(this.name + '#findAll', filter, 'txIds', txIds)
    do {
      // take all query result id's from where we started off last time to
      const slicedIds = txIds.slice(sliceStart, sliceEnd)
      // load each record
      try {
        console.log(this.name + '#findAll (sliced ids)', slicedIds)
        const records = await this.loadTransactionRecords(slicedIds)
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
    console.log(this.name + '#findAll', filter, 'txIds', txIds, txRecordIds)
    // array of unique ID's
    const uniqueRecords = await Promise.all(
      txRecordIds.map(async (txRecordId, index) => {
        const cached = this.getFromMemoryCache(txRecordId, { record: true })
        if (cached) return cached

        // at least one item exists because that's what we're mapping over
        let txRecordVersionsIds = await this.findAllTransactionIds({
          id: txRecordId
        })

        if (!txRecordVersionsIds.length) return null

        if (this.isImmutable) {
          // immutable means only the first record is valid
          let [first] = txRecordVersionsIds
          txRecordVersionsIds = [first]
        }
        // if no versions
        if (!this.hasVersions) {
          /*
             if it has versions, we *do* need to load every transaction.
             Otherwise, we only need the last valid record, 
             as it is the most recent update, and the first record, 
             as a basis to validate the last record
          */
          const [first] = txRecordVersionsIds
          let lastValidRecord = null
          let i = 1
          while (txRecordVersionsIds.length - i) {
            const recordId = txRecordVersionsIds[txRecordVersionsIds.length - i]
            const [record] = await this.loadTransactionRecords([recordId])
            try {
              await this.validateRecord(record)
              lastValidRecord = record
              break
            } catch (e) {}
            i++
          }
          txRecordVersionsIds = !lastValidRecord
            ? [first]
            : [first, lastValidRecord]
        }
        const txRecordVersions = await this.loadTransactionRecords(
          txRecordVersionsIds
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
        if (this.hasVersions) {
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
    const finalRecords = uniqueRecords.filter(record => {
      if (!record) return false
      if (this.optimisticRecordCache.get(record.id)) {
        // delete when the real record loads
        this.optimisticRecordCache.delete(record.id)
      }
      this.addToMemoryCache(record)
      return true
    })
    const optimisiticRecords = this.optimisticRecordCache
      .entries()
      .map(([key, val]) => val)
    // prepend optimisitic records
    if (withOptimistic || !Object.values(filter).length) {
      return [...withOptimistic, ...finalRecords]
    }
    return finalRecords
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
    if (this.hasVersions) {
      finalRecordVersion = {
        ...finalRecordVersion,
        versions: recordVersions
      }
    }

    return finalRecordVersion
  }

  async loadTransactionRecords(txIds) {
    const nullifiableRecords = await Promise.all(
      txIds.map(async id => {
        try {
          if (!id) return null
          const tx = await this.loadTransactionById(id)
          return await this.fromTransaction({ transaction: tx })
        } catch (e) {
          console.log(this.name + '#loadTransactionRecords (ERROR!)', id, txIds)
          console.error(this.name + '#loadTransactionRecords (ERROR!)', e)
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

  async findAllTransactionIds(filter) {
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
    this.requestCache.set(queryJsonStr, txIds)
    return txIds
  }

  objToArql(obj, { isProp = false, isPropValue = false } = {}) {
    const sharedTagNames = Object.values(SharedTagNames)
    // (recursive call) process filter values
    if (typeof obj != 'object') {
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
