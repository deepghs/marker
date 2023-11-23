import { RemoteSourceImage, BasicSourceImage, LocalSourceImage } from './datasource/image'
import { ScorerType } from './types/enum'

export class SingleData {
  uid: string = new Date().getTime() + Math.random().toString(36).substr(2)
  images: BasicSourceImage[]
  selected: boolean[] = [false, false]
  hasChecked: boolean = false
  constructor(
    public img1: BasicSourceImage,
    public img2: BasicSourceImage
  ) {
    this.images = [img1, img2]
  }

  static fromRemoteUrls(url1: string, url2: string) {
    return new SingleData(new RemoteSourceImage(url1), new RemoteSourceImage(url2))
  }
  
  static fromRemoteImages(image1: RemoteSourceImage, image2: RemoteSourceImage) {
    return new SingleData(image1, image2)
  }

  static async fromLocal(
    name1: string,
    arraybuffer1: ArrayBuffer,
    name2: string,
    arraybuffer2: ArrayBuffer
  ) {
    const image1 = new LocalSourceImage(name1, arraybuffer1)
    const image2 = new LocalSourceImage(name2, arraybuffer2)
    return await SingleData.fromLocalImages(image1, image2)
  }

  static async fromLocalImages(image1: LocalSourceImage, image2: LocalSourceImage) {
    await image1.loadImage()
    await image2.loadImage()
    return new SingleData(image1, image2)
  }

  changeChecked() {
    this.hasChecked = true
  }

  changeSelected(target: number, force?: boolean) {
    if (force !== undefined) {
      this.selected[target] = force
      return
    }
    this.selected[target] = !this.selected[target]
  }

  isImgSelected(target: number) {
    return this.selected[target]
  }
  isSelected() {
    return this.selected[0] || this.selected[1]
  }
  getImgList() {
    const image1 = this.getImg(0)
    const image2 = this.getImg(1)
    return [image1, image2]
  }
  getImg(target: number) {
    const image = this.images[target]
    const img = image.getImage()
    return img
  }
  getResult(): ScorerType {
    if (this.selected[0] && this.selected[1]) {
      return ScorerType.BOTH
    } else if (this.selected[0]) {
      return ScorerType.LEFT
    } else if (this.selected[1]) {
      return ScorerType.RIGHT
    } else {
      return ScorerType.SKIP
    }
  }

  export(): any {
    return {
      uid: this.uid,
      img1: this.img1.export().image,
      img2: this.img2.export().image,
      result: this.getResult()
    }
  }
}
