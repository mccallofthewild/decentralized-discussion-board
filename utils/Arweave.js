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
      model: 'model',
      owner: 'owner'
    }
  }
}
export class ArGraphQLApp {
  constructor({ name, version, graphQLTypeDefs, getWallet = async _ => {} }) {
    this.name = name
    this.version = version
    /** @param {Model[]} models */
    this.models = []
    this.graphQLTypeDefs = graphQLTypeDefs
    this.getWallet = getWallet
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

  typeObjectHasDirective(typeObject, directiveName) {
    return (
      typeObject.astNode &&
      !!typeObject.astNode.directives.find(d => d.name.value == directiveName)
    )
  }

  fieldTypeHasDirective(fieldObject, directiveName) {
    for (const directive of fieldObject.astNode.directives) {
      if (directive.name.value == directiveName) return true
    }
    return false
  }

  registerModelsFromSchema(gqlSchema) {
    const types = Object.entries(gqlSchema._typeMap)
    const modelTypes = types.filter(([typeName, typeObject]) =>
      this.typeObjectHasDirective(typeObject, config.directiveNames.model)
    )
    for (const [typeName, typeObject] of modelTypes) {
      const props = []
      for (const [fieldName, fieldObject] of Object.entries(
        typeObject._fields
      )) {
        const fieldTypeString = fieldObject.type.inspect()
        const fieldTypeName =
          fieldObject.type.name ||
          fieldObject.type.ofType.name ||
          fieldObject.type.ofType.ofType.name ||
          fieldObject.type.ofType.ofType.ofType.name ||
          fieldObject.type.ofType.ofType.ofType.ofType.name
        const propModelEntry = modelTypes.find(
          ([name]) => name == fieldTypeName
        )
        let prop = {
          name: fieldName,
          typeDef: fieldTypeString,
          typeName: fieldTypeName,
          isRequired: fieldTypeString.endsWith('!'),
          isPlural: fieldTypeString.startsWith('['),
          isModel: !!propModelEntry,
          isStorage: this.fieldTypeHasDirective(
            fieldObject,
            config.directiveNames.storage
          )
        }

        prop = {
          ...prop,
          isOwner:
            propModelEntry &&
            this.typeObjectHasDirective(
              propModelEntry[1],
              config.directiveNames.owner
            ),
          inputName: !prop.isModel
            ? prop.name
            : prop.isPlural
            ? prop.name + 'Ids'
            : prop.name + 'Id',
          inputTypeDef:
            prop.name == 'id'
              ? 'ID'
              : prop.isModel
              ? prop.typeDef.replace(prop.typeName, 'ID')
              : prop.typeDef
        }
        console.log(propModelEntry)
        if (prop.isOwner) debugger

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
    isOwner = false,
    typeDef,
    typeName,
    name,
    inputTypeDef,
    inputName
  }) {
    this.isStorage = isStorage
    this.isModel = isModel
    this.isRequired = isRequired
    this.isPlural = isPlural
    this.isOwner = isOwner
    this.name = name
    this.typeDef = typeDef
    this.typeName = typeName
    this.inputTypeDef = inputTypeDef
    this.inputName = inputName
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
    const inputFieldProps = this.props.filter(
      prop =>
        !prop.isOwner && prop.name !== 'createdAt' && prop.name !== 'updatedAt'
    )
    const inputFields = inputFieldProps
      .map(prop => `${prop.inputName}: ${prop.inputTypeDef}`)
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
          [createOrUpdateMutationName]: async (root, args, context, info) => {
            const modelArg = args[dropCaseName]
            const record = {}
            for (let prop of inputFieldProps) {
              record[prop.name] = args[prop.inputName]
            }
            record.id = record.id || this.uuidv4()

            return record
          }
        },
        Query: {
          async [dropCaseName]() {}
        }
      }
    }
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

  get sharedTagNames() {
    return {
      APP_NAME: 'App-Name',
      APP_VERSION: 'App-Version',
      APP_ENV: 'App-Environment',
      DATE_TIME: 'Date-Time',
      CONTENT_TYPE: 'Content-Type',
      DATA_MODEL: 'Data-Model'
    }
  }

  async toTransaction() {
    const tagData = { ...this }
    const storageProps = this.props.filter(p => p.isStorage).map(p => p.name)
    const storageData = {}
    for (let prop of storageProps) {
      storageData[prop] = tagData[prop]
      delete tagData[prop]
    }
    const tx = await arweave.createTransaction(
      {
        data: JSON.stringify(storageData)
      },
      wallet
    )
    const tagEntries = this.__proto__.propsToTags(tagData)
    for (const [name, value] of tagEntries) tx.addTag(name, value)
    const {
      APP_NAME,
      APP_VERSION,
      APP_ENV,
      DATE_TIME,
      CONTENT_TYPE,
      DATA_MODEL
    } = this.sharedTagNames
    tx.addTag(APP_NAME, this.app.name)
    tx.addTag(APP_VERSION, this.app.version)
    tx.addTag(APP_ENV, this.app.env)
    tx.addTag(DATE_TIME, new Date().toISOString())
    tx.addTag(CONTENT_TYPE, 'application/json')
    tx.addTag(DATA_MODEL, this.name)
    const wallet = await this.app.getWallet()
    await arweave.transactions.sign(tx, wallet)
    await arweave.transactions.post(tx)
  }
  async findAll({ filter: { AND = [] } = {} }) {
    const txids = await arweave.arql({
      op: 'and',
      expr1: {
        op: 'equals',
        expr1: 'from',
        expr2: 'hnRI7JoN2vpv__w90o4MC_ybE9fse6SUemwQeY8hFxM'
      },
      expr2: {
        op: 'or',
        expr1: {
          op: 'equals',
          expr1: 'type',
          expr2: 'post'
        },
        expr2: {
          op: 'equals',
          expr1: 'type',
          expr2: 'comment'
        }
      }
    })
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
