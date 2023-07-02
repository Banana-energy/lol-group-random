<template>
  <a-form
    ref="formRef"
    :model="form"
    :rules="rules"
    layout="vertical"
  >
    <a-form-item field="name" label="玩家名称">
      <a-auto-complete
        v-model.trim="form.name"
        :data="playerInfoData"
        placeholder="请输入玩家名称"
        allow-clear
        @keyup.enter="handleSubmit"
      />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" @click="handleSubmit">
        确定
      </a-button>
    </a-form-item>
  </a-form>
  <a-list v-if="playerInfo?.length" :max-height="660">
    <template #header>
      玩家信息
    </template>
    <a-tag
      v-for="item in playerInfo"
      :key="item.name"
      class="m-2"
      color="purple"
      closable
      @close="handleDeletePlayer(item)"
    >
      {{ item.name }}
    </a-tag>
  </a-list>
</template>

<script setup lang="ts">
import { PlayerInfo } from './index.vue';
import { FormInstance, Message } from '@arco-design/web-vue';

const props = defineProps<{
  playerInfo?: PlayerInfo[];
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()


const formRef = ref<FormInstance>()

const playerInfoData = computed(() => props.playerInfo?.map(item => item.name))

const rules = {
  name: [
    { required: true, message: '请输入玩家名称', trigger: 'blur' },
  ],
}

const form = reactive<PlayerInfo>({
  name: '',
})

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (valid === undefined) {
    // 判断是否有同名玩家，有则更新，无则添加
    const player = props.playerInfo?.find(item => item.name === form.name)
    if (player) {
      localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
      Message.success('更新成功')
      emit('success')
      return
    } else {
      props.playerInfo?.push(form)
      localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
      Message.success('添加成功')
    }
    form.name = ''
    emit('success')
  }
}

const handleDeletePlayer = (item: PlayerInfo) => {
  const index = props.playerInfo?.findIndex(player => player.name === item.name)
  if (index !== undefined && index !== -1) {
    props.playerInfo?.splice(index, 1)
    localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
    Message.success('删除成功')
  }
}

</script>
