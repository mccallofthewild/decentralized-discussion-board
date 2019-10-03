
<template lang="pug">
img(:src="img" :style="style").x-icon
</template>


<script>
  import { icons } from '~/assets/images/icons'
  export default {
    props: ['icon', 'size'],
    computed: {
      img () {
        return icons[this.icon]
      },
      style () {
        const size = this.size || '25px'
        return {
          width: size,
          height: size,
          padding: `calc(${size} / 3.27)`
        }
      }
    }
  }

</script>


<style lang="scss">
.x-icon {
  &[button] {
    cursor: pointer;
  }
}
</style>