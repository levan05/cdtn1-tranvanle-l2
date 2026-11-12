param([string]$Revision = 'HEAD')
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI is missing. Install Docker Desktop, start the Linux engine, then rerun this script.'
}
function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    # Out-Host makes native stdout visible to Windows PowerShell 5 transcripts.
    & $Program @Arguments | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "$Program exited with $LASTEXITCODE" }
}
Invoke-Checked docker @('info', '--format', '{{.ServerVersion}}')
Invoke-Checked docker @('compose', 'version')
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$projectName = "bt3verify-$stamp"
$trialRoot = Join-Path ([IO.Path]::GetTempPath()) $projectName
$evidenceRoot = Join-Path $repoRoot 'docs/packaging-evidence'
New-Item -ItemType Directory -Path $trialRoot -Force | Out-Null
New-Item -ItemType Directory -Path $evidenceRoot -Force | Out-Null
$transcript = Join-Path $evidenceRoot "$stamp.txt"
Start-Transcript -Path $transcript | Out-Null
try {
    Set-Location $repoRoot
    $hash = & git rev-parse --verify "$Revision^{commit}"
    if ($LASTEXITCODE -ne 0) { throw 'Invalid Git revision.' }
    Write-Host "REVISION $hash"
    Write-Host "ISOLATED DIRECTORY $trialRoot"
    Write-Host "COMPOSE PROJECT $projectName (new project volume; no global prune)"
    $archive = Join-Path $trialRoot 'source.tar'
    Invoke-Checked git @('archive', '--format=tar', "--output=$archive", $hash)
    Invoke-Checked tar @('-xf', $archive, '-C', $trialRoot)
    Set-Location $trialRoot
    # The two setup commands, on a Git export with no node_modules or local .env:
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    Invoke-Checked docker @('compose', '-p', $projectName, 'up', '-d', '--build', '--wait', '--wait-timeout', '180')
    Invoke-Checked docker @('compose', '-p', $projectName, 'ps')
    $health = Invoke-RestMethod -Uri 'http://localhost:8000/health'
    if ($health.status -ne 'ok' -or $health.db -ne 'ok') { throw 'Health response does not match expected values.' }
    Write-Host ('HEALTH ' + ($health | ConvertTo-Json -Compress))
    Invoke-Checked docker @('compose', '-p', $projectName, 'exec', '-T', 'app', 'npm', 'test')
    Invoke-Checked docker @('compose', '-p', $projectName, 'exec', '-T', 'db', 'createdb', '-U', 'postgres', 'baohanh_l2_test')
    Invoke-Checked docker @('compose', '-p', $projectName, 'exec', '-T', '-e', 'DB_NAME=baohanh_l2_test', 'app', 'npm', 'run', 'migrate')
    Invoke-Checked docker @('compose', '-p', $projectName, 'exec', '-T', '-e', 'DB_NAME=baohanh_l2_test', 'app', 'npm', 'run', 'seed')
    Invoke-Checked docker @('compose', '-p', $projectName, 'exec', '-T', '-e', 'DB_NAME=baohanh_l2_test', '-e', 'WORKSHOP_ALLOW_DB_WRITE=1', 'app', 'node', 'scripts/run-workshop-integration.js')
    Invoke-Checked docker @('compose', '-p', $projectName, 'cp', 'app:/app/docs/workshop-integration-results.txt', (Join-Path $evidenceRoot "$stamp-integration.txt"))
    Write-Host 'PASS clean-source packaging rehearsal. This is a local revision rehearsal, not verification of the public v1.0 tag.'
    Write-Host 'Capture this terminal and the frontend before cleanup.'
} finally {
    Write-Host "Evidence: $transcript"
    Write-Host "Containers retained for screenshots. Cleanup only this disposable project: docker compose -p $projectName -f `"$trialRoot/docker-compose.yml`" down -v"
    Set-Location $repoRoot
    Stop-Transcript | Out-Null
}
