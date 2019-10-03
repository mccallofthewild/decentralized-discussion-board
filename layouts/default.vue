<template lang="pug">
div.app-container
  header 
    NavSidebar(:scrollProgress="scrollProgress")
  main(
    @scroll="monitorScroll"
  )
    button(v-if="$route.path != '/'" @click="$router.back()") ⏪ Back
    nuxt


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
:root {
  --color-accent: __colors.accent.main;
}

.app-container {
  navWidth = (100vw / 4.5);
  display: grid;
  grid-template-columns: navWidth 100vw - navWidth;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  grid-auto-flow: column;
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

header {
  max-height: 100vh;
  overflow: hidden;
}

main {
  display: block;
  padding: __spacing.area;
  overflow-y: scroll;
  height: 100vh;
}

*:focus {
  outline: none;
}

body {
  /* zoom: 1.5; */
}

a {
  color: __colors.accent.main;
}

hr {
  border-bottom: 1px solid black;
  margin-top: 25px;
}

button {
  border: none;
  width: auto;
  font-size: 1rem;
  text-transform: uppercase;
  font-weight: 600;
  font-variant: small-caps;
  margin: 5px 0px;
  padding: 3.5px 10px 6px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: __colors.accent.main;
  background: rgba(0, 0, 0, 0.04);

  &:hover {
    border-color: transparent;
    background: rgba(0, 0, 0, 0.01);
  }

  &:focus {
  }
}

select {
  border: 1px solid black;
  font-size: 1rem;
  border-radius: 0;
  padding: 10px;
  background: white;
}

button .emoji {
  font-size: 0.8em;
}

*, *:before, *:after {
  box-sizing: border-box;
  margin: 0;
}
</style>
