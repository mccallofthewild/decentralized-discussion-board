export const typeDefs = /* GraphQL */ `
  # ISO Format
  directive @date(
    defaultFormat: String = "YYYY-MM-DDTHH:mm:ss.sssZ"
  ) on FIELD_DEFINITION
  type TransactionTag {
    name: String!
    value: String!
  }
  # from https://github.com/ArweaveTeam/arweave-js#get-a-transaction
  type Transaction {
    last_tx: String!
    owner: String!
    tags: [TransactionTag!]!
    target: String!
    # quantity is a number as a string e.g. '0'
    quantity: String!
    data: String!
    reward: String!
    signature: String!
    id: ID!
  }
  enum CurrencyDenomination {
    Arweave
    Winston
  }
  input TransactionFilter {
    # "The supported operations are eq, and, and or. You can query by custom tags, which are, in fact, key-value pairs, or system tags from, to, quantity, reward, block_height, and block_indep_hash."
    id: ID
    from: String
    to: String
    quantity: Float
    reward: Float
    block_height: Int
    block_indep_hash: String
  }
  interface Thing {
    id: ID!
    # arweave transaction ID
    # transaction: Transaction!
    createdAt: String!
    updatedAt: String!
  }
  enum PermissionRole {
    ADMIN
  }
  enum PermissionStatus {
    ENABLED
    DISABLED
  }

  type Permission implements Thing {
    id: ID!
    createdAt: String!
    updatedAt: String!
    account: Account!
    address: String!
    role: PermissionRole!
    status: PermissionStatus!
  }
  input PermissionInput {
    id: ID
    accountId: ID!
    address: String!
    role: PermissionRole!
    status: PermissionStatus!
  }

  enum ImageFileType {
    JPG
    PNG
    SVG
  }
  type Image implements Thing {
    id: ID!
    createdAt: String!
    updatedAt: String!
    alt: String
    base64: String!
    fileType: ImageFileType!
  }
  input ImageInput {
    id: ID
    alt: String
    base64: String!
    fileType: ImageFileType!
  }

  type Profile implements Thing {
    id: ID!
    createdAt: String!
    updatedAt: String!
    username: String!
    displayName: String!
    biography: String!
    avatarImage: Image
    versions: [Profile]!
  }
  input ProfileInput {
    id: ID
    username: String!
    displayName: String!
    biography: String!
    avatarImageId: ID
  }
  type Account implements Thing {
    id: ID!
    # arweave transaction ID
    # transaction: Transaction!
    createdAt: String!
    updatedAt: String!
    primaryAddress: String!
    profile: Profile!
    permissions: [Permission]!
    # returns all addresses allowed by permissions
    addresses: [String]!
    versions: [Account]!
  }
  input AccountInput {
    id: ID
    profileId: ID!
    primaryAddress: String!
  }
  input AccountFilter {
    AND: [AccountFilter]
    OR: [AccountFilter]
    id: ID
    profileId: ID
    primaryAddress: String
  }

  enum VoteIntent {
    UP
    DOWN
  }
  type Vote implements Thing {
    id: ID!
    # arweave transaction ID
    # transaction: Transaction!
    createdAt: String!
    updatedAt: String!
    intent: VoteIntent!
    account: Account!
    post: Post!
  }
  input VoteInput {
    id: ID
    postId: ID!
    intent: VoteIntent!
  }
  type Category implements Thing {
    id: ID!
    # arweave transaction ID
    # transaction: Transaction!
    createdAt: String!
    updatedAt: String!
    title: String!
    description: String!
    children: [Category]!
    parent: Category
  }
  input CategoryInput {
    id: ID
    title: String!
    description: String!
    parentId: ID
  }
  input CategoryFilter {
    AND: [CategoryFilter]
    OR: [CategoryFilter]
    title: String
    description: String
    parentId: ID
  }
  type Post implements Thing {
    id: ID!
    # arweave transaction ID
    # transaction: Transaction!
    createdAt: String!
    updatedAt: String!
    title: String!
    content: String!

    votes: [Vote!]!
    account: Account!
    parent: Post
    category: Category
    # optional because versions cannot have versions
    versions: [Post]
  }
  input PostInput {
    # if 'id' is present, will update. Otherwise, will create.
    id: ID
    title: String!
    content: String!
    parentId: ID
    categoryId: ID
    accountId: ID!
  }
  input PostFilter {
    AND: [PostFilter]
    OR: [PostFilter]
    title: String
    parentId: ID
    categoryId: ID
    accountId: ID
  }

  type Auth {
    accounts: [Account]!
    account: Account
    wallet: String
    balance: Float!
    address: String
  }

  type Query {
    # DATA FETCHING
    allPosts(filter: PostFilter, first: Int, skip: Int): [Post]!
    allCategories(filter: CategoryFilter, first: Int, skip: Int): [Category]!
    allAccounts(filter: AccountFilter, first: Int, skip: Int): [Account]!
    allTransactions(filter: TransactionFilter): [Transaction]!
    account(id: ID!): Account
    category(id: ID!): Category
    auth: Auth!
  }
  type Mutation {
    # AUTH
    login(wallet: String!): Auth!
    logout: Auth!
    setAuthAccount(accountId: ID!): Account!

    # DATA WRITING
    createOrUpdateVote(vote: VoteInput): Vote!
    createOrUpdatePost(post: PostInput!): Post!
    createOrUpdateImage(image: ImageInput!): Image!
    createOrUpdateProfile(profile: ProfileInput!): Profile!
    createOrUpdateAccount(account: AccountInput!): Account!
    createOrUpdateCategory(category: CategoryInput!): Category!
    createOrUpdatePermission(permission: PermissionInput!): Permission!
  }
`
