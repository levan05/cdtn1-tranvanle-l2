# Run in a visible classic console so the PNGs capture actual command execution.
$ErrorActionPreference = 'Stop'
chcp 65001 | Out-Null
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = [Console]::OutputEncoding
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
$outputDir = Join-Path $repoRoot 'docs/packaging-evidence/screenshots'
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class EvidenceConsole {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct FontInfo {
    public uint Size; public uint Index; public short Width; public short Height;
    public int Family; public int Weight;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string Face;
  }
  [DllImport("kernel32.dll")] public static extern IntPtr GetStdHandle(int kind);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode)]
  public static extern bool SetCurrentConsoleFontEx(IntPtr handle, bool maximum, ref FontInfo font);
  public static void UseConsolas() {
    var font = new FontInfo { Size=(uint)Marshal.SizeOf(typeof(FontInfo)), Height=18, Family=54, Weight=400, Face="Consolas" };
    SetCurrentConsoleFontEx(GetStdHandle(-11), false, ref font);
  }
  [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int command);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
'@
$consoleWindow = [EvidenceConsole]::GetConsoleWindow()
[EvidenceConsole]::UseConsolas()
[EvidenceConsole]::ShowWindow($consoleWindow, 3) | Out-Null
[EvidenceConsole]::SetForegroundWindow($consoleWindow) | Out-Null
function Save-Screen([string]$Name) {
    [EvidenceConsole]::SetForegroundWindow($consoleWindow) | Out-Null
    Start-Sleep -Milliseconds 900
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
        $bitmap.Save((Join-Path $outputDir $Name), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
}
function Header([string]$Title) {
    Clear-Host
    Write-Host "BT3 - Tran Van Le - L2 - $Title" -ForegroundColor Cyan
    Write-Host (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')
    Write-Host ''
}
$app = 'bt3verify-20261112-132605-app-1'
Header 'Docker health'
Write-Host '> docker ps --filter label=com.docker.compose.project=bt3verify-20261112-132605'
docker ps --filter label=com.docker.compose.project=bt3verify-20261112-132605 --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
Write-Host '> Invoke-RestMethod http://localhost:8000/health'
Invoke-RestMethod http://localhost:8000/health | ConvertTo-Json -Compress | Out-Host
Save-Screen 'docker-health.png'
Header 'Unit tests in Docker'
Write-Host "> docker exec $app npm test (last 16 lines)"
docker exec $app npm test | Select-Object -Last 16 | Out-Host
if ($LASTEXITCODE -ne 0) { throw 'Unit test failed.' }
Save-Screen 'docker-unit-tests.png'
Header 'Integration tests in Docker'
Write-Host "> docker exec -e DB_NAME=baohanh_l2_test -e WORKSHOP_ALLOW_DB_WRITE=1 $app node scripts/run-workshop-integration.js"
docker exec -e DB_NAME=baohanh_l2_test -e WORKSHOP_ALLOW_DB_WRITE=1 $app node scripts/run-workshop-integration.js
if ($LASTEXITCODE -ne 0) { throw 'Integration test failed.' }
Save-Screen 'docker-integration-tests.png'
foreach ($caseId in @('TC-02', 'TC-10')) {
    Header "$caseId in Docker"
    Write-Host "> docker exec -e DB_NAME=baohanh_l2_test -e WORKSHOP_ALLOW_DB_WRITE=1 $app node scripts/run-workshop-integration.js $caseId"
    docker exec -e DB_NAME=baohanh_l2_test -e WORKSHOP_ALLOW_DB_WRITE=1 $app node scripts/run-workshop-integration.js $caseId
    if ($LASTEXITCODE -ne 0) { throw "$caseId failed." }
    Save-Screen "$caseId-docker.png"
}
Write-Host "Saved actual screenshots: $outputDir"
