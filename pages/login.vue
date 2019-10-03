
<template lang="pug">
div(v-if="auth")
  form(v-if="!auth.wallet")
    xInputFile(@change='login')
      template(#activator="{ activate }")
        button(@click="activate")
          span.emoji 🗝
          | Upload KeyFile
    p or
    button.button.button-outline(onclick="window.open('https://tokens.arweave.org','_blank')")
      span.emoji 💸 
      | Get a free wallet with some tokens.
  AuthAccountSelect(
    v-if="auth.accounts.length"
  )
  AccountProfile(v-if="auth.wallet && !auth.accounts.length")

</template>


<script>
import gql from 'graphql-tag'
import { MUTATION_LOGIN, QUERY_AUTH } from '../client-graphql'
export default {
  apollo: {
    auth: QUERY_AUTH
  },
  methods: {
    async login(e) {
      await new Promise((resolve, reject) => {
        const [file] = e.target.files

        const fr = new FileReader()
        fr.onload = async ev => {
          try {
            const wallet = ev.target.result
            if (!file.type.includes('json')) {
              // QR code image parser
            }
            alert(wallet)
            const { errors = [] } = await this.$apollo.mutate({
              mutation: MUTATION_LOGIN,
              refetchQueries: [{ query: QUERY_AUTH }],
              variables: {
                wallet
              }
            })
            errors.forEach(alert)
            resolve(true)
          } catch (e) {
            reject(e)
          }
        }
        fr.readAsText(file)
      })
    }
  }
}
</script>


<style lang="scss" scoped>
</style>