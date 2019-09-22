// Extracts properties with the directive @`directiveName` on return object type
const extractDirectivePropsFromInfo = ({ directiveName, info }) => {
  return info.returnType.ofType.astNode.fields
    .filter(field => {
      const hasDirective = field.directives.find(
        d => d.name.value == directiveName
      )
      return !!hasDirective
    })
    .map(field => field.name.value)
}
export const resolvers = {
  Query: {
    // async hello(root, args, context, info) {
    //   const { name = '' } = args
    //   await new Promise(r => setTimeout(r, 1000))
    //   return 'hello ' + name + '! ' + Date.now()
    // }
  },
  Mutation: {
    // async createOrUpdatePost(
    //   root,
    //   {
    //     post: { id, title, content, parentId, votesIds, categoryId }
    //   },
    //   context,
    //   info
    // ) {
    //   console.log(
    //     'directive props',
    //     extractDirectivePropsFromInfo({ directiveName: 'storage', info })
    //   )
    //   // if (!id) id = ArweaveModel.uuidv4() /* creating */
    //   const now = Date.now()
    //   const post = {
    //     id,
    //     title,
    //     content,
    //     createdAt: now,
    //     updatedAt: now,
    //     parentId,
    //     votesIds,
    //     categoryId
    //   }
    //   return post
    // },
    // async goodbye(root, args, context, info) {
    //   const searchableProps = extractDirectivePropsFromInfo({
    //     directiveName: 'searchable',
    //     info
    //   })
    //   console.log('searchable props', searchableProps, 'args', args)
    //   console.log('goodbye resolver, ', arguments)
    //   return {
    //     words: args.avrilOptions.isSkaterBoi
    //       ? 'see ya l8r boi'
    //       : `He's good enough for her.`
    //   }
    // }
  }
}
