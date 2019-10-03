
<template lang="pug">
div 
  PostForm 
  Lottie(
    v-if="$apollo.queries.allPosts.loading" 
    lottieFile="https://assets3.lottiefiles.com/datafiles/B8q1AyJ5t1wb5S8a2ggTqYNxS1WiKN9mjS76TBpw/articulation/articulation.json" 
    width="50vw" 
    style="filter: saturate(0%)"
  )
  PostList(:posts="allPosts")
</template>

<script>
import gql from 'graphql-tag'
import { QUERY_POSTS } from '~/client-graphql'

export default {
  apollo: {
    allPosts: QUERY_POSTS
  }
}
</script>


<style lang="scss">
</style>