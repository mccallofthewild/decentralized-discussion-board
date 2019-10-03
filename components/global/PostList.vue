
<template lang="pug">
div.post-list
  .post-list__heading
    xText(h1) {{ title }}
    xBtn(flat @click="formIsVisible = true") Create Post
  PostForm(v-if="formIsVisible")
  div(v-for="post in posts").post-list__posts
    PostListItem(:post="post")
</template>


<script>
import gql from 'graphql-tag'
import { QUERY_POSTS } from '~/client-graphql'

export default {
  data: _ => ({
    formIsVisible: false
  }),
  props: {
    posts: {
      required: true
    },
    title: {
      default () {
        return 'Top Posts'
      }
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
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-gap: 30px;
  }

  &__posts {
    animation: fadeIn 1s ease-out;
    margin-top: 30px;
  }
}
</style>