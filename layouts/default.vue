<template lang="pug">
div.app-container
  div 
  div
    header 
      Navigation(:scrollProgress="scrollProgress")
    main(
      @scroll="monitorScroll"
    )
      button(v-if="$route.path != '/'" @click="$router.back()") ⏪ Back
      nuxt
  div


</template>

<script>
import gql from 'graphql-tag'
import { QUERY_AUTH } from '../client-graphql'
import { monitorXHR } from '../utils'

export default {
  data: _ => ({
    scrollProgress: 0
  }),
  mounted() {
    this.monitorXHR()
  },
  methods: {
    monitorXHR() {
      let loading = 0
      monitorXHR({
        onRequestStart: (method, url) => {
          if (!url.includes('/arql')) return
          if (loading == 0) this.$store.commit('ui/setLoading', true)
          loading++
        },
        onRequestEnd: (method, url) => {
          if (!url.includes('/arql')) return
          loading--
          if (loading == 0) this.$store.commit('ui/setLoading', false)
        }
      })
    },
    monitorScroll(e) {
      // debugger
      this.scrollProgress =
        (Math.round((e.target.scrollTop / e.target.scrollHeight) * 500) % 100) +
        '%'
    }
  },

  apollo: {
    auth: {
      query: QUERY_AUTH,
      update() {
        if (this.auth && !this.auth.account) {
          this.$router.push('/accounts/select')
        }
      }
    }
  }
}
</script>

<style lang="stylus">
.app-container {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  width: 100%;
}

html {
  width: 100%;
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  /* text-transform: lowercase !important; */
}


*, *:before, *:after {
  box-sizing: border-box;
  margin: 0;
}
</style>
