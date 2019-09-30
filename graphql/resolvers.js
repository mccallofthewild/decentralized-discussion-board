import {
  Post,
  Vote,
  Account,
  Image,
  Category,
  Permission,
  Profile
} from '../loom-init/models'
import { removeUnauthorizedRecords } from '../loom-init/auth'
import defaultAvatar from '~/assets/images/default-avatar.svg'
import { loomApp } from '../loom-init/app'
export const resolvers = {
  Permission: {
    async account(root, args, context, info) {
      return await Account.find({
        id: root.accountId
      })
    }
  },
  Profile: {
    async avatarImage(root, args, context, info) {
      if (!root.avatarImageId) return null
      const image = await Image.find({
        id: root.avatarImageId
      })
      return image
    }
  },
  Account: {
    async profile(root, args, context, info) {
      return await Profile.find({
        id: root.profileId
      })
    },
    async permissions(root, args, context, info) {
      return await Permission.find({
        accountId: root.id
      })
    },
    async addresses(root, args, context, info) {
      const accountWithVersions = await Account.find({ id: root.id })
      const permissions = await Permission.findAll({
        filter: {
          accountId: root.id
        }
      })
      const addresses = new Set()
      // first authenticated wallet is automatically authorized
      addresses.add(
        loomApp.arweave.wallets.ownerToAddress(
          accountWithVersions.versions[0].__tx.owner
        )
      )
      for (let p of permissions) {
        p.status == 'ENABLED'
          ? addresses.add(p.address)
          : p.status == 'DISABLED'
          ? addresses.delete(p.address)
          : null
      }
      return [...addresses]
    }
  },
  Vote: {
    async post(root, args, context, info) {
      return await Post.find({
        id: root.postId
      })
    },
    async account(root, args, context, info) {
      return await Account.find({
        id: root.accountId
      })
    }
  },
  Category: {
    async parent(root, args, context, info) {
      if (!root.parentId) return null
      return await Category.find({
        id: root.parentId
      })
    },
    async children(root, args, context, info) {
      const result = await Category.findAll({
        parentId: root.id
      })
      console.log('CHILD CATEGORIES RESULT', result)
      return result
    }
  },
  Post: {
    async votes(root, args, context, info) {
      const votes = await Vote.findAll({ filter: { postId: root.id } })
      return votes
    },
    async account(root, args, context, info) {
      return await Account.find({
        id: root.accountId
      })
    },
    async parent(root, args, context, info) {
      return await Post.find({
        id: root.parentId
      })
    },
    async category(root, args, context, info) {
      return await Category.find({
        id: root.categoryId
      })
    }
  },
  Auth: {
    async accounts(root, args, context, info) {
      const address = await resolvers.Auth.address(...arguments)
      const accounts = await Account.findAll({
        filter: {
          from: address
        }
      })
      return accounts
    },
    async account(root, args, context, info) {
      const accounts = await resolvers.Auth.accounts(...arguments)
      const activeAccountId = window.localStorage.getItem(
        process.env.storageKeys.auth.activeAccountId
      )
      if (!activeAccountId) return null
      console.log('if error went away this is why')
      // return null
      const account = await Account.find({
        id: activeAccountId
      })
      console.log('resolvers/account', accounts)
      const otherAccount = accounts.find(a => a.id == activeAccountId)
      console.log('ACTIVE AUTH ACCOUNT', activeAccountId, account, otherAccount)
      return account
    },
    async wallet(root, args, context, info) {
      return window.localStorage.getItem(process.env.storageKeys.auth.wallet)
    },
    async balance() {
      const address = await resolvers.Auth.address(...arguments)
      const winstonBalance = await loomApp.arweave.wallets.getBalance(address)
      const arBalance = loomApp.arweave.ar.winstonToAr(winstonBalance)
      return arBalance
    },
    async address(...args) {
      let wallet = window.localStorage.getItem(
        process.env.storageKeys.auth.wallet
      )
      if (!wallet) return null
      try {
        wallet = JSON.parse(wallet)
      } catch (e) {
        return null
      }
      return await Account.app.arweave.wallets.jwkToAddress(wallet)
    }
  },
  Query: {
    async auth(root, args, context, info) {
      return {}
    },
    async allPosts(
      root,
      { filter = {}, first = 100, skip = 0 },
      context,
      info
    ) {
      return await Post.findAll({ filter, first, skip })
    },
    async allCategories(
      root,
      { filter = {}, first = 100, skip = 0 },
      context,
      info
    ) {
      return await Category.findAll({ filter, first, skip })
    },
    async allAccounts(
      root,
      { filter = {}, first = 100, skip = 0 },
      context,
      info
    ) {
      const wallet = await loomApp.getWallet()
      if (!wallet) return []
      return await Account.findAll({ filter, first, skip })
    },
    async account(root, { id }, context, info) {
      return await Account.find({ id })
    },
    async allTransactions(root, { filter }, context, info) {
      const formatTx = tx => {
        const copy = { ...tx }
        copy.data = tx.get('data', { decode: true, string: true })
        copy.tags = tx.get('tags').map(tag => {
          const name = tag.get('name', { decode: true, string: true })
          const value = tag.get('value', { decode: true, string: true })
          return {
            name,
            value
          }
        })
        return copy
      }
      const mockModel = loomApp.createModel({ name: 'mock', props: [] })
      mockModel.props = []
      if (filter.id) {
        const tx = await mockModel.loadTransactionById(filter.id)
        return [formatTx(tx)]
      }
      const query = mockModel.objToArql(filter)
      const txIds = await loomApp.arweave.arql(query)
      const txs = await Promise.all(
        txIds.map(id => mockModel.loadTransactionById(id))
      )
      console.log('resolvers/allTransactions', query, mockModel, txs)
      return txs.map(formatTx)
    }
  },
  Mutation: {
    async login(root, { wallet }, context, info) {
      window.localStorage.setItem(process.env.storageKeys.auth.wallet, wallet)
      return {}
    },
    async logout(root, { wallet }, context, info) {
      const authStorageKeys = Object.values(process.env.storageKeys.auth)
      for (let key of authStorageKeys) {
        window.localStorage.removeItem(key)
      }
      return {}
    },
    async setAuthAccount(root, { accountId }) {
      // does this wallet have permission to use this account?
      const account = await Account.find({ id: accountId })
      window.localStorage.setItem(
        process.env.storageKeys.auth.activeAccountId,
        accountId
      )
      return account
    },
    async createOrUpdateVote(
      root,
      {
        vote: { id, intent, postId }
      }
    ) {
      const voteDraft = {
        id,
        intent,
        postId
      }
      const [post] = await Post.findAll({ filter: { id: postId } })
      const [postAccount] = await Account.findAll({
        filter: { id: post.accountId }
      })
      const voteCost = Vote.app.arweave.ar.arToWinston(process.env.voteCostInAr)
      const txOptions = process.env.isDevelopment
        ? {}
        : intent == 'UP'
        ? {
            target: postAccount.primaryAddress,
            quantity: voteCost
          }
        : {
            // goes to miners
            reward: voteCost
          }
      return await Vote.toTransaction(voteDraft, txOptions)
    },
    async createOrUpdatePost(root, { post }, context, info) {
      return await Post.toTransaction(post)
    },
    async createOrUpdateImage(root, { image }, context, info) {
      return await Image.toTransaction(image)
    },
    async createOrUpdateProfile(root, { profile }, context, info) {
      return await Profile.toTransaction(profile)
    },
    async createOrUpdateAccount(root, { account }, context, info) {
      const record = await Account.toTransaction(account)
      window.localStorage.setItem(
        process.env.storageKeys.auth.activeAccountId,
        record.id
      )
      return record
    },
    async createOrUpdateCategory(root, { category }, context, info) {
      return await Category.toTransaction(category)
    },
    async createOrUpdatePermission(root, { permission }, context, info) {
      return await Permission.toTransaction(permission)
    }
  }
}
