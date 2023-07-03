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
        placeholder="请输入玩家名称（按回车添加）"
        allow-clear
        @keyup.enter="handleSubmit"
      />
    </a-form-item>
  </a-form>
  <a-list v-if="playerInfo?.length" :max-height="660">
    <template #header>
      玩家信息(点击进行玩家同队绑定)
    </template>
    <a-tag
      v-for="(item, index) in playerInfo"
      :key="item.name"
      class="m-2 cursor-pointer"
      color="purple"
      closable
      @click="handleSelectPlayers(item, index)"
      @close="handleDeletePlayer(item)"
    >
      {{ item.name }}
    </a-tag>
  </a-list>
  <div v-if="currentPlayerInfo.name" class="mt-4">
    <span class="text-lg">{{ currentPlayerInfo.name }}</span>
    <a-select
      v-model:model-value="currentPlayerInfo.bindPlayers"
      class="mt-2"
      placeholder="请选择同队玩家（最多2个）"
      allow-clear
      allow-search
      multiple
    >
      <a-option
        v-for="item in playerInfo?.filter(e => e.name !== currentPlayerInfo.name)"
        :key="item.name"
        :value="item.name"
      >
        {{ item.name }}
      </a-option>
    </a-select>
    <a-button class="mt-4" type="primary" @click="handleBindPlayers">绑定</a-button>
  </div>
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
  bindPlayers: [],
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

const currentPlayerInfo = ref<PlayerInfo>({
  name: '',
  bindPlayers: [],
})

const currentPlayerInfoIndex = ref<number>(0)

const handleSelectPlayers = (item: PlayerInfo, index: number) => {
  currentPlayerInfoIndex.value = index
  currentPlayerInfo.value = JSON.parse(JSON.stringify(item))
}

const bindFn = (player1: PlayerInfo, player2: PlayerInfo) => {
  if (!player1.bindPlayers.includes(player2.name)) {
    player1.bindPlayers.push(player2.name)
    player2.bindPlayers.forEach(item => {
      if(item !== player1.name && !player1.bindPlayers.includes(item)) {
        player1.bindPlayers.push(item)
      }
    })
  }
  return true
}

const unbindFn = (player1: PlayerInfo, player2: PlayerInfo) => {
  const index1 = player1.bindPlayers.findIndex(item => item === player2.name)
  const index2 = player2.bindPlayers.findIndex(item => item === player1.name)
  if (index1 !== undefined && index1 !== -1) {
    player1.bindPlayers.splice(index1, 1)
  }
  if (index2 !== undefined && index2 !== -1) {
    player2.bindPlayers.splice(index2, 1)
  }
  // 从全部玩家中解除绑定关系
  props.playerInfo?.forEach(item => {
    if (item.name !== player1.name && item.name !== player2.name) {
      const index1 = item.bindPlayers.findIndex(e => e === player1.name)
      const index2 = item.bindPlayers.findIndex(e => e === player2.name)
      if (index1 !== undefined && index1 !== -1) {
        item.bindPlayers.splice(index1, 1)
      }
      if (index2 !== undefined && index2 !== -1) {
        item.bindPlayers.splice(index2, 1)
      }
    }
  })
}

const handleBindPlayers = () => {
  const currentPlayerInfoOrigin = props.playerInfo?.[currentPlayerInfoIndex.value]
  if (currentPlayerInfoOrigin) {
    // 判断当前选择玩家绑定关系是否有变化
    if (JSON.stringify(currentPlayerInfoOrigin) === JSON.stringify(currentPlayerInfo.value)) {
      Message.error('绑定关系未发生变化')
      return
    } else {
      // 解除原有绑定关系
      for(let i = 0; i < currentPlayerInfoOrigin.bindPlayers.length; i++) {
        const item = currentPlayerInfoOrigin.bindPlayers[i]
        const player = props.playerInfo?.find(e => e.name === item)
        if (player) {
          unbindFn(player, currentPlayerInfoOrigin)
          i--
        }
      }
      const result: boolean[] = []
      // 绑定新的关系
      currentPlayerInfo.value.bindPlayers.forEach(item => {
        const player = props.playerInfo?.find(e => e.name === item)
        if (player) {
          result.push(bindFn(player, currentPlayerInfo.value))
        }
      })
      if (result.every(item => item)) {
        props.playerInfo[currentPlayerInfoIndex.value] = currentPlayerInfo.value
      }
      localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
      Message.success('绑定成功')
      emit('success')
    }
  }
}


const handleDeletePlayer = (item: PlayerInfo) => {
  const index = props.playerInfo?.findIndex(player => player.name === item.name)
  if (index !== undefined && index !== -1) {
    props.playerInfo?.splice(index, 1)
    localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
    Message.success('删除成功')
    emit('success')
  }
}

</script>
