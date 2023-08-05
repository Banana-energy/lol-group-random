<template>
  <div class="flex justify-center h-screen w-screen">
    <a-tabs v-model:active-key="activeKey">
      <a-tab-pane key="1" class="px-5 tab-pane" title="随机分组">
        <random-main
          :bind-graph="bindGraph"
          :enemy-graph="enemyGraph"
          :player-info="playerInfo"
          :role-hero="roleHero"
          :role-list="roleList"
          class="max-w-screen-lg"
        />
      </a-tab-pane>
      <a-tab-pane key="2" class="px-5 tab-pane" title="添加玩家">
        <add-player
          ref="addPlayer"
          :player-info="playerInfo"
          :show-menu="showMenu"
          class="max-w-screen-lg"
          @add-player="handleAddPlayer"
        />
      </a-tab-pane>
      <a-tab-pane key="3" class="px-5 tab-pane" title="英雄列表">
        <hero-list
          :hero-file="heroFile"
          class="max-w-screen-lg"
          @change-hero-file="handleChangeHeroFile"
          @change-role="handleChangeHero"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="tsx">
import RandomMain from './RandomMain.vue';
import AddPlayer from './AddPlayer.vue';
import HeroList from './HeroList.vue';
import G6, { GraphData, Edge, EdgeConfig } from '@antv/g6';
import { Button, Message, Notification, Row } from '@arco-design/web-vue';
import PlayerGraph, { gColors } from './Graph';
import dfs from '@/utils/dfs';
import { fetch } from '@tauri-apps/api/http';

defineOptions({
  name: 'RandomGroup',
})

const roleList = ['法师', '战士', '坦克', '刺客', '射手']

export type RoleHero = {
  [key: string]: string[];
};

export type RelationGraph = {
  [key: string]: string[];
};

const activeKey = ref('1')

const roleHero: Ref<RoleHero> = ref({})
const heroFile = ref<HeroFile>()
const playerInfo: Ref<GraphData> = ref({})

const playerGraph = ref<PlayerGraph | null>(null)
const showMenu = ref(true)
const addPlayer = ref<typeof AddPlayer | null>(null)

onMounted(() => {
  playerGraph.value = new PlayerGraph(addPlayer.value?.container, addPlayer.value?.contextmenu)
  playerGraph.value?.render(playerInfo.value)
  playerGraph.value.graph?.on<{ edge: Edge }>('aftercreateedge', (e) => {
    if (playerGraph.value?.graph) {
      e.edge.set('states', ['bind'])
      const edges = playerGraph.value.graph.save().edges as EdgeConfig[];
      G6.Util.processParallelEdges(edges);
      playerGraph.value.graph.getEdges().forEach((edge, i) => {
        playerGraph.value?.graph?.updateItem(edge, {
          curveOffset: edges[i].curveOffset,
          curvePosition: edges[i].curvePosition,
        });
      });
      const data = playerGraph.value?.graph?.save() as GraphData
      savePlayerInfo(data)
      Message.success('绑定成功')
    }
  });
  playerGraph.value.graph?.on('afterremoveitem', () => {
    const data = playerGraph.value?.graph?.save() as GraphData
    savePlayerInfo(data)
  })
  playerGraph.value.graph?.on('afterupdateitem', () => {
    const data = playerGraph.value?.graph?.save() as GraphData
    if (data.edges?.some(edge => typeof edge.target !== 'string')) {
      return
    }
    savePlayerInfo(data)
  })
  showMenu.value = false
})

const savePlayerInfo = (data?: GraphData) => {
  if (data) {
    playerInfo.value.edges = data.edges
    playerInfo.value.nodes = data.nodes
    localStorage.setItem('playerInfo', JSON.stringify(playerInfo.value))
  }
}

const bindGraph = computed<RelationGraph>(() => {
  const nodes = playerInfo.value.nodes || []
  const map: { [key: string]: string[] } = {}
  nodes.forEach(node => {
    const bindSet = new Set<string>()
    const seen: { [key: string]: boolean } = {};
    dfs(playerInfo.value, node.id, {
      enter({ current, previous }) {
        const edge = playerGraph.value?.graph?.find('edge', (edge: Edge) => {
          const source = edge.getSource().getID()
          const target = edge.getTarget().getID()
          return (source === current && target === previous) || (source === previous && target === current)
        })
        if (edge?.getStates().includes('bind')) {
          bindSet.add(previous)
          bindSet.add(current)
        }
        map[node.id] = [...bindSet]
      },
      allowTraversal({ current, previous, next }) {
        if (!seen[next]) {
          seen[next] = true;
          const edge = playerGraph.value?.graph?.find('edge', (edge: Edge) => {
            const source = edge.getSource().getID()
            const target = edge.getTarget().getID()
            return (source === current && target === previous) || (source === previous && target === current)
          })
          if (edge?.getStates().includes('enemy')) {
            return false
          }
          return true;
        }
        return false;
      }
    })
  })
  return map
})

const enemyGraph = computed<RelationGraph>(() => {
  const nodes = playerInfo.value.nodes || []
  const map: { [key: string]: string[] } = {}
  nodes.forEach(node => {
    const enemySet = new Set<string>()
    const seen: { [key: string]: boolean } = {};
    dfs(playerInfo.value, node.id, {
      enter({ current, previous }) {
        const edge = playerGraph.value?.graph?.find('edge', (edge: Edge) => {
          const source = edge.getSource().getID()
          const target = edge.getTarget().getID()
          return (source === current && target === previous) || (source === previous && target === current)
        })
        if (edge?.getStates().includes('enemy')) {
          enemySet.add(previous)
          enemySet.add(current)
        }
        map[node.id] = [...enemySet]
      },
      allowTraversal({ current, previous, next }) {
        if (!seen[next]) {
          seen[next] = true;
          const edge = playerGraph.value?.graph?.find('edge', (edge: Edge) => {
            const source = edge.getSource().getID()
            const target = edge.getTarget().getID()
            return (source === current && target === previous) || (source === previous && target === current)
          })
          if (edge?.getStates().includes('bind')) {
            return false
          }
          return true;
        }
        return false;
      }
    })
  })
  return map
})

const handleAddPlayer = (name: string) => {
  if (playerGraph.value?.graph) {
    const playerLength = playerGraph.value.graph.getNodes().length
    playerGraph.value.graph.addItem('node', {
      id: name,
      label: name,
      size: 80,
      color: gColors[0],
      style: {
        fill: gColors[playerLength % gColors.length],
        lineWidth: 0,
      },
      labelCfg: {
        style: {
          fontSize: 20,
          fontWeight: 300,
          fill: '#fff',
        },
      },
    })
    const data = playerGraph.value?.graph?.save() as GraphData
    savePlayerInfo(data)
    playerGraph.value?.graph?.layout()
    Message.success('添加成功')
  }
}

watch(() => activeKey.value, (val) => {
  if (val === '2') {
    if (playerGraph.value?.toolbar) {
      playerGraph.value.toolbar.init()
      playerGraph.value.toolbar.destroyed = false
    }
  } else {
    nextTick(() => {
      if (playerGraph.value?.toolbar) {
        if (!playerGraph.value.toolbar.destroyed) {
          playerGraph.value.toolbar.destroy()
          playerGraph.value.toolbar.destroyed = true
        }
      }
    })
  }
}, {
  immediate: true,
})

const initPlayerInfo = () => {
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

interface HeroAttr {
  name: string;
  title?: string;
  avatar?: string;
  roles: string[];
  alias?: string;
}

export interface HeroFile {
  hero: HeroAttr[];
  version: string;
  fileTime: string;
}

const handleChangeHero = (data: { name: string, role: string }) => {
  const { name, role } = data
  const hero = heroFile.value?.hero.find(item => item.name === name)
  if (hero) {
    hero.roles = [role]
    localStorage.setItem('heroList', JSON.stringify(heroFile.value))
    initHero()
  }
}

const handleChangeHeroFile = (heroFile: HeroFile) => {
  localStorage.setItem('heroList', JSON.stringify(heroFile))
  initHero()
  Message.success('更新成功')
}

const handleNotification = () => {
  const id = `${Date.now()}`;
  Notification.warning({
    id,
    title: '更新',
    content: '英雄列表有更新，请前往英雄列表调整英雄定位',
    duration: 0,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    footer: (<Row wrap={false} justify='end'>
      <Button
        type="secondary"
        size="small"
        onClick={() => Notification.remove(id)}
      >
        取消
      </Button>
      <Button class={'ml-2'} type="primary" size="small" onClick={() => {
        activeKey.value = '3'
        Notification.remove(id)
      }}>
        确定
      </Button>
    </Row>)
  })
}

const initHero = async () => {
  const storeFile = localStorage.getItem('heroList')
  let heroList: HeroFile
  if (storeFile) {
    heroList = JSON.parse(storeFile) as HeroFile
    // 从 https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js 获取
    // 与本地的英雄列表对比版本，如果有更新，就更新本地的英雄列表
    // 通过本地的英雄title匹配获取的英雄列表，有同样的则更新roles，没有则添加
    const { data } = await fetch<HeroFile>('https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js').catch(() => ({ data:heroList }))
    if (data.version !== heroList.version) {
      handleNotification()
      data.hero = data.hero.map(item => {
        const hero = heroList?.hero.find(hero => hero.title === item.title)
        if (hero) {
          item.roles = hero.roles
        }
        return {
          name: item.name,
          title: item.title,
          roles: item.roles.slice(0, 1),
          alias: item.alias,
          avatar: `https://game.gtimg.cn/images/lol/act/img/champion/${item.alias}.png`
        }
      })
      heroList = data
      localStorage.setItem('heroList', JSON.stringify(heroList))
    }
  } else {
    heroList = (await import('@/assets/hero-list.json')).default as HeroFile
    localStorage.setItem('heroList', JSON.stringify(heroList))
    initHero()
  }
  heroFile.value = heroList
  roleHero.value = roleList.reduce((pre, role, index) => ({
    ...pre,
    [roleList[index]]: heroList?.hero.filter(item => item.roles.includes(role)).map(item => {
      return `${item.name}-${item.title}` + `(${item.roles})`
    }) || []
  }), {})
}

initPlayerInfo()
initHero()
</script>

<style lang="scss" scoped>
.tab-pane {
  :deep(.arco-tabs-pane) {
    height: calc(100vh - 64px) !important;
    overflow-y: auto;
  }
}
</style>
