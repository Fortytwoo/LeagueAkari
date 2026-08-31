import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { z } from 'zod'

import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { LOLHEXGUIDE_MAIN_NAMESPACE, type LolHexGuideMainContext } from './context'
import { LolHexGuideIpcHandlers } from './ipc-handlers'
import { LolHexGuideExecutor } from './lolhexguide-executor'
import { shouldLaunchLolHexGuideOnStartup } from './platform'
import { LolHexGuideSettings } from './state'

@Shard(LolHexGuideMain.id)
export class LolHexGuideMain implements IAkariShardInitDispose {
  static id = LOLHEXGUIDE_MAIN_NAMESPACE

  public readonly settings = new LolHexGuideSettings()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService<LolHexGuideSettings>
  private readonly _context: LolHexGuideMainContext
  private readonly _executor: LolHexGuideExecutor
  private readonly _ipcHandlers: LolHexGuideIpcHandlers

  constructor(
    private readonly _ipc: AkariIpcMain,
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain
  ) {
    this._logger = _loggerFactory.create(LolHexGuideMain.id)
    this._settingService = _settingFactory.register(
      LolHexGuideMain.id,
      {
        launchOnAkariStart: {
          default: this.settings.launchOnAkariStart,
          schema: z.boolean()
        }
      },
      this.settings
    )
    this._context = {
      namespace: LolHexGuideMain.id,
      ipc: this._ipc,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      settings: this.settings
    }
    this._executor = new LolHexGuideExecutor(this._context)
    this._ipcHandlers = new LolHexGuideIpcHandlers(this._context, this._executor)
  }

  async onInit() {
    await this._settingService.applyToState()
    this._mobxUtils.propSync(LolHexGuideMain.id, 'settings', this.settings, ['launchOnAkariStart'])
    this._ipcHandlers.register()

    if (shouldLaunchLolHexGuideOnStartup(this.settings.launchOnAkariStart)) {
      setImmediate(() => {
        this._executor.launch().catch((error) => {
          this._logger.warn('Failed to launch Haidou Tools with League Akari', error)
        })
      })
    }
  }
}
