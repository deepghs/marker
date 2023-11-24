<script setup lang="ts">
import { downloadFile, listFiles } from '@huggingface/hub'
import type { RepoDesignation } from '@huggingface/hub'
import JSZip from 'jszip'
import { onMounted } from 'vue'
import { downloadAndUnzip } from '@/utils/huggingface'

const repo: RepoDesignation = { name: 'deepghs/quality_rlhf', type: 'dataset' }

onMounted(async () => {
  let files = await getDataSet(repo)
  let unzippedFiles = await download2()
  console.log(unzippedFiles)
})

async function getDataSet(repo: RepoDesignation) {
  let files = listFiles({ repo })
  let datasets = [] as string[]
  for await (const file of files) {
    if (file.type === 'file' && file.path.endsWith('.zip')) {
      datasets.push(file.path)
    }
  }
  return datasets
}

async function download2(dataset: string = 'dataset_v0_100.zip') {
  return new Promise((resolve, reject) => {
    downloadAndUnzip(repo, dataset).then((zip) => {
      let unzipPromises: any[] = []
      zip?.forEach((relativePath, file) => {
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
  })
}

</script>

<template></template>

<style lang="scss" scoped></style>