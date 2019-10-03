
<template lang="pug">
  div(:style="style").image--avatar
    slot
</template>


<script>

export default {
  props: {
    avatarImage: {}
  },
  computed: {
    image() {
      return (
        this.avatarImage || {
          base64: 'https://source.unsplash.com/featured/?portrait&' + Date.now(),
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
  height: 50px;
  width: 50px;
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  box-shadow: 0px 5px 10px -8px rgba(black, 0.5);
  transition: all 1s ease;
  background-color: white;

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