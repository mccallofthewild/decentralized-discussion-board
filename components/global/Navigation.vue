<template lang="pug">
  nav
    Logo
    //- :paused="!$store.state.ui.loading"
    div
      div(v-if='!auth || $apollo.queries.auth.loading')
        | Loading...
      div(v-else)
        div(v-if="auth && auth.wallet")
          div(v-if="auth.account")
            nuxt-link(:to="{ name: 'users-accountId', params: { accountId: auth.account.id }}") 
              button Profile
            h4 @{{auth.account.profile.username}}
          xBtn(text @click='logout' ) 
            | logout 

        xBtn(v-else :nuxt="true" to='/login') Login

</template>

<script>
import { QUERY_AUTH, MUTATION_LOGOUT } from '../../client-graphql'

export default {
  props: ['scrollProgress'],
  mounted() {
    // this.$apollo.queries.auth.startPolling(2000) // ms
  },
  methods: {
    logout() {
      this.$apollo.mutate({
        mutation: MUTATION_LOGOUT,
        refetchQueries: [{ query: QUERY_AUTH }]
      })
    }
  },
  apollo: {
    auth: { query: QUERY_AUTH }
  }
}
</script>

<style lang="stylus" scoped>
nav {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 15px;
}
</style>