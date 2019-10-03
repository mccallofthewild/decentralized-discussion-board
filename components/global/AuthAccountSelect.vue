
<template lang="pug">
div
  div(v-if="false && auth && auth.accounts")
    h1 Select Account
    div(
      style=`
      display: grid; 
      grid-gap: 5px 10px;
      align-content: center;
      grid-template-columns: 30px 10px 200px; 
      border-top: 1px solid black;
      width: 300px;
      `
      v-if="auth.accounts"
      v-for="account in auth.accounts" 
      :key="account.id" 
      @click="setAccount(account.id)"
    )
      Avatar(small :avatar-image="account.profile.avatarImage")
      div
      div
        h3 {{ account.profile.displayName }}
        h4 @{{ account.profile.username }}
        p {{ account.profile.description }}
    div 
      button(
        @click="$router.push({name: 'accounts-create'})"
      ) Add Account
  Lottie(v-else height="100vh" width="60vw")
</template>


<script>
import { QUERY_AUTH, MUTATION_AUTH_ACCOUNT } from '../../client-graphql'
export default {
  data: _ => ({
    accounts: []
  }),
  apollo: {
    auth: QUERY_AUTH
  },
  methods: {
    async setAccount(id) {
      console.log('setting account')
      await this.$apollo.mutate({
        mutation: MUTATION_AUTH_ACCOUNT,
        refetchQueries: [{ query: QUERY_AUTH }],
        variables: {
          accountId: id
        }
      })
      alert('set account!')
      this.$router.push({ name: 'users-accountId', params: { accountId: id } })
    }
  }
}
</script>


<style lang="scss">
</style>