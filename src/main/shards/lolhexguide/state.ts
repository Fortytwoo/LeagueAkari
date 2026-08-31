import { makeAutoObservable } from 'mobx'

export class LolHexGuideSettings {
  launchOnAkariStart = false

  constructor() {
    makeAutoObservable(this)
  }
}
