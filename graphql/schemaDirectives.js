import { SchemaDirectiveVisitor } from 'graphql-tools'
import { defaultFieldResolver } from 'graphql'

// from https://www.apollographql.com/docs/graphql-tools/schema-directives/#uppercasing-strings

export const storage = class StorageDirective extends SchemaDirectiveVisitor {
  // override visitor method https://www.apollographql.com/docs/graphql-tools/schema-directives/#implementing-schema-directives
  visitInputFieldDefinition(field) {
    // console.log('input field', field)
  }
  visitInputObject() {
    // console.log('input obj', arguments)
  }
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async function(...args) {
      // console.log('overwrite resolver', args)
      const result = await resolve.apply(this, args)
      // if (typeof result === 'string') {
      //   return result.toUpperCase()
      // }
      return result
    }
  }
}
