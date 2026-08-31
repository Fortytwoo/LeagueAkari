import { describe, expect, test } from 'vitest'

import {
  shouldAllowLolHexGuide,
  shouldElevateLolHexGuideLaunch,
  shouldLaunchLolHexGuideOnStartup
} from './platform'

describe('LOLHEXGuide platform guard', () => {
  test('allows the bundled application only on Windows', () => {
    expect(shouldAllowLolHexGuide('win32')).toBe(true)
    expect(shouldAllowLolHexGuide('darwin')).toBe(false)
    expect(shouldAllowLolHexGuide('linux')).toBe(false)
  })

  test('auto-launches only when enabled on Windows', () => {
    expect(shouldLaunchLolHexGuideOnStartup(true, 'win32')).toBe(true)
    expect(shouldLaunchLolHexGuideOnStartup(false, 'win32')).toBe(false)
    expect(shouldLaunchLolHexGuideOnStartup(true, 'darwin')).toBe(false)
  })

  test('requests elevation only for a non-elevated Windows process', () => {
    expect(shouldElevateLolHexGuideLaunch(false, 'win32')).toBe(true)
    expect(shouldElevateLolHexGuideLaunch(true, 'win32')).toBe(false)
    expect(shouldElevateLolHexGuideLaunch(false, 'darwin')).toBe(false)
  })
})
