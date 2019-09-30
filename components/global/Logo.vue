<template lang="pug">
div.logo-container
  nuxt-link(to='/').logo-container__logo
    span.cursive Loom
    span(style="font-weight: 800; font-size: 0.65em;") CHAT
  p 
    em Powered by Arweave
</template>

<style lang="stylus" scoped>
.logo-container {
  &__logo {
    font-size: 2rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
  }
}

.cursive {
  font-family: 'Kitten Swash Monoline', cursive;
}
</style>