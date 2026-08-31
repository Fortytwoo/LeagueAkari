import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { LolHexGuideSettings } from './state'

export const LOLHEXGUIDE_MAIN_NAMESPACE = 'lolhexguide-main'

export interface LolHexGuideMainContext {
  namespace: string
  ipc: AkariIpcMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  settings: LolHexGuideSettings
}
