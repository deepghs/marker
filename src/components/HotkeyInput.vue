<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { HotKey } from '../data/scorer/configs/setting'
const props = defineProps({
  visible: Boolean,
  hotKey: HotKey
})

const emit = defineEmits(['submit', 'update:visible'])

watch(
  () => props.visible,
  (val) => {
    if (val) {
      window.addEventListener('keyup', onKeyup)
    } else {
      window.removeEventListener('keyup', onKeyup)
    }
  }
)

let passedKey = ref('')
let dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

function submitPassedKey(key: string) {
  emit('submit', props.hotKey?.actionKey + '_shortcut', key)
  dialogVisible.value = false
  passedKey.value = ''
}

function onKeyup(e: KeyboardEvent) {
  passedKey.value = e.key
  submitPassedKey(passedKey.value)
}
</script>

<template>
  <el-dialog v-model="dialogVisible" title="Hotkey Setting" width="20%">
    <span style="font-size: large; font-weight: bold">
      Press any key to set hotkey of {{ props.hotKey?.displayName }}
    </span>
    <br />
    <span>{{ 'current: ' + props.hotKey?.key }}</span>
  </el-dialog>
</template>
