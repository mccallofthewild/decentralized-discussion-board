import gql from 'graphql-tag'
import { FRAGMENT_POST, FRAGMENT_ACCOUNT, FRAGMENT_CATEGORY, FRAGMENT_VOTE } from './fragments'
import { print } from 'graphql/language/printer'

export const MUTATION_POST = gql`
  mutation createOrUpdatePost($post: PostInput!) {
    post: createOrUpdatePost(post: $post) {
      ...post
    }
  }
  ${print(FRAGMENT_POST)}
`

export const MUTATION_ACCOUNT = gql`
  mutation MutateAccount($account: AccountInput!) {
    account: createOrUpdateAccount(account: $account) {
      ...account
    }
  }
  ${print(FRAGMENT_ACCOUNT)}
`

export const MUTATION_PROFILE = gql`
  mutation MutateProfile($profile: ProfileInput!) {
    profile: createOrUpdateProfile(profile: $profile) {
      id
    }
  }
`

export const MUTATION_IMAGE = gql`
  mutation MutateImage($image: ImageInput!) {
    image: createOrUpdateImage(image: $image) {
      id
    }
  }
`

export const MUTATION_LOGIN = gql`
  mutation Login($wallet: String!) {
    login(wallet: $wallet) {
      wallet
    }
  }
`

export const MUTATION_LOGOUT = gql`
  mutation LogOut {
    logout {
      wallet
    }
  }
`

export const MUTATION_AUTH_ACCOUNT = gql`
  mutation setAuthAccount($accountId: ID!) {
    setAuthAccount(accountId: $accountId) {
      id
    }
  }
`

export const MUTATION_CATEGORY = gql`
  mutation CategoryMutation($category: CategoryInput!) {
    category: createOrUpdateCategory(category: $category) {
      ...category
    }
  }
  ${print(FRAGMENT_CATEGORY)}
`

export const MUTATION_VOTE = gql`
          mutation VoteMutation($vote: VoteInput!) {
            vote: createOrUpdateVote(vote: $vote) {
              ...vote
            }
          }
          ${FRAGMENT_VOTE}
        `