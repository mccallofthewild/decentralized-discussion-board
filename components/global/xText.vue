
<template lang="pug">
  div.x-text 
    slot
</template>


<script>
export default {}
</script>


<style lang="scss">
.x-text {
  &[h1] {
    font-family: SFProText-Heavy;
    font-size: 35px;
    color: #000000;
    letter-spacing: 0;
  }
  &[h2] {
    font-family: SFProText-Bold;
    font-size: 25px;
    color: #000000;
    letter-spacing: 0;
  }
}
</style>