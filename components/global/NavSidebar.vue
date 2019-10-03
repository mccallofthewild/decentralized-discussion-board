<template lang="pug">
  nav
    div
      Logo
      //- :paused="!$store.state.ui.loading"
      Lottie(
        lottie-file="https://assets2.lottiefiles.com/temp/lf20_IxpQni.json" 
        width="100%" 
        height="auto"
        :paused="true"
        :seek="scrollProgress"
      ).lottie
      div(v-if='!auth || $apollo.queries.auth.loading')
        //- Scanning Thumbprint https://assets7.lottiefiles.com/temp/lf20_lruRTf.json
        //- Person Driving Scooter (Really Good) https://assets2.lottiefiles.com/temp/lf20_IxpQni.json
        //- Swirly Infinity https://assets1.lottiefiles.com/packages/lf20_frdtxW.json
        //- Digital Human Scanning https://assets2.lottiefiles.com/temp/lf20_HXh4T7.json
        
      div(v-else)
        div(v-if="auth && auth.wallet")
          div(v-if="auth.account")
            nuxt-link(:to="{ name: 'users-accountId', params: { accountId: auth.account.id }}") 
              button Profile
            h4 @{{auth.account.profile.username}}
          button(@click='logout') 
            span.emoji 👋
            | logout 
          nuxt-link(tag="button" to="/accounts/select") Switch Account
          p 💰{{ auth.balance }} AR
        nuxt-link(tag="button" v-else='' to='/login') Login / Signup

    //- | created by McCall Alexander
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
  flex-direction: column;
  justify-content: space-between;
  border-right: 2px solid black;
  height: 100%;
  padding: __spacing.area;
}

.lottie {
  __lottieMargins = -1 * __spacing.area;
  margin-left: __lottieMargins;
  margin-right: __lottieMargins;
}
</style>