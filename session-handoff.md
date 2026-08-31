# Session Handoff

## Current Objective

- **Goal:** Bundle LOLHEXGuide into League Akari and add a League Akari launcher entry.
- **Current status:** `bundled-lolhexguide-001` is complete; no feature is active.
- **Branch / commit:** `dev`; starting commit `b068c1e0`.
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
- Verified the development app and packaged app through the configured CDP workflow.

## Verification Evidence

| Check                | Command                           | Result  | Notes                                      |
| -------------------- | --------------------------------- | ------- | ------------------------------------------ |
| Harness structure    | `validate-harness.mjs --target .` | Passed  | 100/100; five subsystems at 5/5.           |
| Standard gate        | `.\init.ps1`                      | Passed  | Yarn skip-build install, typecheck, tests. |
| Type checks          | `yarn typecheck`                  | Passed  | Node and renderer reported no errors.      |
| Test suite           | `yarn test`                       | Passed  | 99 files and 564 tests passed.             |
| Script syntax        | Bash and PowerShell parsers       | Passed  | Both entrypoints parse successfully.       |
| Diff hygiene         | `git diff --check`                | Passed  | No whitespace errors.                      |
| Full native install  | `yarn install --immutable`        | Blocked | Visual Studio C++ workload not detected.   |
| LOLHEXGuide resource | prepare script and `7za t`        | Passed  | 216 files; archive SHA-256 recorded.       |
| Full test suite      | `yarn test`                       | Passed  | 100 files and 566 tests.                   |
| Settings persistence | toggle, restart, inspect          | Passed  | Value restored and auto-launch executed.   |
| Windows package      | `yarn build:win`                  | Passed  | 239,112,909-byte 7z artifact.              |
| Packaged smoke       | CDP sidebar launch                | Passed  | Launch succeeded; settings row visible.    |

## Files Changed

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
