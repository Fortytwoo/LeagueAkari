# Session Handoff

## Current Objective

- **Goal:** Bundle LOLHEXGuide into League Akari with reliable elevated launch behavior.
- **Current status:** `bundled-lolhexguide-001` is complete; no feature is active.
- **Branch / commit:** `dev`; follow-up started from `72858a87`.
- **Last Updated:** 2026-08-31

## Completed This Session

- Audited the five harness subsystems.
- Added repository-specific startup, scope, Definition of Done, and end-of-session rules.
- Added feature state, progress tracking, and cross-platform verification entrypoints.
- Verified the completed harness and recorded the native Windows toolchain boundary.
- Reversed the earlier integration direction and restored the original LOLHEXGuide application.
- Added a reproducible two-volume LOLHEXGuide resource with SHA-256 metadata. Each volume remains
  below GitHub's per-file limit without relying on unavailable public-fork LFS uploads.
- Added Windows-only main and renderer shards for status, first-install extraction, launch,
  duplicate-instance protection, and launch-on-start settings.
- Added a localized `海斗工具` sidebar quick action immediately after Automation.
- Added a typed App settings row whose value is stored in `LeagueAkari.db` under
  `lolhexguide-main/launchOnAkariStart`.
- Fixed normal-user launches by routing `GameBoxServer.exe` through the existing elevation helper;
  direct spawn remains for an already elevated League Akari process.
- Made packaged League Akari request administrator privileges at process startup.
- Made launcher success depend on observing the real `lolhexguide.exe` target process.
- Verified the development app and packaged app through the configured CDP workflow.

## Verification Evidence

| Check                | Command                           | Result  | Notes                                       |
| -------------------- | --------------------------------- | ------- | ------------------------------------------- |
| Harness structure    | `validate-harness.mjs --target .` | Passed  | 100/100; five subsystems at 5/5.            |
| Standard gate        | `.\init.ps1`                      | Passed  | Yarn skip-build install, typecheck, tests.  |
| Type checks          | `yarn typecheck`                  | Passed  | Node and renderer reported no errors.       |
| Test suite           | `yarn test`                       | Passed  | 99 files and 564 tests passed.              |
| Script syntax        | Bash and PowerShell parsers       | Passed  | Both entrypoints parse successfully.        |
| Diff hygiene         | `git diff --check`                | Passed  | No whitespace errors.                       |
| Full native install  | `yarn install --immutable`        | Blocked | Visual Studio C++ workload not detected.    |
| LOLHEXGuide resource | prepare script and `7za t`        | Passed  | 216 files; archive SHA-256 recorded.        |
| Full test suite      | `yarn test`                       | Passed  | 100 files and 567 tests.                    |
| Settings persistence | toggle, restart, inspect          | Passed  | Value restored and auto-launch executed.    |
| Elevation smoke      | `elevate.exe GameBoxServer.exe`   | Passed  | Exit 0; complete process tree launched.     |
| Windows package      | `yarn build:win`                  | Passed  | 239,114,414-byte 7z artifact.               |
| Packaged smoke       | CDP sidebar launch                | Passed  | Launch succeeded; settings row visible.     |
| Follow-up typecheck  | `yarn typecheck`                  | Passed  | Node and renderer reported no errors.       |
| Follow-up tests      | `yarn test`                       | Passed  | 100 files and 567 tests passed.             |
| Elevated package     | Manifest inspection               | Passed  | Final exe requests administrator access.    |
| Confirmed launch     | Packaged CDP sidebar launch       | Passed  | Visible target window and process observed. |

## Files Changed

- `electron-builder.yml`
- `src/main/shards/lolhexguide/lolhexguide-executor.ts`
- `AGENTS.md`
- `feature_list.json`
- `progress.md`
- `session-handoff.md`
- `init.sh`
- `init.ps1`

## Decisions Made

- Existing project architecture guidance remains in place; harness rules are additive.
- `feature_list.json` tracks real scoped work rather than placeholder product features.
- Standard verification skips native dependency build scripts and does not package the Electron
  application. Native/runtime or packaging work requires the full immutable install and matching
  smoke check.
- LOLHEXGuide installs into the League Akari user-data directory on first use instead of shipping as
  hundreds of loose files in the installed application.
- The launcher is a dedicated shard and sidebar action; renderer code never spawns external
  processes.
- Ordinary feature configuration belongs in the SQLite-backed `SettingFactoryMain`; only
  pre-database bootstrap behavior belongs in `base-config.json`.
- Packaged League Akari runs elevated by default; the helper remains only as a fallback for dev or
  nonstandard launch paths.
- An elevation-helper exit is not launch success; confirm `lolhexguide.exe` before notifying users.

## Blockers / Risks

- A full `yarn install --immutable` currently cannot build `better-sqlite3` because this Windows host
  has no detectable Visual Studio C++ workload. The standard non-native gate remains available.

## Next Session Startup

1. Confirm the repository with `git status --short --branch`.
2. Read `AGENTS.md`, `feature_list.json`, and `progress.md`.
3. Review this handoff and select exactly one `in-progress` feature.
4. Run `./init.sh` or `.\init.ps1` before editing.

## Recommended Next Step

- Add or select one concrete feature for the next request, set it to `in-progress`, and run the
  standard gate before editing.
