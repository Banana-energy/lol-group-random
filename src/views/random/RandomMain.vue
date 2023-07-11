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
      <a-checkbox-group v-if="playerOptions.length" v-model="form.playerList" :options="playerOptions" />
    </a-form-item>
    <a-form-item field="heroPoolNum" label="英雄池数量">
      <a-input-number
        v-model="form.heroPoolNum"
        :max="30"
        :min="15"
        placeholder="请输入英雄池数量"
      />
    </a-form-item>
    <a-form-item class="!mb-0" field="heroRules" label="英雄池规则">
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
      <a-button type="primary" long @click="handleSubmit">
        确定
      </a-button>
    </a-form-item>
  </a-form>
  <a-list :bordered="false" :grid-props="{ gutter: 0, xs: 24, sm: 12, md: 12, lg: 6, xl: 6 }">
    <a-list-item>
      <a-list size="small">
        <template #header>
          队伍一
        </template>
        <a-list-item v-for="item in team1" :key="item">
          {{ item }}
        </a-list-item>
      </a-list>
    </a-list-item>
    <a-list-item>
      <a-list size="small">
        <template #header>
          队伍二
        </template>
        <a-list-item v-for="item in team2" :key="item">
          {{ item }}
        </a-list-item>
      </a-list>
    </a-list-item>
    <a-list-item>
      <a-list size="small">
        <template #header>
          队伍一英雄
        </template>
        <a-list-item v-for="item in hero1" :key="item">
          {{ item }}
        </a-list-item>
      </a-list>
    </a-list-item>
    <a-list-item>
      <a-list size="small">
        <template #header>
          队伍二英雄
        </template>
        <a-list-item v-for="item in hero2" :key="item">
          {{ item }}
        </a-list-item>
      </a-list>
    </a-list-item>
  </a-list>
</template>

<script setup lang="ts">
import { FormInstance, FieldRule, Message } from '@arco-design/web-vue';
import { RelationGraph, RoleHero } from './index.vue';
import { GraphData } from '@antv/g6';

const props = defineProps<{
  bindGraph: RelationGraph;
  enemyGraph: RelationGraph;
  playerInfo?: GraphData;
  roleHero?: RoleHero;
  roleList: string[];
}>()

const formRef = ref<FormInstance>()

const playerOptions = computed(() => {
  return props.playerInfo?.nodes?.map(item => ({ label: item.id, value: item.id })) || []
})

export interface Rules {
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
  heroRules: [
    { required: true, message: '请输入英雄池规则' },
    {
      validator: (value: { [key: string]: number }, callback) => {
        const total = Object.values(value).reduce((prev, cur) => prev + cur, 0)
        if (total < form.heroPoolNum) {
          callback('英雄池数量不足')
        } else if (total > form.heroPoolNum) {
          callback('英雄池数量过多')
        } else {
          callback()
        }
      },
    },
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
    法师: 5,
    坦克: 2,
    刺客: 2,
    射手: 2,
  },
})

watch(() => form.model, (val) => {
  if (val === 5) {
    form.heroPoolNum = 15
    form.heroRules = {
      战士: 4,
      法师: 5,
      坦克: 2,
      刺客: 2,
      射手: 2,
    }
  } else if (val === 4) {
    form.heroPoolNum = 12
    form.heroRules = {
      战士: 3,
      法师: 4,
      坦克: 2,
      刺客: 2,
      射手: 1,
    }
  } else if (val === 3) {
    form.heroPoolNum = 9
    form.heroRules = {
      战士: 2,
      法师: 3,
      坦克: 2,
      刺客: 1,
      射手: 1,
    }
  }
})

const team1 = ref<string[]>([])
const team2 = ref<string[]>([])
const hero1 = ref<string[]>([])
const hero2 = ref<string[]>([])

const random = (selectedPlayers: string[] = []) => {
  let playerList = form.playerList.map(item => item).filter(item => !selectedPlayers.includes(item))
  const team = []
  for (let i = 0; i < form.model; i++) {
    const index = Math.floor(Math.random() * playerList.length)
    const player = playerList[index]
    // 获取当前玩家的敌对玩家
    const enemyPlayers = props.enemyGraph[player]
    if (enemyPlayers && enemyPlayers.length) {
      // 如果有敌对玩家则将敌对玩家从玩家列表中删除
      enemyPlayers.forEach(item => {
        const index = playerList.findIndex(player => player === item)
        playerList[index] = ''
      })
    }
    playerList = playerList.filter(item => item)
    if (playerList.length < form.model - i) {
      Message.error('敌对玩家数量过多')
      return []
    }
    // 获取当前玩家的绑定玩家
    const bindPlayers = props.bindGraph[player]
    // 判断是否有绑定玩家
    if (bindPlayers && bindPlayers.length) {
      if (bindPlayers.length > form.model) {
        Message.error('绑定玩家数量过多')
        return []
      }
      if (bindPlayers.length <= form.model - i) {
        // 获取绑定玩家并过滤掉不在玩家列表中的玩家
        const bindPlayersName = bindPlayers.filter(item => playerList.includes(item))
        // 将绑定玩家放入本队伍
        team.push(...bindPlayersName)
        // 将绑定玩家从玩家列表中删除
        bindPlayersName.forEach(item => {
          const index = playerList.findIndex(player => player === item)
          const bindPlayer = playerList[index]
          // 获取绑定玩家的敌对玩家
          const enemyPlayers = props.enemyGraph[bindPlayer]
          if (enemyPlayers && enemyPlayers.length) {
            // 如果有敌对玩家则将敌对玩家从玩家列表中删除
            enemyPlayers.forEach(item => {
              const index = playerList.findIndex(player => player === item)
              playerList[index] = ''
            })
          }
          playerList[index] = ''
        })
        // 跳过绑定玩家的数量
        i += bindPlayersName.length - 1
        continue
      } else {
        i--
      }
    } else {
      // 如果没有绑定玩家则随机分配
      team.push(player)
      playerList[index] = ''
    }
  }
  return team
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (valid === undefined) {
    const t1: string[] = random()
    if (!t1.length) {
      return
    }
    const t2: string[] = random(t1)
    const h1: string[] = []
    const h2: string[] = []
    const roleNum = form.heroRules
    const roleHero = props.roleHero
    props.roleList.forEach(role => {
      const list = roleHero?.[role].slice() || []
      const num = roleNum[role]
      for (let i = 0; i < num; i++) {
        const index = Math.floor(Math.random() * list.length)
        h1.push(list[index])
        list.splice(index, 1)
      }
      for (let i = 0; i < num; i++) {
        const index = Math.floor(Math.random() * list.length)
        h2.push(list[index])
        list.splice(index, 1)
      }
    })
    team1.value = t1
    team2.value = t2
    hero1.value = h1
    hero2.value = h2
  }
}

</script>

<style lang="scss" scoped>
.player-list {
  width: 150px;
}

.hero-list {
  width: 200px;
}
</style>
