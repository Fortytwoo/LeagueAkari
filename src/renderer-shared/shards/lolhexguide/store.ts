import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useLolHexGuideStore = defineStore('shard:lolhexguide-renderer', () => {
  const settings = shallowReactive({
    launchOnAkariStart: false
  })

  return { settings }
})
