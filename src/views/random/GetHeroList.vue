<template>
  <a-descriptions :column="1" title="英雄列表">
    <a-descriptions-item v-for="item of data" :key="item.label" :label="item.label">
      <a-tag color="purple">{{ item.value }}</a-tag>
    </a-descriptions-item>
  </a-descriptions>
  <a-list v-if="heroList?.hero.length" :max-height="660">
    <a-list-item v-for="item in heroList.hero" :key="item.name">
      <a-list-item-meta :description="item.roles.join(',')" />
    </a-list-item>
  </a-list>
</template>

<script setup lang="ts">
import { HeroList } from './index.vue';

const props = defineProps<{
  heroList: HeroList | null
}>()

const data = [
  {
    label: '版本',
    value: props.heroList?.version || '',
  },
  {
    label: '更新时间',
    value: props.heroList?.fileTime || '',
  },
  {
    label: '英雄数量',
    value: props.heroList?.hero.length || '',
  }
]

</script>
