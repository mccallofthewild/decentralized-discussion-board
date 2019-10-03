
<template lang="pug">
div.post-list
  .post-list__heading
    xText(h1) Top Posts
    xBtn(flat) Create Post
  div(v-for="post in posts").post-list__posts
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

.post-list {
  margin-top: 30px;

  &__heading {
    display: flex;
    justify-content: space-between;
  }

  &__posts {
    animation: fadeIn 1s ease-out;
    margin-top: 30px;
  }
}
</style>