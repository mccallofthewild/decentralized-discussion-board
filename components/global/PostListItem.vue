
<template lang="pug">
  div(v-if="post")
    h2 {{ post.title }} 
    small @{{ post.account.profile.username }}
    div(v-if="post.category")
      nuxt-link(:to="{ name: 'categories-categoryId', params: { categoryId: post.category.id } }")
        em {{ '#' + post.category.title}}
    div Created {{ new Date(post.createdAt).toLocaleDateString() }} {{ new Date(post.createdAt).toLocaleTimeString() }}
    div(v-if="post.createdAt != post.updatedAt") Updated {{ new Date(post.updatedAt).toLocaleDateString() }} {{ new Date(post.updatedAt).toLocaleTimeString() }}
    p(style="white-space: pre;") {{ post.content }}
    span(style="display: flex; align-items: center;")
      button(:disabled="!auth || !auth.account || ownedByUser" title="upvote" @click="vote(true)") 🔼
      | {{ voteSum.UP - voteSum.DOWN }}
      button(:disabled="!auth || !auth.account || ownedByUser" title="downvote" @click="vote(false)") 🔽
      button(v-if="ownedByUser" title="reply") ↩️
      button(v-if="ownedByUser" title="edit") ✍️
      //- button(title="delete") 🗑
      button(title="history" @click="$router.push({name: 'posts-postId-history', params: { postId: post.id } })") 📜
    br
    br
</template>

<script>
import gql from 'graphql-tag'
import { QUERY_POSTS, QUERY_AUTH } from '../../client-graphql'
export default {
  props: ['post'],
  apollo: {
    auth: QUERY_AUTH
  },
  computed: {
    ownedByUser() {
      return (
        this.auth &&
        this.auth.account &&
        this.post &&
        this.auth.account.id == this.post.account.id
      )
    },
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


<style lang="stylus" scoped>
button:disabled {
  cursor: not-allowed !important;
  opacity: 0.5;
}
</style>