<template>
  <a-form
    ref="formRef"
    :model="form"
    :rules="rules"
    layout="vertical"
  >
    <a-form-item field="model" label="模式选择">
      <a-radio-group v-model="form.model">
        <a-radio :value="5">5 v 5</a-radio>
        <a-radio :value="4">4 v 4</a-radio>
        <a-radio :value="3">3 v 3</a-radio>
      </a-radio-group>
    </a-form-item>
    <a-form-item field="playerList" label="玩家选择">
      <template #label>
        <span>玩家选择</span>
        <span v-if="!playerOptions.length" class="text-red-500">（请先添加玩家）</span>
      </template>
      <a-checkbox-group
        v-if="playerOptions.length"
        v-model="form.playerList"
        :disabled="playerDisabled"
        :options="playerOptions"
      />
    </a-form-item>
    <a-form-item field="heroPoolNum" label="英雄池数量">
      <a-input-number
        v-model="form.heroPoolNum"
        :max="30"
        :min="15"
        placeholder="请输入英雄池数量"
      />
    </a-form-item>
    <a-form-item field="heroPool" label="英雄池">
      <template #label>
        <div class="flex whitespace-nowrap items-center">
          <span>英雄池</span>
          <span class="text-red-500 ml-2">
            已选({{ form.heroPool.length }})
          </span>
          <span class="text-red-500 ml-2">
            至少需要({{ form.heroPoolNum * 2 }})
          </span>
        </div>
      </template>
      <a-scrollbar class="max-h-md overflow-auto">
        <a-checkbox-group v-if="heroPoolOptions.length" v-model="form.heroPool">
          <a-grid :col-gap="24" :cols="4" :row-gap="16">
            <a-grid-item v-for="item in heroPoolOptions" :key="item" class="whitespace-nowrap">
              <a-checkbox :value="item">{{ item }}</a-checkbox>
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
  <a-transfer
    v-model:model-value="team2"
    :data="team"
    :title="['队伍一', '队伍二']"
    class="player-transfer"
    show-search
  />
  <a-transfer
    v-model:model-value="hero2"
    :data="hero"
    :title="['队伍一英雄', '队伍二英雄']"
    class="mt-5 hero-transfer"
    show-search
  />
</template>

<script setup lang="ts">
import { FormInstance, FieldRule } from '@arco-design/web-vue';
import { PlayerInfo } from './index.vue';
import { TransferItem } from '@arco-design/web-vue/es/transfer/interface';

const props = defineProps<{
  playerInfo?: PlayerInfo[];
}>()

const formRef = ref<FormInstance>()

const playerOptions = computed(() => props.playerInfo?.map(item => ({ label: item.name, value: item.name })) ?? [])

const heroPoolOptions = computed(() => {
  const set = new Set<string>()
  props.playerInfo?.forEach(item => {
    item.heroPool.forEach(hero => {
      set.add(hero)
    })
  })
  return [...set]
})

watch(() => props.playerInfo, () => {
  form.heroPool = heroPoolOptions.value.map(item => item)
})

interface Rules {
  [key: string]: FieldRule[]
}

const rules: Rules = {
  model: [
    { required: true, message: '请选择模式' },
  ],
  playerList: [
    { required: true, message: '请选择玩家' },
    {
      validator: (value, callback) => {
        if (value.length < form.model * 2) {
          callback('玩家数量不足')
        } else if (value.length > form.model * 2) {
          callback('玩家数量过多')
        } else {
          callback()
        }
      },
    },
  ],
  heroPoolNum: [
    { required: true, message: '请输入英雄池数量' },
    { type: 'number', message: '请输入数字' },
    { min: 15, message: '英雄池数量不足15个' },
    { max: 30, message: '英雄池数量超过30个' },
  ],
  heroPool: [
    { required: true, message: '英雄池数量为0' },
    {
      validator: (value, callback) => {
        if (value.length < form.heroPoolNum * 2) {
          callback(`英雄池数量不足${form.heroPoolNum * 2}个`)
        } else {
          callback()
        }
      },
    }
  ],
}

const form = reactive({
  model: 5,
  playerList: [],
  heroPoolNum: 15,
  heroPool: heroPoolOptions.value.map(item => item),
})

const playerDisabled = computed(() => {
  return form.playerList.length >= form.model * 2
})

const team1 = ref<string[]>([])
const team2 = ref<string[]>([])
const hero1 = ref<string[]>([])
const hero2 = ref<string[]>([])

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (valid === undefined) {
    const playerList = form.playerList.map(item => item)
    const heroPool = form.heroPool.map(item => item)
    const t1: string[] = []
    const t2: string[] = []
    const h1: string[] = []
    const h2: string[] = []
    for (let i = 0; i < form.model; i++) {
      const index = Math.floor(Math.random() * playerList.length)
      t1.push(playerList[index])
      playerList.splice(index, 1)
    }
    for (let i = 0; i < form.model; i++) {
      const index = Math.floor(Math.random() * playerList.length)
      t2.push(playerList[index])
      playerList.splice(index, 1)
    }
    for (let i = 0; i < form.heroPoolNum; i++) {
      const index = Math.floor(Math.random() * heroPool.length)
      h1.push(heroPool[index])
      heroPool.splice(index, 1)
    }
    for (let i = 0; i < form.heroPoolNum; i++) {
      const index = Math.floor(Math.random() * heroPool.length)
      h2.push(heroPool[index])
      heroPool.splice(index, 1)
    }
    team1.value = t1
    team2.value = t2
    hero1.value = h1
    hero2.value = h2
  }
}

const team: ComputedRef<TransferItem[]> = computed(() => {
  return team1.value.concat(team2.value).map(item => ({ value: item, label: item, disabled: false }))
})

const hero: ComputedRef<TransferItem[]> = computed(() => {
  return hero1.value.concat(hero2.value).map(item => ({ value: item, label: item, disabled: false }))
})

</script>

<style lang="scss" scoped>
.hero-transfer {
  :deep(.arco-transfer-view) {
    height: 500px;
  }
}

.player-transfer {
  :deep(.arco-transfer-view) {
    height: 280px;
  }
}
</style>
