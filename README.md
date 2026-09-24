# PixivParse
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

English | [简体中文](README.zh.md) | [日本語](README.ja.md)

## Introduction
PixivParse is a lightweight **Tampermonkey/Greasemonkey userscript** that parses and downloads Pixiv artworks in original quality. It works by injecting a floating button on any Pixiv artwork page, and provides:

- **Original image download** — fetches `original` URLs with a spoofed `Referer` to bypass hot-link protection
- **Batch download** — download all images of a multi-page artwork at once
- **One-click ZIP packaging** — streams all images into a ZIP archive using [fflate](https://github.com/101arrowz/fflate), with no extra server required
- **Multilingual UI** — Chinese / English / Japanese with automatic detection and manual switching

## Project Structure
- `PixivParse.user.js`: The complete userscript (installation file)
- `PixivParse.meta.js`: Metadata stub (used by `@updateURL` for auto-updates)
- `LICENSE`: Apache License 2.0 text
- `NOTICE`: Attribution notices
- `lincenses/LICENSE-fflate.txt`: fflate MIT license

## Quick Start

### Prerequisites
- A browser with userscript support: **Chrome / Edge** (Tampermonkey) or **Firefox** (Greasemonkey)
- Log in to [pixiv.net](https://www.pixiv.net/) in the same browser

### Installation
1. Install the [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://add0n.mozilla.org/addons/greasemonkey/) extension.
2. Open the raw script from this repository:
   - `https://raw.githubusercontent.com/Harry20120330/PixivParse/main/PixivParse.user.js`
3. Click **Install** on the script's install page.
4. Visit any Pixiv artwork page, e.g. `https://www.pixiv.net/artworks/XXXX`.

### Usage
1. A floating **Parse** button appears on the right edge of the page.
2. Click it to open the artwork gallery panel:
   - **Pack as ZIP** — downloads all images into a single ZIP file (streaming, low memory footprint).
   - **Download all** — triggers individual file saves one by one (browser may prompt for multiple saves).
   - **Download image N** — save a single image.
   - **Copy title** — copy the artwork title to clipboard.
3. Use the language switcher (🌐) in the top bar to change UI language; your choice is remembered.

## Notes
- **Login required.** The script uses Pixiv's `ajax` endpoints with the browser's session cookie; you must be logged in to pixiv.net for image access.
- **ZIP streaming.** The fflate library loads from CDN on demand; if the CDN is unreachable, ZIP packaging will be unavailable (individual downloads still work).
- **Rate limiting.** Batch downloads trigger many parallel requests; be gentle and avoid hammering Pixiv.
- **No server.** Everything runs in the browser. No accounts, keys, or backends required.

## Troubleshooting
- **Parse button doesn't appear:** confirm the page URL matches `https://www.pixiv.net/artworks/*` and the userscript is enabled.
- **Images fail to load:** verify you are logged in and that `pixiv.net` is reachable in the same browser profile.
- **ZIP packaging fails with `fflate missing`:** the CDN `@require` failed — check network or reload the page.
- **Auto-update not working:** `@updateURL` points to `PixivParse.meta.js`; make sure the script was installed from the raw URL above.

## License
This project is licensed under the **Apache License, Version 2.0**.

See the [LICENSE](LICENSE) file for the full license text.
For additional attribution notices, please see the [NOTICE](NOTICE) file.
