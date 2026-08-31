import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { LolHexGuideLaunchResult, LolHexGuideStatus } from '@shared/types/lolhexguide'

import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  LOLHEXGUIDE_MAIN_NAMESPACE,
  LOLHEXGUIDE_RENDERER_NAMESPACE,
  type LolHexGuideRendererContext
} from './context'
import { syncLolHexGuideSettings } from './settings-sync'

@Shard(LolHexGuideRenderer.id)
export class LolHexGuideRenderer implements IAkariShardInitDispose {
  static id = LOLHEXGUIDE_RENDERER_NAMESPACE

  private readonly _context: LolHexGuideRendererContext

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(LoggerRenderer) logger: LoggerRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) settingUtils: SettingUtilsRenderer
  ) {
    this._context = { ipc, logger, piniaMobxUtils, settingUtils }
  }

  async onInit() {
    await syncLolHexGuideSettings(this._context)
  }

  getStatus() {
    return this._context.ipc.call<LolHexGuideStatus>(LOLHEXGUIDE_MAIN_NAMESPACE, 'getStatus')
  }

  launch() {
    this._context.logger.info(LOLHEXGUIDE_RENDERER_NAMESPACE, 'Launch Haidou Tools')
    return this._context.ipc.call<LolHexGuideLaunchResult>(LOLHEXGUIDE_MAIN_NAMESPACE, 'launch')
  }

  setLaunchOnAkariStart(enabled: boolean) {
    return this._context.settingUtils.set(LOLHEXGUIDE_MAIN_NAMESPACE, 'launchOnAkariStart', enabled)
  }
}
