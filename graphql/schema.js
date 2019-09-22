import { typeDefs } from './typeDefs'
import { resolvers } from './resolvers'
import { makeExecutableSchema } from 'graphql-tools'
import * as schemaDirectives from './schemaDirectives'
import gql from 'graphql-tag'
import { buildSchema } from 'graphql'
import { ArGraphQLApp } from '../utils/Arweave'

// export const schema = makeExecutableSchema({
//   typeDefs,
//   resolvers,
//   schemaDirectives
// })

const app = new ArGraphQLApp({
  name: 'loom-chat',
  version: process.env.version,
  env: process.env.NODE_ENV == 'production' ? 'production' : 'test',
  graphQLTypeDefs: typeDefs,
  getWallet: async _ => {
    const wallet = window.localStorage.getItem(process.env.authWalletStorageKey)
    return JSON.parse(wallet)
  }
})

export const schema = app.buildSchemaFromModels()

// debugger
