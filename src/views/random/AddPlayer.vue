<template>
  <a-form
    ref="formRef"
    :model="form"
    :rules="rules"
    layout="vertical"
  >
    <a-form-item field="name" label="玩家名称">
      <a-input
        v-model.trim="form.name"
        placeholder="请输入玩家名称（按回车添加）"
        allow-clear
        @keydown.enter="handleSubmit"
      />
    </a-form-item>
  </a-form>
  <div ref="container" class="w-full h-lg mt-4"></div>
  <a-menu v-if="showMenu" ref="contextmenu" :default-open-keys="['0']">
    <a-menu-item key="0_0_0" class="!hover:bg-red-500 !hover:text-white !leading-6 !mb-0" data-obj="1">
      删除
    </a-menu-item>
  </a-menu>
</template>

<script setup lang="ts">
import G6, { EdgeConfig, GraphData } from '@antv/g6';
import PlayerGraph, { gColors } from './Graph';
import { FormInstance, MenuInstance, Message } from '@arco-design/web-vue';
import { Rules } from './RandomMain.vue';

const props = defineProps<{
  playerInfo: GraphData;
  activeKey: string;
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
})
const rules = reactive<Rules>({
  name: [
    {
      required: true,
      message: '请输入玩家名称',
    },
    {
      validator: (value, callback) => {
        if (props.playerInfo?.nodes?.find(item => item.id === value)) {
          callback('玩家已存在')
        } else {
          callback()
        }
      },
    },
  ],
})

const playerLength = computed(() => props.playerInfo?.nodes?.length || 0)

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (valid === undefined) {
    const { name } = form
    if (name) {
      props.playerInfo.nodes?.push({
        id: name,
        label: name,
        size: 80,
        color: gColors[0],
        style: {
          fill: gColors[playerLength.value % gColors.length],
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
      localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
      emit('success')
      form.name = ''
      graph.render(props.playerInfo)
      Message.success('添加成功')
    }
  }
}

const container = ref<HTMLDivElement>()
const contextmenu = ref<MenuInstance>()

let graph: PlayerGraph
const showMenu = ref(true)
onMounted(() => {
  graph = new PlayerGraph(container.value, contextmenu.value)
  graph.render(props.playerInfo)

  graph.graph?.on('aftercreateedge', () => {
    if (graph.graph) {
      const edges = graph.graph.save().edges as EdgeConfig[];
      G6.Util.processParallelEdges(edges);
      graph.graph.getEdges().forEach((edge, i) => {
        graph.graph?.updateItem(edge, {
          curveOffset: edges[i].curveOffset,
          curvePosition: edges[i].curvePosition,
        });
      });
      props.playerInfo.edges = graph.graph.save().edges as EdgeConfig[]
      localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
      emit('success')
      Message.success('绑定成功')
    }
  });
  graph.graph?.on('afterremoveitem', () => {
    const data = graph.graph?.save() as GraphData
    if (data) {
      props.playerInfo.edges = data.edges
      props.playerInfo.nodes = data.nodes
      localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
      emit('success')
    }
  })
  showMenu.value = false
})

watch(() => props.activeKey, (val) => {
  if (val === '2') {
    if (graph.toolbar) {
      graph.toolbar.init()
      graph.toolbar.destroyed = false
    }
  } else {
    if (graph.toolbar) {
      if (!graph.toolbar.destroyed) {
        graph.toolbar.destroy()
        graph.toolbar.destroyed = true
      }
    }
  }
})

</script>

<style scoped>
:deep(.g6-component-contextmenu) {
  width: 120px;
  padding: 5px 0;
}
</style>
