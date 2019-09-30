
<template lang="pug">
div.file-input-container
  input(type='file', ref="input" :class="native ? '' : 'file-input--hidden'" v-bind="$attrs" v-on="$listeners")
  slot(name="activator", v-if="!native" v-bind="{ activate }")
</template>

<script>
import Jimp from 'jimp'
export default {
  inheritAttrs: false,
  props: ['native'],
  methods: {
    activate() {
      this.$refs.input.click()
    }
  }
}
</script>


<style lang="scss">
.file-input-container {
  position: relative;
  .file-input--hidden {
    // do not use display: none or visibility: hidden because the element needs to be accessible for validation
    height: 0;
    width: 0;
    overflow: hidden;
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    opacity: 0;
    z-index: -1;
  }
}
</style>