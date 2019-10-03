import { loomApp } from './app'
import { removeUnauthorizedRecords, timeTravel } from './auth'
import { formatUsername } from '../utils/usernameValidation'

export const Post = loomApp.createModel({
  name: 'Post',
  timestamps: true,
  props: {
    accountId: {
      required: true,
      storage: false
    },
    title: {
      required: true,
      storage: false
    },
    content: {
      required: true,
      storage: true
    },
    parentId: {
      required: false,
      storage: false
    },
    categoryId: {
      required: false,
      storage: false
    }
  }
})

export const Category = loomApp.createModel({
  name: 'Category',
  timestamps: true,
  immutable: true,
  props: {
    title: {
      required: true
    },
    description: {
      required: true
    },
    parentId: {
      required: false
    }
  }
})

export const Vote = loomApp.createModel({
  name: 'Vote',
  timestamps: true,
  // users can negate previous votes with new votes, but cannot edit the votes themselves
  immutable: true,
  async reducer(recordVersions) {
    const [origin] = recordVersions
    if (!origin) return null
    const [votePost] = await Post.findAll({
      filter: {
        id: origin.postId
      }
    })
    const [ownerAccount] = await Account.findAll({
      filter: { id: votePost.accountId }
    })
    // find all votes which were sent by the post owner
    const votesByOwner = await removeUnauthorizedRecords(recordVersions, {
      accountId: votePost.accountId
    }).map(({ id }) => id)
    return recordVersions.filter(v => {
      // post owner is not allowed to vote
      if (votesByOwner.includes(v.id)) return false
      // vote must be sufficiently paid for
      const isUpvote = v.intent == 'UP'
      const winstonFunds = isUpvote
        ? /* paid to owner */ v.__tx.quantity
        : /* paid to miners */ v.__tx.reward
      const arFunds = Vote.app.arweave.ar.winstonToAr(winstonFunds)
      const hasSufficientFunds = +process.env.voteCostInAr <= +arFunds
      if (isUpvote && hasSufficientFunds) {
        // funds should be sent to post's account's primaryAddress
        const accountWhenVoteCreated = timeTravel(
          ownerAccount.versions,
          v.createdAt
        )
        if (
          !process.env.isDevelopment &&
          accountWhenVoteCreated.primaryAddress !== v.__tx.target
        ) {
          return false
        }
        return true
      }
      // as long as the downvote payment was mined, they only need the right amount of funds
      return hasSufficientFunds
    })
  },
  props: {
    accountId: {
      required: true
    },
    postId: {
      required: true
    },
    intent: {
      required: true
    }
  }
})

export const Account = loomApp.createModel({
  name: 'Account',
  timestamps: true,
  async reducer(recordVersions) {
    return Account.defaultReducer(recordVersions)
    const authorized = await removeUnauthorizedRecords(recordVersions)
    return Account.defaultReducer(authorized)
  },
  async validator(record) {
    return true
    debugger
    const ownerAddress = await Account.app.arweave.wallets.ownerToAddress(
      record.__tx.owner
    )
    debugger
    if (record.primaryAddress == ownerAddress) return true
    // could improve efficiency with a `last` filter option in the future
    const permissions = await Permission.findAll({
      filter: {
        accountId: record.id,
        address: record.primaryAddress
      }
    })
    if (permissions.length && permissions.pop().status == 'ENABLED') {
      return true
    }
    throw new Account.errorTypes.RecordValidationError(
      `Account#primaryAddress (${record.primaryAddress}) must be to an authorized wallet on the account.`
    )
  },
  props: {
    profileId: {
      required: true
    },
    primaryAddress: {
      required: true
    }
  }
})

export const Permission = loomApp.createModel({
  name: 'Permission',
  immutable: true,
  timestamps: true,
  async validator(record) {
    console.log(
      '\n\n\n\n\nmay cause infinite loop due to Permission and Account validators referencing each other recursively\n\n\n\n'
    )
    // don't deauthorize the primary address
    if (record.status == 'ENABLED') return true
    // is disabled
    const account = await Account.find({
      id: record.accountId,
      primaryAddress: record.address
    })
    if (account) {
      throw new Permission.errorTypes.RecordValidationError(
        `Cannot disable account's primaryAddress`
      )
    }
    return true
  },
  async reducer(recordVersions) {
    // rules: only authorized users can authorize users
    if (!recordVersions.length) return null
    const originRecord = recordVersions[0]
    /* 
      Accounts don't need permissions until they add a device.
      So, if we used the origin Permission record's address,
      bad actors could arbitrarily define permissions on new accounts.
      By relying on the Account record's address, we can avoid this.
    */
    const [originAccount] = await Account.findAll({
      filter: {
        id: originRecord.accountId
      }
    })
    const originAddress = originAccount.__tx.get('owner', {
      decode: true,
      string: true
    })
    // first user is admin
    const authorizedAddressRoles = { [originAddress]: 'ADMIN' }
    recordVersions = recordVersions.reduce((prev, record) => {
      const authorizedRole =
        authorizedAddressRoles[
          record.__tx.get('owner', { decode: true, string: true })
        ]
      if (authorizedRole) {
        if (authorizedRole == 'ADMIN') {
          if (record.status == 'ENABLED') {
            authorizedAddressRoles[record.address] = record.role
          } else if (record.status == 'DISABLED') {
            delete authorizedAddressRoles[record.address]
          }
        }
        return [...prev, record]
      } else return prev
    }, [])
    return Permission.defaultReducer(recordVersions)
  },
  props: {
    accountId: {
      required: true
    },
    address: {
      required: true
    },
    role: {
      required: true
    },
    status: {
      required: true
    }
  }
})

export const Image = loomApp.createModel({
  name: 'Image',
  immutable: true,
  timestamps: true,
  props: {
    alt: {
      required: false
    },
    base64: {
      required: true,
      storage: true
    },
    fileType: {
      required: true
    }
  }
})

export const Profile = loomApp.createModel({
  name: 'Profile',
  immutable: false,
  timestamps: true,
  validator(record) {
    const u = record.username
    if (u !== formatUsername(u, { end: true })) {
      throw new Post.errorTypes.RecordValidationError('Invalid username')
    }
  },
  props: {
    username: {
      required: true
    },
    displayName: {
      required: true
    },
    biography: {
      required: true
    },
    avatarImageId: {
      required: false
    }
  }
})
