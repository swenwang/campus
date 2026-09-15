# Read-only, redacted pre-publication scan. No network access or secret values in output.
$ErrorActionPreference = 'Stop'
$scanRoot = Split-Path $PSScriptRoot -Parent
Push-Location $scanRoot
try {
    $scanRules = [ordered]@{
        'private-key-block' = '-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'
        'github-token' = '\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b'
        'aws-access-id' = '\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'
        'api-token-shape' = '\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{20,})\b'
        'credential-in-url' = 'https?://[^\s/:@]+:[^\s/@]+@'
        'literal-wallet-key' = '(?i)(?:private[_-]?key|secret[_-]?key)\s*[:=]\s*["''](?:0x)?[a-f0-9]{64}["'']'
        'seed-phrase-assignment' = '(?i)(?:mnemonic|seed[_-]?phrase)\s*[:=]\s*["''][a-z]+(?:\s+[a-z]+){11,23}["'']'
        'windows-user-path' = '(?i)\b[A-Z]:[\\/]+Users[\\/]+[^\s\\/"'']+'
    }
    $scanFindings = [System.Collections.Generic.List[object]]::new()
    function Check-PublicText([string]$scanLabel, [string]$scanText) {
        foreach ($scanRule in $scanRules.GetEnumerator()) {
            if ([regex]::IsMatch($scanText, $scanRule.Value)) {
                $scanFindings.Add([pscustomobject]@{ file = $scanLabel; rule = $scanRule.Key })
            }
        }
    }
    $scanPaths = @(git ls-files --cached --others --exclude-standard | Sort-Object -Unique)
    foreach ($scanPath in $scanPaths) {
        if (Test-Path -LiteralPath $scanPath -PathType Leaf) {
            Check-PublicText "working:$scanPath" (Get-Content -LiteralPath $scanPath -Raw)
        }
    }
    $scanObjectCount = 0
    foreach ($scanObject in (git rev-list --objects --all)) {
        $scanParts = $scanObject -split ' ', 2
        if ($scanParts.Count -ne 2) { continue }
        $scanKind = git cat-file -t $scanParts[0]
        if ($scanKind -ne 'blob') { continue }
        $scanObjectCount++
        $scanText = (git cat-file blob $scanParts[0]) -join "`n"
        Check-PublicText "history:$($scanParts[1])@$($scanParts[0].Substring(0,8))" $scanText
    }
    # Commit metadata becomes public too. Report only whether non-noreply addresses exist.
    $scanEmails = @(git log --all --format='%ae%n%ce' | Sort-Object -Unique)
    $scanPersonalEmailCount = @($scanEmails | Where-Object { $_ -notmatch '@(?:users\.)?noreply\.github\.com$' }).Count
    [pscustomobject]@{
        workingFiles = $scanPaths.Count
        historyBlobs = $scanObjectCount
        historyNonNoreplyEmailCount = $scanPersonalEmailCount
        findings = @($scanFindings.ToArray())
        limitation = 'Heuristic scan only; no guarantee that all credential or personal-data formats are detected.'
    } | ConvertTo-Json -Depth 4
    if ($scanFindings.Count) { exit 1 }
} finally {
    Pop-Location
}
