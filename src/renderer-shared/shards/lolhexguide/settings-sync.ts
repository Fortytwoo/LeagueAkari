import { LOLHEXGUIDE_MAIN_NAMESPACE, type LolHexGuideRendererContext } from './context'
import { useLolHexGuideStore } from './store'

export async function syncLolHexGuideSettings(context: LolHexGuideRendererContext) {
  const store = useLolHexGuideStore()
  await context.piniaMobxUtils.sync(LOLHEXGUIDE_MAIN_NAMESPACE, 'settings', store.settings)
}
