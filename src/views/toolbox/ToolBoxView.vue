<script lang="ts" setup>
import ImageUtilsTesting from '../tool/ImageUtilsTesting.vue'
import { ref } from 'vue'

const page_name = ref('ToolBox')
</script>
<template>
  <el-card class="about">
    <div class="toolbox-container">
      <div class="toolbox-item">
        <ImageUtilsTesting />
      </div>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.about {
  min-height: 100%;
  padding: 20px 60px;
  padding-bottom: 0px;
}

.toolbox-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  justify-content: space-evenly;
  align-items: center;
  .toolbox-item {
    min-width: 200px;
  }
}
</style>
