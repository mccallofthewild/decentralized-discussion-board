
<template lang="pug">
  div.category-list
    div(
      v-for="c in displayCategories"
      :key="c.key"
      @click="c.click"
    ).category-list__item
      div {{ c.title }}
</template>


<script>
export default {
  props: ['categories'],
  data: _ => ({
    expanded: false
  }),
  computed: {
    displayCategories() {
      if (!this.categories) return []
      const categoriesToItems = categories =>
        categories.map(c => ({
          key: c.id,
          title: c.title,
          click: _ =>
            this.$router.push({
              name: 'categories-categoryId',
              params: { categoryId: c.id }
            })
        }))
      return this.expanded
        ? [
            ...categoriesToItems(this.categories),
            {
              title: 'Hide Categories',
              key: 'retractor',
              click: _ => {
                this.expanded = false
              }
            }
          ]
        : [
            ...categoriesToItems(this.categories.slice(0, 2)),
            {
              title: 'View All Categories',
              key: 'expander',
              click: _ => {
                this.expanded = true
              }
            }
          ]
    }
  }
}
</script>


<style lang="scss">
.category-list {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 15px;
  margin-top: 30px;
  &__item {
    background: #000000;
    height: 113px;
    padding: 15px;
    font-weight: 700;
    font-size: 20px;
    color: #fafafa;
    letter-spacing: 0;
  }
}
</style>