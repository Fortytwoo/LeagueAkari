import type { LolHexGuideMainContext } from './context'
import type { LolHexGuideExecutor } from './lolhexguide-executor'

export class LolHexGuideIpcHandlers {
  constructor(
    private readonly _context: LolHexGuideMainContext,
    private readonly _executor: LolHexGuideExecutor
  ) {}

  register() {
    this._context.ipc.onCall(this._context.namespace, 'getStatus', () => {
      return this._executor.getStatus()
    })

    this._context.ipc.onCall(this._context.namespace, 'launch', () => {
      return this._executor.launch()
    })
  }
}
