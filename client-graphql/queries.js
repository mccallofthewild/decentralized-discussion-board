import gql from 'graphql-tag'
import { print } from 'graphql'
import {
  FRAGMENT_ACCOUNT,
  FRAGMENT_POST,
  FRAGMENT_TRANSACTION,
  FRAGMENT_CATEGORY
} from './fragments'

export const QUERY_AUTH = gql`
  query {
    auth {
      wallet
      address
      balance
      account {
        ...account
        addresses
      }
      accounts {
        ...account
      }
    }
  }
  ${print(FRAGMENT_ACCOUNT)}
`

export const QUERY_POSTS = gql`
  query {
    allPosts {
      ...post
    }
  }
  ${print(FRAGMENT_POST)}
`

export const QUERY_ACCOUNT = gql`
  query GetAccount($id: ID!) {
    account(id: $id) {
      ...account
    }
  }
  ${print(FRAGMENT_ACCOUNT)}
`

export const QUERY_TRANSACTIONS = gql`
  query AllTransactions($filter: TransactionFilter!) {
    allTransactions(filter: $filter) {
      ...transaction
    }
  }
  ${print(FRAGMENT_TRANSACTION)}
`

export const QUERY_CATEGORIES = gql`
  query {
    allCategories {
      ...category
      children {
        ...category
      }
    }
  }
  ${print(FRAGMENT_CATEGORY)}
`
