# PixivParse
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

English | [简体中文](README.zh.md) | [日本語](README.ja.md)

## Introduction
PixivParse is a lightweight **Tampermonkey userscript** that parses and downloads Pixiv artworks in original quality. It works by injecting a floating button on any Pixiv artwork page, and provides:

- **Original image download** — all three paths (single, batch, ZIP) fetch `original` URLs through `GM_xmlhttpRequest` with a `Referer` header, bypassing hot-link protection
- **Batch download** — images are fetched and saved one at a time, with a progress indicator and a success/failure count
- **One-click ZIP packaging** — streams all images into a ZIP archive using [fflate](https://github.com/101arrowz/fflate), with no extra server required
- **One unified panel** — single-page and multi-page artworks share the same layout, with buttons in three tiers of prominence
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
2. Click it to open the artwork gallery panel. An **action zone** sits at a fixed position above the thumbnails. Its buttons come in three tiers; the zone never moves or disappears, only *which action is primary* changes with the image count:

   | Tier | Look | Multi-page (N > 1) | Single page (N = 1) |
   |---|---|---|---|
   | Primary | accent-filled, heavier weight | Pack as ZIP (N images) | Download original |
   | Secondary | accent outline | Download all (N images) | Pack as ZIP |
   | Per-item | neutral, under each thumbnail | Download image N | not rendered (the primary already does this) |

   - **Pack as ZIP** — downloads all images into a single ZIP file (fetched one at a time, stored without compression).
   - **Download all** — fetches and saves images sequentially, showing `Downloading i/N` along the way and reporting how many succeeded or failed.
   - **Download image N** — save a single image.
   - **Copy title** — copy the artwork title to clipboard.

   > A single-page artwork deliberately gets **no** "Download all" button: it would call the exact same function with the exact same arguments as "Download image 1", and two identical controls doing the identical thing only makes people wonder which one is correct.
3. Use the top bar switchers to pick a theme (🌗 system / 🌙 dark / ☀️ light) and a UI language (🌐). Both choices are remembered across visits, and changing the theme does not rebuild the panel or reset its scroll position.

## Notes
- **Login required.** The script uses Pixiv's `ajax` endpoints with the browser's session cookie; you must be logged in to pixiv.net for image access.
- **ZIP packaging and memory.** The fflate library loads from CDN on demand; if the CDN is unreachable, ZIP packaging will be unavailable (individual downloads still work). Images are fetched one at a time and compression is streamed, but the **finished ZIP is held entirely in memory**, so peak usage is roughly the combined size of all original images (entries are stored, not compressed). For very large galleries — say hundreds of full-size PNGs — this can consume a lot of memory or even crash the tab; use "Download all" instead in that case.
- **Request throttling.** Both ZIP packing and "Download all" fetch images **one at a time**, so only a single request is ever in flight. As of 1.1.2, "Download all" awaits each image sequentially instead of staggering saves at 300 ms: every image is now pulled into a Blob before the browser writes it, so firing them concurrently would keep several large images resident in memory at once and was more likely to trip the browser's multiple-download prompt. Even so, please avoid repeatedly re-parsing or pulling large batches, so as not to put pressure on Pixiv.
- **No more silent failures.** Every download now reports its outcome — success, fallback, or failure. Failures name the cause (HTTP status / timeout / network error) on screen, with full details in the console.
- **No server.** Everything runs in the browser. No accounts, keys, or backends required.
- **Static images only.** Animated artworks (ugoira) cannot be parsed; the panel states this explicitly instead of showing an empty gallery. Static illustrations and multi-page manga are both supported.
- **Filename sanitizing.** The artwork title is used for download filenames and the ZIP's inner folder name, so characters that are illegal in filenames (`\` `/` `:` `*` `?` `"` `<` `>` `|`) and control characters are replaced with underscores, leading/trailing dots and spaces are stripped, over-long titles are truncated to 120 bytes on a character boundary, and reserved Windows device names (`CON`, `NUL`, ...) get a suffix. This prevents silently failed downloads and ZIP entries that would extract outside the target folder when a title is something like `..`.

## Configuration
These constants near the top of the script are meant to be edited; reload the script in Tampermonkey afterwards:

| Constant | Default | What it does |
|---|---|---|
| `SHOW_ZIP_FOR_SINGLE` | `true` | Whether single-page artworks offer "Pack as ZIP". The archive uses a `title/001.jpg` layout, which is handy if you file downloads by artwork; set to `false` if the extra folder is unwanted |
| `FILENAME_MAX_BYTES` | `120` | Filename byte cap, leaving headroom for the `_000.png` / `.zip` suffixes |
| `METADATA_TIMEOUT_MS` | `20000` | Timeout for the metadata endpoints, in ms |
| `CUSTOM_HEADERS` | `Referer: https://www.pixiv.net/` | The header that defeats hot-link protection; normally left alone |

The three button tiers are defined by `BTN_VARIANTS`, and their colours come from the `--pp-primary-*` / `--pp-secondary-*` variables in each theme palette — change those two places to restyle.

## Troubleshooting
- **Clicking "Download image" does nothing (v1.1.0 and earlier):** the old single-image path called `GM_download`, which delegates to the browser's download API and has **no way to attach custom request headers**. `i.pximg.net` answers every request lacking a `Referer` with 403, so the download died server-side while Tampermonkey neither called back nor raised an error — the button just appeared inert. Single-page artworks were hit hardest, because in that case neither the ZIP nor the "Download all" button renders, leaving the broken one as the panel's only option. Fixed in 1.1.1 by fetching the bytes through `GM_xmlhttpRequest` with the `Referer` set (the same path the ZIP packer uses); please upgrade.
- **A failure toast with a status code:** the panel now reports why. A 403 usually means the session expired — log in to pixiv.net again. A timeout means check the connection.
- **Parse button doesn't appear:** confirm the page URL matches `https://www.pixiv.net/artworks/*` and the userscript is enabled.
- **Images fail to load:** verify you are logged in and that `pixiv.net` is reachable in the same browser profile.
- **ZIP packaging fails with `fflate missing`:** the CDN `@require` failed — check network or reload the page.
- **Auto-update not working:** `@updateURL` points to `PixivParse.meta.js`; make sure the script was installed from the raw URL above.

## Roadmap
- Support more artwork types (e.g. ugoira / animated illustrations)
- Add PDF export
- Reduce memory usage for ZIP packaging
- Support Pixiv Novel parsing
- Reading mode

## License
This project is licensed under the **Apache License, Version 2.0**.

See the [LICENSE](LICENSE) file for the full license text.
For additional attribution notices, please see the [NOTICE](NOTICE) file.
