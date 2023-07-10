<template>
  <a-descriptions :column="1" title="英雄列表">
    <a-descriptions-item v-for="item of data" :key="item.label" :label="item.label">
      <a-tag color="arcoblue">{{ item.value }}</a-tag>
    </a-descriptions-item>
  </a-descriptions>
  <div v-if="heroList">
    <a-collapse>
      <a-collapse-item v-for="item in Object.keys(roleHeroList)" :key="item" :header="item">
        <a-scrollbar class="max-h-sm overflow-y-auto">
          <a-tag
            v-for="hero in roleHeroList[item]"
            :key="hero"
            :color="colorMap[item] || 'purple'"
            class="mt-2 mr-2"
            closable
          >
            {{ hero }}
          </a-tag>
          <a-input
            v-if="showInput"
            ref="inputRef"
            v-model.trim="inputVal"
            class="!w-20 mt-2 arco-tag arco-tag-size-medium"
            size="mini"
            @blur="handleAdd(item)"
            @keyup.enter="handleAdd(item)"
          />
          <a-tag
            v-else
            class="cursor-pointer mt-2 mr-2"
            color="blue"
            @click="handleEdit"
          >
            <template #icon>
              <icon-plus />
            </template>
            添加
          </a-tag>
        </a-scrollbar>
      </a-collapse-item>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { InputInstance, Message } from '@arco-design/web-vue';
import { IHeroList } from './index.vue';
import { IconPlus } from '@arco-design/web-vue/es/icon';

const props = defineProps<{
  heroList: IHeroList | null
}>()

const emit = defineEmits<{
  (e: 'success', data: IHeroList): void
}>()

const colorMap: { [key: string]: string } = {
  法师: 'pinkpurple',
  战士: 'orange',
  坦克: 'orangered',
  刺客: 'cyan',
  射手: 'purple',
}

interface RoleHeroList {
  [key: string]: string[]
}

const inputRef = ref<InputInstance | null>(null);
const showInput = ref(false);
const inputVal = ref('');

const handleEdit = () => {
  showInput.value = true;

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value?.focus();
    }
  });
};

const handleAdd = (role: string) => {
  if (inputVal.value) {
    const heroList = props.heroList
    const hero = heroList?.hero.find(item => item.name === inputVal.value)
    if (hero) {
      Message.warning(`英雄${inputVal.value}已存在`)
    } else {
      heroList?.hero.push({
        name: inputVal.value,
        roles: [role]
      })
      emit('success', heroList as IHeroList)
    }
    inputVal.value = '';
  }
  showInput.value = false;
};

const roleHeroList = computed(() => {
  return props.heroList?.hero.reduce((pre, item) => {
    item.roles.forEach(role => {
      pre[role] = pre[role] || []
      pre[role].push(item.name)
    })
    return pre
  }, {} as RoleHeroList) || {}
})

const data = [
  {
    label: '版本',
    value: props.heroList?.version || '',
  },
  {
    label: '更新时间',
    value: props.heroList?.fileTime || '',
  },
  {
    label: '英雄数量',
    value: props.heroList?.hero.length || '',
  }
]

</script>
