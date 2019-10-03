<template lang="pug">
div.logo-container
  nuxt-link(to='/' tag="img" :src="Logo").logo-container__logo
    
</template>
<script>
import Logo from '~/assets/images/logo.svg'
export default {
  data: _ => ({
    Logo
  })
}
</script>
<style lang="stylus" scoped>
.logo-container {
  &__logo {
    height: 28.2px;
  }
}
</style>