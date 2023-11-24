import type JSZip from 'jszip'
import { DataSourceType } from '../types/enum'
import { BasicSourceImage, LocalMemoryImage, RemoteSourceImage } from './image'
import { downloadAndUnzip } from '@/utils/huggingface'
import type { RepoDesignation } from '@huggingface/hub'

export abstract class BasicDataSource {
  abstract getType(): DataSourceType
  abstract getImageNames(): string[]
  abstract getImage(index: number): BasicSourceImage
  abstract addImage(image: BasicSourceImage): void
  abstract removeImage(index: number): void
  abstract isReady(): boolean
  abstract clear(): void
  abstract size(): number
}

export class LocalZipDataSource extends BasicDataSource {
  images: LocalMemoryImage[] = []
  constructor(list: any[]) {
    super()
    this.images = list.map((item) => {
      return new LocalMemoryImage(item.filename, item.content)
    })
  }

  static async FromZip(zip: JSZip) {
    let images = await new Promise<LocalMemoryImage[]>((resolve, reject) => {
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
    return new LocalZipDataSource(images)
  }

  isReady(): boolean {
    return this.images.length > 0
  }
  getType(): DataSourceType {
    return DataSourceType.LocalZip
  }
  getImageNames(): string[] {
    return this.images.map((image) => image.name)
  }
  getImage(index: number): LocalMemoryImage {
    return this.images[index]
  }
  addImage(image: LocalMemoryImage): void {
    this.images.push(image)
  }
  removeImage(index: number): void {
    this.images.splice(index, 1)
  }
  clear(): void {
    this.images = []
  }
  size(): number {
    return this.images.length
  }
}

export class RemoteUrlsDataSource extends BasicDataSource {
  images: RemoteSourceImage[] = []
  constructor(list: string[]) {
    super()
    this.images = list.map((url) => {
      return new RemoteSourceImage(url)
    })
  }
  isReady(): boolean {
    return this.images.length > 0
  }
  getType(): DataSourceType {
    return DataSourceType.RemoteUrls
  }
  getImageNames(): string[] {
    return this.images.map((image) => image.url)
  }
  getImage(index: number): RemoteSourceImage {
    return this.images[index]
  }
  addImage(image: RemoteSourceImage): void {
    this.images.push(image)
  }
  removeImage(index: number): void {
    this.images.splice(index, 1)
  }
  clear(): void {
    this.images = []
  }
  size(): number {
    return this.images.length
  }
}

export class RemoteHFRepoZipDataSource extends BasicDataSource {
  repo: RepoDesignation
  dataset: string
  local: LocalZipDataSource | null = null;
  constructor(repo: RepoDesignation, datasetName: string) {
    super()
    this.repo = repo
    this.dataset = datasetName
  }
  async initData() {
    let list = await downloadAndUnzip(this.repo, this.dataset)
    if (list) {
      this.local = await LocalZipDataSource.FromZip(list);
    }
  }
  isReady(): boolean {
    return this.local !== null && this.local.isReady()
  }
  getType(): DataSourceType {
    return DataSourceType.RemoteHFRepoZip
  }
  getImageNames(): string[] {
    return this.local?.getImageNames() || []
  }
  getImage(index: number): LocalMemoryImage {
    return this.local?.getImage(index) || new LocalMemoryImage('', new ArrayBuffer(0))
  }
  addImage(image: LocalMemoryImage): void {
    this.local?.addImage(image)
  }
  removeImage(index: number): void {
    this.local?.removeImage(index)
  }
  clear(): void {
    this.local?.clear()
  }
  size(): number {
    return this.local?.size() || 0
  }
}
