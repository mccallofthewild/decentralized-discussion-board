import gql from 'graphql-tag'
import { print } from 'graphql'

export const FRAGMENT_PROFILE = gql`
  fragment profile on Profile {
    id
    username
    displayName
    biography
    avatarImage {
      id
      alt
      base64
      fileType
    }
  }
`
export const FRAGMENT_ACCOUNT = gql`
  fragment account on Account {
    id
    primaryAddress
    profile {
      ...profile
    }
  }
  ${print(FRAGMENT_PROFILE)}
`
export const FRAGMENT_POST = gql`
  fragment post on Post {
    id
    title
    content
    createdAt
    updatedAt
    account {
      ...account
    }
    category {
      id
      title
    }
    votes {
      id
      intent
    }
  }
  ${FRAGMENT_ACCOUNT}
`

export const FRAGMENT_TRANSACTION = gql`
  fragment transaction on Transaction {
    id
    last_tx
    owner
    target
    quantity
    data
    reward
    signature
    tags {
      name
      value
    }
  }
`

export const FRAGMENT_CATEGORY = gql`
  fragment category on Category {
    id
    title
    description
    parent {
      id
    }
  }
`
