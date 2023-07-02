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
    <a-form-item class="!mb-0" label="英雄池规则">
      <a-form-item
        v-for="item in roleList"
        :key="item"
        :label="item"
        class="m-2"
      >
        <a-input-number
          v-model="form.heroRules[item]"
          :max="5"
          :min="1"
          placeholder="请输入数量"
        />
      </a-form-item>
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
import { PlayerInfo,RoleHero } from './index.vue';
import { TransferItem } from '@arco-design/web-vue/es/transfer/interface';

const props = defineProps<{
  playerInfo?: PlayerInfo[];
  roleHero?: RoleHero;
  roleList: string[];
}>()

const formRef = ref<FormInstance>()

const playerOptions = computed(() => props.playerInfo?.map(item => ({ label: item.name, value: item.name })) ?? [])

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
}

interface Form {
  model: number;
  playerList: string[];
  heroPoolNum: number;
  heroRules: {
    [key: string]: number;
  };
}

const form = reactive<Form>({
  model: 5,
  playerList: [],
  heroPoolNum: 15,
  heroRules: {
    战士: 4,
    法师: 2,
    坦克: 2,
    刺客: 4,
    辅助: 1,
    射手: 2,
  },
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
    // 根据规则随机分配队伍及队伍英雄，规则为 role为 mage 2个，fighter 4个，tank 2个， assassin 4个，support 1个，marksman 2个
    const t1: string[] = []
    const t2: string[] = []
    const h1: string[] = []
    const h2: string[] = []
    const roleNum = form.heroRules
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
    const roleHero = props.roleHero
    props.roleList.forEach(role  => {
      const list = roleHero?.[role] || []
      const num = roleNum[role]
      for(let i = 0; i < num; i++) {
        const index = Math.floor(Math.random() * list.length)
        h1.push(list[index] + ' ' + role)
        list.splice(index, 1)
      }
      for(let i = 0; i < num; i++) {
        const index = Math.floor(Math.random() * list.length)
        h2.push(list[index] + ' ' + role)
        list.splice(index, 1)
      }
    })
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
:deep(.arco-transfer-view) {
  width: 300px;
}
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
