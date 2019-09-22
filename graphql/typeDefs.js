export const typeDefs = /* GraphQL */ `
  # defines arweave models
  directive @model on OBJECT
  # defines that item will be stored in non-searchable data
  directive @storage on FIELD_DEFINITION
  # ISO Format
  directive @date(
    defaultFormat: String = "YYYY-MM-DDTHH:mm:ss.sssZ"
  ) on FIELD_DEFINITION
  # type ArweaveTransactionTag @model {
  #   name: String!
  #   value: String!
  # }
  # # from https://github.com/ArweaveTeam/arweave-js#get-a-transaction
  # type ArweaveTransaction @model {
  #   last_tx: String!
  #   owner: String!
  #   tags: [ArweaveTransactionTag!]!
  #   target: String!
  #   # quantity is a number as a string e.g. '0'
  #   quantity: String!
  #   data: String!
  #   reward: String!
  #   signature: String!
  #   id: ID!
  # }
  interface Thing {
    id: ID!
    # arweave transaction ID
    # transaction: ArweaveTransaction!
    createdAt: String!
    updatedAt: String!
  }
  # intrinsically attached to the wallet
  type User implements Thing @model {
    id: ID!
    # arweave transaction ID
    # transaction: ArweaveTransaction!
    createdAt: String!
    updatedAt: String!
    username: String!
    displayName: String!
  }
  enum VoteIntent {
    UP
    DOWN
  }
  type Vote implements Thing @model {
    id: ID!
    # arweave transaction ID
    # transaction: ArweaveTransaction!
    createdAt: String!
    updatedAt: String!
    user: User!
    post: Post!
    intent: VoteIntent!
  }
  type Category implements Thing @model {
    id: ID!
    # arweave transaction ID
    # transaction: ArweaveTransaction!
    createdAt: String!
    updatedAt: String!
    title: String!
    description: String!
    parent: Category
  }
  type Post implements Thing @model {
    id: ID!
    # arweave transaction ID
    # transaction: ArweaveTransaction!
    createdAt: String!
    updatedAt: String!
    title: String!
    content: String! @storage
    user: User!
    parent: Post
    votes: [Vote!]!
    category: Category
  }
  # input PostInput {
  #   # if 'id' is present, will update. Otherwise, will create.
  #   id: ID
  #   title: String!
  #   content: String!
  #   parentId: ID
  #   votesIds: [ID!]!
  #   categoryId: ID
  # }
  type ArvilLyrics {
    words: String!
  }
  input AvrilOptionsInput {
    # whether or not said boi is a skater boi
    isSkaterBoi: Boolean!
  }
  # type Query {
  #   hello(name: String): String!
  # }
  # type Mutation {
  #   goodbye(avrilOptions: AvrilOptionsInput!): ArvilLyrics!
  #   # createOrUpdatePost(post: PostInput!): Post!
  # }
`
