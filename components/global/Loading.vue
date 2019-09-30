
<template lang="pug">
div(ref="container").container
  //- https://lottiefiles.com/9478-loading
  //- lottie-player(src='https://assets5.lottiefiles.com/packages/lf20_iOMDyg.json' background='transparent' speed='1' style='width: 300px; height: 300px;' loop='' autoplay='')
  //- https://lottiefiles.com/9416-just-a-bouncing-ball
  //- lottie-player(src='https://assets2.lottiefiles.com/packages/lf20_UfG5hu.json' background='transparent' speed='1' style='width: 300px; height: 300px;' loop='' autoplay='')
  //- https://lottiefiles.com/3738-blockchain-2
  //- lottie-player(src='https://assets4.lottiefiles.com/datafiles/njmaE1GfhBLP2KZ/data.json' background='transparent' speed='0.75' style='width: 66vw; margin-left: 16vw; height: auto;' loop='' autoplay='')
  //- https://lottiefiles.com/28-loading
  //- lottie-player(background='transparent' speed='1' loop autoplay)
  //- lottie-player(src='https://assets6.lottiefiles.com/datafiles/DlRM2jtACyr4IX1u6l5rqtW1QWZKLCkNoBIXWeyH/loading.json' background='transparent' speed='1' style='width: 300px; height: 300px;' loop='' autoplay='')

</template>


<script>
export default {
  props: {
    lottieFile: {
      default() {
        return 'https://assets2.lottiefiles.com/datafiles/2v8JJf2RtB45OAy/data.json'
      }
    },
    width: {
      default() {
        return '100px'
      }
    },
    height: {
      default() {
        return '100px'
      }
    }
  },
  mounted() {
    const id = 'lottie-player-script'
    const existing = document.getElementById(id)
    const createLottiePlayer = _ => {
      const lottiePlayer = document.createElement('lottie-player')
      Object.entries({
        background: 'transparent',
        speed: '1',
        loop: true,
        autoplay: true,
        style: `width: ${this.width}; height: ${this.height};`,
        src: this.lottieFile
      }).forEach(([key, val]) => lottiePlayer.setAttribute(key, val))
      this.$refs.container.appendChild(lottiePlayer)
    }
    if (existing) return createLottiePlayer()
    let script = document.createElement('script')
    script = document.body.appendChild(script)
    script.setAttribute('id', id)
    script.onload = createLottiePlayer
    script.setAttribute(
      'src',
      'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js'
    )
  }
}
</script>


<style lang="stylus" scoped></style>