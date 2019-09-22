
<template lang="pug">
.container

  .file-input
    input#file(type='file' @change='login')
    #desc Drop a keyfile to login.
  div
    p
      br
      | Weavemail is mail that 
      b Google cannot read
      | .
      br
      | Mail that 
      b cannot be censored
      | .
      br
      | Mail that 
      b cannot be lost
      | .
      br
      span(style='display: inline-block; margin-top: 0.5em; margin-bottom: 0.75em;')
        | Weavemail is mail that 
        b you own
        | .
      br
    button.button.button-outline(onclick=" window.open('https://tokens.arweave.org','_blank')")
      | Get a wallet with some tokens.

</template>


<script>
import { AR__SET_WALLET } from '@/store-names/mutations'
import { AR__LOGIN } from '../store-names/actions'
export default {
  methods: {
    login(e) {
      const files = e.target.files
      const fr = new FileReader()
      fr.onload = ev => {
        try {
          const wallet = JSON.parse(ev.target.result)
          this.$store.dispatch(AR__LOGIN, { wallet })
        } catch (err) {
          alert('Error logging in: ' + err)
        }
      }
      fr.readAsText(files[0])
    }
  },
  watch: {
    '$store.state.ar.wallet': {
      immediate: true,
      handler(val) {
        if (val) {
          alert('logged in!')
          this.$router.push('/')
        }
      }
    }
  }
}
</script>


<style lang="scss" scoped>
</style>