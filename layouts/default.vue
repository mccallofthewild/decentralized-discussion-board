<template>
  <div>
    <!-- {{hello}} -->
    <nuxt-link tag="h1" to="/">LoomChat</nuxt-link>
    <p>
      <em>Powered by Arweave</em>
    </p>
    <nav>
      <div v-if="$store.state.ar.wallet">
        Logged In 👍
        <small>
          <a href="javascript:void(0)" @click="logout">(logout?)</a>
        </small>
      </div>
      <nuxt-link to="/login">Login / Signup</nuxt-link>
    </nav>
    {{ JSON.stringify(post) }}
    <div style="margin-top: 50px;">
      <nuxt />
    </div>
  </div>
</template>

<script>
import { AR__LOGIN, AR__LOGOUT } from '../store-names/actions'
import gql from 'graphql-tag'

export default {
  apollo: {
    // Simple query that will update the 'hello' vue property
    // hello: gql`
    //   query {
    //     hello(name: "darkness my old friend")
    //   }
    // `
    post: gql`
      query {
        post(id: "lksfjk") {
          id
        }
      }
    `
  },
  async beforeMount() {
    this.$store.dispatch(AR__LOGIN)
    return
    const {
      data: {
        goodbye: { words }
      }
    } = await this.$apollo.mutate({
      mutation: gql`
        mutation {
          goodbye(avrilOptions: { isSkaterBoi: false }) {
            words
          }
        }
      `,
      variables: {}
    })
    console.log(words)
  },
  methods: {
    logout() {
      this.$store.dispatch(AR__LOGOUT)
    }
  }
}
</script>

<style>
html {
  font-family: Medio, 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}
body {
  margin: 50px;
  zoom: 1.5;
}

button {
  background: black;
  color: white;
  border: none;
  padding: 10px;
  width: auto;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}
</style>
