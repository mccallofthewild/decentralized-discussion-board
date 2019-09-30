import { typeDefs } from './typeDefs'
import { resolvers } from './resolvers'
import { makeExecutableSchema } from 'graphql-tools'
import * as schemaDirectives from './schemaDirectives'

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives
})
