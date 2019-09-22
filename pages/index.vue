
<template lang="pug">
form(@submit.prevent="submit")
  h1 Delete your automation. It is slowing you down. A lot.
  label Title
  input(v-model="newPost.title")
  label Content
  textarea(v-model="newPost.content")
  //- | {{ newPost}}
  button(type="submit") Create Post
</template>


<script>
import gql from 'graphql-tag'
export default {
  data: _ => ({
    newPost: {
      title: '',
      content: ''
    }
  }),
  methods: {
    async submit() {
      const {
        data: { post }
      } = await this.$apollo.mutate({
        mutation: gql`
          mutation createOrUpdatePost($post: PostInput!) {
            post: createOrUpdatePost(post: $post) {
              id
            }
          }
        `,
        variables: {
          post: { ...this.newPost, votesIds: [] }
        }
      })
    }
  }
}
</script>


<style lang="stylus" scoped>
form {
  display: flex;
  flex-direction: column;

  button {
    align-self: flex-start;
  }
}
</style>