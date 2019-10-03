
<template lang="pug">
div 

  div(v-for="post in posts").posts-container
    PostListItem(:post="post")
</template>


<script>
import gql from 'graphql-tag'
import { QUERY_POSTS } from '~/client-graphql'

export default {
  props: {
    posts: {
      required: true
    }
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