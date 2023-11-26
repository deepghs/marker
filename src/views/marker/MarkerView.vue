<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'
import { ref, onMounted, computed } from 'vue'
import localforage from 'localforage'
import JSZip from 'jszip'
import { ElLoading, type UploadInstance } from 'element-plus'
import * as XLSX from 'xlsx'

//ingnore mousetrap type error
// @ts-ignore
import Mousetrap from 'mousetrap'

import HotKetInput from '@/components/HotkeyInput.vue'
import { SingleData } from '@/data/scorer/single'
import { HotKeySettings, HotKey } from '@/data/scorer/configs/setting'
import {
  BasicDataSource,
  LocalZipDataSource,
  RemoteUrlsDataSource,
  RemoteHFRepoZipDataSource
} from '@/data/scorer/datasource/datasource'
import { DataSourceType, ScorerType } from '@/data/scorer/types/enum'
import { checkVersion, upgrade } from '@/data/scorer/configs/info'
import type { RepoDesignation } from '@/utils/huggingface'
import { Reporitory } from '@/utils/huggingface'

let dataSource = ref(new RemoteUrlsDataSource([]) as BasicDataSource)
let dataSourceType = ref(DataSourceType.RemoteHFRepoZip)
let current = ref(SingleData.fromRemoteUrls('', ''))
let currentIndex = ref(0)
let history = ref([current.value])
let current_setting = ref(new HotKeySettings())
let HotKeyWantToChange = ref(new HotKey('', '', ''))
const settingDialogVisible = ref(false)
const uploadRef = ref<UploadInstance>()
const expandSettingPanel = ref("DataSource")
const currentRepo = ref(new Reporitory({ name: 'deepghs/quality_rlhf', type: 'dataset' }))
const hotkeySettingVisible = ref(false)
const selectedHFDataset = ref('')

onMounted(async () => {
  await initSetting()
  ElLoading.service().setText('Loading Dataset...')
  const dataset = 'dataset_v0_100.zip'
  dataSource.value = getTestDataSource();
  await init()
  // dataSource.value = getRemoteHFDataSource(currentRepo.value.getRepoName(),dataset)
  // await (dataSource.value as RemoteHFRepoZipDataSource).initData()
})

async function init() {
  ElLoading.service({
    lock: true,
    text: 'Loading Setting...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  if (dataSourceType.value === DataSourceType.RemoteHFRepoZip) {
    await (dataSource.value as RemoteHFRepoZipDataSource).initData()
  }
  current.value = await getNewPair()
  currentIndex.value = 0
  history.value = [current.value]
  ElLoading.service().close()
}

function getTestDataSource(): BasicDataSource {
  dataSourceType.value = DataSourceType.RemoteUrls
  const testList = [
    'https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg',
    'https://fuss10.elemecdn.com/1/34/19aa98b1fcb2781c4fba33d850549jpeg.jpeg',
    'https://fuss10.elemecdn.com/0/6f/e35ff375812e6b0020b6b4e8f9583jpeg.jpeg',
    'https://fuss10.elemecdn.com/9/bb/e27858e973f5d7d3904835f46abbdjpeg.jpeg',
    'https://fuss10.elemecdn.com/d/e6/c4d93a3805b3ce3f323f7974e6f78jpeg.jpeg',
    'https://fuss10.elemecdn.com/3/28/bbf893f792f03a54408b3b7a7ebf0jpeg.jpeg',
    'https://fuss10.elemecdn.com/2/11/6535bcfb26e4c79b48ddde44f4b6fjpeg.jpeg'
  ]
  return new RemoteUrlsDataSource(testList)
}

function getRemoteHFDataSource(repo: RepoDesignation, dataset: string): RemoteHFRepoZipDataSource {
  dataSourceType.value = DataSourceType.RemoteHFRepoZip
  ElLoading.service().setText('Loading Dataset' + dataset + ' ...')
  return new RemoteHFRepoZipDataSource(repo, dataset);
}

function getPrevious() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
    current.value = history.value[currentIndex.value]
  }
}

async function getNext() {
  current.value.changeChecked()
  if (currentIndex.value < history.value.length - 1) {
    currentIndex.value += 1
    current.value = history.value[currentIndex.value]
  } else {
    let next = await getNewPair()
    current.value = next
    history.value.push(next)
    currentIndex.value += 1
  }
}

function getImage(index: number) {
  return current.value.getImg(index)
}

async function getNewPair(): Promise<SingleData> {
  var num1 = 0 + Math.round(Math.random() * (dataSource.value.size() - 1))
  var num2 = 0 + Math.round(Math.random() * (dataSource.value.size() - 1))
  while (num1 === num2) {
    num2 = 0 + Math.round(Math.random() * (dataSource.value.size() - 1))
  }

  if (dataSource.value.getType() === DataSourceType.LocalZip) {
    let img1 = (dataSource.value as LocalZipDataSource).getImage(num1)
    let img2 = (dataSource.value as LocalZipDataSource).getImage(num2)
    return await SingleData.fromLocalImages(img1.clone(), img2.clone())
  }
  if (dataSource.value.getType() === DataSourceType.RemoteHFRepoZip) {
    let img1 = (dataSource.value as RemoteHFRepoZipDataSource).getImage(num1)
    let img2 = (dataSource.value as RemoteHFRepoZipDataSource).getImage(num2)
    return SingleData.fromLocalImages(img1.clone(), img2.clone())
  }
  return SingleData.fromRemoteImages(
    (dataSource.value as RemoteUrlsDataSource).getImage(num1),
    (dataSource.value as RemoteUrlsDataSource).getImage(num2)
  )
}

function selectImage(index: number, force?: boolean) {
  if (force !== undefined) {
    current.value.changeSelected(index, force)
    return
  }
  current.value.changeSelected(index)
}

function isSelected(index: number) {
  return current.value.isImgSelected(index) ? 'always' : 'hover'
}

function showSettingDialog() {
  settingDialogVisible.value = true
}

function closeSettingDialog() {
  settingDialogVisible.value = false
  saveSetting()
}

async function initSetting() {
  let isLatest = await checkVersion()
  let result = await localforage.getItem('hotkeySettings')
  if (!isLatest) {
    upgrade(() => {
      let default_setting = new HotKeySettings()
      if (result) {
        let setting = result as HotKeySettings
        Object.keys(default_setting).forEach((key) => {
          if (!Object.prototype.hasOwnProperty.call(result, key)) {
            console.log(key)
            setting[key] = default_setting[key]
          }
        })
        current_setting.value = setting
        saveSetting()
        window.location.reload()
      }
    })
  }
  if (!result) {
    const default_setting = new HotKeySettings()
    current_setting.value = default_setting
    await saveSetting()
  } else {
    current_setting.value = result as HotKeySettings
  }
  resetHotKeys()
  bindHotKeys()
}

async function saveSetting() {
  let saving = JSON.parse(JSON.stringify(current_setting.value))
  await localforage.setItem('hotkeySettings', saving)
}

function setHotKey(key: string, value: string) {
  current_setting.value[key].key = value
  saveSetting()
  resetHotKeys()
  bindHotKeys()
}

function bindHotKeys() {
  Object.keys(current_setting.value).forEach((actionKey) => {
    const item = current_setting.value[actionKey] as HotKey
    Mousetrap.bind(
      item.key,
      () => {
        if (settingDialogVisible.value) {
          return
        }
        callfunc(item.actionKey)
      },
      'keyup'
    )
  })
}

function unbindHotKeys(key: string) {
  Mousetrap.unbind(key)
}

function resetHotKeys() {
  Mousetrap.reset()
}

function callfunc(key: string) {
  switch (key) {
    case 'previous':
      getPrevious()
      break
    case 'next':
      getNext()
      break
    case 'select_left_and_next':
      selectImage(0, true)
      selectImage(1, false)
      getNext()
      break
    case 'select_right_and_next':
      selectImage(0, false)
      selectImage(1, true)
      getNext()
      break
    case 'select_both_and_next':
      selectImage(0, true)
      selectImage(1, true)
      getNext()
      break
    case 'select_none_and_next':
      selectImage(0, false)
      selectImage(1, false)
      getNext()
      break
    default:
      break
  }
}

async function beforeUpload(file: any) {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading Dataset from Zip File...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  dataSource.value = (await LoadDataSourceFromZip(file)) as LocalZipDataSource
  current.value = await getNewPair()
  currentIndex.value = 0
  history.value = [current.value]
  closeSettingDialog()
  loading.close()
  return false
}

function LoadDataSourceFromZip(file: any) {
  return new Promise((resolve, reject) => {
    let zip = new JSZip()
    zip.loadAsync(file)
      .then((zip) => {
        LocalZipDataSource.FromZip(zip).then((newDatasource) => {
          resolve(newDatasource)
        }).catch((error) => {
          reject(error)
        })
      }).catch((error) => {
        reject(error)
      })
  })
}

function settingHotKey(key: string) {
  hotkeySettingVisible.value = true
  HotKeyWantToChange.value = current_setting.value[key]
}

function exportData() {
  const data = history.value.reduce((data, item) => {
    if (item.hasChecked) {
      data.push(item.export())
    }
    return data
  }, [] as any[])
  return data
}

function exportToExcel() {
  const data = exportData()
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'result')
  const wbout = XLSX.write(wb, {
    bookType: 'xlsx',
    bookSST: true,
    type: 'array'
  })
  let url = window.URL.createObjectURL(new Blob([wbout]))
  let link = document.createElement('a')
  link.style.display = 'none'
  link.href = url
  const date = new Date().getTime()
  link.setAttribute('download', date + '.xlsx')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link) //下载完成移除元素
  window.URL.revokeObjectURL(url) //释放掉blob对象
}

function getStatistic(){
  const loadedDateset = dataSource.value.size() ?? 0;
  const total = history.value.length
  const statisic = history.value.reduce((result, item) => {
    if (item.getResult() !==  ScorerType.SKIP) {
      result.checked += 1
    }else{
      result.skip += 1
    }
    return result
  }, {
    checked : 0,
    skip : 0
  })
  return {
    dataset: loadedDateset,
    total: total,
    checked: statisic.checked,
    skip: statisic.skip
  }
}
</script>

<template>
  <div class="scorer">
    <el-container>
      <el-header class="scorer-menu">
        <el-button :icon="Setting" circle @click="showSettingDialog" />
        <el-button class="export-button" type="primary" @click="exportToExcel">Export</el-button>
        <span>{{ 'total: ' + getStatistic().total }}</span>
        <span style="padding-right: 5px;">{{ 'checked: ' + getStatistic().checked }}</span>
        <span style="padding-right: 5px;">{{ 'skip: ' + getStatistic().skip }}</span>
        <span style="padding-right: 5px;">{{ 'dataset: ' + getStatistic().dataset }}</span>
      </el-header>
      <el-main class="scorer-container">
        <el-card :shadow="isSelected(0)" class="image-container" @click="selectImage(0)">
          <div class="image">
            <div @click.stop style="max-height: 100%">
              <el-image :src="getImage(0)" :zoom-rate="1.2" :max-scale="7" :min-scale="0.2"
                :preview-src-list="[getImage(0)]" fit="contain" />
            </div>
          </div>
        </el-card>
        <el-card :shadow="isSelected(1)" class="image-container" @click="selectImage(1)">
          <div class="image">
            <div @click.stop style="max-height: 100%">
              <el-image :src="getImage(1)" :zoom-rate="1.2" :max-scale="7" :min-scale="0.2"
                :preview-src-list="[getImage(1)]" fit="contain" />
            </div>
          </div>
        </el-card>
        <el-dialog v-model="settingDialogVisible" title="Setting" width="30%">
          <el-collapse v-model="expandSettingPanel" accordion>
            <el-collapse-item title="DataSource" name="DataSource">
              <div>
                <el-radio-group v-model="dataSourceType" size="small">
                  <el-radio-button :label="DataSourceType.LocalZip" />
                  <el-radio-button :label="DataSourceType.RemoteHFRepoZip" />
                  <el-radio-button :label="DataSourceType.RemoteUrls" disabled />
                </el-radio-group>
                <div style="padding-top: 10px;">
                  <div v-if="dataSourceType === DataSourceType.RemoteHFRepoZip">
                    <div class="hfsource-setting">
                      <el-input style="width:300px" v-model="currentRepo.repo.name" placeholder="dataset name" disabled/>
                      <el-button type="primary" style="width:100px" @click="async () => { await currentRepo.getFiles(true) }" :disabled="currentRepo.loaded">Get Repo</el-button>
                    </div>
                    <div class="hfsource-setting">
                      <el-select style="width:300px" v-model="selectedHFDataset" placeholder="dataset name" :disabled="!currentRepo.loaded">
                        <el-option v-for="(item) in currentRepo.files" :key="item" :label="item" :value="item" />
                      </el-select>
                      <el-button type="primary" style="width:100px" :disabled="!currentRepo.loaded"
                        @click="async () => { dataSource = getRemoteHFDataSource(currentRepo.repo, selectedHFDataset); await init(); closeSettingDialog() }">Load</el-button>
                    </div>
                  </div>
                  <div v-else-if="dataSourceType === DataSourceType.LocalZip">
                    <el-upload ref="uploadRef" class="upload-demo"
                      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :before-upload="beforeUpload"
                      :accept="'application/zip'">
                      <template #trigger>
                        <el-button type="primary">Load from local zip</el-button>
                      </template>
                    </el-upload>
                  </div>
                </div>
              </div>
            </el-collapse-item>
            <el-collapse-item title="HotKey" name="HotKey">
              <el-form>
                <template v-for="(value, key) in current_setting" :key="key">
                  <el-form-item :label="value.displayName" label-width="150px">
                    <el-button type="primary" @click="settingHotKey(key as string)">
                      {{ value.key }}
                    </el-button>
                  </el-form-item>
                </template>
              </el-form>
            </el-collapse-item>
          </el-collapse>
          <template #footer>
            <span class="dialog-footer">
              <el-button type="primary" @click="closeSettingDialog"> Confirm </el-button>
            </span>
          </template>
          <HotKetInput v-model:visible="hotkeySettingVisible" v-model:hotKey="HotKeyWantToChange" update:visible=""
            @submit="setHotKey"></HotKetInput>
        </el-dialog>
      </el-main>
      <el-footer>
        <div class="scorer-footer">
          <el-button type="primary" @click="getPrevious" :disabled="currentIndex - 1 < 0">
            Previous
          </el-button>
          <el-button type="primary" @click="getNext">
            {{ current.isSelected() ? 'Next' : 'Skip' }}
          </el-button>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.scorer {
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-wrap: nowrap;
}

.scorer .scorer-menu {
  width: 100%;
  padding: 0 20px;
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: nowrap;
  align-items: center;
}

.scorer .scorer-menu .export-button {
  margin-right: 10px;
}

.scorer .scorer-container {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: stretch;
  flex-wrap: nowrap;
  align-content: center;
}

.image-container {
  width: 40%;
  height: 750px;

  .image {
    height: 650px;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-content: center;
    justify-content: center;
    align-items: center;

    .el-image {
      height: calc(100%);
    }
  }
}

.is-always-shadow {
  border-color: red;
}

.hfsource-setting {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-around;
  align-items: center;
  padding-bottom: 10px;
}

.scorer .scorer-footer {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: center;
  align-items: center;
}

.el-footer {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: center;
  align-items: center;
  padding: 0;
}
</style>
