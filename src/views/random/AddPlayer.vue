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
    <a-divider :margin="5" />
    <a-menu-item key="0_0_1" class="!hover:bg-red-500 !hover:text-white !leading-6 !mb-0" data-obj="1">
      绑定
    </a-menu-item>
    <a-divider :margin="5" />
    <a-menu-item key="0_0_2" class="!hover:bg-red-500 !hover:text-white !leading-6 !mb-0" data-obj="1">
      敌对
    </a-menu-item>
  </a-menu>
</template>

<script setup lang="ts">
import { GraphData } from '@antv/g6';
import { FormInstance, MenuInstance } from '@arco-design/web-vue';
import { Rules } from './RandomMain.vue';

const props = defineProps<{
  showMenu: boolean;
  playerInfo: GraphData;
  activeKey: string;
}>()

const emit = defineEmits<{
  (e: 'add-player', name: string): void
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

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (valid === undefined) {
    const { name } = form
    if (name) {
      emit('add-player', name)
      form.name = ''
    }
  }
}

const container = ref<HTMLDivElement | null>(null)
const contextmenu = ref<MenuInstance | null>(null)

defineExpose({
  container,
  contextmenu,
})

</script>

<style scoped>
:deep(.g6-component-contextmenu) {
  width: 120px;
  padding: 5px 0;
}
</style>
