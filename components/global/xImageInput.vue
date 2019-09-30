
<template lang="pug">
  xInputFile(@change='getFile' v-bind="$attrs" v-on="$listeners")
    template(#activator="activator")
      slot(name="activator", v-bind="activator")
</template>

<script>
import Jimp from 'jimp'
export default {
  inheritAttrs: false,
  props: ['processJimp'],
  methods: {
    // get file
    async getFile(e) {
      const files = e.target.files
      const fr = new FileReader()
      fr.onload = async ev => {
        try {
          const imageDataUrl = ev.target.result
          const img = await Jimp.read(imageDataUrl)
          let processed = img
          if (this.processJimp) {
            processed = await this.processJimp(processed)
          }
          const processedDataUri = await processed.getBase64Async(Jimp.MIME_PNG)
          this.$emit('image-type', 'PNG')
          this.$emit('data-uri', processedDataUri)
        } catch (e) {
          alert('image upload failed ' + e.message)
        }
      }
      fr.readAsDataURL(files[0])
      // fr.readAsText(files[0])
    }
    // create image graphql
    // emit
  }
}
</script>


<style lang="scss">
</style>