

<script>
// https://github.com/LottieFiles/lottie-player
import '@lottiefiles/lottie-player'

export default {
  render(createElement) {
    window.CanvasRenderer = class {
      setProjectInterface() {}
    }
    const playerEl = createElement(
      'lottie-player', // tag name
      {
        ref: 'lottiePlayer',
        attrs: {
          background: 'transparent',
          speed: '1',
          loop: true,
          autoplay: true,
          style: `width: ${this.width}; height: ${this.height};`,
          src: this.lottieFile,
          renderer: 'svg',
          animType: 'svg'
        }
      },
      this.$slots.default // array of children
    )
    return playerEl
  },

  data: _ => ({
    lottie: null,
    runCount: 0
  }),
  props: {
    seek: {},
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
    },
    paused: {
      default: _ => false
    }
  },
  async mounted() {
    await this.$nextTick()
    if (this.paused) this.$refs.lottiePlayer.pause()
  },
  methods: {},
  watch: {
    paused(curr, prev) {
      if (this.paused) this.$refs.lottiePlayer.pause()
      if (!this.paused) this.$refs.lottiePlayer.play()
    },
    seek() {
      this.$refs.lottiePlayer.seek(this.seek)
    }
  }
}
</script>


<style lang="stylus" scoped></style>