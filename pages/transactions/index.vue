
<template lang="pug">
  ul.transactions_container
    Loading(v-if="!allTransactions && $apollo.loading")
    li(v-for="tx in allTransactions" :key="tx.id").tx 
      a(:href="`https://viewblock.io/arweave/tx/${tx.id}`" target="_blank")
        | ID: 
        b {{ tx.id }}
      div(v-for="key in ['target', 'quantity', 'reward']")
        nuxt-link(:to="{ name: 'transactions', query: { [key]: tx[key] } }") 
          | {{ key }}: {{ tx[key] }}
      details 
        summary Data 
        span {{ tx.data }}
      h4 Tags:
      ul
        li(v-for="(val, key) in tx.tags") 
          | {{ val.name }}: 
          b 
            span(v-if="val.name != 'Date-Time'") {{ val.value }}
            span(v-else) {{ new Date(val.value).toLocaleDateString() }} {{ new Date(val.value).toLocaleTimeString() }}
</template>


<script>
import { QUERY_TRANSACTIONS } from '../../client-graphql'

export default {
  apollo: {
    allTransactions() {
      const { from, to, id, quantity, reward, block_height, block_indep_hash } =
        this.$route.query || {}
      return {
        query: QUERY_TRANSACTIONS,
        variables: {
          filter: {
            from,
            to,
            id,
            quantity,
            reward,
            block_height,
            block_indep_hash
          }
        }
      }
    }
  }
}
</script>


<style lang="stylus">
.transactions_container {
  overflow: wrap;
  white-space: wrap;
  width: 100%;

  .tx {
  }
}
</style>