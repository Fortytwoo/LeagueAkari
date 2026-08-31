import type { AkariIpcRenderer } from '../ipc'
import type { LoggerRenderer } from '../logger'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'

export const LOLHEXGUIDE_MAIN_NAMESPACE = 'lolhexguide-main'
export const LOLHEXGUIDE_RENDERER_NAMESPACE = 'lolhexguide-renderer'

export interface LolHexGuideRendererContext {
  ipc: AkariIpcRenderer
  logger: LoggerRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
}
