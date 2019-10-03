
<template lang="pug">
   div(
      style=`
        width: 100%;
        position: relative;
      `
    )
      div(
        style=`
          width: 100%;
          height: 100%;
          position: absolute;
          pointer-events: none;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 2;
          background-image: linear-gradient(to right, white, transparent, transparent, transparent, white);
        `
      )
      div(
        style=`
          display: flex;
          flex-direction: row;
          width: 100%;
          overflow-x: scroll;
          align-items: center;
          justify-content: flex-start;
          padding: 10px;
          border-radius: 200px;
        `
        @mouseover.once=`e => {
            const width = e.target.scrollWidth / 3
            e.target.scrollLeft = width;
        }`
          
        @scroll=`e => {
          const sectionWidth = e.target.scrollWidth / 3
          const tooFarToRight = sectionWidth * 2 < e.target.scrollLeft
          const tooFarToLeft = e.target.scrollLeft < sectionWidth;
          if (tooFarToRight) {
            e.target.scrollLeft = sectionWidth;
          } else if (tooFarToLeft) {
            e.target.scrollLeft = sectionWidth * 2
          }
        }`
      )
        Avatar(
          v-for="(avi, index) in Array.from({ length: avatars.length * 3 }, (a, i) => avatars[i%avatars.length])"
          :key="avi + index"
          medium
          style="margin: 5px;"
          :avatar-image="{ base64: avi }"
  
        )
          div(
            style=`
              height: 100%;
              width: 100%;
              position: absolute;
              z-index: 2;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              cursor: pointer;
            `
            @click="$emit('selected', avi)"
          )
</template>


<script>
import { avatars } from '~/assets/images/avatars'

export default {
  data: _ => ({
    avatars
  }),
  methods: {
    formatAvatarPath(avatar) {
      return avatar
        .split('/')
        .pop()
        .replace('icons8-', '')
        .replace('.svg', '')
        .split('-')
        .map(word => {
          let [first, ...chars] = word
          first = first.toUpperCase()
          return [first, ...chars].join('')
        })
        .join(' ')
    }
  }
}
</script>


<style lang="scss">
</style>