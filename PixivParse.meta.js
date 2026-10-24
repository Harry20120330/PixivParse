// ==UserScript==
// @name         PixivParse
// @namespace    https://github.com/Harry20120330/PixivParse
// @version      2.0.0
// @description  Parse and download Pixiv artworks (original images / batch ZIP / ugoira ZIP+JSON / MP4 / GIF).
// @author       Harry20120330
// @match        https://www.pixiv.net/artworks/*
// @match        https://www.pixiv.net/*/artworks/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      pximg.net
// @connect      i.pximg.net
// @run-at       document-start
// @license      Apache License 2.0
// @license      MIT; includes fflate v0.8.2 (Copyright (c) 2026 Arjun Barrett)
// @license      MIT; includes gifenc v1.0.3, inlined (Copyright (c) 2017 Matt DesLauriers)
// @license      MIT; includes mp4-muxer v5.2.2 (Copyright (c) 2024 Vanilagy)
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js
// @require      https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.min.js
// @downloadURL  https://raw.githubusercontent.com/Harry20120330/PixivParse/main/PixivParse.user.js
// @updateURL    https://raw.githubusercontent.com/Harry20120330/PixivParse/main/PixivParse.meta.js
// @supportURL   https://github.com/Harry20120330/PixivParse/issues
// ==/UserScript==
