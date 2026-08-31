import { describe, expect, test } from 'vitest'

import { shouldAllowLolHexGuide, shouldLaunchLolHexGuideOnStartup } from './platform'

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
})
