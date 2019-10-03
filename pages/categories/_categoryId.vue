
<template lang="pug">
  div(v-if="category")
    h1 {{ category.title }}
    div(v-if="posts")
      PostList(:posts="posts")
</template>


<script>
import { QUERY_CATEGORY, QUERY_POSTS } from '../../client-graphql'

export default {
  computed: {
    posts() {
      if (!this.allPosts) return []
      return this.allPosts.filter(p => {
        return p.category && p.category.id == this.$route.params.categoryId
      })
    }
  },
  apollo: {
    category() {
      return {
        query: QUERY_CATEGORY,
        variables: {
          id: this.$route.params.categoryId
        }
      }
    },
    allPosts() {
      return {
        query: QUERY_POSTS,
        variables: {
          filter: {
            // categoryId: this.$route.params.categoryId
          }
        }
      }
    }
  }
}
</script>


<style lang="scss">
</style>