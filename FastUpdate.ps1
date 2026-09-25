$USER_JS = "PixivParse.user.js"
$META_JS = "PixivParse.meta.js"

$BEGIN_MARK = "// ==UserScript=="
$END_MARK = "// ==/UserScript=="

$content = Get-Content $USER_JS -Raw -Encoding UTF8
$start = $content.IndexOf($BEGIN_MARK)
$end = $content.IndexOf($END_MARK)
$meta = $content.Substring($start, $end - $start + $END_MARK.Length) + "`n"

Set-Content -Path $META_JS -Value $meta -Encoding UTF8 -NoNewline

Write-Host "[Done] $USER_JS -> $META_JS"