<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import MainHeader from './components/layout/MainHeader.vue'
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header">
        <main-header></main-header>
      </el-header>
      <el-main class="container">
        <RouterView />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.header {
  padding: 0px;
  margin: 0px;
  height: 60px;
}
.container {
  padding: 0;
  height: calc(100vh - 60px);
}
</style>
