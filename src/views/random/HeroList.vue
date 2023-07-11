<template>
  <div v-if="roleHero">
    <a-collapse>
      <a-collapse-item v-for="(item, index) in Object.keys(roleHero)" :key="item" :header="item">
        <a-scrollbar class="max-h-sm overflow-y-auto">
          <a-tag
            v-for="(hero) in roleHero[item]"
            :key="hero"
            :color="colorMap[item] || 'purple'"
            class="mt-2 mr-2"
            closable
            @close="handleClose(item, hero)"
          >
            {{ hero }}
          </a-tag>
          <a-input
            v-show="showInput[index]"
            ref="inputRef"
            v-model.trim="inputVal"
            class="!w-20 mt-2 arco-tag arco-tag-size-medium"
            size="mini"
            @blur="handleAdd(item, index)"
            @keyup.enter="handleAdd(item, index)"
          />
          <a-tag
            v-show="!showInput[index]"
            class="cursor-pointer mt-2 mr-2"
            color="blue"
            @click="handleEdit(index)"
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
import { InputInstance } from '@arco-design/web-vue';
import { RoleHero } from './index.vue';
import { IconPlus } from '@arco-design/web-vue/es/icon';

const props = defineProps<{
  roleHero: RoleHero
}>()

const emit = defineEmits<{
  (e: 'add-hero', data: {
    role: string,
    name: string,
  }): void
  (e: 'delete-hero', data: {
    role: string,
    name: string,
  }): void
}>()

const colorMap: { [key: string]: string } = {
  法师: 'pinkpurple',
  战士: 'orange',
  坦克: 'orangered',
  刺客: 'cyan',
  射手: 'purple',
}

const inputRef = ref<InputInstance[]>([]);
const showInput = ref<boolean[]>([]);
const inputVal = ref('');

onMounted(() => {
  Object.keys(props.roleHero).forEach(() => {
    showInput.value.push(false);
  });
})

const handleEdit = (index:number) => {
  showInput.value[index] = true;

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value?.[index].focus();
    }
  });
};

const handleAdd = (role: string, index: number) => {
  if (inputVal.value) {
    emit('add-hero', {
      role,
      name: inputVal.value,
    })
    inputVal.value = '';
  }
  showInput.value[index] = false;
};

const handleClose = (role: string, hero: string) => {
  emit('delete-hero', {
    role,
    name: hero,
  })
};

</script>
