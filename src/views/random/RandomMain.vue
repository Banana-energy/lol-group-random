<template>
  <div>
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
          :min="5"
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
          随机分组
        </a-button>
        <a-button
          class="ml-2"
          status="success"
          type="primary"
          long
          @click="handleSaveDefaultConfig"
        >
          保存为默认配置
        </a-button>
        <a-button
          class="ml-2"
          status="success"
          type="primary"
          long
          @click="handleSaveHeroConfig"
        >
          保存英雄规则
        </a-button>
      </a-form-item>
    </a-form>
    <div class="flex ">
      <a-list :bordered="false" :grid-props="{ gutter: 0, xs: 24, sm: 24, md: 24, lg: 12, xl: 12 }" class="w-1/2">
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
      </a-list>
      <a-split
        :size="0.5"
        class="w-1/2 border-gray-300 border"
        min="80px"
        style="margin: 13px 20px"
      >
        <template #first>
          <a-typography-title :heading="6" class="px-2">
            队伍一英雄
          </a-typography-title>
          <a-typography-paragraph class="px-2">
            <a-tag
              v-for="item in hero1"
              :key="item"
              class="m-0.5"
              color="magenta"
              bordered
            >
              {{ item }}
            </a-tag>
          </a-typography-paragraph>
        </template>
        <template #second>
          <a-typography-title :heading="6" class="px-2">
            队伍二英雄
          </a-typography-title>
          <a-typography-paragraph class="px-2">
            <a-tag
              v-for="item in hero2"
              :key="item"
              class="m-0.5"
              color="green"
              bordered
            >
              {{ item }}
            </a-tag>
          </a-typography-paragraph>
        </template>
      </a-split>
    </div>
  </div>
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
    战士: 5,
    法师: 4,
    坦克: 2,
    刺客: 2,
    射手: 2,
  },
})

watch(() => form.model, (val) => {
  const heroRules = localStorage.getItem('heroRules')
  if (heroRules) {
    const data = JSON.parse(heroRules)
    if (data) {
      form.heroRules = data[val] || {
        战士: 5,
        法师: 4,
        坦克: 2,
        刺客: 2,
        射手: 2,
      }
    }
  } else {
    form.heroRules = {
      战士: 5,
      法师: 4,
      坦克: 2,
      刺客: 2,
      射手: 2,
    }
  }
  const heroPoolNum = localStorage.getItem('heroPoolNum')
  if (heroPoolNum) {
    const data = JSON.parse(heroPoolNum)
    if (data) {
      form.heroPoolNum = data[val] || 15
    }
  } else {
    form.heroPoolNum = 15
  }
})

const initDefaultConfig = () => {
  const storeForm = localStorage.getItem('form')
  if (storeForm) {
    const data = JSON.parse(storeForm)
    form.model = data?.model || 5
    form.playerList = data?.playerList || []
    form.heroPoolNum = data?.heroPoolNum || 15
    form.heroRules = data?.heroRules || {
      战士: 5,
      法师: 4,
      坦克: 2,
      刺客: 2,
      射手: 2,
    }
  }
}

onMounted(() => {
  initDefaultConfig()
})

const handleSaveDefaultConfig = async () => {
  const valid = await formRef.value?.validateField(['model', 'heroPoolNum', 'heroRules'])
  if (valid === undefined) {
    localStorage.setItem('form', JSON.stringify(form))
    Message.success('保存成功')
  }
}

const handleSaveHeroConfig = async () => {
  const valid = await formRef.value?.validateField(['heroRules', 'heroPoolNum', 'model'])
  if (valid === undefined) {
    const heroRules = localStorage.getItem('heroRules')
    if (heroRules) {
      const data = JSON.parse(heroRules)
      if (data) {
        data[form.model] = form.heroRules
        localStorage.setItem('heroRules', JSON.stringify(data))
      }
    } else {
      const data = {
        [form.model]: form.heroRules,
      }
      localStorage.setItem('heroRules', JSON.stringify(data))
    }
    const heroPoolNum = localStorage.getItem('heroPoolNum')
    if (heroPoolNum) {
      const data = JSON.parse(heroPoolNum)
      if (data) {
        data[form.model] = form.heroPoolNum
        localStorage.setItem('heroPoolNum', JSON.stringify(data))
      }
    } else {
      const data = {
        [form.model]: form.heroPoolNum,
      }
      localStorage.setItem('heroPoolNum', JSON.stringify(data))
    }
    Message.success('保存成功')
  }
}

const team1 = ref<string[]>([])
const team2 = ref<string[]>([])
const hero1 = ref<string[]>([])
const hero2 = ref<string[]>([])

let finished = true

const random = (selectedPlayers: string[] = []) => {
  let playerList = form.playerList.filter(item => item && !selectedPlayers.includes(item))
  const bindResult = Object.values(props.bindGraph).some(bind => {
    return bind.filter(item => playerList.includes(item)).length > form.model
  })
  if (bindResult) {
    Message.error('绑定玩家数量过多')
    finished = true
    return []
  }
  const enemyResult = Object.values(props.enemyGraph).some(enemy => {
    return enemy.filter(item => playerList.includes(item)).length > form.model
  })
  if (enemyResult) {
    Message.error('敌对玩家数量过多')
    finished = true
    return []
  }
  const team: string[] = []
  for (let i = 0; i < form.model; i++) {
    playerList = playerList.filter(item => item)
    const index = Math.floor(Math.random() * playerList.length)
    const player = playerList[index]
    if (!player) {
      finished = false
      return []
    }
    // 获取当前玩家的敌对玩家
    const enemyPlayers = props.enemyGraph[player].filter(item => item !== player)
    if (enemyPlayers && enemyPlayers.length) {
      // 如果有敌对玩家则将敌对玩家从玩家列表中删除
      enemyPlayers.forEach(item => {
        const index = playerList.findIndex(player => player === item)
        playerList[index] = ''
      })
    }
    playerList = playerList.filter(item => item)
    // 获取当前玩家的绑定玩家
    const bindPlayers = props.bindGraph[player].filter(item => playerList.includes(item))
    // 判断是否有绑定玩家
    if (bindPlayers?.length) {
      if (bindPlayers.length <= form.model - i) {
        // 获取绑定玩家并过滤掉不在玩家列表中的玩家
        // 将绑定玩家放入本队伍
        team.push(...bindPlayers)
        // 将绑定玩家从玩家列表中删除
        bindPlayers.forEach(item => {
          const index = playerList.findIndex(player => player === item)
          const bindPlayer = playerList[index]
          // 获取绑定玩家的敌对玩家
          const enemyPlayers = props.enemyGraph[bindPlayer]
          if (enemyPlayers && enemyPlayers.length) {
            // 如果有敌对玩家则将敌对玩家从玩家列表中删除
            enemyPlayers.forEach(item => {
              const index = playerList.findIndex(player => player === item)
              if (team.includes(playerList[index])) {
                finished = false
                return []
              }
              playerList[index] = ''
            })
          }
          playerList[index] = ''
        })
        // 跳过绑定玩家的数量
        i += bindPlayers.length - 1
        continue
      } else {
        finished = false
        return []
      }
    } else {
      // 如果没有绑定玩家则随机分配
      team.push(player)
      const index = playerList.findIndex(item => item === player)
      if (index !== -1) {
        playerList[index] = ''
      }
    }
  }
  finished = true
  return team
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (valid === undefined) {
    let t1: string[] = random()
    while (!t1.length && !finished) {
      t1 = random()
    }
    if (!t1.length) {
      return
    }
    let t2: string[] = random(t1)
    while (!t2.length && !finished) {
      t1 = random()
      while (!t1.length && !finished) {
        t1 = random()
      }
      t2 = random(t1)
    }
    if (!t2.length) {
      return
    }
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
