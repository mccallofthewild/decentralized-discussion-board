
<template lang="pug">
div 
  Loading(v-if="$apollo.queries.allPosts.loading" width="300px" height="300px")
  div(v-if="$apollo.loading")
  div(v-for="post in allPosts").posts-container
    PostListItem(:post="post")
</template>


<script>
import gql from 'graphql-tag'
import { QUERY_POSTS } from '../../client-graphql'

export default {
  apollo: {
    allPosts: QUERY_POSTS
  }
}
</script>


<style lang="stylus" scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.posts-container {
  animation: fadeIn 1s ease-out;
}
</style>