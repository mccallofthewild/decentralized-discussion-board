<template lang="pug">
  nav
    div
      Logo
      div(v-if='!$apollo.queries.auth.loading')
        div(v-if="auth && auth.wallet")
          div(v-if="auth.account")
            nuxt-link(tag="button" :to="{ name: 'user-accountId', params: { accountId: auth.account.id }}") 
              | Profile
          button(@click='logout') 
            span.emoji 👋
            | logout 
          nuxt-link(tag="button" to="/accounts/select") Switch Account
          p 💰{{ auth.balance }} AR
        nuxt-link(tag="button" v-else='' to='/login') Login / Signup
    | created by McCall Alexander
</template>

<script>
import { QUERY_AUTH, MUTATION_LOGOUT } from '../../client-graphql'
export default {
  methods: {
    logout() {
      this.$apollo.mutate({
        mutation: MUTATION_LOGOUT,
        refetchQueries: [{ query: QUERY_AUTH }]
      })
    }
  },
  apollo: {
    auth: QUERY_AUTH
  }
}
</script>

<style lang="stylus" scoped>
nav {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 2px solid black;
  height: 100%;
  padding: __spacing.area;
}
</style>