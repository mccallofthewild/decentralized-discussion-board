import { ApolloClient } from 'apollo-client'
import { SchemaLink } from 'apollo-link-schema'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { schema } from '../graphql/schema'
import Vue from 'vue'
import VueApollo from 'vue-apollo'

Vue.use(VueApollo)

// Create the apollo client
const apolloClient = new ApolloClient({
  // from https://medium.com/front-end-weekly/implementing-graphql-api-in-the-browser-9fc8dec68a5d
  // and (better) https://blog.hasura.io/client-side-graphql-schema-resolving-and-schema-stitching-f4d8bccc42d2/
  link: new SchemaLink({ schema }),
  cache: new InMemoryCache()
})

export default ({ app, ...context }, inject) => {
  // from https://github.com/nuxt-community/apollo-module/blob/f5273659f9370f3a85e70203f31fc0a0b5c5f09f/lib/templates/plugin.js#L99
  app.apolloProvider = new VueApollo({
    defaultClient: apolloClient
  })
}
