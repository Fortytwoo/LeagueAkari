import extractorPath from '@resources/bundled/lolhexguide/7za.exe?asset&asarUnpack'
import archivePart1Path from '@resources/bundled/lolhexguide/lolhexguide-00.00.00.38.7z.001?asset&asarUnpack'
import archivePart2Path from '@resources/bundled/lolhexguide/lolhexguide-00.00.00.38.7z.002?asset&asarUnpack'
import elevateExecutablePath from '@resources/elevate.exe?asset&asarUnpack'
import type { LolHexGuideLaunchResult, LolHexGuideStatus } from '@shared/types/lolhexguide'
import { app } from 'electron'
import { execFile, spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import type { LolHexGuideMainContext } from './context'
import { shouldAllowLolHexGuide, shouldElevateLolHexGuideLaunch } from './platform'
import { LOLHEXGUIDE_RESOURCE_MANIFEST as manifest } from './resource-manifest'

const execFileAsync = promisify(execFile)
const archivePaths = [archivePart1Path, archivePart2Path]
const launchConfirmationTimeout = 15_000
const launchConfirmationInterval = 500

export class LolHexGuideExecutor {
  private _installationPromise: Promise<string> | null = null

  constructor(private readonly _context: LolHexGuideMainContext) {}

  async getStatus(): Promise<LolHexGuideStatus> {
    const supported = shouldAllowLolHexGuide()

    return {
      supported,
      installed: supported ? await this._isInstalled() : false,
      version: manifest.version
    }
  }

  async launch(): Promise<LolHexGuideLaunchResult> {
    if (!shouldAllowLolHexGuide()) {
      throw new Error('LOLHEXGuide is only available on Windows.')
    }

    if (await this._isAlreadyRunning()) {
      return {
        alreadyRunning: true,
        installedNow: false,
        version: manifest.version
      }
    }

    const installedBeforeLaunch = await this._isInstalled()
    const installDirectory = await this._ensureInstalled()
    const executablePath = path.join(installDirectory, manifest.launcherFile)

    await this._spawnLauncher(executablePath, installDirectory)
    await this._confirmLaunch()

    return {
      alreadyRunning: false,
      installedNow: !installedBeforeLaunch,
      version: manifest.version
    }
  }

  private _getInstallDirectory() {
    return path.join(app.getPath('userData'), 'bundled-apps', 'lolhexguide', manifest.version)
  }

  private async _isInstalled() {
    const executablePath = path.join(this._getInstallDirectory(), manifest.launcherFile)

    try {
      const executableHash = await this._hashFile(executablePath)
      return executableHash === manifest.launcherSha256
    } catch {
      return false
    }
  }

  private _ensureInstalled() {
    if (!this._installationPromise) {
      this._installationPromise = this._installIfNeeded().finally(() => {
        this._installationPromise = null
      })
    }

    return this._installationPromise
  }

  private async _installIfNeeded() {
    const installDirectory = this._getInstallDirectory()
    if (await this._isInstalled()) {
      return installDirectory
    }

    if (archivePaths.length !== manifest.archiveFiles.length) {
      throw new Error('Bundled Haidou Tools archive volume count is invalid.')
    }

    for (const [index, archiveFile] of manifest.archiveFiles.entries()) {
      const archiveHash = await this._hashFile(archivePaths[index])
      if (archiveHash !== archiveFile.sha256) {
        throw new Error(`Bundled Haidou Tools archive volume ${archiveFile.file} is invalid.`)
      }
    }

    const installRoot = path.dirname(installDirectory)
    const stagingDirectory = path.join(installRoot, `.installing-${randomUUID()}`)
    await fs.mkdir(stagingDirectory, { recursive: true })

    this._context.logger.info('Extracting bundled LOLHEXGuide', {
      version: manifest.version,
      stagingDirectory
    })

    try {
      await execFileAsync(extractorPath, ['x', archivePart1Path, `-o${stagingDirectory}`, '-y'], {
        windowsHide: true,
        maxBuffer: 16 * 1024 * 1024
      })

      const stagedLauncherPath = path.join(stagingDirectory, manifest.launcherFile)
      const launcherHash = await this._hashFile(stagedLauncherPath)
      if (launcherHash !== manifest.launcherSha256) {
        throw new Error('Extracted LOLHEXGuide launcher failed its integrity check.')
      }

      await fs.rm(installDirectory, { force: true, recursive: true })
      await fs.rename(stagingDirectory, installDirectory)
      this._context.logger.info('Bundled LOLHEXGuide is ready', {
        version: manifest.version,
        installDirectory
      })
      return installDirectory
    } catch (error) {
      await fs.rm(stagingDirectory, { force: true, recursive: true }).catch(() => undefined)
      throw error
    }
  }

  private async _spawnLauncher(executablePath: string, workingDirectory: string) {
    const environment = {
      ...process.env,
      hy_launcher_verify: '0',
      hy_launcher_chain: '539298071'
    }

    if (shouldElevateLolHexGuideLaunch(this._context.shared.global.isElevated)) {
      await this._spawnElevatedLauncher(executablePath, workingDirectory, environment)
      return
    }

    try {
      await this._spawnDetachedLauncher(executablePath, workingDirectory, environment)
    } catch (error) {
      if (!this._isAccessDeniedError(error)) {
        throw error
      }

      this._context.logger.warn('Direct Haidou Tools launch was denied; retrying with elevation')
      await this._spawnElevatedLauncher(executablePath, workingDirectory, environment)
    }
  }

  private _spawnDetachedLauncher(
    executablePath: string,
    workingDirectory: string,
    environment: NodeJS.ProcessEnv
  ) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(executablePath, [], {
        cwd: workingDirectory,
        detached: true,
        env: environment,
        stdio: 'ignore',
        windowsHide: true
      })

      child.once('error', reject)
      child.once('spawn', () => {
        child.unref()
        this._context.logger.info('Launched LOLHEXGuide', { executablePath })
        resolve()
      })
    })
  }

  private async _spawnElevatedLauncher(
    executablePath: string,
    workingDirectory: string,
    environment: NodeJS.ProcessEnv
  ) {
    this._context.logger.info('Requesting elevation to launch Haidou Tools', { executablePath })
    await execFileAsync(elevateExecutablePath, [executablePath], {
      cwd: workingDirectory,
      env: environment,
      windowsHide: true
    })
    this._context.logger.info('Requested elevated Haidou Tools launch', { executablePath })
  }

  private _isAccessDeniedError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && 'code' in error && error.code === 'EACCES'
  }

  private async _confirmLaunch() {
    const deadline = Date.now() + launchConfirmationTimeout

    while (Date.now() < deadline) {
      if (await this._isAlreadyRunning()) {
        this._context.logger.info('Confirmed Haidou Tools process is running')
        return
      }

      await new Promise((resolve) => setTimeout(resolve, launchConfirmationInterval))
    }

    throw new Error(
      'Haidou Tools did not start. Please accept the Windows administrator prompt and try again.'
    )
  }

  private async _isAlreadyRunning() {
    try {
      const { stdout } = await execFileAsync(
        'tasklist.exe',
        ['/FI', 'IMAGENAME eq lolhexguide.exe', '/FO', 'CSV', '/NH'],
        { windowsHide: true }
      )
      return stdout.toLowerCase().includes('"lolhexguide.exe"')
    } catch (error) {
      this._context.logger.warn('Failed to check whether LOLHEXGuide is already running', error)
      return false
    }
  }

  private async _hashFile(filePath: string) {
    const hash = createHash('sha256')
    for await (const chunk of createReadStream(filePath)) {
      hash.update(chunk)
    }
    return hash.digest('hex')
  }
}
