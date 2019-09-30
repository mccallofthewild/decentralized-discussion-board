
<template lang="pug">
div 
  Loading(v-if="!account" width="33vh" height="33vh")
  AccountProfile(v-else-if="account" :account="account")
</template>

<script>
import { QUERY_ACCOUNT } from '~/client-graphql'
export default {
  apollo: {
    account() {
      return {
        query: QUERY_ACCOUNT,
        variables: {
          id: this.$route.params.accountId
        }
      }
    }
  }
}
</script>  