export function shouldAllowLolHexGuide(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32'
}

export function shouldLaunchLolHexGuideOnStartup(
  enabled: boolean,
  platform: NodeJS.Platform = process.platform
) {
  return enabled && shouldAllowLolHexGuide(platform)
}

export function shouldElevateLolHexGuideLaunch(
  isElevated: boolean,
  platform: NodeJS.Platform = process.platform
) {
  return shouldAllowLolHexGuide(platform) && !isElevated
}
