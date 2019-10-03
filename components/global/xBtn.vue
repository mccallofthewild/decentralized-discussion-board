
<template lang="pug">
  button(v-if="!nuxt" v-on="$listeners")
    slot
  nuxt-link(v-else tag="button", :to="to" v-on="$listeners")
    slot
</template>


<script>
export default {
  props: ['nuxt', 'to'],
  data: _ => ({ })
}
</script>


<style lang="scss">
button {
  background: none;
  border: none;
  text-transform: uppercase;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  &[text] {
    color: #000000;
    letter-spacing: 0;
    text-align: center;
  }
  &[flat] {
    padding: 12px 32px;
    background: #fafafa;
  }
}
</style>