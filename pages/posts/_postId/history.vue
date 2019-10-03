
<template lang="pug">
  div(v-if="post")
    PostListItem(
      :post="post"
    )
    h1 Edit History:
    PostListItem(
      v-for="version in post.versions"
      :key="version.id"
      :post="version"
    )
</template>


<script>
import { QUERY_POSTS } from '../../../client-graphql'

export default {
  data: _ => ({
    allPosts: []
  }),
  computed: {
    post() {
      return this.allPosts.find(p => p.id == this.$route.params.postId)
    }
  },
  apollo: {
    allPosts: QUERY_POSTS
  }
}
</script>


<style lang="scss">
</style>