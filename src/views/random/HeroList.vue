<template>
  <div class="flex flex-wrap mb-4">
    <div class="w-full">
      <a-upload
        ref="upload"
        :on-before-upload="handleBeforeUpload"
        :show-file-list="false"
        accept=".json"
        @change="handleImportHeroFile"
      >
        <template #upload-button>
          <a-button type="primary">上传英雄配置文件</a-button>
          <a-button class="ml-2" @click.stop="handleDownload">下载模板</a-button>
        </template>
      </a-upload>
    </div>
    <a-comment
      v-for="item in heroList"
      :key="item.name"
      :author="item.name + '-' + item.title"
      class="w-1/4 !my-2"
    >
      <template #content>
        <div class="flex flex-wrap items-center">
          <a-dropdown
            v-for="role in item.roles"
            :key="role"
            class="mt-2 mr-2"
            @select="(val) => handleChangeRole(item.name, val)"
          >
            <a-tag :color="colorMap[role]?.color || 'purple'" size="large" bordered>
              <template #icon>
                <icon :icon="colorMap[role]?.icon || 'vscode-icons:file-type-dockertest'" />
              </template>
              {{ role }}
              <icon-down class="ml-1" />
            </a-tag>
            <a-badge v-if="!colorMap[role]" class="ml-2" text="NEW" />
            <template #content>
              <a-doption
                v-for="roleOption in Object.keys(colorMap)"
                :key="roleOption"
                :disabled="role === roleOption"
                class="w-auto !text-xl !leading-[2.5rem]"
              >
                <template #icon>
                  <icon :icon="colorMap[roleOption].icon" />
                </template>
                <template #default>
                  {{ roleOption }}
                </template>
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </template>
      <template #avatar>
        <a-avatar>
          <img :src="item.avatar" alt="avatar" />
        </a-avatar>
      </template>
    </a-comment>
  </div>
</template>

<script setup lang="ts">
import { FileItem, Message } from '@arco-design/web-vue';
import { HeroFile } from './index.vue';
import { IconDown } from '@arco-design/web-vue/es/icon';
import { Icon } from '@iconify/vue';
import debounce from 'lodash.debounce';

const props = defineProps<{
  heroFile?: HeroFile
}>()

const emit = defineEmits<{
  (e: 'change-role', data: {
    role: string,
    name: string,
  }): void
  (e: 'change-hero-file', data: HeroFile): void
}>()

const heroList = computed(() => {
  return props.heroFile?.hero || []
})

const colorMap: { [key: string]: { color: string, icon: string } } = {
  法师: {
    color: 'pinkpurple',
    icon: 'vscode-icons:file-type-composer',
  },
  战士: {
    color: 'orange',
    icon: 'vscode-icons:file-type-cobol',
  },
  坦克: {
    color: 'orangered',
    icon: 'vscode-icons:file-type-grunt',
  },
  刺客: {
    color: 'cyan',
    icon: 'vscode-icons:file-type-light-objidconfig',
  },
  射手: {
    color: 'purple',
    icon: 'vscode-icons:file-type-haml',
  },
}

const handleBeforeUpload = (file: File) => {
  // 判断文件类型为json
  if (file.type !== 'application/json') {
    Message.warning('只能上传json文件')
    return false
  }
  return true
}

const handleImportHeroFile = debounce((fileList: FileItem[]) => {
  const { file } = fileList[0]
  if (!file) return
  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = () => {
    try {
      const heroFile: HeroFile = JSON.parse(reader.result as string)
      if (!heroFile.fileTime || !heroFile.hero || !heroFile.hero.length || !heroFile.version) {
        Message.error('文件解析失败')
        return
      }
      emit('change-hero-file', heroFile)
    } catch (error) {
      Message.error('文件解析失败')
    }
  }
}, 500)

const handleDownload =async  () => {
  const heroFile = await import('@/assets/hero-list.json')
  const blob = new Blob([JSON.stringify(heroFile.default, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'hero.json'
  link.click()
}

const handleChangeRole = (name: string, role?: string | number | Record<string, any>) => {
  emit('change-role', {
    name,
    role: role as string,
  })
}

</script>

<style scoped>
:deep(.arco-tag-icon) {
  display: flex;
}

.arco-icon-down {
  transition: transform .3s, -webkit-transform .3s;
}

.arco-dropdown-open .arco-icon-down {
  transform: rotate(180deg);
}
</style>
