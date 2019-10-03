
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
  &[title] {
    font-family: SFProText-Semibold;
    font-size: 15px;
    color: rgba(0,0,0,0.50);
    letter-spacing: 0;
    &[light] {
      font-family: SFProText-Regular;
      font-size: 15px;
      color: rgba(0,0,0,0.50);
      letter-spacing: 0;
    }
  }
  &[link] {
    font-family: SFProText-Semibold;
    font-size: 15px;
    color: #692FC6;
    letter-spacing: 0;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>