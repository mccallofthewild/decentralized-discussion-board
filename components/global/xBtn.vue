
<template lang="pug">
  button(v-if="!nuxt")
    slot
  nuxt-link(v-else tag="button", :to="to")
    slot
</template>


<script>
export default {
  props: ['nuxt', 'to']
}
</script>


<style lang="scss">
button {
  background: none;
  border: none;
  text-transform: uppercase;
  font-weight: 800;
  font-size: 15px;
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