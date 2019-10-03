
<template lang="pug">
  div(v-if="post").post
    div.post__votes
      xIcon(
        icon="chevron-up" 
        button 
        :active="userVoteIntent == 'UP'" 
        @click.native="vote(true)"
      ).post__vote
      xIcon(
        icon="chevron-down" 
        button 
        :active="userVoteIntent == 'DOWN'" 
        @click.native="vote(false)"
      ).post__vote
    Avatar(:avatarImage="post.account.profile.avatarImage").post__avatar
    div.post__data
      xText(h2) {{ post.title }} 
      div.post__data__labels
        xText(title) {{ post.account.profile.displayName }}
        xText(title light).post-label {{ timeago.format(post.createdAt) }}
        xText(title light).post-label {{ voteSum.UP }} upvotes
        //- xText(link title="real link").post-label facebook.com
      div(v-if="post.category")
        //- nuxt-link(:to="{ name: 'categories-categoryId', params: { categoryId: post.category.id } }")
        //-   em {{ '#' + post.category.title}}
      //- p(style="white-space: pre;") {{ post.content }}
      //- span(style="display: flex; align-items: center;")
      //-   button(:disabled="!auth || !auth.account || ownedByUser" title="upvote" @click="vote(true)") 🔼
      //-   | {{ voteSum.UP - voteSum.DOWN }}
      //-   button(:disabled="!auth || !auth.account || ownedByUser" title="downvote" @click="vote(false)") 🔽
      //-   button(v-if="ownedByUser" title="reply") ↩️
      //-   button(v-if="ownedByUser" title="edit") ✍️
      //-   //- button(title="delete") 🗑
      //-   button(title="history" @click="$router.push({name: 'posts-postId-history', params: { postId: post.id } })") 📜

</template>
 
<script>
import gql from 'graphql-tag'
import { QUERY_POSTS, QUERY_AUTH, MUTATION_VOTE } from '../../client-graphql'
import * as timeago from 'timeago.js';
console.log(timeago)
export default {
  props: ['post'],
  data: _ => ({
    timeago
  }),
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
    },
    userVoteIntent () {
      return this.post.votes.reduce(
        (prev, vote) => {
          const isUserVote = vote && vote.account 
            && (        
              this.auth &&
              this.auth.account &&
              this.post &&
              this.auth.account.id == vote.account.id
            )
          if (isUserVote) return vote.intent
          return prev
        },
        null
      )
    }
  },
  methods: {
    async vote(up) {
      if (this.ownedByUser) return;
      console.log('voting')
      const voteIntent = up ? 'UP' : 'DOWN'
      const {
        data,
        errors = []
      } = await this.$apollo.mutate({
        mutation: MUTATION_VOTE,
        variables: {
          vote: { intent: voteIntent, postId: this.post.id }
        },
        refetchQueries: [{ query: QUERY_POSTS }]
      })
      errors.forEach(e => alert(e.message))
    }
  }
}
</script>


<style lang="stylus" scoped>
.post {
  display: flex;
  // icon size - avatar margin
  margin-left: -25px - 15px;
  &__votes {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 59px;
    .post__vote {
      &[active] {
        opacity: 0.25;
      }
    }
  }
  &__avatar {
    margin-top: 5px;
    margin-left: 15px;
  }  
  &__data {
    margin-left: 30px;
    &__labels {
      display: flex;
      margin-top: 10px;
      .post-label {
        margin-left: 10px;
      }
    }
  }
}
button:disabled {
  cursor: not-allowed !important;
  opacity: 0.5;
}
</style>