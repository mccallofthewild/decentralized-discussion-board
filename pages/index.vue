
<template lang="pug">
div 
  xText(h1 style="margin-top: 30px;") Browse
  CategoryList(:categories="allCategories")
  PostList(:posts="allPosts")
  Lottie(
    v-if="$apollo.queries.allPosts.loading" 
    lottieFile="https://assets3.lottiefiles.com/datafiles/B8q1AyJ5t1wb5S8a2ggTqYNxS1WiKN9mjS76TBpw/articulation/articulation.json" 
    width="50vw" 
    style="filter: saturate(0%)"
  )
</template>

<script>
import gql from 'graphql-tag'
import { QUERY_POSTS, QUERY_CATEGORIES } from '~/client-graphql'

export default {
  apollo: {
    allPosts: QUERY_POSTS,
    allCategories: QUERY_CATEGORIES
  }
}
</script>


<style lang="scss">
</style>