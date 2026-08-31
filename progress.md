# Session Progress Log

## Current State

- **Last Updated:** 2026-08-31
- **Current Objective:** Bundle LOLHEXGuide into League Akari and expose a launcher in the League Akari UI.
- **Active Feature:** None
- **Status:** `done`

## What's Done

- Audited the existing harness with `harness-creator`.
- Confirmed the repository uses Yarn 4, TypeScript, Vue 3, Electron, and Vitest.
- Preserved the existing project-specific guidance in `AGENTS.md`.
- Added feature state, cross-platform verification entrypoints, lifecycle rules, and restartable
  handoff state.
- Completed the structural, type-check, test, syntax, and diff-hygiene gates.

## What's In Progress

- Nothing. The non-elevated Haidou Tools launch fix is complete.

## What's Next

1. Select a new feature before making additional application changes.

## Blockers / Risks

- The full native dependency command `yarn install --immutable` cannot build `better-sqlite3` on
  this Windows host because node-gyp cannot detect a Visual Studio C++ workload. This does not block
  the standard non-native gate; native/runtime and packaging work still requires that toolchain.
- LOLHEXGuide adds about 141 MiB compressed to the application resources. It is stored as two
  ordinary Git archive volumes below GitHub's per-file size limit because public forks cannot add
  new Git LFS objects.

## Decisions Made

- Keep the existing `AGENTS.md` architecture guide and add only the missing harness routing.
- Provide both `init.sh` and `init.ps1` because the project is cross-platform and commonly developed
  on Windows.
- Use immutable Yarn installation with `--mode=skip-build`, type checking, and Vitest as the standard
  local gate. Require a full native install and matching runtime smoke check for Electron native or
  packaging changes.
- Package LOLHEXGuide as versioned 7z volumes, validate every volume and the launcher before first
  use, and install it under `<userData>/bundled-apps/lolhexguide/<version>`.
- Keep LOLHEXGuide Windows-only and detect a running `lolhexguide.exe` before starting another
  `GameBoxServer.exe`.
- Expose the product name as `海斗工具` / `Haidou Tools`; keep LOLHEXGuide only as the internal
  resource and compatibility namespace.
- Store `launchOnAkariStart` in the typed SQLite settings system under
  `lolhexguide-main/launchOnAkariStart`, not in early bootstrap `base-config.json`.
- `GameBoxServer.exe` declares `requireAdministrator`; use the existing elevation helper when League
  Akari is not elevated, preserve the launcher environment, and retain `EACCES` fallback handling.

## Files Modified This Session

- `AGENTS.md` — added startup, scope, completion, verification, and handoff rules.
- `feature_list.json` — added explicit feature state and done criteria.
- `progress.md` — added restartable current-state and evidence log.
- `session-handoff.md` — added next-session startup and handoff state.
- `init.sh` — added the portable fail-fast verification entrypoint.
- `init.ps1` — added the Windows PowerShell verification entrypoint.

## Verification Evidence

- `yarn prettier --write AGENTS.md feature_list.json progress.md session-handoff.md` — passed.
- Harness validator — `100/100`; all five subsystems scored `5/5`.
- `.\init.ps1` — passed with Yarn 4.18.0; immutable resolution completed in `skip-build` mode.
- `yarn typecheck` — passed for Node and renderer TypeScript projects.
- `yarn test` — passed: 99 test files, 564 tests.
- `feature_list.json` parse, `bash -n ./init.sh`, and PowerShell parser checks — passed.
- `git diff --check` — clean; Git emitted only the existing line-ending conversion warning for
  `AGENTS.md`.
- Full `yarn install --immutable` — blocked before typecheck/test because `better-sqlite3` requires a
  Visual Studio C++ workload; exact boundary is documented above and in `session-handoff.md`.
- `yarn typecheck:node` and `yarn typecheck:web` — passed.
- `yarn test` — passed: 100 files, 567 tests.
- Development-mode CDP smoke test — `海斗工具` appears directly beside `自动操作`; clicking it
  launched `GameBoxServer.exe` plus the LOLHEXGuide Electron process tree.
- Settings persistence smoke test — changed `lolhexguide-main/launchOnAkariStart` from false to
  true, verified the saved value, restarted League Akari, observed automatic launch, then restored
  the test value to false.
- Packaged-app CDP smoke test — sidebar launcher and App settings row are visible and functional;
  repeat click kept one `GameBoxServer.exe` instance.
- Non-elevated launch-path smoke — elevation helper returned 0 and launched the full
  `GameBoxServer.exe` / `lolhexguide.exe` process tree with required environment variables.
- Fix package smoke — elevated direct launch passed from the packaged application; no `EACCES` was
  logged and nine Haidou Tools processes were observed.
- `yarn build:win` — passed; created `dist/League Akari-1.5.2-beta-win.7z` (239,114,414 bytes).
- Package inspection — final archive contains both LOLHEXGuide volumes (78,643,200 and 69,012,206
  bytes) and the 7-Zip extractor; packaged and source volume SHA-256 values match the resource
  manifest.

## Notes for Next Session

- Read the four harness state files before editing.
- No feature is active; add or select one before the next implementation task.
