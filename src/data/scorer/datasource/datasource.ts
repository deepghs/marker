import { DataSourceType } from '../types/enum'
import { BasicSourceImage, LocalSourceImage, RemoteSourceImage } from './image'
import { downloadFile } from '@huggingface/hub'

export abstract class BasicDataSource {
  abstract getType(): DataSourceType
  abstract getImageNames(): string[]
  abstract getImage(index: number): BasicSourceImage
  abstract addImage(image: BasicSourceImage): void
  abstract removeImage(index: number): void
  abstract clear(): void
  abstract size(): number
}

export class LocalZipDataSource extends BasicDataSource {
  images: LocalSourceImage[] = []
  constructor(list: any[]) {
    super()
    this.images = list.map((item) => {
      return new LocalSourceImage(item.filename, item.content)
    })
  }
  getType(): DataSourceType {
    return DataSourceType.LocalZip
  }
  getImageNames(): string[] {
    return this.images.map((image) => image.name)
  }
  getImage(index: number): LocalSourceImage {
    return this.images[index]
  }
  addImage(image: LocalSourceImage): void {
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
  repoUrl = ''
  async download(name: string) {
  }
}
