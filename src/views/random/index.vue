<template>
  <div class="flex justify-center">
    <a-tabs v-model:active-key="activeKey" class="max-w-screen-lg">
      <a-tab-pane key="1" class="px-5" title="随机分组">
        <random-main
          :bind-graph="bindGraph"
          :enemy-graph="enemyGraph"
          :player-info="playerInfo"
          :role-hero="roleHero"
          :role-list="roleList"
        />
      </a-tab-pane>
      <a-tab-pane key="2" class="px-5" title="添加玩家">
        <add-player
          ref="addPlayer"
          :player-info="playerInfo"
          :show-menu="showMenu"
          @add-player="handleAddPlayer"
        />
      </a-tab-pane>
      <a-tab-pane key="3" class="px-5" title="英雄列表">
        <hero-list :role-hero="roleHero" @add-hero="handleAddHero" @delete-hero="handleDelHero" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import RandomMain from './RandomMain.vue';
import AddPlayer from './AddPlayer.vue';
import HeroList from './HeroList.vue';
import G6, { GraphData, Edge, EdgeConfig } from '@antv/g6';
import { Message } from '@arco-design/web-vue';
import PlayerGraph, { gColors } from './Graph';
import dfs from '@/utils/dfs';

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
    if(data.edges?.some(edge => typeof edge.target !== 'string')) {
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

interface HeroFile { hero: { name: string; roles: string[]; }[]; version: string; fileTime: string; }

const handleAddHero = (data: { role: string, name: string }) => {
  const { role, name } = data
  const heroList = JSON.parse(localStorage.getItem('heroList') || '{}') as HeroFile
  const hero = heroList.hero.find(item => item.name === name)
  if (hero) {
    if (!hero.roles.includes(role)) {
      hero.roles.push(role)
      localStorage.setItem('heroList', JSON.stringify(heroList))
      Message.success('添加成功')
    } else {
      Message.error('英雄已存在')
    }
  } else {
    heroList.hero.push({
      name,
      roles: [role],
    })
    localStorage.setItem('heroList', JSON.stringify(heroList))
    Message.success('添加成功')
  }
  initHero()
}

const handleDelHero = (data: { role: string, name: string }) => {
  const { role, name } = data
  const heroName = name.split('(')[0]
  const heroList = JSON.parse(localStorage.getItem('heroList') || '{}') as HeroFile
  const hero = heroList.hero.find(item => item.name === heroName)
  if (hero) {
    if (hero.roles.includes(role)) {
      hero.roles = hero.roles.filter(item => item !== role)
      localStorage.setItem('heroList', JSON.stringify(heroList))
      Message.success('删除成功')
    } else {
      Message.error('英雄不存在')
    }
  } else {
    Message.error('英雄不存在')
  }
  initHero()
}

const initHero = async () => {
  const heroFile = localStorage.getItem('heroList')
  let heroList: HeroFile | undefined
  if (heroFile) {
    heroList = JSON.parse(heroFile) as HeroFile
  } else {
    heroList = (await import('@/assets/hero-list.json')).default as HeroFile
    localStorage.setItem('heroList', JSON.stringify(heroList))
  }
  roleHero.value = roleList.reduce((pre, role, index) => ({
    ...pre,
    [roleList[index]]: heroList?.hero.filter(item => item.roles.includes(role)).map(item => {
      return item.name + `(${item.roles})`
    }) || []
  }), {})
}

initPlayerInfo()
initHero()
</script>
