<template>
  <div class="flex justify-center p-5">
    <a-tabs v-model:active-key="activeKey" class="max-w-screen-lg" lazy-load>
      <a-tab-pane key="1" title="随机分组">
        <random-main :player-info="playerInfo" :role-hero="roleHero" :role-list="roleList" />
      </a-tab-pane>
      <a-tab-pane key="2" title="添加玩家">
        <add-player :player-info="playerInfo" @success="getPlayerInfo" />
      </a-tab-pane>
      <a-tab-pane key="3" title="英雄列表">
        <get-hero-list :hero-list="heroList" @success="(val) => heroList = val" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import RandomMain from './RandomMain.vue';
import AddPlayer from './AddPlayer.vue';
import GetHeroList from './GetHeroList.vue';
import { GraphData } from '@antv/g6';

defineOptions({
  name: 'RandomGroup',
})

export type HeroAttrs = {
  name: string;
  roles: string[];
}

export interface HeroList {
  hero: HeroAttrs[],
  fileTime: string,
  version: string,
}

const roleList = ['法师', '战士', '坦克', '刺客', '射手']

export type RoleHero = {
  [key: string]: string[];
};

const activeKey = ref('1')

const heroList: Ref<HeroList | null> = ref(null)
const roleHero: Ref<RoleHero | undefined> = ref(undefined)
const playerInfo: Ref<GraphData> = ref({})

const getHero = async () => {
  heroList.value = (await import('@/assets/hero-list.json')).default
  roleHero.value = roleList.reduce((pre, role, index)=> ({
    ...pre,
    [roleList[index]]: heroList.value?.hero.filter(item => item.roles.includes(role)).map(item => {
      return item.name + `(${item.roles})`
    }) || []
  }), {})
}

const getPlayerInfo = () => {
  const storePlayerInfo = localStorage.getItem('playerInfo')
  if (storePlayerInfo) {
    playerInfo.value = JSON.parse(storePlayerInfo) as GraphData
  } else {
    playerInfo.value = {
      nodes: [],
      edges: [],
    }
    localStorage.setItem('playerInfo', JSON.stringify(playerInfo.value))
  }
}
getPlayerInfo()
getHero()
</script>
