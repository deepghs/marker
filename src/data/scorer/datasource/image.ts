import { ImageType } from '../types/enum'

export abstract class BasicSourceImage {
  abstract getType(): ImageType
  abstract getImage(): string | ArrayBuffer | null | Promise<string | ArrayBuffer | null>
  abstract clone(): BasicSourceImage
  abstract export(): any
}

export class LocalMemoryImage extends BasicSourceImage {
  name: string
  content: ArrayBuffer
  base64: string | ArrayBuffer | null = null
  constructor(name: string, content: ArrayBuffer) {
    super()
    this.name = name
    this.content = content
  }

  async loadImage(): Promise<string | ArrayBuffer | null> {
    this.base64 = await this.arraybuffer2ImageBase64(this.content)
    return this.base64
  }

  getImage(): string | ArrayBuffer | null {
    return this.base64
  }

  getType(): ImageType {
    return ImageType.Local
  }

  async arraybuffer2ImageBase64(arraybuffer: ArrayBuffer): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([arraybuffer], { type: 'image/jpeg' })
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onload = function (e) {
        resolve(reader.result)
      }
    })
  }

  clone(): LocalMemoryImage {
    return new LocalMemoryImage(this.name, this.content)
  }

  export(): any {
    return {
      image: this.name
    }
  }
}

export class RemoteSourceImage extends BasicSourceImage {
  url: string
  constructor(remote_url: string) {
    super()
    this.url = remote_url
  }

  getImage(): string | ArrayBuffer | null {
    return this.url
  }

  getType(): ImageType {
    return ImageType.Remote
  }

  clone(): RemoteSourceImage {
    return new RemoteSourceImage(this.url)
  }

  export(): any {
    return {
      image: this.url
    }
  }
}
