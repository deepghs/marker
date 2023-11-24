<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const activeIndex = ref('home')
const router = useRouter()
const handleSelect = (key: string, keyPath: string[]) => {
  router.push('/' + key)
}
const title = import.meta.env.VITE_APP_TITLE
</script>
<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-demo"
    mode="horizontal"
    :ellipsis="false"
    @select="handleSelect"
  >
    <el-menu-item index="0">
      <!-- <img style="width: 100px" src="/images/element-plus-logo.svg" alt="Element logo" /> -->
      <span style="font-size:32px;font-weight:bolder">{{ title }}</span>
    </el-menu-item>
    <div class="flex-grow" />
    <el-menu-item index="home">Home</el-menu-item>
    <el-menu-item index="marker">Marker</el-menu-item>
    <el-menu-item index="toolbox">ToolBox</el-menu-item>
    <el-menu-item index="about">About</el-menu-item>
  </el-menu>
</template>

<style>
.flex-grow {
  flex-grow: 1;
}
</style>
