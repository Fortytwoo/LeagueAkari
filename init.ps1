$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location -LiteralPath $repoRoot

try {
  Write-Host '=== League Akari harness verification ==='

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is required.'
  }
  if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
    throw 'Yarn 4 is required.'
  }

  Write-Host '=== yarn install --immutable --mode=skip-build ==='
  & yarn install --immutable --mode=skip-build
  if ($LASTEXITCODE -ne 0) {
    throw "yarn install --immutable --mode=skip-build failed with exit code $LASTEXITCODE."
  }

  Write-Host '=== yarn typecheck ==='
  & yarn typecheck
  if ($LASTEXITCODE -ne 0) {
    throw "yarn typecheck failed with exit code $LASTEXITCODE."
  }

  Write-Host '=== yarn test ==='
  & yarn test
  if ($LASTEXITCODE -ne 0) {
    throw "yarn test failed with exit code $LASTEXITCODE."
  }

  Write-Host '=== Verification complete ==='
  Write-Host 'Next steps: read feature_list.json, work on one feature at a time, and record evidence.'
} finally {
  Pop-Location
}
