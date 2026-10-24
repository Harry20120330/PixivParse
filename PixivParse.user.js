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

(function() {
    'use strict';

    // ========================================
    // Multilingual UI strings (Chinese/English/Japanese)
    // Organize all user-facing text and dynamic messages here
    // ========================================
    const I18N = {
        zh: {
            parse: "解析",
            close: "关闭",
            loading: "正在解析作品...",
            title: "作品图集",
            copyTitle: "复制标题",
            copied: "已复制",
            copyFailed: "复制失败",

            theme: "主题",
            themeSystem: "跟随系统",
            themeDark: "深色",
            themeLight: "浅色",

            packZip: (n) => `一键打包下载 (${n}张 ZIP)`,
            downloadAll: (n) => `一键下载全部 (${n}张)`,
            downloadOriginal: "下载原图",
            packZipSingle: "打包为 ZIP",
            downloadImage: (n) => `下载图片 ${n}`,
            batchTip: "开始批量下载，请允许浏览器多次保存",

            downloadingSingle: "正在下载...",
            dlStarted: (name) => `已开始下载：${name}`,
            dlFailed: (msg) => `下载失败：${msg}`,
            dlFallback: "原图拉取失败，已退回浏览器下载（可能被防盗链拒绝）",
            batchDone: (n) => `下载完成：${n} 张`,
            batchDoneWithFailed: (ok, failed) => `下载完成：成功 ${ok} 张，失败 ${failed} 张`,

            preparing: "准备打包...",
            downloading: (i, total) => `下载中 ${i}/${total}...`,
            zipping: "正在生成 ZIP...",
            zipStarted: "ZIP 下载已开始",
            zipStartedWithFailed: (n) => `ZIP 下载已开始（${n} 张失败已跳过）`,
            allFailed: "所有图片下载失败",
            zipFailed: (msg) => `打包失败：${msg}`,
            fflateMissing: "fflate 库未加载，请检查网络或重装脚本",

            parseFailed: (msg) => `解析失败：${msg}`,
            requestTimeout: "请求超时，请检查网络后重试",
            networkError: "网络连接失败，请检查网络后重试",
            httpError: (code) => `服务器返回 ${code}（可能需要重新登录，或已触发访问限制）`,
            badResponse: "服务器返回了无法解析的内容，请稍后重试",
            emptyResponse: "服务器返回了空内容，请稍后重试",
            notArtwork: "非作品页面",
            noInfo: "无法获取作品信息",
            noImages: "无法获取图片列表",
            ugoiraIncompleteData: "动图数据不完整：未能获取到帧数据，无法导出。",
            noDownloadableImages: "未能从该作品获取到可下载的图片。",

            ugoiraInfo: (n, sec, mime) => `动图 · 共 ${n} 帧 · 约 ${sec} 秒 · ${mime === "image/png" ? "PNG 无损帧" : mime === "image/gif" ? "GIF 帧" : "JPEG 真彩帧"}`,
            ugoiraZip: "下载 ZIP（图片 + 帧数据）",
            ugoiraMp4: "转换为 MP4",
            ugoiraGif: "转换为 GIF",
            ugoiraMp4Note: "当前浏览器不支持 MP4 编码（需 Chrome/Edge 94+、Firefox 130+ 或 Safari 16.4+），已隐藏该选项",
            ugoiraPreviewLoading: "动画预览加载中...",
            ugoiraPreviewFailed: "预览加载失败，但不影响下载功能",
            ugoiraFetchingZip: "正在拉取动画 ZIP...",
            ugoiraUnpacking: "正在解包帧图...",
            ugoiraPacking: "正在重新打包...",
            ugoiraZipStarted: "ZIP 下载已开始（含 animation.json）",
            ugEncoding: (i, total) => `编码中 ${i}/${total}...`,
            mp4Started: "MP4 下载已开始",
            gifStarted: "GIF 下载已开始",
            mp4EncoderMissing: "浏览器缺少 VideoEncoder，无法转换 MP4",
            mp4MuxerMissing: "mp4-muxer 库未加载，请检查网络或刷新页面",
            gifEncMissing: "GIF 编码模块初始化失败",
            convertFailed: (msg) => `转换失败：${msg}`,
            ugoiraEmptyZip: "动画 ZIP 为空或下载失败",
            ugoiraNoFramesInZip: "动画 ZIP 中未找到帧图",
        },
        en: {
            parse: "Parse",
            close: "Close",
            loading: "Parsing artwork...",
            title: "Artwork Gallery",
            copyTitle: "Copy title",
            copied: "Copied",
            copyFailed: "Copy failed",

            theme: "Theme",
            themeSystem: "System",
            themeDark: "Dark",
            themeLight: "Light",

            packZip: (n) => `Pack as ZIP (${n} images)`,
            downloadAll: (n) => `Download all (${n} images)`,
            downloadOriginal: "Download original",
            packZipSingle: "Pack as ZIP",
            downloadImage: (n) => `Download image ${n}`,
            batchTip: "Batch download starting. Please allow multiple saves.",

            downloadingSingle: "Downloading...",
            dlStarted: (name) => `Download started: ${name}`,
            dlFailed: (msg) => `Download failed: ${msg}`,
            dlFallback: "Original fetch failed; fell back to a browser download (may be blocked by hotlink protection)",
            batchDone: (n) => `Done: ${n} image(s) downloaded`,
            batchDoneWithFailed: (ok, failed) => `Done: ${ok} succeeded, ${failed} failed`,

            preparing: "Preparing...",
            downloading: (i, total) => `Downloading ${i}/${total}...`,
            zipping: "Generating ZIP...",
            zipStarted: "ZIP download started",
            zipStartedWithFailed: (n) => `ZIP download started (${n} failed, skipped)`,
            allFailed: "All downloads failed",
            zipFailed: (msg) => `Pack failed: ${msg}`,
            fflateMissing: "fflate not loaded. Check network or reinstall.",

            parseFailed: (msg) => `Parse failed: ${msg}`,
            requestTimeout: "The request timed out. Check your connection and try again.",
            networkError: "The network request failed. Check your connection and try again.",
            httpError: (code) => `Server returned ${code} (you may need to log in again, or access is rate-limited)`,
            badResponse: "Server returned an unparseable response. Please try again later.",
            emptyResponse: "Server returned an empty response. Please try again later.",
            notArtwork: "Not an artwork page",
            noInfo: "Failed to fetch artwork info",
            noImages: "Failed to fetch image list",
            ugoiraIncompleteData: "Incomplete ugoira data: no frame data was returned, so it cannot be exported.",
            noDownloadableImages: "No downloadable images were returned for this artwork.",

            ugoiraInfo: (n, sec, mime) => `Animated · ${n} frames · ~${sec}s · ${mime === "image/png" ? "PNG lossless frames" : mime === "image/gif" ? "GIF frames" : "JPEG truecolor frames"}`,
            ugoiraZip: "Download ZIP (frames + timing)",
            ugoiraMp4: "Convert to MP4",
            ugoiraGif: "Convert to GIF",
            ugoiraMp4Note: "MP4 encoding is unavailable in this browser (needs Chrome/Edge 94+, Firefox 130+, or Safari 16.4+); the option is hidden",
            ugoiraPreviewLoading: "Loading animation preview...",
            ugoiraPreviewFailed: "Preview failed to load; downloads below still work",
            ugoiraFetchingZip: "Fetching animation ZIP...",
            ugoiraUnpacking: "Unpacking frames...",
            ugoiraPacking: "Repacking ZIP...",
            ugoiraZipStarted: "ZIP download started (includes animation.json)",
            ugEncoding: (i, total) => `Encoding ${i}/${total}...`,
            mp4Started: "MP4 download started",
            gifStarted: "GIF download started",
            mp4EncoderMissing: "VideoEncoder is unavailable; MP4 conversion is not possible",
            mp4MuxerMissing: "mp4-muxer not loaded. Check network or reload the page.",
            gifEncMissing: "GIF encoder module failed to initialize",
            convertFailed: (msg) => `Conversion failed: ${msg}`,
            ugoiraEmptyZip: "Ugoira ZIP is empty or failed to download",
            ugoiraNoFramesInZip: "No frame images found in the ugoira ZIP",
        },
        ja: {
            parse: "解析",
            close: "閉じる",
            loading: "作品を解析中...",
            title: "作品ギャラリー",
            copyTitle: "タイトルをコピー",
            copied: "コピーしました",
            copyFailed: "コピー失敗",

            theme: "テーマ",
            themeSystem: "システムに従う",
            themeDark: "ダーク",
            themeLight: "ライト",

            packZip: (n) => `ZIPで一括ダウンロード (${n}枚)`,
            downloadAll: (n) => `全てダウンロード (${n}枚)`,
            downloadOriginal: "原画をダウンロード",
            packZipSingle: "ZIPにする",
            downloadImage: (n) => `画像 ${n} をダウンロード`,
            batchTip: "一括ダウンロードを開始します。複数回の保存を許可してください。",

            downloadingSingle: "ダウンロード中...",
            dlStarted: (name) => `ダウンロード開始：${name}`,
            dlFailed: (msg) => `ダウンロード失敗：${msg}`,
            dlFallback: "原画の取得に失敗したため、ブラウザのダウンロードに切り替えました（直リンク防止で拒否される可能性あり）",
            batchDone: (n) => `完了：${n} 枚をダウンロード`,
            batchDoneWithFailed: (ok, failed) => `完了：成功 ${ok} 枚、失敗 ${failed} 枚`,

            preparing: "準備中...",
            downloading: (i, total) => `ダウンロード中 ${i}/${total}...`,
            zipping: "ZIPを生成中...",
            zipStarted: "ZIPダウンロード開始",
            zipStartedWithFailed: (n) => `ZIPダウンロード開始（${n}枚失敗、スキップ）`,
            allFailed: "全てのダウンロードが失敗しました",
            zipFailed: (msg) => `パック失敗：${msg}`,
            fflateMissing: "fflateが読み込まれていません",

            parseFailed: (msg) => `解析失敗：${msg}`,
            requestTimeout: "リクエストがタイムアウトしました。ネットワークを確認して再試行してください。",
            networkError: "ネットワークリクエストに失敗しました。ネットワークを確認して再試行してください。",
            httpError: (code) => `サーバーが ${code} を返しました（再ログインが必要か、アクセス制限の可能性があります）`,
            badResponse: "サーバーが解析できない応答を返しました。しばらくしてから再試行してください。",
            emptyResponse: "サーバーが空の応答を返しました。しばらくしてから再試行してください。",
            notArtwork: "作品ページではありません",
            noInfo: "作品情報の取得に失敗",
            noImages: "画像リストの取得に失敗",
            ugoiraIncompleteData: "うごイラデータが不完全です：フレーム情報を取得できなかったため書き出せません。",
            noDownloadableImages: "この作品からダウンロード可能な画像を取得できませんでした。",

            ugoiraInfo: (n, sec, mime) => `うごイラ · 全${n}コマ · 約${sec}秒 · ${mime === "image/png" ? "PNG ロスレス" : mime === "image/gif" ? "GIF フレーム" : "JPEG フルカラー"}`,
            ugoiraZip: "ZIPをダウンロード（画像+コマデータ）",
            ugoiraMp4: "MP4に変換",
            ugoiraGif: "GIFに変換",
            ugoiraMp4Note: "このブラウザはMP4エンコードに対応していません（Chrome/Edge 94+、Firefox 130+、Safari 16.4+ が必要）",
            ugoiraPreviewLoading: "アニメーションプレビューを読み込み中...",
            ugoiraPreviewFailed: "プレビューの読み込みに失敗しました（ダウンロードには影響ありません）",
            ugoiraFetchingZip: "うごイラZIPを取得中...",
            ugoiraUnpacking: "コマ画像を展開中...",
            ugoiraPacking: "ZIPを再パック中...",
            ugoiraZipStarted: "ZIPダウンロード開始（animation.json 含む）",
            ugEncoding: (i, total) => `エンコード中 ${i}/${total}...`,
            mp4Started: "MP4ダウンロード開始",
            gifStarted: "GIFダウンロード開始",
            mp4EncoderMissing: "VideoEncoder がないためMP4に変換できません",
            mp4MuxerMissing: "mp4-muxer が読み込まれていません。ネットワークを確認するかページを再読み込みしてください。",
            gifEncMissing: "GIFエンコーダの初期化に失敗しました",
            convertFailed: (msg) => `変換失敗：${msg}`,
            ugoiraEmptyZip: "うごイラZIPが空か、ダウンロードに失敗しました",
            ugoiraNoFramesInZip: "うごイラZIPにフレーム画像が見つかりません",
        },
    };

    const LANG_META = {
        zh: { short: "中", native: "中文" },
        en: { short: "EN", native: "English" },
        ja: { short: "日", native: "日本語" },
    };
    const LANG_ORDER = ["zh", "en", "ja"];

    // ========================================
    // Auto-detect user language based on browser settings or saved preference
    // Fallback order: saved preference → browser language → English
    // ========================================
    function detectLang() {
        try {
            const saved = (typeof GM_getValue === 'function')
                ? GM_getValue("pixiv_lang", null)
                : null;
            // hasOwnProperty, not a truthiness test: I18N["constructor"] and
            // I18N["toString"] are inherited and truthy, which would set LANG to
            // a bogus key and blank out every label in the UI.
            if (saved && Object.prototype.hasOwnProperty.call(I18N, saved)) return saved;
        } catch (e) { /* ignore */ }

        const codes = (navigator.languages && navigator.languages.length)
            ? navigator.languages
            : [navigator.language || "en"];
        for (const code of codes) {
            const c = code.toLowerCase();
            if (c.startsWith("zh")) return "zh";
            if (c.startsWith("ja")) return "ja";
        }
        return "en";
    }

    let LANG = detectLang();
    let T = I18N[LANG] || I18N.en;
    let activeData = null;

    // Live ugoira canvas preview players; closeResultPage() destroys them so
    // their setTimeout loops and decoded ImageBitmaps never outlive the panel.
    let activeUgoiraPlayers = [];
    // Shared re-entrancy guard for the three ugoira export pipelines
    // (ZIP repack / GIF encode / MP4 encode). Mirrors `packing` / `batching`.
    let converting = false;

    function setLang(newLang) {
        if (!Object.prototype.hasOwnProperty.call(I18N, newLang)) return;
        LANG = newLang;
        T = I18N[newLang];
        try {
            if (typeof GM_setValue === 'function') GM_setValue("pixiv_lang", newLang);
        } catch (e) { /* ignore */ }

        const fb = document.getElementById("pixivParseFloatBtn");
        if (fb) fb.textContent = T.parse;
    }

    // ========================================
    // Theme management (system / dark / light)
    // Preference is persisted in Tampermonkey storage (GM_setValue),
    // and applied by toggling data-pp-theme on <html> so every UI element
    // picks up the new CSS variables instantly without a re-render.
    // ========================================
    const THEME_STORAGE_KEY = "pixiv_theme";
    const THEME_ORDER = ["system", "dark", "light"];
    const THEME_META = {
        system: { icon: "🌗", labelKey: "themeSystem" },
        dark:   { icon: "🌙", labelKey: "themeDark" },
        light:  { icon: "☀️", labelKey: "themeLight" },
    };

    // Media query tracking the OS/browser color scheme (used by "system" mode)
    const darkMQ = (typeof window.matchMedia === 'function')
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    function detectTheme() {
        try {
            const saved = (typeof GM_getValue === 'function')
                ? GM_getValue(THEME_STORAGE_KEY, null)
                : null;
            if (saved && Object.prototype.hasOwnProperty.call(THEME_META, saved)) return saved;
        } catch (e) { /* ignore */ }
        return "system";
    }

    let THEME_MODE = detectTheme();

    // Resolve the configured mode into the concrete palette to use
    function resolveTheme(mode) {
        if (mode === "dark") return "dark";
        if (mode === "light") return "light";
        // "system": follow the OS scheme. If it cannot be queried at all, keep
        // the historical dark look rather than silently flipping to light.
        if (!darkMQ) return "dark";
        return darkMQ.matches ? "dark" : "light";
    }

    // Write the resolved palette onto <html>; CSS variables cascade to all UI
    function applyTheme() {
        const resolved = resolveTheme(THEME_MODE);
        const root = document.documentElement;
        if (root) root.setAttribute("data-pp-theme", resolved);

        // Keep the switcher button icon in sync (panel may already be open)
        document.querySelectorAll(".pixiv-dd-btn[data-role='theme']").forEach(btn => {
            const icon = btn.querySelector("[data-role='icon']");
            if (icon) icon.textContent = THEME_META[THEME_MODE].icon;
            btn.title = `${T.theme}: ${T[THEME_META[THEME_MODE].labelKey]}`;
        });
    }

    function setTheme(newMode) {
        if (!Object.prototype.hasOwnProperty.call(THEME_META, newMode)) return;
        THEME_MODE = newMode;
        try {
            if (typeof GM_setValue === 'function') GM_setValue(THEME_STORAGE_KEY, newMode);
        } catch (e) { /* ignore */ }
        applyTheme();
    }

    // Follow live OS theme changes while in "system" mode
    if (darkMQ) {
        const onSchemeChange = () => { if (THEME_MODE === "system") applyTheme(); };
        if (typeof darkMQ.addEventListener === 'function') {
            darkMQ.addEventListener('change', onSchemeChange);
        } else if (typeof darkMQ.addListener === 'function') {
            darkMQ.addListener(onSchemeChange); // legacy Safari
        }
    }

    // ========================================
    // Inject CSS for UI components (dropdowns, modals, buttons)
    // Both palettes are exposed as CSS custom properties on <html>, so
    // switching dark/light only flips the data-pp-theme attribute and every
    // element (including already-rendered ones) updates instantly.
    // Glassmorphism styling kept for the macOS-like appearance.
    // ========================================
    function injectStyles() {
        applyTheme(); // set data-pp-theme before any element is styled
        if (document.getElementById("pixivParseStyles")) return;
        const style = document.createElement("style");
        style.id = "pixivParseStyles";
        style.textContent = `
            /* ---- Dark palette (default; identical to the previous look) ---- */
            :root, :root[data-pp-theme="dark"] {
                --pp-bg: #1c1c1e;
                --pp-card: #252527;
                --pp-text: #e5e5e7;
                --pp-text-sub: #8e8e93;
                --pp-btn-bg: #252527;
                --pp-btn-text: #ffffff;
                --pp-accent: #0096fa;
                /* Primary CTA: accent-filled. Contrast on #0096fa is 3.02:1 with
                   white, so it carries 16px/600 text only (AA Large), never the
                   13-14px labels used elsewhere. */
                --pp-primary-bg: #0096fa;
                --pp-primary-text: #ffffff;
                --pp-primary-glow: 0 2px 10px rgba(0,150,250,0.35), inset 0 0 6px rgba(255,255,255,0.18);
                --pp-primary-glow-pressed: 0 1px 4px rgba(0,150,250,0.28), inset 0 0 3px rgba(255,255,255,0.12);
                /* Secondary CTA: accent outline on the card surface. */
                --pp-secondary-text: #4ab8ff;
                --pp-secondary-border: rgba(0,150,250,0.45);
                --pp-secondary-glow: inset 0 0 0 1px rgba(0,150,250,0.45);
                --pp-secondary-glow-pressed: inset 0 0 0 1px rgba(0,150,250,0.6), inset 0 0 8px rgba(0,150,250,0.12);
                --pp-glow: inset 0 0 6px rgba(255,255,255,0.1);
                --pp-glow-pressed: inset 0 0 3px rgba(255,255,255,0.06);
                --pp-float-glow: inset 0 0 6px rgba(255,255,255,0.1);
                --pp-float-glow-pressed: inset 0 0 3px rgba(255,255,255,0.06);
                --pp-menu-bg: rgba(37,37,39,0.95);
                --pp-menu-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
                --pp-item-hover: rgba(255,255,255,0.06);
                --pp-border: rgba(255,255,255,0.05);
                --pp-avatar-border: rgba(255,255,255,0.15);
            }

            /* ---- Light palette ---- */
            :root[data-pp-theme="light"] {
                --pp-bg: #f2f2f7;
                --pp-card: #ffffff;
                --pp-text: #1c1c1e;
                --pp-text-sub: #6e6e73;
                --pp-btn-bg: #ffffff;
                --pp-btn-text: #1c1c1e;
                --pp-accent: #0066cc;  /* 5.57:1 on white — AA for the 14px active item label */
                /* Primary CTA uses the darker accent so white text clears AA
                   Large (#0066cc on white = 5.57:1, white on #0066cc = 5.57:1). */
                --pp-primary-bg: #0066cc;
                --pp-primary-text: #ffffff;
                --pp-primary-glow: 0 2px 10px rgba(0,102,204,0.28), inset 0 0 0 1px rgba(0,0,0,0.06);
                --pp-primary-glow-pressed: 0 1px 4px rgba(0,102,204,0.22), inset 0 0 0 1px rgba(0,0,0,0.08);
                --pp-secondary-text: #0066cc;
                --pp-secondary-border: rgba(0,102,204,0.40);
                --pp-secondary-glow: inset 0 0 0 1px rgba(0,102,204,0.40);
                --pp-secondary-glow-pressed: inset 0 0 0 1px rgba(0,102,204,0.6), inset 0 0 8px rgba(0,102,204,0.10);
                --pp-glow: 0 1px 2px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.12);
                --pp-glow-pressed: 0 0 1px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.14);
                /* The floating button sits on Pixiv's own (white) page, so it
                   needs a real drop shadow to stay visible in light mode. */
                --pp-float-glow: 0 2px 12px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(0,0,0,0.12);
                --pp-float-glow-pressed: 0 1px 4px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.14);
                --pp-menu-bg: rgba(255,255,255,0.95);
                --pp-menu-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08);
                --pp-item-hover: rgba(0,0,0,0.05);
                --pp-border: rgba(0,0,0,0.08);
                --pp-avatar-border: rgba(0,0,0,0.10);
            }

            .pixiv-dd-wrap { position: relative; }

            .pixiv-dd-btn {
                display: inline-flex; align-items: center; gap: 6px;
                background: var(--pp-btn-bg); color: var(--pp-btn-text);
                border: none; outline: none;
                border-radius: 14px; padding: 8px 12px;
                font-size: 13px; font-weight: 500; font-family: inherit;
                flex-shrink: 0;
                box-shadow: var(--pp-glow);
                cursor: pointer;
                transition: box-shadow 0.15s, transform 0.15s,
                            background 0.2s ease, color 0.2s ease;
                -webkit-tap-highlight-color: transparent;
            }
            .pixiv-dd-btn:hover { transform: translateY(-1px); }
            .pixiv-dd-btn:active {
                box-shadow: var(--pp-glow-pressed);
                transform: scale(0.98);
            }

            .pixiv-dd-menu {
                position: absolute; top: calc(100% + 8px); right: 0;
                min-width: 150px;
                background: var(--pp-menu-bg);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-radius: 14px;
                box-shadow: var(--pp-menu-shadow);
                padding: 6px;
                opacity: 0;
                transform: translateY(-6px) scale(0.96);
                transform-origin: top right;
                pointer-events: none;
                transition: opacity 0.18s ease, transform 0.18s ease;
                z-index: 1000;
            }
            .pixiv-dd-menu.open {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }

            .pixiv-dd-item {
                display: flex; align-items: center; justify-content: space-between;
                gap: 10px;
                padding: 8px 12px;
                border-radius: 10px;
                color: var(--pp-text);
                font-size: 14px;
                cursor: pointer;
                transition: background 0.12s, color 0.2s ease;
                user-select: none;
            }
            .pixiv-dd-item:hover { background: var(--pp-item-hover); }
            .pixiv-dd-item.active {
                color: var(--pp-accent);
                font-weight: 600;
            }
            .pixiv-dd-item .check {
                font-size: 13px;
                opacity: 0;
                transition: opacity 0.15s;
            }
            .pixiv-dd-item.active .check { opacity: 1; }
        `;
        const host = document.head || document.documentElement;
        if (!host) {
            // @run-at document-start: neither exists yet, retry once parsed
            document.addEventListener("DOMContentLoaded", () => injectStyles(), { once: true });
            return;
        }
        host.appendChild(style);
    }

    // ========================================
    // Color scheme, HTTP headers, and UI dimensions
    // Colors are CSS variable references resolved from the active palette
    // (see injectStyles); theme switching needs no re-render.
    // ========================================
    const CUSTOM_HEADERS = { 'Referer': 'https://www.pixiv.net/' };
    const GITHUB_URL = "https://github.com/Harry20120330/PixivParse/";

    const bgColor = "var(--pp-bg)";
    const cardColor = "var(--pp-card)";
    const textColor = "var(--pp-text)";
    const subTextColor = "var(--pp-text-sub)";
    const btnBgColor = "var(--pp-btn-bg)";
    const btnTextColor = "var(--pp-btn-text)";
    const innerGlow = "var(--pp-glow)";
    const innerGlowPressed = "var(--pp-glow-pressed)";
    const floatGlow = "var(--pp-float-glow)";
    const floatGlowPressed = "var(--pp-float-glow-pressed)";
    const accentColor = "var(--pp-accent)";
    const borderColor = "var(--pp-border)";
    const avatarBorderColor = "var(--pp-avatar-border)";

    // Button hierarchy. Every panel button used to share one flat style, so
    // "打包 ZIP", "下载全部" and "下载图片 N" all looked equally important and
    // --pp-accent was spent on an 8px badge. Three roles, driven by the
    // *semantics* of the action rather than by how many images there are:
    //   primary   — the one thing this panel is for (accent-filled)
    //   secondary — a legitimate alternative (accent outline)
    //   ghost     — per-item, repeats N times (the original neutral style)
    const BTN_VARIANTS = {
        primary: {
            bg: "var(--pp-primary-bg)", color: "var(--pp-primary-text)",
            glow: "var(--pp-primary-glow)", glowPressed: "var(--pp-primary-glow-pressed)",
            fontSize: "16px", fontWeight: "600", padding: "14px"
        },
        secondary: {
            bg: "transparent", color: "var(--pp-secondary-text)",
            glow: "var(--pp-secondary-glow)", glowPressed: "var(--pp-secondary-glow-pressed)",
            fontSize: "15px", fontWeight: "500", padding: "12px"
        },
        ghost: {
            bg: btnBgColor, color: btnTextColor,
            glow: innerGlow, glowPressed: innerGlowPressed,
            fontSize: "15px", fontWeight: "500", padding: "11px"
        }
    };

    // Set to false to hide "打包为 ZIP" on single-page artworks. Kept on by
    // default: the ZIP carries a `title/001.ext` folder structure that people
    // who archive by artwork tend to want even for a single image, and it keeps
    // the n=1 and n>1 panels structurally identical instead of forking them.
    const SHOW_ZIP_FOR_SINGLE = true;

    // ========================================
    // Manage result page modal lifecycle and cleanup
    // Ensures proper event listener removal and state reset on close
    // ========================================
    let activeResultMask = null;

    function closeResultPage() {
        if (activeResultMask) {
            activeResultMask.querySelectorAll(".pixiv-dd-wrap").forEach(wrap => {
                if (typeof wrap._cleanup === "function") wrap._cleanup();
            });
            activeResultMask.remove();
            activeResultMask = null;
        }
        // Stop ugoira preview players: kill their frame loops and free every
        // decoded ImageBitmap. Without this a closed panel would keep decoding
        // frames in the background (the "ghost player" problem).
        activeUgoiraPlayers.forEach(p => { try { p.destroy(); } catch (e) { /* ignore */ } });
        activeUgoiraPlayers = [];
        activeData = null;
        // Restore the floating button once the result page is closed
        injectButton();
    }

    // ========================================
    // Create and manage the floating action button
    // Helper to add tactile press-feedback animation (scales down on tap/click)
    // ========================================
    function pressEffect(el, pressDown, pressUp) {
        el.addEventListener("pointerdown", pressDown);
        el.addEventListener("pointerup", pressUp);
        el.addEventListener("pointerleave", pressUp);
    }

    function createFloatingBtn() {
        const btn = document.createElement("button");
        btn.textContent = T.parse;
        btn.id = "pixivParseFloatBtn";
        Object.assign(btn.style, {
            position: "fixed",
            top: "50%",
            right: "20px",
            transform: "translateY(-50%)",
            zIndex: "2147483647",
            width: "56px", height: "56px", borderRadius: "50%",
            background: btnBgColor, color: btnTextColor,
            border: "none", outline: "none",
            fontSize: "14px", fontWeight: "600",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            boxShadow: floatGlow,
            cursor: "pointer",
            transition: "box-shadow 0.15s, transform 0.15s",
            WebkitTapHighlightColor: "transparent"
        });
        pressEffect(
            btn,
            () => {
                btn.style.boxShadow = floatGlowPressed;
                btn.style.transform = "translateY(-50%) scale(0.92)";
            },
            () => {
                btn.style.boxShadow = floatGlow;
                btn.style.transform = "translateY(-50%) scale(1)";
            }
        );
        return btn;
    }

    function showLoadingToast(msg) {
        const old = document.getElementById("pixivLoadingToast");
        if (old) old.remove();
        const toast = document.createElement("div");
        toast.id = "pixivLoadingToast";
        toast.textContent = msg;
        Object.assign(toast.style, {
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: cardColor, color: textColor,
            padding: "14px 24px", borderRadius: "20px",
            fontSize: "15px", zIndex: "2147483647",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            boxShadow: innerGlow,
            whiteSpace: "pre-line",
            textAlign: "center"
        });
        document.body.appendChild(toast);
        return toast;
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => alert(T.copied)).catch(() => alert(T.copyFailed));
        } else {
            const ta = document.createElement("textarea");
            ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select();
            try { document.execCommand("copy"); alert(T.copied); } catch (e) { alert(T.copyFailed); }
            document.body.removeChild(ta);
        }
    }

    // variant: "primary" | "secondary" | "ghost" (default) — see BTN_VARIANTS.
    function createPanelButton(text, callback, variant) {
        const v = BTN_VARIANTS[variant] || BTN_VARIANTS.ghost;
        const btn = document.createElement("button");
        btn.textContent = text;
        Object.assign(btn.style, {
            display: "block", width: "100%",
            background: v.bg, color: v.color,
            border: "none", outline: "none",
            borderRadius: "14px",
            padding: v.padding, fontSize: v.fontSize, fontWeight: v.fontWeight,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            marginBottom: variant === "ghost" ? "12px" : "10px",
            boxShadow: v.glow,
            cursor: "pointer",
            transition: "box-shadow 0.15s, transform 0.15s",
            WebkitTapHighlightColor: "transparent"
        });
        pressEffect(
            btn,
            () => {
                btn.style.boxShadow = v.glowPressed;
                btn.style.transform = "scale(0.98)";
            },
            () => {
                btn.style.boxShadow = v.glow;
                btn.style.transform = "scale(1)";
            }
        );
        btn.onclick = callback;
        return btn;
    }

    // ========================================
    // Save a single image.
    //
    // The previous implementation called GM_download({url, name}) directly.
    // GM_download delegates to the browser's download API, which has no way to
    // attach custom request headers — and i.pximg.net answers every request
    // that lacks `Referer: https://www.pixiv.net/` with 403 Forbidden. The
    // download therefore died server-side while Tampermonkey surfaced nothing,
    // so the button simply appeared to do nothing.
    //
    // Fetch the bytes ourselves through GM_xmlhttpRequest (which *can* set the
    // Referer — this is the same path the ZIP packer already uses successfully)
    // and hand the browser a blob URL. GM_download is kept only as a last-resort
    // fallback, in case the XHR is blocked but the browser download is not.
    // ========================================
    const MIME_BY_EXT = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
        gif: "image/gif", webp: "image/webp", bmp: "image/bmp"
    };

    // Re-wrap a Blob whose type is missing/empty so the saved file opens
    // correctly, inferring the MIME type from the URL extension.
    function typedBlob(blob, url) {
        if (blob && blob.type) return blob;
        const type = MIME_BY_EXT[extOf(url)] || "application/octet-stream";
        return new Blob([blob], { type });
    }

    function saveBlobAs(blob, filename) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }

    // opts.silent: skip the toast and rethrow on failure, so the batch caller
    // can drive one shared progress toast and count real successes.
    async function downloadFile(url, filename, opts) {
        const silent = !!(opts && opts.silent);
        const toast = silent ? null : showLoadingToast(T.downloadingSingle);

        try {
            const blob = await fetchImageBlob(url);
            if (!blob || blob.size === 0) throw new Error(T.emptyResponse);
            saveBlobAs(typedBlob(blob, url), filename);
            if (toast) {
                toast.textContent = T.dlStarted(filename);
                setTimeout(() => toast.remove(), 2600);
            }
            return true;
        } catch (e) {
            console.error("PixivParse: image fetch failed", url, e);
            if (silent) throw e;

            // Last resort: let the browser try, even though it will most likely
            // hit the same 403. Say so instead of pretending it worked.
            let fellBack = false;
            try {
                if (typeof GM_download === "function") {
                    GM_download({ url, name: filename, saveAs: false });
                    fellBack = true;
                }
            } catch (e2) {
                console.error("PixivParse: GM_download fallback failed", e2);
            }
            if (toast) {
                toast.textContent = fellBack
                    ? T.dlFallback
                    : T.dlFailed(e && e.message ? e.message : String(e));
                setTimeout(() => toast.remove(), fellBack ? 3500 : 5000);
            }
            return false;
        }
    }

    // Extract file extension from Pixiv image URL, removing query parameters
    // Defaults to 'jpg' if extension cannot be determined
    function extOf(url) {
        const seg = String(url).split("/").pop().split("?")[0];
        const m = seg.match(/\.([a-z0-9]+)$/i);
        return m ? m[1].toLowerCase() : "jpg";
    }

    // ========================================
    // Sanitize an artwork title for use as a filename or ZIP entry segment.
    // Pixiv titles routinely contain characters that are illegal in filenames
    // (\ / : * ? " < > |), control characters (including NUL), leading or
    // trailing dots, or are long enough to exceed the 255-byte limit most
    // filesystems impose on a single name component. Used unsanitized they
    // break GM_download, and titles like ".." produce ZIP entries that extract
    // outside the target folder.
    // ========================================
    const FILENAME_ILLEGAL_RE = /[\\/:*?"<>|\u0000-\u001f]/g;
    const FILENAME_MAX_BYTES = 120; // leaves room for "_000.png" / ".zip" suffixes
    const FILENAME_RESERVED_RE = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i; // Windows devices

    function byteLength(str) {
        if (typeof TextEncoder === 'function') return new TextEncoder().encode(str).length;
        let n = 0; // conservative fallback: 3 bytes per non-ASCII code point
        for (const ch of str) n += ch.codePointAt(0) > 0x7f ? 3 : 1;
        return n;
    }

    // Truncate on a code-point boundary so multi-byte characters stay intact
    function truncateBytes(str, maxBytes) {
        if (byteLength(str) <= maxBytes) return str;
        let out = "";
        for (const ch of str) {
            if (byteLength(out + ch) > maxBytes) break;
            out += ch;
        }
        return out;
    }

    function sanitizeFilename(raw, fallback) {
        let s = String(raw === undefined || raw === null ? "" : raw)
            .replace(/\s+/g, " ")               // collapse newlines/tabs/space runs first
            .replace(FILENAME_ILLEGAL_RE, "_") // then any remaining illegal/control char
            .replace(/^[\s.]+/, "")             // leading dots & spaces (hidden files, "..")
            .replace(/[\s.]+$/, "");            // trailing dots & spaces (invalid on Windows)

        s = truncateBytes(s, FILENAME_MAX_BYTES).replace(/[\s.]+$/, "");

        // Titles like "../.." reduce to separators/punctuation only; prefer the
        // fallback. Deliberately avoids /[\p{L}\p{N}]/u: Unicode property escapes
        // are a parse-time SyntaxError on older engines (Firefox < 78), which
        // would kill the whole script, not just this branch.
        if (!/[^\s._-]/.test(s)) s = "";
        if (FILENAME_RESERVED_RE.test(s)) s += "_"; // never a bare device name
        return s || fallback || "pixiv";
    }

    // ========================================
    // Fetch artwork metadata and image URLs from Pixiv API
    // Returns title, description, author info, and list of image URLs
    // ========================================
    // ========================================
    // fetch() with a hard timeout and human-readable failures.
    // The metadata calls previously had neither: a hung request left the
    // "parsing..." toast on screen forever and kept `parsing` latched true, so
    // the button stayed dead until the page was reloaded; and an HTML error
    // page surfaced to the user as "Unexpected token '<' ... is not valid JSON".
    // ========================================
    const METADATA_TIMEOUT_MS = 20000;

    function fetchWithTimeout(url, ms) {
        if (typeof AbortController !== 'function') {
            return fetch(url, { credentials: 'include' });
        }
        const ctrl = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, ms);
        return fetch(url, { credentials: 'include', signal: ctrl.signal }).then(
            (res) => { clearTimeout(timer); return res; },
            (err) => {
                clearTimeout(timer);
                if (timedOut) throw new Error(T.requestTimeout);
                // Network-level failures (offline, DNS, connection reset) reject
                // with raw browser TypeErrors ("Failed to fetch" /
                // "NetworkError..." / "Load failed") that leaked English into
                // the localized alert. Wrap them; the raw error stays
                // reachable via .cause for the console logging in catch sites.
                const wrapped = new Error(T.networkError);
                wrapped.cause = err;
                throw wrapped;
            }
        );
    }

    // Convert a response into JSON, or into a message the user can act on
    async function readJson(res, label) {
        if (!res || !res.ok) throw new Error(T.httpError(res ? res.status : 0));
        try {
            return await res.json();
        } catch (e) {
            console.error('PixivParse: unparseable response from', label, e);
            throw new Error(T.badResponse);
        }
    }

    // "_ugoira1920x1080.zip" → [1920, 1080]; null when the URL shape changes
    function parseUgoiraDims(url) {
        const m = /ugoira(\d+)x(\d+)\.zip/i.exec(String(url || ""));
        return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
    }

    // illustComment arrives as HTML (<a href="/jump.php...">, <strong>,
    // emoji <img>, …). The panel shows plain text, so strip tags safely:
    // a detached innerHTML never executes scripts, and textContent then
    // returns only the visible words. <br>/</p> become newlines and pixiv
    // emoji keep their alt text so the caption stays readable.
    function htmlToText(html) {
        const raw = String(html || "");
        if (!raw) return "";
        const prepared = raw
            .replace(/<img[^>]*\balt="([^"]*)"[^>]*>/gi, "$1")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/(?:p|div|li)>/gi, "\n");
        const div = document.createElement("div");
        div.innerHTML = prepared;
        return (div.textContent || "")
            .replace(/[^\S\n]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    // Split a /pages response body into two parallel lists:
    //   images   — what the download buttons fetch: originals, falling back
    //              to master1200 when pixiv does not expose the original;
    //   previews — what the gallery <img> renders. The panel column is 520px
    //              wide, so master1200 is already more than it can display;
    //              loading 3000px+ originals there (a 24-page work at 3490px
    //              each pulls ~60MB instead of ~8MB) wastes an order of
    //              magnitude in bandwidth for zero visible difference.
    // Entries without any usable URL are dropped from both lists so the
    // gallery never renders <img src="undefined"> nor a download button
    // pointing at "undefined".
    function buildImageLists(pagesBody) {
        const images = [];
        const previews = [];
        (pagesBody || []).forEach(p => {
            if (!p || !p.urls) return;
            const original = p.urls.original || p.urls.regular;
            if (!original) return;
            images.push(original);
            previews.push(p.urls.regular || p.urls.small || original);
        });
        return { images, previews };
    }

    async function fetchPixivData() {
        const match = location.href.match(/artworks\/(\d+)/);
        if (!match) throw new Error(T.notArtwork);
        const illustId = match[1];

        // Fire both requests in parallel. For ugoira the pages response is an
        // empty list and gets discarded; the timing table comes from a third
        // call (ugoira_meta) once the detail response confirms the type.
        const [detailResp, pagesResp] = await Promise.all([
            fetchWithTimeout(`https://www.pixiv.net/ajax/illust/${illustId}`, METADATA_TIMEOUT_MS),
            fetchWithTimeout(`https://www.pixiv.net/ajax/illust/${illustId}/pages`, METADATA_TIMEOUT_MS)
                .catch(err => ({ __failed: err }))
        ]);
        const detail = await readJson(detailResp, 'illust');

        if (detail.error || !detail.body) throw new Error(detail.message || T.noInfo);

        const illust = detail.body;
        const user = illust.user || {};
        const base = {
            title: illust.illustTitle || illustId,
            desc: htmlToText(illust.illustComment),
            author: {
                name: illust.userName || user.userName || user.name || "",
                avatar: illust.userImage || user.profileImageUrl || user.image || "",
                id: illust.userId || user.id || ""
            },
            illustId: illustId
        };

        // Pixiv illustType: 0 = illustration, 1 = manga, 2 = ugoira.
        if (Number(illust.illustType) === 2) {
            const metaResp = await fetchWithTimeout(
                `https://www.pixiv.net/ajax/illust/${illustId}/ugoira_meta`, METADATA_TIMEOUT_MS);
            const meta = await readJson(metaResp, 'ugoira_meta');
            if (meta.error || !meta.body || !meta.body.frames || !meta.body.frames.length) {
                throw new Error(meta.message || T.noImages);
            }
            const dims = parseUgoiraDims(meta.body.originalSrc);
            return Object.assign({}, base, {
                type: "ugoira",
                zipUrl: meta.body.originalSrc,
                previewZipUrl: meta.body.src || meta.body.originalSrc,
                mime: meta.body.mime_type || "image/jpeg",
                // Keep the artist's original per-frame timing: the ZIP master
                // must be lossless and MP4/preview both honor short delays.
                // Only impossible values are sanitized; the 20ms GIF floor is
                // applied at GIF write time (browsers inflate GIF delays
                // below 2 cs to 10 cs).
                frames: meta.body.frames.map(f => {
                    const d = Number(f.delay);
                    return { file: f.file, delay: (Number.isFinite(d) && d > 0) ? d : 50 };
                }),
                width: dims ? dims[0] : 0,
                height: dims ? dims[1] : 0
            });
        }

        const pages = pagesResp.__failed ? null : await readJson(pagesResp, 'pages');
        if (!pages || pages.error || !pages.body) {
            const msg = (pages && pages.message)
                || (pagesResp.__failed && pagesResp.__failed.message)
                || T.noImages;
            throw new Error(msg);
        }
        const built = buildImageLists(pages.body);
        return Object.assign({}, base, {
            type: "image",
            images: built.images,
            previews: built.previews
        });
    }

    // ========================================
    // Download image as Blob with proper Referer header
    // Required to bypass Pixiv's hotlink protection
    // Includes timeout handling and error detection
    // ========================================
    function fetchImageBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: CUSTOM_HEADERS,
                responseType: 'blob',
                timeout: 30000,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300 && res.response instanceof Blob) {
                        resolve(res.response);
                    } else {
                        reject(new Error('HTTP ' + res.status));
                    }
                },
                // Same localization rule as fetchWithTimeout: these strings end
                // up inside dlFailed / convertFailed toasts, so raw English
                // would leak into the localized UI. "HTTP <status>" stays
                // as-is — numeric, language-neutral.
                onerror: () => reject(new Error(T.networkError)),
                ontimeout: () => reject(new Error(T.requestTimeout))
            });
        });
    }

    // ========================================
    // Stream images into ZIP file using fflate library
    // Downloads images sequentially and monitors success/failure
    // Auto-triggers browser download upon completion
    // ========================================
    // Re-entrancy guard: the panel stays open while packing, so the button is
    // clickable again. Without this, N clicks run N packs in parallel — N ZIPs,
    // N x images fetched, and every pack but the last writing progress into a
    // detached toast node.
    let packing = false;
    function packAndDownload(images, baseName) {
        if (packing) return Promise.resolve();
        packing = true;
        return runPackAndDownload(images, baseName)
            .finally(() => { packing = false; });
    }

    async function runPackAndDownload(images, rawBaseName) {
        const baseName = sanitizeFilename(rawBaseName, "pixiv_album");
        const loading = showLoadingToast(T.preparing);

        if (typeof fflate === 'undefined' || !fflate.Zip) {
            loading.textContent = T.fflateMissing;
            setTimeout(() => loading.remove(), 3000);
            return;
        }

        const { Zip, ZipPassThrough } = fflate;
        const total = images.length;
        let loaded = 0;
        let failed = 0;

        const chunks = [];
        let zipError = null;

        const zip = new Zip((err, dat) => {
            if (err) {
                zipError = err;
                console.error('ZIP stream error:', err);
                return;
            }
            chunks.push(dat);
        });

        for (let i = 0; i < total; i++) {
            const url = images[i];
            const ext = extOf(url);
            const filename = `${String(i + 1).padStart(3, '0')}.${ext}`;
            const entryName = `${baseName}/${filename}`;

            loading.textContent = T.downloading(i + 1, total);

            try {
                const blob = await fetchImageBlob(url);
                const buf = new Uint8Array(await blob.arrayBuffer());

                const entry = new ZipPassThrough(entryName);
                zip.add(entry);
                entry.push(buf, true);
                loaded++;
            } catch (e) {
                failed++;
                console.error('Image download failed:', filename, e);
            }
        }

        loading.textContent = T.zipping;
        zip.end();

        if (zipError) {
            loading.textContent = T.zipFailed(zipError.message);
            setTimeout(() => loading.remove(), 3000);
            return;
        }

        if (loaded === 0) {
            loading.textContent = T.allFailed;
            setTimeout(() => loading.remove(), 3000);
            return;
        }

        const zipBlob = new Blob(chunks, { type: 'application/zip' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = baseName + '.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);

        loading.textContent = failed > 0 ? T.zipStartedWithFailed(failed) : T.zipStarted;
        setTimeout(() => loading.remove(), 2500);
    }

    // ========================================
    // Ugoira (animated artwork) support.
    // A ugoira is a ZIP of numbered still frames plus a per-frame delay table
    // that lives ONLY in the ugoira_meta API response (never inside the ZIP).
    // The panel therefore offers:
    //   ZIP — original frames + generated animation.json (lossless master)
    //   MP4 — hardware-encoded via WebCodecs when available (button hidden else)
    //   GIF — pure-JS fallback that always works (vendored gifenc, no CDN)
    // plus a canvas preview that plays the small ~600px ZIP.
    // ========================================

    // Shared by all three export paths: download + unzip the ugoira ZIP once.
    // Returns { entries, frames, mime } with frames filtered to entries present.
    async function fetchUgoiraFrames(data) {
        if (typeof fflate === "undefined" || !fflate.unzipSync) throw new Error(T.fflateMissing);
        const blob = await fetchImageBlob(data.zipUrl);
        if (!blob || blob.size === 0) throw new Error(T.ugoiraEmptyZip);
        const entries = fflate.unzipSync(new Uint8Array(await blob.arrayBuffer()));
        const frames = data.frames.filter(f => entries[f.file]);
        if (!frames.length) throw new Error(T.ugoiraNoFramesInZip);
        return { entries: entries, frames: frames, mime: data.mime || "image/jpeg" };
    }

    function renderUgoiraPanel(data, content) {
        const fileBase = sanitizeFilename(data.title, "ugoira");
        const n = data.frames.length;
        const totalMs = data.frames.reduce((s, f) => s + (f.delay || 0), 0);
        const sec = Math.max(1, Math.round(totalMs / 1000));

        const info = document.createElement("div");
        info.textContent = T.ugoiraInfo(n, sec, data.mime);
        info.style.cssText = `color:${subTextColor};font-size:13px;line-height:1.5;margin:0 2px 12px;`;
        content.appendChild(info);

        // ---- Action zone (same top-fixed ordering as static artworks) ----
        content.appendChild(createPanelButton(
            T.ugoiraZip, () => packUgoiraZip(data, fileBase), "primary"));

        // MP4 is capability-gated: the slot keeps the button order stable while
        // the async isConfigSupported() check resolves; unsupported browsers
        // get a muted note instead of a button that would always fail.
        const mp4Slot = document.createElement("div");
        content.appendChild(mp4Slot);
        fillMp4Slot(mp4Slot, data);

        content.appendChild(createPanelButton(
            T.ugoiraGif, () => encodeUgoiraToGif(data, fileBase), "secondary"));

        // ---- Preview (async; degrades to a note when it cannot load) ----
        mountUgoiraPreview(data, content);
    }

    // First H.264 codec string this platform can encode at the given size, or
    // null. Ordered for decoder compatibility: High L4.0 already covers
    // everything up to 1080p (1920x1080 = 8160 macroblocks, just under L4.0's
    // 8192 budget); Main L4.0 / Baseline L3.0 (720p) satisfy constrained
    // hardware; High L5.1 exists for oversized (>1080p) ugoira, which L4.0's
    // macroblock budget cannot address.
    async function pickH264Codec(width, height, bitrate, framerate) {
        const candidates = ["avc1.640028", "avc1.4d0028", "avc1.42E01E", "avc1.640033"];
        for (let c = 0; c < candidates.length; c++) {
            try {
                const s = await VideoEncoder.isConfigSupported({
                    codec: candidates[c], width: width, height: height,
                    bitrate: bitrate, framerate: framerate
                });
                if (s && s.supported) return candidates[c];
            } catch (e) { /* try next profile */ }
        }
        return null;
    }

    async function fillMp4Slot(slot, data) {
        let supported = false;
        try {
            if (typeof VideoEncoder !== "undefined") {
                // H.264 needs even dimensions; probe with the even-ized size the
                // encoder will actually be configured with. When the ZIP URL
                // carried no WxH (regex miss → 0), probe a representative 1080p
                // size instead of hiding the option: encodeUgoiraToMp4 derives
                // the true dimensions from the first decoded frame and re-probes
                // codecs there anyway, so the button stays correct.
                const w0 = data.width > 0 ? data.width : 1920;
                const h0 = data.height > 0 ? data.height : 1080;
                const w = w0 - (w0 % 2);
                const h = h0 - (h0 % 2);
                supported = !!(await pickH264Codec(w, h, 4000000, 24));
            }
        } catch (e) { supported = false; }

        // The panel may have been closed while probing; appending to a detached
        // node is harmless and gets GC'd, so no further guarding is needed.
        if (supported) {
            slot.appendChild(createPanelButton(
                T.ugoiraMp4,
                () => encodeUgoiraToMp4(data, sanitizeFilename(data.title, "ugoira")),
                "secondary"));
        } else {
            const note = document.createElement("div");
            note.textContent = T.ugoiraMp4Note;
            note.style.cssText = `color:${subTextColor};font-size:12px;line-height:1.5;margin:-2px 2px 10px;`;
            slot.appendChild(note);
        }
    }

    // Canvas playback of the small preview ZIP. Decoded ImageBitmaps are kept
    // in a rolling ±1-frame window (constant ~3 MB) instead of decoding all
    // frames up front — a 150-frame 600px animation would otherwise need
    // ~200 MB of bitmaps. Frame timing uses a setTimeout chain driven by each
    // frame's own delay; ugoira delays are variable, so requestAnimationFrame
    // (locked to 60fps) cannot express them.
    function mountUgoiraPreview(data, content) {
        const holder = document.createElement("div");
        holder.style.cssText = `width:100%;border-radius:16px;margin-bottom:10px;box-shadow:${innerGlow};background:${cardColor};padding:28px 0;text-align:center;color:${subTextColor};font-size:13px;`;
        holder.textContent = T.ugoiraPreviewLoading;
        content.appendChild(holder);

        // Set once the live canvas is mounted. The watchdog's failure-note
        // cleanup (below, +10s) must never remove a preview that arrived late
        // but successfully — without this flag, a load finishing between 45s
        // and 55s gets its canvas deleted 10 seconds after mounting.
        let mountedOk = false;
        const load = (async () => {
            if (typeof fflate === "undefined" || !fflate.unzipSync) throw new Error(T.fflateMissing);
            const blob = await fetchImageBlob(data.previewZipUrl);
            if (!blob || blob.size === 0) throw new Error("empty preview ZIP");
            const entries = fflate.unzipSync(new Uint8Array(await blob.arrayBuffer()));
            const frames = data.frames.filter(f => entries[f.file]);
            if (!frames.length) throw new Error("no frames in preview ZIP");
            const mime = data.mime || "image/jpeg";

            const firstBm = await createImageBitmap(new Blob([entries[frames[0].file]], { type: mime }));
            const W = firstBm.width, H = firstBm.height;
            firstBm.close();

            const canvas = document.createElement("canvas");
            canvas.width = W; canvas.height = H;
            canvas.style.cssText = `width:100%;border-radius:16px;display:block;box-shadow:${innerGlow};`;
            const ctx = canvas.getContext("2d");

            let stopped = false;
            let i = 0;
            const cache = new Map();
            const getBitmap = async (idx) => {
                if (cache.has(idx)) return cache.get(idx);
                const bm = await createImageBitmap(new Blob([entries[frames[idx].file]], { type: mime }));
                // The panel may close while this decode is in flight; destroy()
                // has already cleared the cache, so drop the bitmap and abort
                // (both callers catch: the tick loop breaks, prefetch swallows)
                // instead of re-inserting it into a cache nobody will empty.
                if (stopped) {
                    try { bm.close(); } catch (e) { /* ignore */ }
                    throw new Error("preview player stopped");
                }
                cache.forEach((v, k) => {
                    if (k < idx - 1 || k > idx + 1) { v.close(); cache.delete(k); }
                });
                cache.set(idx, bm);
                return bm;
            };

            // Panel could have been closed while the ZIP was downloading.
            // NOTE: check holder (already mounted), never canvas — a freshly
            // created canvas is detached, so canvas.isConnected is always
            // false and the preview would hang on the loading note forever.
            if (!holder.isConnected) { stopped = true; return; }

            holder.style.padding = "0";
            holder.style.background = "transparent";
            holder.style.boxShadow = "none";
            holder.textContent = "";
            holder.appendChild(canvas);
            mountedOk = true;

            // Playback loop, started AFTER the canvas enters the DOM because
            // its condition reads canvas.isConnected. Ugoira delays are
            // variable, so a setTimeout chain (not rAF) drives each frame.
            (async function tick() {
                while (!stopped && canvas.isConnected) {
                    try {
                        ctx.drawImage(await getBitmap(i), 0, 0);
                    } catch (e) { break; }
                    getBitmap((i + 1) % frames.length).catch(() => { }); // prefetch, no await
                    await new Promise(r => setTimeout(r, frames[i].delay));
                    i = (i + 1) % frames.length;
                }
            })();

            activeUgoiraPlayers.push({
                destroy() {
                    stopped = true;
                    cache.forEach(b => { try { b.close(); } catch (e) { /* ignore */ } });
                    cache.clear();
                }
            });

            return true;
        })();

        // Hard watchdog: if Tampermonkey silently queues the cross-origin ZIP
        // request (undecided permission — its `timeout` option does not tick
        // while queued), settle the UI instead of spinning forever. A late
        // success still replaces the failure note with the live canvas.
        let watchdogTimer = null;
        Promise.race([
            load,
            new Promise((_, rej) => {
                watchdogTimer = setTimeout(() =>
                    rej(new Error("preview load watchdog (45s)")), 45000);
            })
        ]).catch((e) => {
            console.error("PixivParse: ugoira preview failed", data.previewZipUrl, e);
            holder.textContent = T.ugoiraPreviewFailed;
            holder.title = e && e.message ? String(e.message) : String(e);
            setTimeout(() => {
                if (holder.parentNode && !mountedOk) holder.remove();
            }, 10000);
        });
        // Drop the timer as soon as the load settles either way; otherwise it
        // pins this whole closure (entries, frames, holder) for the full 45s
        // even after a successful mount.
        load.then(() => clearTimeout(watchdogTimer),
                  () => clearTimeout(watchdogTimer));
    }

    // Primary export: original frames re-zipped together with animation.json
    // (fflate store-level, since JPEG/PNG frames do not recompress usefully).
    // The result is a self-describing master equal to what the artist uploaded,
    // convertible later by ffmpeg / gallery-dl / any ugoira tool.
    async function packUgoiraZip(data, rawBase) {
        if (converting) return;
        converting = true;
        const baseName = sanitizeFilename(rawBase, "ugoira");
        const loading = showLoadingToast(T.ugoiraFetchingZip);
        try {
            loading.textContent = T.ugoiraFetchingZip;
            const got = await fetchUgoiraFrames(data);
            // animation.json must describe THIS zip: list only frames that are
            // actually inside it (fetchUgoiraFrames already filtered), and
            // never ship width/height 0 when the URL regex missed — one cheap
            // decode of the first frame gives the true dimensions, matching
            // what the GIF/MP4 paths already do.
            let width = data.width, height = data.height;
            if ((!width || !height) && got.frames.length) {
                const probe = await createImageBitmap(
                    new Blob([got.entries[got.frames[0].file]], { type: got.mime }));
                width = probe.width;
                height = probe.height;
                probe.close();
            }
            const meta = {
                format: "pixiv-ugoira",
                version: 1,
                illustId: data.illustId,
                title: data.title,
                artist: data.author && data.author.name ? data.author.name : "",
                mimeType: got.mime,
                width: width,
                height: height,
                source: data.zipUrl,
                frames: got.frames
            };
            loading.textContent = T.ugoiraPacking;
            got.entries["animation.json"] = fflate.strToU8(JSON.stringify(meta, null, 2));
            const out = fflate.zipSync(got.entries, { level: 0 });
            saveBlobAs(new Blob([out], { type: "application/zip" }), `${baseName}_ugoira.zip`);
            loading.textContent = T.ugoiraZipStarted;
            setTimeout(() => loading.remove(), 2600);
        } catch (e) {
            console.error("PixivParse: ugoira ZIP pack failed", e);
            loading.textContent = T.convertFailed(e && e.message ? e.message : String(e));
            setTimeout(() => loading.remove(), 5000);
        } finally {
            converting = false;
        }
    }

    // Fallback export: pure-JS GIF encode (vendored gifenc, no CDN needed).
    // Uses one global 256-color palette sampled across the animation, so
    // colors stay stable between frames (no palette popping).
    async function encodeUgoiraToGif(data, rawBase) {
        if (converting) return;
        converting = true;
        const baseName = sanitizeFilename(rawBase, "ugoira");
        const loading = showLoadingToast(T.ugoiraFetchingZip);
        try {
            if (!GIF_ENC || !GIF_ENC.GIFEncoder) throw new Error(T.gifEncMissing);
            const GIFEncoder = GIF_ENC.GIFEncoder;
            const quantize = GIF_ENC.quantize;
            const applyPalette = GIF_ENC.applyPalette;

            loading.textContent = T.ugoiraFetchingZip;
            const got = await fetchUgoiraFrames(data);
            const frames = got.frames;

            // Decode dimensions from the first frame
            const firstBm = await createImageBitmap(new Blob([got.entries[frames[0].file]], { type: got.mime }));
            const W = firstBm.width, H = firstBm.height;
            firstBm.close();

            // --- Sample up to 16 downscaled frames to build a global palette ---
            const SAMPLE = 16;
            const step = Math.max(1, Math.floor(frames.length / SAMPLE));
            const sampCv = document.createElement("canvas");
            const SW = Math.min(320, W);
            const SH = Math.max(1, Math.round(H * (SW / W)));
            sampCv.width = SW; sampCv.height = SH;
            const sctx = sampCv.getContext("2d", { willReadFrequently: true });
            const pooled = [];
            for (let i = 0; i < frames.length; i += step) {
                loading.textContent = T.ugoiraUnpacking;
                const bm = await createImageBitmap(new Blob([got.entries[frames[i].file]], { type: got.mime }));
                sctx.drawImage(bm, 0, 0, SW, SH);
                bm.close();
                const d = sctx.getImageData(0, 0, SW, SH).data;
                for (let p = 0; p < d.length; p += 8) { // every 2nd pixel
                    pooled.push(d[p], d[p + 1], d[p + 2], 255);
                }
            }
            const palette = quantize(new Uint8Array(pooled), 256, { format: "rgb565" });

            // --- Encode every frame against the shared palette ---
            const cv = document.createElement("canvas");
            cv.width = W; cv.height = H;
            const ctx = cv.getContext("2d", { willReadFrequently: true });
            const gif = GIFEncoder();
            for (let i = 0; i < frames.length; i++) {
                loading.textContent = T.ugEncoding(i + 1, frames.length);
                const bm = await createImageBitmap(new Blob([got.entries[frames[i].file]], { type: got.mime }));
                ctx.drawImage(bm, 0, 0);
                bm.close();
                const rgba = ctx.getImageData(0, 0, W, H).data;
                const index = applyPalette(rgba, palette, "rgb565");
                // The palette goes in ONLY on the first frame: gifenc writes a
                // palette passed on later frames as a per-frame LOCAL color
                // table — 768 bytes of duplicates per frame with one shared
                // palette (a 100-frame ugoira would carry ~76 KB of dead
                // weight). Frames without a local table use the global one,
                // which is exactly the shared-palette pattern here.
                const frameOpts = {
                    first: i === 0,
                    repeat: 0,          // loop forever (read on the first frame)
                    // Browsers inflate GIF delays below 2 cs to 10 cs; floor
                    // sub-20ms frames here so fast ugoira don't play sluggish.
                    delay: Math.max(20, frames[i].delay)
                };
                if (i === 0) frameOpts.palette = palette;
                gif.writeFrame(index, W, H, frameOpts);
                if (i % 3 === 0) await new Promise(r => setTimeout(r, 0)); // keep UI alive
            }
            gif.finish();
            saveBlobAs(new Blob([gif.bytes()], { type: "image/gif" }), `${baseName}.gif`);
            loading.textContent = T.gifStarted;
            setTimeout(() => loading.remove(), 2600);
        } catch (e) {
            console.error("PixivParse: GIF conversion failed", e);
            loading.textContent = T.convertFailed(e && e.message ? e.message : String(e));
            setTimeout(() => loading.remove(), 5000);
        } finally {
            converting = false;
        }
    }

    // Best-quality export: H.264 MP4 via WebCodecs (hardware encoder) muxed by
    // mp4-muxer. Per-frame ugoira delays map 1:1 onto VFR timestamps, so the
    // output plays back at exactly the pace the artist authored. Frames are
    // fed sequentially with bounded encoder queue depth — never all decoded at
    // once — keeping memory flat regardless of frame count.
    async function encodeUgoiraToMp4(data, rawBase) {
        if (converting) return;
        converting = true;
        const baseName = sanitizeFilename(rawBase, "ugoira");
        const loading = showLoadingToast(T.ugoiraFetchingZip);
        let encoder = null;
        try {
            if (typeof VideoEncoder === "undefined") throw new Error(T.mp4EncoderMissing);
            if (typeof Mp4Muxer === "undefined" || !Mp4Muxer.Muxer) throw new Error(T.mp4MuxerMissing);

            loading.textContent = T.ugoiraFetchingZip;
            const got = await fetchUgoiraFrames(data);
            const frames = got.frames;

            const firstBm = await createImageBitmap(new Blob([got.entries[frames[0].file]], { type: got.mime }));
            const W0 = firstBm.width, H0 = firstBm.height;
            firstBm.close();
            // H.264 requires even dimensions; squeezing by <1px beats cropping
            const W = W0 - (W0 % 2);
            const H = H0 - (H0 % 2);

            const totalMs = frames.reduce((s, f) => s + f.delay, 0);
            const avgFps = Math.max(1, Math.round(frames.length / (totalMs / 1000)));
            const bitrate = Math.min(25000000, Math.max(2500000, Math.round(W * H * avgFps * 0.1)));

            // Pick the first H.264 profile the platform can encode with
            const codec = await pickH264Codec(W, H, bitrate, avgFps);
            if (!codec) throw new Error(T.mp4EncoderMissing);

            const muxer = new Mp4Muxer.Muxer({
                target: new Mp4Muxer.ArrayBufferTarget(),
                video: { codec: "avc", width: W, height: H },
                fastStart: "in-memory"
            });
            let encError = null;
            encoder = new VideoEncoder({
                output: (chunk, meta) => {
                    if (!encError) {
                        try { muxer.addVideoChunk(chunk, meta); }
                        catch (e) { encError = e; }
                    }
                },
                error: (e) => { encError = e; }
            });
            encoder.configure({
                codec: codec, width: W, height: H,
                bitrate: bitrate, framerate: avgFps,
                avc: { format: "avc" }
            });

            const cv = document.createElement("canvas");
            cv.width = W; cv.height = H;
            const ctx = cv.getContext("2d");
            const kfEvery = Math.max(1, avgFps * 2); // keyframe ~every 2s
            let tsUs = 0;

            for (let i = 0; i < frames.length; i++) {
                if (encError) throw encError;
                loading.textContent = T.ugEncoding(i + 1, frames.length);
                const bm = await createImageBitmap(new Blob([got.entries[frames[i].file]], { type: got.mime }));
                ctx.drawImage(bm, 0, 0, W, H);
                bm.close();
                const vf = new VideoFrame(cv, {
                    timestamp: tsUs,
                    duration: frames[i].delay * 1000
                });
                encoder.encode(vf, { keyFrame: i % kfEvery === 0 });
                vf.close();
                tsUs += frames[i].delay * 1000;
                // Bound the encoder queue so memory stays flat on big ugoira
                if (encoder.encodeQueueSize > 8) {
                    await new Promise((resolve) => {
                        const onDequeue = () => {
                            encoder.removeEventListener("dequeue", onDequeue);
                            resolve();
                        };
                        encoder.addEventListener("dequeue", onDequeue);
                    });
                }
                if (i % 3 === 0) await new Promise(r => setTimeout(r, 0)); // keep UI alive
            }

            await encoder.flush();
            encoder.close();
            encoder = null;
            if (encError) throw encError;
            muxer.finalize();
            saveBlobAs(new Blob([muxer.target.buffer], { type: "video/mp4" }), `${baseName}.mp4`);
            loading.textContent = T.mp4Started;
            setTimeout(() => loading.remove(), 2600);
        } catch (e) {
            console.error("PixivParse: MP4 conversion failed", e);
            if (encoder) { try { encoder.close(); } catch (e2) { /* ignore */ } }
            loading.textContent = T.convertFailed(e && e.message ? e.message : String(e));
            setTimeout(() => loading.remove(), 5000);
        } finally {
            converting = false;
        }
    }

    // gifenc v1.0.3 (vendored) — MIT License, Copyright (c) 2020 Matt DesLauriers.
    // Inlined from dist/gifenc.esm.js (export statement removed) so the GIF
    // fallback path works even when the CDN is unreachable. Names inside are
    // the bundle's own minified ones; exposed below under GIF_ENC.
    const GIF_ENC = (function () {
        // === gifenc-vendor-start ===
        var X={signature:"GIF",version:"89a",trailer:59,extensionIntroducer:33,applicationExtensionLabel:255,graphicControlExtensionLabel:249,imageSeparator:44,signatureSize:3,versionSize:3,globalColorTableFlagMask:128,colorResolutionMask:112,sortFlagMask:8,globalColorTableSizeMask:7,applicationIdentifierSize:8,applicationAuthCodeSize:3,disposalMethodMask:28,userInputFlagMask:2,transparentColorFlagMask:1,localColorTableFlagMask:128,interlaceFlagMask:64,idSortFlagMask:32,localColorTableSizeMask:7};function F(t=256){let e=0,s=new Uint8Array(t);return{get buffer(){return s.buffer},reset(){e=0},bytesView(){return s.subarray(0,e)},bytes(){return s.slice(0,e)},writeByte(r){n(e+1),s[e]=r,e++},writeBytes(r,o=0,i=r.length){n(e+i);for(let c=0;c<i;c++)s[e++]=r[c+o]},writeBytesView(r,o=0,i=r.byteLength){n(e+i),s.set(r.subarray(o,o+i),e),e+=i}};function n(r){var o=s.length;if(o>=r)return;var i=1024*1024;r=Math.max(r,o*(o<i?2:1.125)>>>0),o!=0&&(r=Math.max(r,256));let c=s;s=new Uint8Array(r),e>0&&s.set(c.subarray(0,e),0)}}var O=12,J=5003,lt=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function at(t,e,s,n,r=F(512),o=new Uint8Array(256),i=new Int32Array(J),c=new Int32Array(J)){let x=i.length,a=Math.max(2,n);o.fill(0),c.fill(0),i.fill(-1);let l=0,f=0,g=a+1,h=g,b=!1,w=h,_=(1<<w)-1,u=1<<g-1,k=u+1,B=u+2,p=0,A=s[0],z=0;for(let y=x;y<65536;y*=2)++z;z=8-z,r.writeByte(a),I(u);let d=s.length;for(let y=1;y<d;y++){t:{let m=s[y],v=(m<<O)+A,M=m<<z^A;if(i[M]===v){A=c[M];break t}let V=M===0?1:x-M;for(;i[M]>=0;)if(M-=V,M<0&&(M+=x),i[M]===v){A=c[M];break t}I(A),A=m,B<1<<O?(c[M]=B++,i[M]=v):(i.fill(-1),B=u+2,b=!0,I(u))}}return I(A),I(k),r.writeByte(0),r.bytesView();function I(y){for(l&=lt[f],f>0?l|=y<<f:l=y,f+=w;f>=8;)o[p++]=l&255,p>=254&&(r.writeByte(p),r.writeBytesView(o,0,p),p=0),l>>=8,f-=8;if((B>_||b)&&(b?(w=h,_=(1<<w)-1,b=!1):(++w,_=w===O?1<<w:(1<<w)-1)),y==k){for(;f>0;)o[p++]=l&255,p>=254&&(r.writeByte(p),r.writeBytesView(o,0,p),p=0),l>>=8,f-=8;p>0&&(r.writeByte(p),r.writeBytesView(o,0,p),p=0)}}}var $=at;function D(t,e,s){return t<<8&63488|e<<2&992|s>>3}function G(t,e,s,n){return t>>4|e&240|(s&240)<<4|(n&240)<<8}function j(t,e,s){return t>>4<<8|e&240|s>>4}function R(t,e,s){return t<e?e:t>s?s:t}function T(t){return t*t}function tt(t,e,s){var n=0,r=1e100;let o=t[e],i=o.cnt,c=o.ac,x=o.rc,a=o.gc,l=o.bc;for(var f=o.fw;f!=0;f=t[f].fw){let h=t[f],b=h.cnt,w=i*b/(i+b);if(!(w>=r)){var g=0;s&&(g+=w*T(h.ac-c),g>=r)||(g+=w*T(h.rc-x),!(g>=r)&&(g+=w*T(h.gc-a),!(g>=r)&&(g+=w*T(h.bc-l),!(g>=r)&&(r=g,n=f))))}}o.err=r,o.nn=n}function Q(){return{ac:0,rc:0,gc:0,bc:0,cnt:0,nn:0,fw:0,bk:0,tm:0,mtm:0,err:0}}function ut(t,e){let s=e==="rgb444"?4096:65536,n=new Array(s),r=t.length;if(e==="rgba4444")for(let o=0;o<r;++o){let i=t[o],c=i>>24&255,x=i>>16&255,a=i>>8&255,l=i&255,f=G(l,a,x,c),g=f in n?n[f]:n[f]=Q();g.rc+=l,g.gc+=a,g.bc+=x,g.ac+=c,g.cnt++}else if(e==="rgb444")for(let o=0;o<r;++o){let i=t[o],c=i>>16&255,x=i>>8&255,a=i&255,l=j(a,x,c),f=l in n?n[l]:n[l]=Q();f.rc+=a,f.gc+=x,f.bc+=c,f.cnt++}else for(let o=0;o<r;++o){let i=t[o],c=i>>16&255,x=i>>8&255,a=i&255,l=D(a,x,c),f=l in n?n[l]:n[l]=Q();f.rc+=a,f.gc+=x,f.bc+=c,f.cnt++}return n}function H(t,e,s={}){let{format:n="rgb565",clearAlpha:r=!0,clearAlphaColor:o=0,clearAlphaThreshold:i=0,oneBitAlpha:c=!1}=s;if(!t||!t.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(t instanceof Uint8Array)&&!(t instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");let x=new Uint32Array(t.buffer),a=s.useSqrt!==!1,l=n==="rgba4444",f=ut(x,n),g=f.length,h=g-1,b=new Uint32Array(g+1);for(var w=0,u=0;u<g;++u){let C=f[u];if(C!=null){var _=1/C.cnt;l&&(C.ac*=_),C.rc*=_,C.gc*=_,C.bc*=_,f[w++]=C}}T(e)/w<.022&&(a=!1);for(var u=0;u<w-1;++u)f[u].fw=u+1,f[u+1].bk=u,a&&(f[u].cnt=Math.sqrt(f[u].cnt));a&&(f[u].cnt=Math.sqrt(f[u].cnt));var k,B,p;for(u=0;u<w;++u){tt(f,u,!1);var A=f[u].err;for(B=++b[0];B>1&&(p=B>>1,!(f[k=b[p]].err<=A));B=p)b[B]=k;b[B]=u}var z=w-e;for(u=0;u<z;){for(var d;;){var I=b[1];if(d=f[I],d.tm>=d.mtm&&f[d.nn].mtm<=d.tm)break;d.mtm==h?I=b[1]=b[b[0]--]:(tt(f,I,!1),d.tm=u);var A=f[I].err;for(B=1;(p=B+B)<=b[0]&&(p<b[0]&&f[b[p]].err>f[b[p+1]].err&&p++,!(A<=f[k=b[p]].err));B=p)b[B]=k;b[B]=I}var y=f[d.nn],m=d.cnt,v=y.cnt,_=1/(m+v);l&&(d.ac=_*(m*d.ac+v*y.ac)),d.rc=_*(m*d.rc+v*y.rc),d.gc=_*(m*d.gc+v*y.gc),d.bc=_*(m*d.bc+v*y.bc),d.cnt+=y.cnt,d.mtm=++u,f[y.bk].fw=y.fw,f[y.fw].bk=y.bk,y.mtm=h}let M=[];var V=0;for(u=0;;++V){let L=R(Math.round(f[u].rc),0,255),C=R(Math.round(f[u].gc),0,255),Y=R(Math.round(f[u].bc),0,255),E=255;if(l){if(E=R(Math.round(f[u].ac),0,255),c){let st=typeof c=="number"?c:127;E=E<=st?0:255}r&&E<=i&&(L=C=Y=o,E=0)}let K=l?[L,C,Y,E]:[L,C,Y];if(xt(M,K)||M.push(K),(u=f[u].fw)==0)break}return M}function xt(t,e){for(let s=0;s<t.length;s++){let n=t[s],r=n[0]===e[0]&&n[1]===e[1]&&n[2]===e[2],o=n.length>=4&&e.length>=4?n[3]===e[3]:!0;if(r&&o)return!0}return!1}function U(t,e){var s=0,n;for(n=0;n<t.length;n++){let r=t[n]-e[n];s+=r*r}return s}function P(t,e){return e>1?Math.round(t/e)*e:t}function et(t,{roundRGB:e=5,roundAlpha:s=10,oneBitAlpha:n=null}={}){let r=new Uint32Array(t.buffer);for(let o=0;o<r.length;o++){let i=r[o],c=i>>24&255,x=i>>16&255,a=i>>8&255,l=i&255;if(c=P(c,s),n){let f=typeof n=="number"?n:127;c=c<=f?0:255}l=P(l,e),a=P(a,e),x=P(x,e),r[o]=c<<24|x<<16|a<<8|l<<0}}function nt(t,e,s="rgb565"){if(!t||!t.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(t instanceof Uint8Array)&&!(t instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");if(e.length>256)throw new Error("applyPalette() only works with 256 colors or less");let n=new Uint32Array(t.buffer),r=n.length,o=s==="rgb444"?4096:65536,i=new Uint8Array(r),c=new Array(o),x=s==="rgba4444";if(s==="rgba4444")for(let a=0;a<r;a++){let l=n[a],f=l>>24&255,g=l>>16&255,h=l>>8&255,b=l&255,w=G(b,h,g,f),_=w in c?c[w]:c[w]=gt(b,h,g,f,e);i[a]=_}else{let a=s==="rgb444"?j:D;for(let l=0;l<r;l++){let f=n[l],g=f>>16&255,h=f>>8&255,b=f&255,w=a(b,h,g),_=w in c?c[w]:c[w]=bt(b,h,g,e);i[l]=_}}return i}function gt(t,e,s,n,r){let o=0,i=1e100;for(let c=0;c<r.length;c++){let x=r[c],a=x[3],l=q(a-n);if(l>i)continue;let f=x[0];if(l+=q(f-t),l>i)continue;let g=x[1];if(l+=q(g-e),l>i)continue;let h=x[2];l+=q(h-s),!(l>i)&&(i=l,o=c)}return o}function bt(t,e,s,n){let r=0,o=1e100;for(let i=0;i<n.length;i++){let c=n[i],x=c[0],a=q(x-t);if(a>o)continue;let l=c[1];if(a+=q(l-e),a>o)continue;let f=c[2];a+=q(f-s),!(a>o)&&(o=a,r=i)}return r}function rt(t,e,s=5){if(!t.length||!e.length)return;let n=t.map(i=>i.slice(0,3)),r=s*s,o=t[0].length;for(let i=0;i<e.length;i++){let c=e[i];c.length<o?c=[c[0],c[1],c[2],255]:c.length>o?c=c.slice(0,3):c=c.slice();let x=N(n,c.slice(0,3),U),a=x[0],l=x[1];l>0&&l<=r&&(t[a]=c)}}function q(t){return t*t}function W(t,e,s=U){let n=Infinity,r=-1;for(let o=0;o<t.length;o++){let i=t[o],c=s(e,i);c<n&&(n=c,r=o)}return r}function N(t,e,s=U){let n=Infinity,r=-1;for(let o=0;o<t.length;o++){let i=t[o],c=s(e,i);c<n&&(n=c,r=o)}return[r,n]}function ot(t,e,s=U){return t[W(t,e,s)]}function ct(t={}){let{initialCapacity:e=4096,auto:s=!0}=t,n=F(e),r=5003,o=new Uint8Array(256),i=new Int32Array(r),c=new Int32Array(r),x=!1;return{reset(){n.reset(),x=!1},finish(){n.writeByte(X.trailer)},bytes(){return n.bytes()},bytesView(){return n.bytesView()},get buffer(){return n.buffer},get stream(){return n},writeHeader:a,writeFrame(l,f,g,h={}){let{transparent:b=!1,transparentIndex:w=0,delay:_=0,palette:u=null,repeat:k=0,colorDepth:B=8,dispose:p=-1}=h,A=!1;if(s?x||(A=!0,a(),x=!0):A=Boolean(h.first),f=Math.max(0,Math.floor(f)),g=Math.max(0,Math.floor(g)),A){if(!u)throw new Error("First frame must include a { palette } option");pt(n,f,g,u,B),it(n,u),k>=0&&dt(n,k)}let z=Math.round(_/10);wt(n,p,z,b,w);let d=Boolean(u)&&!A;ht(n,f,g,d?u:null),d&&it(n,u),yt(n,l,f,g,B,o,i,c)}};function a(){ft(n,"GIF89a")}}function wt(t,e,s,n,r){t.writeByte(33),t.writeByte(249),t.writeByte(4),r<0&&(r=0,n=!1);var o,i;n?(o=1,i=2):(o=0,i=0),e>=0&&(i=e&7),i<<=2;let c=0;t.writeByte(0|i|c|o),S(t,s),t.writeByte(r||0),t.writeByte(0)}function pt(t,e,s,n,r=8){let o=1,i=0,c=Z(n.length)-1,x=o<<7|r-1<<4|i<<3|c,a=0,l=0;S(t,e),S(t,s),t.writeBytes([x,a,l])}function dt(t,e){t.writeByte(33),t.writeByte(255),t.writeByte(11),ft(t,"NETSCAPE2.0"),t.writeByte(3),t.writeByte(1),S(t,e),t.writeByte(0)}function it(t,e){let s=1<<Z(e.length);for(let n=0;n<s;n++){let r=[0,0,0];n<e.length&&(r=e[n]),t.writeByte(r[0]),t.writeByte(r[1]),t.writeByte(r[2])}}function ht(t,e,s,n){if(t.writeByte(44),S(t,0),S(t,0),S(t,e),S(t,s),n){let r=0,o=0,i=Z(n.length)-1;t.writeByte(128|r|o|0|i)}else t.writeByte(0)}function yt(t,e,s,n,r=8,o,i,c){$(s,n,e,r,t,o,i,c)}function S(t,e){t.writeByte(e&255),t.writeByte(e>>8&255)}function ft(t,e){for(var s=0;s<e.length;s++)t.writeByte(e.charCodeAt(s))}function Z(t){return Math.max(Math.ceil(Math.log2(t)),1)}var Bt=ct;
        // === gifenc-vendor-end ===
        return {
            GIFEncoder: ct,
            quantize: H,
            applyPalette: nt,
            prequantize: et
        };
    })();

    // ========================================
    // Generic dropdown shared by the language and theme switchers
    // buttonLabel is HTML; items are { value, label, icon? }
    // Exposes wrap._cleanup() so listeners can be removed with the panel
    // ========================================
    function createDropdown({ role, buttonLabel, items, currentValue, onSelect }) {
        const wrap = document.createElement("div");
        wrap.className = "pixiv-dd-wrap";

        const btn = document.createElement("button");
        btn.className = "pixiv-dd-btn";
        btn.dataset.role = role;
        btn.innerHTML = buttonLabel;

        const menu = document.createElement("div");
        menu.className = "pixiv-dd-menu";

        items.forEach(it => {
            const item = document.createElement("div");
            item.className = "pixiv-dd-item" + (it.value === currentValue ? " active" : "");
            const iconHTML = it.icon
                ? `<span style="margin-right:6px;font-size:13px;">${it.icon}</span>`
                : "";
            item.innerHTML = `
                <span>${iconHTML}${it.label}</span>
                <span class="check">\u2713</span>
            `;
            item.onclick = (e) => {
                e.stopPropagation();
                menu.classList.remove("open");
                if (it.value === currentValue) return;
                onSelect(it.value);
            };
            menu.appendChild(item);
        });

        btn.onclick = (e) => {
            // stopPropagation keeps this click from reaching the document-level
            // closeOnOutside handlers, so other dropdowns would stay open and
            // overlap this one. Close them explicitly: menus are mutually exclusive.
            e.stopPropagation();
            const willOpen = !menu.classList.contains("open");
            document.querySelectorAll(".pixiv-dd-menu.open").forEach(m => {
                if (m !== menu) m.classList.remove("open");
            });
            menu.classList.toggle("open", willOpen);
        };

        const closeOnOutside = (e) => {
            if (!wrap.contains(e.target)) {
                menu.classList.remove("open");
            }
        };
        document.addEventListener("click", closeOnOutside);

        wrap._cleanup = () => {
            document.removeEventListener("click", closeOnOutside);
        };

        wrap.appendChild(btn);
        wrap.appendChild(menu);
        return wrap;
    }

    // ========================================
    // Language switcher: Chinese / English / Japanese
    // ========================================
    function createLangSwitcher(onSwitch) {
        return createDropdown({
            role: "lang",
            buttonLabel: `<span style="font-size:13px;line-height:1;">\u{1F310}</span><span>${LANG_META[LANG].short}</span>`,
            items: LANG_ORDER.map(code => ({
                value: code,
                label: LANG_META[code].native,
            })),
            currentValue: LANG,
            onSelect: onSwitch,
        });
    }

    // ========================================
    // Theme switcher: follow system / dark / light
    // The choice is persisted in Tampermonkey storage; applying it only flips
    // CSS variables, so an open panel repaints without re-rendering and the
    // scroll position is preserved.
    // ========================================
    function createThemeSwitcher() {
        const dd = createDropdown({
            role: "theme",
            buttonLabel: `<span data-role="icon" style="font-size:13px;line-height:1;">${THEME_META[THEME_MODE].icon}</span>`,
            items: THEME_ORDER.map(mode => ({
                value: mode,
                icon: THEME_META[mode].icon,
                label: T[THEME_META[mode].labelKey],
            })),
            currentValue: THEME_MODE,
            onSelect: (mode) => {
                setTheme(mode);
                // Rebuild in place so the check marker and icon follow the choice.
                // The old wrap leaves the DOM here, so release its document-level
                // outside-click listener first or it would leak on every switch.
                dd._cleanup();
                dd.replaceWith(createThemeSwitcher());
            },
        });
        dd.querySelector(".pixiv-dd-btn").title =
            `${T.theme}: ${T[THEME_META[THEME_MODE].labelKey]}`;
        return dd;
    }

    // ========================================
    // Render full-screen result modal with artwork details
    // Displays: title, description, author card, gallery, and download buttons
    // Language switcher auto-refreshes page and preserves scroll position
    // ========================================
    function renderResultPage(data) {
        closeResultPage();
        activeData = data;

        const mask = document.createElement("div");
        Object.assign(mask.style, {
            position: "fixed", inset: "0",
            background: bgColor,
            zIndex: "2147483646", overflowY: "auto",
            paddingTop: "90px", paddingLeft: "16px", paddingRight: "16px", paddingBottom: "40px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif"
        });

        activeResultMask = mask;

        // ---- Top bar ----
        const topBar = document.createElement("div");
        Object.assign(topBar.style, {
            position: "fixed", top: "0", left: "0", right: "0",
            background: cardColor, zIndex: "999",
            padding: "12px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: "8px", flexWrap: "wrap",
            boxShadow: innerGlow,
            borderBottom: `1px solid ${borderColor}`
        });

        const titleSpan = document.createElement("span");
        // min-width:0 plus a truncating inner span: without them the flex row
        // cannot shrink, so on a ~320px screen the Close button is pushed past
        // the right edge of this fixed bar and the panel cannot be dismissed.
        titleSpan.style.cssText = `display:flex;align-items:center;flex:1 1 auto;min-width:0;color:${textColor};font-size:18px;font-weight:600;`;
        const badge = document.createElement("span");
        badge.style.cssText = `display:inline-block;flex-shrink:0;width:8px;height:8px;background:${accentColor};border-radius:2px;margin-right:8px;`;
        const titleText = document.createElement("span");
        titleText.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;";
        titleText.textContent = T.title;
        titleSpan.appendChild(badge);
        titleSpan.appendChild(titleText);

        const btnGroup = document.createElement("div");
        btnGroup.style.cssText = "display:flex;gap:8px;align-items:center;flex-shrink:0;";

        function makeTopBtn(text, onClick) {
            const btn = document.createElement("button");
            btn.textContent = text;
            Object.assign(btn.style, {
                background: btnBgColor, color: btnTextColor,
                border: "none", outline: "none",
                borderRadius: "14px", padding: "8px 14px",
                fontSize: "14px", fontWeight: "500", fontFamily: "inherit",
                flexShrink: "0",
                boxShadow: innerGlow, cursor: "pointer",
                WebkitTapHighlightColor: "transparent"
            });
            pressEffect(
                btn,
                () => { btn.style.boxShadow = innerGlowPressed; },
                () => { btn.style.boxShadow = innerGlow; }
            );
            btn.onclick = onClick;
            return btn;
        }

        // Language switcher dropdown: rebuilds in place after switching, scroll position preserved
        const langSwitcher = createLangSwitcher((newLang) => {
            const scrollTop = mask.scrollTop;
            const dataRef = activeData;

            setLang(newLang);
            closeResultPage();
            renderResultPage(dataRef);

            requestAnimationFrame(() => {
                if (activeResultMask) activeResultMask.scrollTop = scrollTop;
            });
        });

        const githubBtn = makeTopBtn("GitHub", () => {
            window.open(GITHUB_URL, "_blank", "noopener,noreferrer");
        });

        const closeBtn = makeTopBtn(T.close, () => {
            // closeResultPage() removes the mask and restores the floating button
            closeResultPage();
        });

        // Theme switcher: system / dark / light (persisted in userscript storage)
        const themeSwitcher = createThemeSwitcher();

        btnGroup.appendChild(themeSwitcher);
        btnGroup.appendChild(langSwitcher);
        btnGroup.appendChild(githubBtn);
        btnGroup.appendChild(closeBtn);
        topBar.appendChild(titleSpan);
        topBar.appendChild(btnGroup);
        mask.appendChild(topBar);

        // ---- Content area ----
        const content = document.createElement("div");
        content.style.cssText = "max-width:520px; width:100%; margin:0 auto; box-sizing:border-box;";

        if (data.title || data.desc) {
            const descCard = document.createElement("div");
            Object.assign(descCard.style, {
                background: cardColor, borderRadius: "20px", padding: "16px",
                marginBottom: "20px", color: textColor, fontSize: "15px", lineHeight: "1.6",
                boxShadow: innerGlow,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px"
            });
            const textCol = document.createElement("div");
            textCol.style.cssText = "white-space:pre-wrap;word-break:break-word;flex:1;min-width:0;";
            if (data.title) {
                const descText = document.createElement("div");
                descText.textContent = data.title;
                textCol.appendChild(descText);
            }
            if (data.desc) {
                const descEl = document.createElement("div");
                descEl.textContent = data.desc;
                descEl.style.cssText = `margin-top:8px;color:${subTextColor};font-size:13px;line-height:1.6;`;
                textCol.appendChild(descEl);
            }
            descCard.appendChild(textCol);
            if (data.title) {
                const copyBtn = document.createElement("button");
                copyBtn.textContent = T.copyTitle;
                Object.assign(copyBtn.style, {
                    background: btnBgColor, color: btnTextColor,
                    border: "none", outline: "none",
                    borderRadius: "8px",
                    padding: "4px 12px", fontSize: "12px", fontWeight: "500",
                    flexShrink: "0", marginTop: "2px",
                    boxShadow: innerGlow, cursor: "pointer",
                    WebkitTapHighlightColor: "transparent"
                });
                copyBtn.onclick = () => copyText(data.title);
                descCard.appendChild(copyBtn);
            }
            content.appendChild(descCard);
        }

        if (data.author && data.author.name) {
            const authorCard = document.createElement("div");
            Object.assign(authorCard.style, {
                display: "flex", alignItems: "center", gap: "14px",
                background: cardColor, borderRadius: "20px", padding: "14px",
                marginBottom: "20px", boxShadow: innerGlow
            });
            if (data.author.avatar) {
                const avt = document.createElement("img");
                avt.src = data.author.avatar;
                Object.assign(avt.style, {
                    width: "48px", height: "48px", borderRadius: "50%",
                    objectFit: "cover", border: `2px solid ${avatarBorderColor}`
                });
                authorCard.appendChild(avt);
            }
            const nameWrap = document.createElement("div");
            const nameDiv = document.createElement("div");
            nameDiv.style.cssText = `color:${textColor};font-size:16px;font-weight:500;`;
            nameDiv.textContent = data.author.name;
            nameWrap.appendChild(nameDiv);
            if (data.author.id) {
                const idDiv = document.createElement("div");
                idDiv.style.cssText = `color:${subTextColor};font-size:13px;`;
                idDiv.textContent = "ID: " + data.author.id;
                nameWrap.appendChild(idDiv);
            }
            authorCard.appendChild(nameWrap);
            content.appendChild(authorCard);
        }

        if (data.images && data.images.length > 0) {
            // One sanitized base for every artifact of this artwork, so the ZIP
            // folder name and the individual filenames stay consistent.
            const fileBase = sanitizeFilename(data.title, "image");

            // ========================================
            // Action zone. Deliberately NOT forked on image count for its own
            // sake: the zone always renders, always sits above the gallery, and
            // only the *role* each action plays changes with n. The old
            // `if (images.length > 1)` fork was what made single-page artworks a
            // separate, untested code path — the reason the broken GM_download
            // call survived there unnoticed.
            // ========================================
            const images = data.images;
            const n = images.length;
            const single = n === 1;

            const doZip = () => packAndDownload(images, fileBase);

            const doDownloadAll = async () => {
                if (batching) return;
                batching = true;
                const toast = showLoadingToast(T.batchTip);
                let ok = 0, failed = 0;

                try {
                    // Sequential rather than staggered setTimeouts: each image is
                    // now fetched as a Blob before the browser saves it, so firing
                    // them all at once would stack N large buffers in memory and
                    // trip download throttling.
                    for (let idx = 0; idx < n; idx++) {
                        const url = images[idx];
                        toast.textContent = T.downloading(idx + 1, n);
                        try {
                            await downloadFile(url, `${fileBase}_${idx + 1}.${extOf(url)}`, { silent: true });
                            ok++;
                        } catch (e) {
                            failed++;
                            console.error("PixivParse: batch item failed", url, e);
                        }
                    }
                    toast.textContent = failed === 0
                        ? T.batchDone(ok)
                        : T.batchDoneWithFailed(ok, failed);
                } finally {
                    // Always release the guard, otherwise every later
                    // "download all" click on this page is ignored.
                    batching = false;
                    setTimeout(() => toast.remove(), 3000);
                }
            };

            if (single) {
                // n=1: a "download all (1 image)" button would invoke the exact
                // same function with the exact same arguments as the per-image
                // button below it. Two identical-looking controls doing the
                // identical thing is noise, so the per-image action is promoted
                // to primary instead and the batch button is dropped entirely.
                content.appendChild(createPanelButton(
                    T.downloadOriginal,
                    () => downloadFile(images[0], `${fileBase}_1.${extOf(images[0])}`),
                    "primary"
                ));
                if (SHOW_ZIP_FOR_SINGLE) {
                    // Kept as secondary rather than hidden: the ZIP lays the file
                    // out as `title/001.ext`, which people archiving by artwork
                    // want even for one page — and it keeps the n=1 panel
                    // structurally identical to the n>1 one.
                    content.appendChild(createPanelButton(T.packZipSingle, doZip, "secondary"));
                }
            } else {
                content.appendChild(createPanelButton(T.packZip(n), doZip, "primary"));
                content.appendChild(createPanelButton(T.downloadAll(n), doDownloadAll, "secondary"));
            }

            // ---- Gallery ----
            images.forEach((imgUrl, idx) => {
                const img = document.createElement("img");
                // Lazy MUST be set before src: the fetch decision reads the
                // attribute when image loading kicks off, and every gallery
                // entry after the first sits below the fold.
                img.loading = "lazy";
                // master1200 preview tier — see buildImageLists. Downloads
                // still fetch the original captured in imgUrl above.
                img.src = (data.previews && data.previews[idx]) || imgUrl;
                img.style.cssText = `width:100%;border-radius:16px;display:block;margin-bottom:${single ? "0" : "10px"};box-shadow:${innerGlow};`;
                content.appendChild(img);
                // For a single page the primary CTA above already covers this
                // image, so repeating it under the thumbnail is pure duplication.
                if (!single) {
                    content.appendChild(createPanelButton(
                        T.downloadImage(idx + 1),
                        () => downloadFile(imgUrl, `${fileBase}_${idx+1}.${extOf(imgUrl)}`),
                        "ghost"
                    ));
                }
            });
        } else if (data.type === "ugoira" && data.frames && data.frames.length > 0) {
            // Animated artwork: canvas preview + ZIP / MP4 / GIF exports
            renderUgoiraPanel(data, content);
        } else {
            // Nothing to download. A ugoira whose metadata somehow yielded no
            // frames lands here too; explain rather than a blank gallery.
            const isUgoira = data.type === "ugoira";
            const notice = document.createElement("div");
            Object.assign(notice.style, {
                display: "flex", alignItems: "flex-start", gap: "10px",
                background: cardColor, borderRadius: "20px", padding: "16px",
                marginBottom: "20px", boxShadow: innerGlow,
                color: textColor, fontSize: "14px", lineHeight: "1.6"
            });
            const icon = document.createElement("span");
            icon.textContent = isUgoira ? "\u{1F39E}\uFE0F" : "\u26A0\uFE0F";
            icon.style.cssText = "font-size:18px;line-height:1.4;flex-shrink:0;";
            const msg = document.createElement("span");
            msg.style.cssText = "flex:1;min-width:0;";
            msg.textContent = isUgoira ? T.ugoiraIncompleteData : T.noDownloadableImages;
            notice.appendChild(icon);
            notice.appendChild(msg);
            content.appendChild(notice);
        }

        mask.appendChild(content);
        document.body.appendChild(mask);

        // Hide floating button (result page takes full screen)
        removeButton();
    }

    // ========================================
    // Entry point: fetch artwork data and render result modal
    // Prevents parallel requests if user clicks button multiple times
    // ========================================
    let parsing = false;
    let batching = false;   // guards the "download all" staggered queue
    async function startParse() {
        if (parsing) return; // Debounce: prevent concurrent requests
        parsing = true;
        const loading = showLoadingToast(T.loading);
        try {
            const data = await fetchPixivData();
            loading.remove();
            renderResultPage(data);
        } catch (e) {
            loading.remove();
            alert(T.parseFailed(e.message));
            console.error(e);
        } finally {
            parsing = false;
        }
    }

    // ========================================
    // Inject/remove floating action button on page
    // Button appears on right side (fixed position) and triggers artwork parsing
    // ========================================
    // Pixiv is an SPA: after navigating to e.g. /users/123 the script is still
    // loaded, so re-validate the URL instead of leaving a button that only
    // errors with "not an artwork page" when clicked.
    function isArtworkPage() {
        return /\/artworks\/\d+/.test(location.pathname);
    }

    function injectButton() {
        if (!isArtworkPage()) { removeButton(); return; }
        if (document.getElementById("pixivParseFloatBtn")) return;
        const btn = createFloatingBtn();
        btn.onclick = () => {
            startParse();
        };
        document.body.appendChild(btn);
    }

    function removeButton() {
        const btn = document.getElementById("pixivParseFloatBtn");
        if (btn) btn.remove();
    }

    // ========================================
    // Monitor page navigation and clean up state when URL changes
    // Closes result modal on SPA route/hash changes, AJAX navigation, back/forward
    // ========================================
    let lastUrl = location.href;
    function checkPage() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            closeResultPage(); // Reset state when user navigates away
        }
    }

    function waitForPage() {
        return new Promise(resolve => {
            if (document.readyState === 'complete') resolve();
            else window.addEventListener('load', resolve, { once: true });
        });
    }

    async function main() {
        injectStyles();
        await waitForPage();
        injectButton();

        const observer = new MutationObserver(checkPage);
        const titleEl = document.querySelector('title');
        if (titleEl) observer.observe(titleEl, { childList: true });

        const origPush = history.pushState;
        history.pushState = function(...args) {
            origPush.apply(this, args);
            setTimeout(checkPage, 200);
        };
        const origReplace = history.replaceState;
        history.replaceState = function(...args) {
            origReplace.apply(this, args);
            setTimeout(checkPage, 200);
        };
        window.addEventListener('popstate', () => setTimeout(checkPage, 200));
    }

    main();
})();