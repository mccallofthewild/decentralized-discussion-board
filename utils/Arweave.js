//- @flow
// @ts-ignore
import Arweave from 'arweave/web'
import { makeExecutableSchema } from 'graphql-tools'
import { buildSchema } from 'graphql'

const arweave = Arweave.init(process.env.arweaveConfig)

const config = {
  get tagPropertyPrefix() {
    return 'Data-Prop-'
  },
  get directiveNames() {
    return {
      storage: 'storage',
      model: 'model'
    }
  }
}
export class ArGraphQLApp {
  constructor({ name, version, graphQLTypeDefs }) {
    this.name = name
    this.version = version
    /** @param {Model[]} models */
    this.models = []
    this.graphQLTypeDefs = graphQLTypeDefs
    this.registerModelsFromSchema(buildSchema(graphQLTypeDefs))
  }

  buildSchemaFromModels() {
    const types = {
      Query: '',
      Mutation: '',
      input: ''
    }
    const resolvers = {
      Mutation: {},
      Query: {}
    }
    for (let model of this.models) {
      const {
        types: { Query: _query, Mutation: _mutation, input: _input },
        resolvers: { Query: queryResolvers, Mutation: mutationResolvers }
      } = model.definitions
      types.Query += '\n' + _query
      types.Mutation += '\n' + _mutation
      types.input += '\n' + _input
      resolvers.Mutation = {
        ...resolvers.Mutation,
        ...mutationResolvers
      }
      resolvers.Query = {
        ...resolvers.Query,
        ...queryResolvers
      }
    }
    const typeDefs = /* GraphQL */ `
      ${this.graphQLTypeDefs}
      ${types.input}
      type Mutation {
        ${types.Mutation}
      }
      type Query {
        ${types.Query}
      }
    `
    return makeExecutableSchema({
      typeDefs,
      resolvers
    })
  }

  isModel(typeObject) {
    return (
      typeObject.astNode &&
      !!typeObject.astNode.directives.find(
        d => d.name.value == config.directiveNames.model
      )
    )
  }
  registerModelsFromSchema(gqlSchema) {
    const types = Object.entries(gqlSchema._typeMap)
    const modelTypes = types.filter(([typeName, typeObject]) =>
      this.isModel(typeObject)
    )
    for (const [typeName, typeObject] of modelTypes) {
      const props = []
      for (const [fieldName, fieldObject] of Object.entries(
        typeObject._fields
      )) {
        const fieldTypeString = fieldObject.type.inspect()
        // if (fieldName == 'votes') debugger
        const typeName =
          fieldObject.type.name ||
          fieldObject.type.ofType.name ||
          fieldObject.type.ofType.ofType.name ||
          fieldObject.type.ofType.ofType.ofType.name ||
          fieldObject.type.ofType.ofType.ofType.ofType.name
        const prop = {
          name: fieldName,
          typeDef: fieldTypeString,
          typeName: typeName,
          isRequired: fieldTypeString.endsWith('!'),
          isPlural: fieldTypeString.startsWith('['),
          isModel: !!modelTypes.find(([name]) => name == typeName),
          isStorage: false
        }
        if (fieldName == 'votes') debugger

        for (const directive of typeObject.astNode.directives) {
          switch (directive.name.value) {
            case config.directiveNames.storage:
              prop.isStorage = true
              break
          }
        }
        props.push(prop)
      }
      this.registerModel({ name: typeName, props: props })
    }
  }
  registerModel({ name, props }) {
    this.models.push(
      new Model({
        name,
        props,
        app: this
      })
    )
  }
}
class ModelProp {
  constructor({
    isStorage = false,
    isModel = false,
    isRequired = false,
    isPlural = false,
    typeDef,
    typeName,
    name
  }) {
    this.isStorage = isStorage
    this.isModel = isModel
    this.isRequired = isRequired
    this.isPlural = isPlural
    this.name = name
    this.typeDef = typeDef
    this.typeName = typeName
  }
}

class Model {
  /**
   *Creates an instance of Model.
   * @param {Object} arg
   * @param {string} arg.name
   * @param {ModelProp[]} arg.props
   * @param {ArGraphQLApp} arg.app
   * @memberof Model
   */
  constructor({ name, props, app }) {
    this.app = app
    this.name = name
    this.props = props
  }

  dropCaseFirstLetter(str) {
    let copy = `${str}`.split('')
    copy[0] = copy[0].toLowerCase()
    copy = copy.join('')
    return copy
  }
  get definitions() {
    const dropCaseName = this.dropCaseFirstLetter(this.name)
    const inputTypeName = `${this.name}Input`
    const inputFields = this.props
      .filter(prop => prop.name == 'createdAt' || prop.name == 'updatedAt')
      .map(prop => {
        console.log('isModel', prop.isModel)
        const type =
          prop.name == 'id'
            ? 'ID'
            : prop.isModel
            ? prop.typeDef.replace(prop.typeName, 'ID')
            : prop.typeDef
        const name = !prop.isModel
          ? prop.name
          : prop.isPlural
          ? prop.name + 'Ids'
          : prop.name + 'Id'
        return `${name}: ${type}`
      })
      .join('\n')
    console.log(inputFields)
    const searchTypeName = `${this.name}SearchInput`
    const createOrUpdateMutationName = `createOrUpdate${this.name}`
    return {
      types: {
        input: /* GraphQL */ `
          input ${inputTypeName} {
            # if 'id' is present, will update. Otherwise, will create.
            ${inputFields}
          }
        `,
        Mutation: `
          ${createOrUpdateMutationName}(${dropCaseName}: ${inputTypeName}): ${this.name}!
        `,
        Query: `
          ${dropCaseName}(id: ID!): ${this.name}
        `
      },
      resolvers: {
        Mutation: {
          [createOrUpdateMutationName]() {}
        },
        Query: {
          [dropCaseName]() {}
        }
      }
    }
  }

  now() {
    return new Date().toISOString()
  }

  static propsToTags(obj) {
    return Object.entries(obj).map(([prop, value]) => [
      config.tagPropertyPrefix + prop,
      JSON.stringify(value)
    ])
  }

  static tagsToProps(tags) {
    const entries = tags.map(({ name, value }) => [
      tagName.replace(config.tagPropertyPrefix, ''),
      JSON.parse(value)
    ])
    return Object.fromEntries(entries)
  }

  static async fromTransaction({ transaction }) {
    const { tags, data } = transaction
    const dataTags = tags.filter(({ name }) =>
      name.includes(config.tagPropertyPrefix)
    )
    return {
      ...this.tagsToProps(dataTags),
      ...JSON.parse(data)
    }
  }

  async save({ storageProps = [] }) {
    const tagData = { ...this }
    const storageData = {}
    for (let prop of storageProps) {
      storageData[prop] = copy[prop]
      delete copy[prop]
    }
    const tx = await arweave.createTransaction(
      {
        data: JSON.stringify({ ...this })
      },
      wallet
    )
    const tagEntries = this.__proto__.propsToTags(tagData)
    for (const [name, value] of tagEntries) tx.addTag(name, value)
    tx.addTag('App-Name', 'loom-chat')
    tx.addTag('App-Version', this.app.version)
    tx.addTag('Content-Type', 'application/json')
    tx.addTag('Data-Model', this.name)
    await arweave.transactions.sign(tx, wallet)
    await arweave.transactions.post(tx)
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
