
<template lang="pug">
  form(@submit.prevent="submit")
    div(v-if="allCategories")
      button(type="button" @click="createCategory") Create Category
      select(@change="e => newPost.categoryId = e.target.value") 
        option(v-for="c in allCategories" :value="c.id" :selected="c.id == newPost.categoryId") {{ c.title }}
        option(:value="null" :selected="null == newPost.categoryId") Select Category
    label 
      span Title
    input(required :placeholder="placeholder.title" v-model="newPost.title")
    label 
      span Content
    textarea(required :placeholder="placeholder.content" ref="textarea" :style="textareaStyle" v-model="newPost.content")
    button(type="submit") Create Post
</template>


<script>
import gql from 'graphql-tag'
import {
  MUTATION_POST,
  QUERY_AUTH,
  QUERY_POSTS,
  QUERY_CATEGORIES,
  MUTATION_CATEGORY
} from '../../client-graphql'
const poeQuote = `Once upon a midnight dreary, while I pondered, weak and weary,
Over many a quaint and curious volume of forgotten lore—
    While I nodded, nearly napping, suddenly there came a tapping,
As of some one gently rapping, rapping at my chamber door.
“’Tis some visitor,” I muttered, “tapping at my chamber door—
            Only this and nothing more.”`
const blankPost = _ => ({
  title: '',
  content: '',
  categoryId: null
})
export default {
  data: _ => ({
    textareaStyle: {},
    placeholder: {
      title: 'The Raven',
      content: poeQuote
    },
    newPost: blankPost()
  }),
  apollo: {
    auth: QUERY_AUTH,
    allCategories: QUERY_CATEGORIES
  },
  methods: {
    async createCategory() {
      const title = prompt('Category Title')
      const description = prompt('Category Description')
      if (!title || !description) return
      const {
        data: { category }
      } = await this.$apollo.mutate({
        mutation: MUTATION_CATEGORY,
        variables: {
          category: {
            title,
            description
          }
        },
        refetchQueries: [{ query: QUERY_CATEGORIES }]
      })
      this.newPost.categoryId = category.id
    },
    async submit() {
      if (!this.auth || !this.auth.account) return alert('login')
      const {
        data: { post }
      } = await this.$apollo.mutate({
        mutation: MUTATION_POST,
        variables: {
          post: { ...this.newPost, accountId: this.auth.account.id }
        },
        refetchQueries: [{ query: QUERY_POSTS }]
      })
      console.log('created post', post)
      this.newPost = blankPost()
    },
    autosizeTextarea() {
      const textarea = this.$refs.textarea
      if (!textarea) return
      this.textareaStyle = { height: textarea.scrollHeight + 'px' }
    }
  },
  mounted() {
    this.autosizeTextarea()
  },
  watch: {
    'newPost.content': {
      immediate: true,
      handler() {
        this.autosizeTextarea()
      }
    }
  }
}
</script>


<style lang="stylus" scoped>
form {
  display: flex;
  flex-direction: column;

  label {
    font-weight: 600;
    color: grey;
    margin-top: 0.4rem;
  }

  textarea, input {
    font-size: 1rem;
    border: none;
    background: rgba(0, 0, 0, 0.1);
  }

  button {
    margin-top: 0.4rem;
    align-self: flex-start;
  }
}
</style>