[CmdletBinding()]
param(
  [Parameter()]
  [string]$SourceDirectory = 'G:\LOLHEXGuid\pc_lolhexguide\00.00.00.38',

  [Parameter()]
  [string]$Version = '00.00.00.38'
)

$ErrorActionPreference = 'Stop'

$sourcePath = (Resolve-Path -LiteralPath $SourceDirectory).Path
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$outputDirectory = Join-Path $repositoryRoot 'resources\bundled\lolhexguide'
$archivePath = Join-Path $outputDirectory "lolhexguide-$Version.7z"
$archiveVolumePattern = "$archivePath.*"
$extractorSourcePath = Join-Path $sourcePath '7za.exe'
$launcherPath = Join-Path $sourcePath 'GameBoxServer.exe'
$appAsarPath = Join-Path $sourcePath 'resources\app.asar'
$extractorOutputPath = Join-Path $outputDirectory '7za.exe'
$manifestPath = Join-Path $outputDirectory 'manifest.json'
$manifestModulePath = Join-Path $repositoryRoot 'src\main\shards\lolhexguide\resource-manifest.ts'

foreach ($requiredPath in @($extractorSourcePath, $launcherPath, $appAsarPath)) {
  if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
    throw "Required LOLHEXGuide file is missing: $requiredPath"
  }
}

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

Get-ChildItem -Path $archiveVolumePattern -File -ErrorAction SilentlyContinue |
  Remove-Item -Force
if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath -Force }

Push-Location $sourcePath
try {
  & $extractorSourcePath a -t7z $archivePath '.\*' '-xr!log\*' -mx=5 -mmt=on -mtc=off -mta=off -mtm=off -v75m
  if ($LASTEXITCODE -ne 0) {
    throw "7-Zip failed to create the LOLHEXGuide archive (exit code $LASTEXITCODE)."
  }
} finally {
  Pop-Location
}

$archiveVolumes = @(Get-ChildItem -Path $archiveVolumePattern -File | Sort-Object Name)
if ($archiveVolumes.Count -lt 2) {
  throw 'Expected the LOLHEXGuide resource to contain at least two archive volumes.'
}

& $extractorSourcePath t $archiveVolumes[0].FullName
if ($LASTEXITCODE -ne 0) {
  throw "7-Zip failed to validate the LOLHEXGuide archive (exit code $LASTEXITCODE)."
}

Copy-Item -LiteralPath $extractorSourcePath -Destination $extractorOutputPath -Force

$includedFiles = Get-ChildItem -LiteralPath $sourcePath -Recurse -File | Where-Object {
  $relativePath = [System.IO.Path]::GetRelativePath($sourcePath, $_.FullName)
  -not $relativePath.StartsWith("log$([System.IO.Path]::DirectorySeparatorChar)", [System.StringComparison]::OrdinalIgnoreCase)
}

$manifest = [ordered]@{
  schemaVersion = 1
  version = $Version
  archiveFiles = @($archiveVolumes | ForEach-Object {
    [ordered]@{
      file = $_.Name
      sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
      bytes = $_.Length
    }
  })
  launcherFile = 'GameBoxServer.exe'
  launcherSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $launcherPath).Hash.ToLowerInvariant()
  sourceFileCount = $includedFiles.Count
  sourceBytes = ($includedFiles | Measure-Object -Property Length -Sum).Sum
  excludedPaths = @('log/**')
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
$manifestModule = "export const LOLHEXGUIDE_RESOURCE_MANIFEST = $($manifest | ConvertTo-Json -Depth 4) as const`n"
$manifestModule | Set-Content -LiteralPath $manifestModulePath -Encoding UTF8

Write-Host "Prepared LOLHEXGuide $Version"
foreach ($archiveFile in $manifest.archiveFiles) {
  Write-Host "Archive: $($archiveFile.file) ($($archiveFile.bytes) bytes)"
  Write-Host "SHA256: $($archiveFile.sha256)"
}
