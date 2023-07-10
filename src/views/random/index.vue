<template>
  <div class="flex justify-center p-5">
    <a-tabs v-model:active-key="activeKey" class="max-w-screen-lg">
      <a-tab-pane key="1" title="随机分组">
        <random-main
          :bind-graph="bindGraph"
          :player-info="playerInfo"
          :role-hero="roleHero"
          :role-list="roleList"
        />
      </a-tab-pane>
      <a-tab-pane key="2" title="添加玩家">
        <add-player
          ref="addPlayer"
          :active-key="activeKey"
          :player-info="playerInfo"
          :show-menu="showMenu"
          @add-player="handleAddPlayer"
        />
      </a-tab-pane>
      <a-tab-pane key="3" title="英雄列表">
        <hero-list :hero-list="heroList" @success="(val) => heroList = val" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import RandomMain from './RandomMain.vue';
import AddPlayer from './AddPlayer.vue';
import HeroList from './HeroList.vue';
import G6, { GraphData, Edge, EdgeConfig, INode } from '@antv/g6';
import { Message } from '@arco-design/web-vue';
import PlayerGraph, { gColors } from './Graph';

defineOptions({
  name: 'RandomGroup',
})

export type HeroAttrs = {
  name: string;
  roles: string[];
}

export interface IHeroList {
  hero: HeroAttrs[],
  fileTime: string,
  version: string,
}

const roleList = ['法师', '战士', '坦克', '刺客', '射手']

export type RoleHero = {
  [key: string]: string[];
};

const activeKey = ref('1')

const heroList: Ref<IHeroList | null> = ref(null)
const roleHero: Ref<RoleHero | undefined> = ref(undefined)
const playerInfo: Ref<GraphData> = ref({})

const bindGraph = ref<INode[][]>([])
const enemyGraph = ref<INode[][]>([])

let playerGraph: PlayerGraph | undefined
const showMenu = ref(true)
const addPlayer = ref<typeof AddPlayer | null>(null)

onMounted(() => {
  playerGraph = new PlayerGraph(addPlayer.value?.container, addPlayer.value?.contextmenu)
  playerGraph?.render(playerInfo.value)
  playerGraph.graph?.on<{ edge: Edge }>('aftercreateedge', (e) => {
    if (playerGraph?.graph) {
      e.edge.set('states', ['bind'])
      const edges = playerGraph.graph.save().edges as EdgeConfig[];
      G6.Util.processParallelEdges(edges);
      playerGraph.graph.getEdges().forEach((edge, i) => {
        playerGraph?.graph?.updateItem(edge, {
          curveOffset: edges[i].curveOffset,
          curvePosition: edges[i].curvePosition,
        });
      });
      const data = playerGraph?.graph?.save() as GraphData
      savePlayerInfo(data)
      Message.success('绑定成功')
    }
  });
  playerGraph.graph?.on('afterremoveitem', () => {
    const data = playerGraph?.graph?.save() as GraphData
    savePlayerInfo(data)
  })
  playerGraph.graph?.on('afterupdateitem', () => {
    const data = playerGraph?.graph?.save() as GraphData
    savePlayerInfo(data)
  })
  showMenu.value = false
  getRelationGraph()
})

const getBindGraph = () => {
  const bindPlayer = playerGraph?.graph?.getEdges().filter(edge => edge.getStates().includes('bind')).map(edge => [edge.getSource(), edge.getTarget()]) || []
  const set = new Set()
  bindPlayer.forEach(nodes => {
    nodes.forEach(node => {
      set.add(node.getID())
    })
  })
  const unbindPlayer = playerGraph?.graph?.getNodes().filter(node => !set.has(node.getID())) || []
  bindGraph.value = [...bindPlayer, ...unbindPlayer.map(node => [node])]
}

const getEnemyGraph = () => {
  const bindPlayer = playerGraph?.graph?.getEdges().filter(edge => edge.getStates().includes('enemy')).map(edge => [edge.getSource(), edge.getTarget()]) || []
  const set = new Set()
  bindPlayer.forEach(nodes => {
    nodes.forEach(node => {
      set.add(node.getID())
    })
  })
  const unbindPlayer = playerGraph?.graph?.getNodes().filter(node => !set.has(node.getID())) || []
  enemyGraph.value = [...bindPlayer, ...unbindPlayer.map(node => [node])]
}

const getRelationGraph = () => {
  getBindGraph()
  getEnemyGraph()
}

const savePlayerInfo = (data?: GraphData) => {
  if (data) {
    playerInfo.value.edges = data.edges
    playerInfo.value.nodes = data.nodes
    localStorage.setItem('playerInfo', JSON.stringify(playerInfo.value))
    getRelationGraph()
  }
}

const handleAddPlayer = (name: string) => {
  if (playerGraph?.graph) {
    const playerLength = playerGraph.graph.getNodes().length
    playerGraph.graph.addItem('node', {
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
    const data = playerGraph?.graph?.save() as GraphData
    savePlayerInfo(data)
    Message.success('添加成功')
  }
}

watch(() => activeKey.value, (val) => {
  if (val === '2') {
    if (playerGraph?.toolbar) {
      playerGraph.toolbar.init()
      playerGraph.toolbar.destroyed = false
    }
  } else {
    nextTick(() => {
      if (playerGraph?.toolbar) {
        if (!playerGraph.toolbar.destroyed) {
          playerGraph.toolbar.destroy()
          playerGraph.toolbar.destroyed = true
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

const initHero = async () => {
  heroList.value = (await import('@/assets/hero-list.json')).default
  roleHero.value = roleList.reduce((pre, role, index) => ({
    ...pre,
    [roleList[index]]: heroList.value?.hero.filter(item => item.roles.includes(role)).map(item => {
      return item.name + `(${item.roles})`
    }) || []
  }), {})
}

initPlayerInfo()
initHero()
</script>
