#!/usr/bin/env bash

USER_JS="PixivParse.user.js"
META_JS="PixivParse.meta.js"

BEGIN_MARK="// ==UserScript=="
END_MARK="// ==/UserScript=="

awk -v begin="$BEGIN_MARK" -v end="$END_MARK" '
    $0 == begin { found = 1 }
    found { print }
    $0 == end { exit }
' "$USER_JS" > "$META_JS"

echo "[Done] $USER_JS -> $META_JS"