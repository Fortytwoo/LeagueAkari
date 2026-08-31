const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { finished } = require('node:stream/promises')

const asar = require('@electron/asar')

const autoStartMarker = 'League Akari auto-starts the bundled Haidou Tools services'
const weGameDisabledMarker =
  '[HuyaUtils] No LoL or WeGame found; automatic WeGame launch disabled by League Akari'

function replaceOnce(source, expected, replacement, label) {
  const firstIndex = source.indexOf(expected)
  if (firstIndex === -1) {
    throw new Error(`LOLHEXGuide patch target is missing: ${label}`)
  }
  if (source.indexOf(expected, firstIndex + expected.length) !== -1) {
    throw new Error(`LOLHEXGuide patch target is ambiguous: ${label}`)
  }
  return source.slice(0, firstIndex) + replacement + source.slice(firstIndex + expected.length)
}

function patchMainSource(source) {
  let patched = replaceOnce(
    source,
    `let launchPageIpcRegistered = false;
let launchToolStarted = false;
let hexShareIpcRegistered = false;`,
    `let launchPageIpcRegistered = false;
let launchToolStarted = false;
let launchToolStartPromise = null;
let hexShareIpcRegistered = false;`,
    'launch state'
  )

  patched = replaceOnce(
    patched,
    `function registerLaunchPageIpc() {
  if (launchPageIpcRegistered) {
    return;
  }
  launchPageIpcRegistered = true;
  electron.ipcMain.handle(IPC_CHANNELS.LAUNCH.START_TOOL, async () => {
    if (launchWindowInstance) {
      const launchBrowserWindow = launchWindowInstance.getWindow();
      if (launchBrowserWindow) {
        await initializeLolHexService(launchBrowserWindow);
        if (lolHexService) {
          await lolHexService.startActivitySession();
        }
        await initializeLolTFTService(launchBrowserWindow);
      }
    }
    const isLolInstalled2 = await checkIsLolInstalled();
    logger.info("Launch page start tool requested", { isLolInstalled: isLolInstalled2 });
    launchToolStarted = true;
    if (isLolInstalled2) {
      await handleLolClientLogic();
    }
    return { isLolInstalled: isLolInstalled2 };
  });`,
    `async function startLaunchTool() {
  if (!launchToolStartPromise) {
    launchToolStartPromise = (async () => {
      if (launchWindowInstance) {
        const launchBrowserWindow = launchWindowInstance.getWindow();
        if (launchBrowserWindow) {
          await initializeLolHexService(launchBrowserWindow);
          if (lolHexService) {
            await lolHexService.startActivitySession();
          }
          await initializeLolTFTService(launchBrowserWindow);
        }
      }
      const isLolInstalled2 = await checkIsLolInstalled();
      logger.info("Launch page start tool requested", { isLolInstalled: isLolInstalled2 });
      launchToolStarted = true;
      if (isLolInstalled2) {
        await handleLolClientLogic();
      }
      return { isLolInstalled: isLolInstalled2 };
    })();
  }
  try {
    return await launchToolStartPromise;
  } catch (error2) {
    launchToolStartPromise = null;
    throw error2;
  }
}
function registerLaunchPageIpc() {
  if (launchPageIpcRegistered) {
    return;
  }
  launchPageIpcRegistered = true;
  electron.ipcMain.handle(IPC_CHANNELS.LAUNCH.START_TOOL, startLaunchTool);`,
    'start tool IPC handler'
  )

  patched = replaceOnce(
    patched,
    `  logger.info("[HuyaUtils] No LoL or WeGame found, launching WeGame LOL");
  launchWeGameLOL();`,
    `  logger.info(
    "${weGameDisabledMarker}"
  );`,
    'automatic WeGame launch'
  )

  return patched
}

function patchRendererSource(source) {
  return replaceOnce(
    source,
    `  const handleCreateShortcut = async () => {`,
    `  reactExports.useEffect(() => {
    // ${autoStartMarker}
    void handleLaunch();
  }, []);
  const handleCreateShortcut = async () => {`,
    'launch page auto-start effect'
  )
}

function findLaunchRendererAsset(rootDirectory) {
  const assetsDirectory = path.join(rootDirectory, 'dist', 'renderer', 'assets')
  const candidates = fs
    .readdirSync(assetsDirectory)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => path.join(assetsDirectory, fileName))
    .filter((filePath) =>
      fs.readFileSync(filePath, 'utf8').includes('window.launchAPI.startTool()')
    )

  if (candidates.length !== 1) {
    throw new Error(`Expected one LOLHEXGuide launch renderer asset, found ${candidates.length}`)
  }
  return candidates[0]
}

function verifyExtractedRuntime(rootDirectory) {
  const mainPath = path.join(rootDirectory, 'dist', 'main', 'index.cjs')
  const mainSource = fs.readFileSync(mainPath, 'utf8')
  const rendererSource = fs.readFileSync(findLaunchRendererAsset(rootDirectory), 'utf8')

  if (
    !mainSource.includes(
      'electron.ipcMain.handle(IPC_CHANNELS.LAUNCH.START_TOOL, startLaunchTool);'
    )
  ) {
    throw new Error('Patched LOLHEXGuide startTool handler is missing')
  }
  if (!mainSource.includes(weGameDisabledMarker)) {
    throw new Error('Patched LOLHEXGuide WeGame guard is missing')
  }
  if (mainSource.includes('[HuyaUtils] No LoL or WeGame found, launching WeGame LOL')) {
    throw new Error('Original LOLHEXGuide automatic WeGame launch is still present')
  }
  if (!rendererSource.includes(autoStartMarker)) {
    throw new Error('Patched LOLHEXGuide launch-page auto-start effect is missing')
  }
}

async function patchArchive(archivePath) {
  const extractionDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'league-akari-lolhexguide-asar-')
  )
  const patchedArchivePath = `${archivePath}.patched`

  try {
    asar.extractAll(archivePath, extractionDirectory)
    const mainPath = path.join(extractionDirectory, 'dist', 'main', 'index.cjs')
    const rendererPath = findLaunchRendererAsset(extractionDirectory)
    fs.writeFileSync(mainPath, patchMainSource(fs.readFileSync(mainPath, 'utf8')), 'utf8')
    fs.writeFileSync(
      rendererPath,
      patchRendererSource(fs.readFileSync(rendererPath, 'utf8')),
      'utf8'
    )
    verifyExtractedRuntime(extractionDirectory)
    const output = await asar.createPackage(extractionDirectory, patchedArchivePath)
    await finished(output)
    fs.copyFileSync(patchedArchivePath, archivePath)
  } finally {
    fs.rmSync(extractionDirectory, { force: true, recursive: true })
    fs.rmSync(patchedArchivePath, { force: true })
  }
}

async function verifyArchive(archivePath) {
  const extractionDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'league-akari-lolhexguide-verify-')
  )
  try {
    asar.extractAll(archivePath, extractionDirectory)
    verifyExtractedRuntime(extractionDirectory)
  } finally {
    fs.rmSync(extractionDirectory, { force: true, recursive: true })
  }
}

async function main() {
  const [mode, inputPath] = process.argv.slice(2)
  if (!['patch', 'verify'].includes(mode) || !inputPath) {
    throw new Error('Usage: node patch-lolhexguide-runtime.cjs <patch|verify> <app.asar>')
  }

  const archivePath = path.resolve(inputPath)
  if (!fs.statSync(archivePath).isFile()) {
    throw new Error(`LOLHEXGuide app.asar is not a file: ${archivePath}`)
  }

  if (mode === 'patch') {
    await patchArchive(archivePath)
  } else {
    await verifyArchive(archivePath)
  }
  console.log(`LOLHEXGuide runtime ${mode} passed: ${archivePath}`)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}

module.exports = {
  patchMainSource,
  patchRendererSource,
  verifyExtractedRuntime
}
