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
</template>

<script setup lang="ts">
import G6, { EdgeConfig, GraphData } from '@antv/g6';
import PlayerGraph, { gColors } from './Graph';
import { FormInstance, Message } from '@arco-design/web-vue';
import { Rules } from './RandomMain.vue';

const props = defineProps<{
  playerInfo: GraphData;
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

let graph: PlayerGraph
onMounted(() => {
  graph = new PlayerGraph(container.value)
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
})

</script>
