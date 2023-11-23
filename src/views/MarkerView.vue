<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'
import { ref, onMounted, watch } from 'vue'
import localforage from 'localforage'
import JSZip from 'jszip'
import { ElLoading, type UploadInstance } from 'element-plus'

//ingnore mousetrap type error
// @ts-ignore
import Mousetrap from 'mousetrap'

import HotKetInput from '../components/HotkeyInput.vue'
import { SingleData } from '../data/scorer/single'
import { HotKeySettings, HotKey } from '../data/scorer/configs/setting'
import {
  BasicDataSource,
  LocalZipDataSource,
  RemoteUrlsDataSource
} from '../data/scorer/datasource/datasource'
import { DataSourceType } from '@/data/scorer/types/enum'
import * as XLSX from 'xlsx'

let dataSource = ref({} as BasicDataSource)
let current = ref(SingleData.fromRemoteUrls('', ''))
let currentIndex = ref(0)
let history = ref([current.value])
let current_setting = ref(new HotKeySettings())
let HotKeyWantToChange = ref(new HotKey('', '', ''))
const settingDialogVisible = ref(false)
const uploadRef = ref<UploadInstance>()

const hotkeySettingVisible = ref(false)

onMounted(async () => {
  await initSetting()
  dataSource.value = getTestDataSource()
  current.value = await getNewPair()
  currentIndex.value = 0
  history.value = [current.value]
})

function getTestDataSource(): BasicDataSource {
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
  let result = await localforage.getItem('hotkeySettings')
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
  // const startTime = new Date();
  let data: any = await unzipFile(file)
  dataSource.value = new LocalZipDataSource(data)
  current.value = await getNewPair()
  currentIndex.value = 0
  history.value = [current.value]
  closeSettingDialog()
  // const endTime = new Date();
  // const executionTime = endTime - startTime;
  // console.log(data)
  // console.log(`代码执行时间：${executionTime} 毫秒`);
  loading.close()
  return false
}

function unzipFile(file: any) {
  return new Promise((resolve, reject) => {
    let zip = new JSZip()
    zip
      .loadAsync(file)
      .then((zip) => {
        let unzipPromises: any[] = []
        zip.forEach((relativePath, file) => {
          if (!file.dir) {
            unzipPromises.push(
              file.async('arraybuffer').then((content) => {
                return {
                  filename: file.name,
                  content: content
                }
              })
            )
          }
        })
        Promise.all(unzipPromises)
          .then((unzippedFiles) => {
            resolve(unzippedFiles)
          })
          .catch((error) => {
            reject(error)
          })
      })
      .catch((error) => {
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
</script>

<template>
  <div class="scorer">
    <el-container>
      <el-header class="scorer-menu">
        <el-button :icon="Setting" circle @click="showSettingDialog" />
        <el-button class="export-button" type="primary" @click="exportToExcel">Export</el-button>
      </el-header>
      <el-main class="scorer-container">
        <el-card :shadow="isSelected(0)" class="image-container" @click="selectImage(0)">
          <div class="image">
            <div @click.stop style="max-height: 100%">
              <el-image
                :src="getImage(0)"
                :zoom-rate="1.2"
                :max-scale="7"
                :min-scale="0.2"
                :preview-src-list="[getImage(0)]"
                fit="contain"
              />
            </div>
          </div>
        </el-card>
        <el-card :shadow="isSelected(1)" class="image-container" @click="selectImage(1)">
          <div class="image">
            <div @click.stop style="max-height: 100%">
              <el-image
                :src="getImage(1)"
                :zoom-rate="1.2"
                :max-scale="7"
                :min-scale="0.2"
                :preview-src-list="[getImage(1)]"
                fit="contain"
              />
            </div>
          </div>
        </el-card>
        <el-dialog v-model="settingDialogVisible" title="Setting" width="30%">
          <span style="font-size: 20px; font-weight: bolder">DataSource</span>
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
            :before-upload="beforeUpload"
            :accept="'application/zip'"
          >
            <template #trigger>
              <el-button type="primary">Load from local zip</el-button>
            </template>
          </el-upload>
          <span>HotKey</span>
          <el-form>
            <template v-for="(value, key) in current_setting" :key="key">
              <el-form-item :label="value.displayName" label-width="150px">
                <el-button type="primary" @click="settingHotKey(key as string)">
                  {{ value.key }}
                </el-button>
              </el-form-item>
            </template>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button type="primary" @click="closeSettingDialog"> Confirm </el-button>
            </span>
          </template>
          <HotKetInput
            v-model:visible="hotkeySettingVisible"
            v-model:hotKey="HotKeyWantToChange"
            update:visible=""
            @submit="setHotKey"
          ></HotKetInput>
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
