# PixivParse
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

English | [简体中文](README.zh.md) | [日本語](README.ja.md)

## Introduction
PixivParse is a lightweight **Tampermonkey userscript** that parses and downloads Pixiv artworks in original quality. It injects a floating button on any Pixiv artwork page and provides:

- **Original image download** — fetches `original` URLs with a spoofed `Referer` to bypass hot-link protection
- **Batch download** — download all images of a multi-page artwork at once
- **One-click ZIP packaging** — streams all images into a ZIP archive using [fflate](https://github.com/101arrowz/fflate), with no extra server required
- **Multilingual UI** — Chinese / English / Japanese with automatic detection and manual switching
- **Dark / light theme** — follow system, dark, or light

## Project Structure
- `PixivParse.user.js`: The complete userscript (installation file)
- `PixivParse.meta.js`: Metadata stub (used by `@updateURL` for auto-updates)
- `LICENSE`: Apache License 2.0 text
- `NOTICE`: Attribution notices
- `licenses/LICENSE-fflate.txt`: fflate MIT license
- `FastUpdate.sh` / `FastUpdate.ps1`: maintenance scripts that extract the UserScript metadata block from `PixivParse.user.js` to regenerate `PixivParse.meta.js` (Bash and PowerShell variants producing identical bytes)
- `.gitattributes`: pins LF line endings so a CRLF working copy cannot make those scripts misbehave

## Quick Start

### Prerequisites
- A browser with userscript support: **Chrome / Edge / Firefox / Safari / Opera**, with Tampermonkey installed
- Log in to [pixiv.net](https://www.pixiv.net/) in the same browser

### Installation
1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension.
2. Open the raw script from this repository:
   - `https://raw.githubusercontent.com/Harry20120330/PixivParse/main/PixivParse.user.js`
3. Click **Install** on the script's install page.
4. Visit any Pixiv artwork page, e.g. `https://www.pixiv.net/artworks/XXXX`.

### Usage
1. A floating **Parse** button appears on the right edge of the page.
2. Click it to open the artwork gallery panel:
   - **One-click ZIP download (N images)** — downloads all images into a single ZIP file (fetched one at a time, stored without compression).
   - **Download all (N images)** — triggers individual file saves one by one (the browser may ask for permission to save multiple files).
   - **Download image N** — save a single image.
   - **Copy title** — copy the artwork title to clipboard.
3. Use the top bar switchers to pick a theme (🌗 system / 🌙 dark / ☀️ light) and a UI language (🌐). Both choices are remembered permanently; changing the theme does not re-render the panel or change its scroll position.

## Notes
- **Login required.** The script uses Pixiv's `ajax` endpoints with the browser's session cookie; you must be logged in to pixiv.net for image access.
- **ZIP packaging and memory.** The fflate library loads from CDN on demand; if the CDN is unreachable, ZIP packaging will be unavailable (individual downloads still work). Images are fetched one at a time and compression is streamed, but the **finished ZIP is held entirely in memory**, so peak usage is roughly the combined size of all original images (entries are stored, not compressed). For very large galleries — say hundreds of full-size PNGs — this can consume a lot of memory or even crash the tab; use "Download all" instead in that case.
- **Request throttling.** ZIP packing fetches images one at a time, so only a single request is ever in flight; "Download all" staggers its saves at 300 ms intervals. Even so, please avoid repeatedly re-parsing or pulling large batches, so as not to put pressure on Pixiv.
- **No server.** Everything runs in the browser. No accounts, keys, or backends required.
- **Static images only.** Animated artworks (ugoira) cannot be parsed; the panel clearly explains why. Static illustrations and multi-page manga are both supported.
- **Filename sanitizing.** The artwork title is used for download filenames and the ZIP's inner folder name, so characters that are illegal in filenames (`\` `/` `:` `*` `?` `"` `<` `>` `|`) and control characters are replaced with underscores, leading/trailing dots and spaces are stripped, over-long titles are truncated to 120 bytes on a character boundary, and reserved Windows device names such as `CON` and `NUL` get a suffix. This prevents silently failed downloads and ZIP entries that would extract outside the target folder when a title is `..`.

## Troubleshooting
- **Parse button doesn't appear:** confirm the page URL matches `https://www.pixiv.net/artworks/*` and the userscript is enabled.
- **Images fail to load:** verify you are logged in and that `pixiv.net` is reachable in the same browser profile.
- **ZIP packaging fails with `fflate missing`:** the CDN `@require` failed — check network or reload the page.
- **Auto-update not working:** `@updateURL` points to `PixivParse.meta.js`; make sure the script was installed from the raw URL above.

## Roadmap
- Support more artwork types (e.g. ugoira / animated illustrations)
- Add PDF export
- Reduce memory usage for ZIP packaging
- Support Pixiv Novel parsing

## License
This project is licensed under the **Apache License, Version 2.0**.

See the [LICENSE](LICENSE) file for the full license text.
For additional attribution notices, please see the [NOTICE](NOTICE) file.
