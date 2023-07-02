<template>
  <div class="flex justify-center p-5">
    <a-tabs v-model:active-key="activeKey" class="max-w-screen-lg" lazy-load>
      <a-tab-pane key="1" title="随机分组">
        <random-main :player-info="playerInfo" />
      </a-tab-pane>
      <a-tab-pane key="2" title="添加玩家">
        <add-player :hero-list="heroList" :player-info="playerInfo" @success="getPlayerInfo" />
      </a-tab-pane>
      <a-tab-pane key="3" title="英雄列表">
        <get-hero-list :hero-list="heroList" />
      </a-tab-pane>
      <a-tab-pane key="4" title="玩家信息">
        <a-list v-if="playerInfo?.length" :max-height="660">
          <template #header>
            玩家信息
          </template>
          <a-list-item v-for="item in playerInfo" :key="item.name">
            <a-list-item-meta :title="item.name">
              <template #description>
                <a-tag
                  v-for="hero in item.heroPool"
                  :key="hero"
                  class="mr-2 my-1"
                  color="pinkpurple"
                  closable
                  @close="handleDeleteHero(item, hero)"
                >
                  {{ hero }}
                </a-tag>
              </template>
            </a-list-item-meta>
            <template #actions>
              <icon-delete class="cursor-pointer" @click="handleDeletePlayer(item)" />
            </template>
          </a-list-item>
        </a-list>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import RandomMain from './RandomMain.vue';
import AddPlayer from './AddPlayer.vue';
import GetHeroList from './GetHeroList.vue';
import { IconDelete } from '@arco-design/web-vue/es/icon';

defineOptions({
  name: 'RandomGroup',
})

export type HeroAttrs = {
  heroId: string;
  name: string;
  title: string;
  keywords: string;
}

export interface HeroList {
  hero: HeroAttrs[],
  fileTime: string,
  version: string,
}

export interface PlayerInfo {
  name: string;
  heroPool: string[];
}

const activeKey = ref('1')

const heroList: Ref<HeroList | null> = ref(null)
const playerInfo: Ref<PlayerInfo[] | undefined> = ref([])

const handleDeleteHero = (item: PlayerInfo, hero: string) => {
  item.heroPool = item.heroPool.filter((item) => item !== hero)
  localStorage.setItem('playerInfo', JSON.stringify(playerInfo.value))
}

const handleDeletePlayer = (item: PlayerInfo) => {
  playerInfo.value = playerInfo.value?.filter((player) => player.name !== item.name)
  localStorage.setItem('playerInfo', JSON.stringify(playerInfo.value))
}

const getHero = async () => {
  heroList.value = (await import('@/assets/hero-list.json')).default
}

const getPlayerInfo = () => {
  const storePlayerInfo = localStorage.getItem('playerInfo')
  if (storePlayerInfo) {
    playerInfo.value = JSON.parse(storePlayerInfo) as PlayerInfo[]
  }
}
getPlayerInfo()
getHero()
</script>
