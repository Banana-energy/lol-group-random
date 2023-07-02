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
        @change="handleGetPlayerInfo"
      />
    </a-form-item>
    <a-form-item :label-attrs="{ class: 'flex items-center' }" field="heroPool" label="英雄池">
      <template #label>
        <div class="flex whitespace-nowrap items-center">
          <span>英雄池</span>
          <a-input
            v-model.trim="search"
            class="ml-2"
            placeholder="搜索（按下回车搜索）"
            allow-clear
            @change="handleSearch"
          />
        </div>
      </template>
      <a-scrollbar class="max-h-lg overflow-auto">
        <a-checkbox-group v-if="heroPoolOptions.length" v-model="form.heroPool">
          <a-grid :col-gap="24" :cols="4" :row-gap="16">
            <a-grid-item v-for="item in heroPoolOptions" :key="item.value" class="whitespace-nowrap">
              <a-checkbox :value="item.value">{{ item.label }}</a-checkbox>
            </a-grid-item>
          </a-grid>
        </a-checkbox-group>
      </a-scrollbar>
    </a-form-item>
    <a-form-item>
      <a-button type="primary" @click="handleSubmit">
        确定
      </a-button>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { HeroList, PlayerInfo } from './index.vue';
import { FormInstance, Message } from '@arco-design/web-vue';

const props = defineProps<{
  heroList: HeroList | null;
  playerInfo?: PlayerInfo[];
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const search = ref('')

const formRef = ref<FormInstance>()

interface HeroPoolOptions {
  label: string
  value: string
}

const heroPoolOptions = ref<HeroPoolOptions[]>([])

heroPoolOptions.value = props.heroList?.hero.map(item => ({ label: item.name + '-' + item.title, value: item.name + '-' + item.title })) ?? []

const playerInfoData = computed(() => props.playerInfo?.map(item => item.name))

const rules = {
  name: [
    { required: true, message: '请输入玩家名称', trigger: 'blur' },
  ],
  heroPool: [
    { required: true, message: '英雄池数量为0', trigger: 'change' },
  ],
}

const form = reactive<PlayerInfo>({
  name: '',
  heroPool: [],
})

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (valid === undefined) {
    // 判断是否有同名玩家，有则更新，无则添加
    const player = props.playerInfo?.find(item => item.name === form.name)
    if (player) {
      player.heroPool = form.heroPool
      localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
      Message.success('更新成功')
      emit('success')
      return
    } else {
      props.playerInfo?.push(form)
      localStorage.setItem('playerInfo', JSON.stringify(props.playerInfo))
      Message.success('添加成功')
    }
    emit('success')
  }
}

const handleGetPlayerInfo = (val: string) => {
  const playerInfo = props.playerInfo?.find(item => item.name === val)
  if (playerInfo) {
    form.heroPool = playerInfo.heroPool
  } else {
    form.heroPool = []
  }
}

const handleSearch = (val: string) => {
  heroPoolOptions.value = props.heroList?.hero.filter(item => item.keywords.includes(val)).map(item => ({ label: item.name + '-' + item.title, value: item.heroId })) ?? []
}

</script>
