
<template lang="pug">
  div(:style="style").image--avatar
    slot
</template>


<script>
import patternImage from '~/assets/images/default-avatar.svg'
export default {
  props: {
    avatarImage: {}
  },
  computed: {
    image() {
      return (
        this.avatarImage || {
          base64: patternImage,
          fileType: 'SVG',
          alt: null
        }
      )
    },
    style() {
      const src = this.image.base64
      return {
        backgroundImage: `url("${src}")`
      }
    }
  }
}
</script>


<style lang="stylus" scoped>
sizes ?= {
  small: 33px,
  medium: 66px,
  large: 132px,
  xLarge: 264px
};

.image--avatar {
  position: relative;
  background-color: white;
  border-radius: 100%;
  height: 100%;
  width: 100%;
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  box-shadow: 0px 5px 10px -8px rgba(black, 0.5);
  margin: 10px;
  transition: all 1s ease;

  &[small] {
    padding: (sizes.small / 2px);
    max-width: sizes.small;
    max-height: sizes.small;
  }

  &[medium] {
    padding: (sizes.medium / 2px);
    max-width: sizes.medium;
    max-height: sizes.medium;
  }

  &[large] {
    padding: (sizes.large / 2px);
    max-width: sizes.large;
    max-height: sizes.large;
  }

  &[x-large] {
    padding: (sizes.xLarge / 2px);
    max-width: sizes.xLarge;
    max-height: sizes.xLarge;
  }
}
</style>