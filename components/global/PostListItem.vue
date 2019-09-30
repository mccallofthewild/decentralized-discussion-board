
<template lang="pug">
  div
    h2 {{ post.title }} 
    small @{{ post.account.profile.username }}
    div 
      em #category
    p(style="white-space: pre;") {{ post.content }}
    span(style="display: flex; align-items: center;")
      button(title="upvote" @click="vote(true)") 🔼
      | {{ voteSum.UP - voteSum.DOWN }}
      button(title="downvote" @click="vote(false)") 🔽
      button(title="reply") ↩️
      button(title="edit") ✍️
      //- button(title="delete") 🗑
      button(title="history") 📜
    br
    br
</template>

<script>
import gql from 'graphql-tag'
import { QUERY_POSTS } from '../../client-graphql'
export default {
  props: ['post'],
  computed: {
    voteSum() {
      return this.post.votes.reduce(
        (prev, vote) => {
          prev[vote.intent]++
          return prev
        },
        { UP: 0, DOWN: 0 }
      )
    }
  },
  methods: {
    async vote(up) {
      const voteIntent = up ? 'UP' : 'DOWN'
      const {
        data: { vote }
      } = await this.$apollo.mutate({
        mutation: gql`
          mutation createVote($vote: VoteInput!) {
            vote: createVote(vote: $vote) {
              id
              intent
            }
          }
        `,
        variables: {
          vote: { intent: voteIntent, postId: this.post.id }
        },
        update: (store, { data: { vote } }) => {
          // Read the data from our cache for this query.
          const data = store.readQuery({ query: QUERY_POSTS })
          // Add our tag from the mutation to the end
          const post = data.allPosts.find(post => post.id == this.post.id)
          post.votes.push(vote)
          // Write our data back to the cache.
          store.writeQuery({ query: QUERY_POSTS, data })
        },
        optimisticResponse: {
          __typename: 'Mutation',
          vote: {
            __typename: 'Vote',
            id: -1,
            intent: voteIntent
          }
        }
      })
    }
  }
}
</script>


<style lang="scss">
</style>