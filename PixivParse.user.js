// ==UserScript==
// @name         PixivParse
// @namespace    https://github.com/Harry20120330/PixivParse
// @version      1.1.0
// @description  Parse and download Pixiv artworks (original images / batch ZIP).
// @author       Harry20120330
// @match        https://www.pixiv.net/artworks/*
// @match        https://www.pixiv.net/*/artworks/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @license      Apache License 2.0
// @license      MIT; includes fflate (Copyright (c) 2026 Arjun Barrett)
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js
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
            downloadImage: (n) => `下载图片 ${n}`,
            batchTip: "开始批量下载，请允许浏览器多次保存",

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
            httpError: (code) => `服务器返回 ${code}（可能需要重新登录，或已触发访问限制）`,
            badResponse: "服务器返回了无法解析的内容，请稍后重试",
            notArtwork: "非作品页面",
            noInfo: "无法获取作品信息",
            noImages: "无法获取图片列表",
            ugoiraUnsupported: "这是动图作品（うごきらす / ugoira），目前仅支持静态图片，无法解析下载。",
            noDownloadableImages: "未能从该作品获取到可下载的图片。",
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
            downloadImage: (n) => `Download image ${n}`,
            batchTip: "Batch download starting. Please allow multiple saves.",

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
            httpError: (code) => `Server returned ${code} (you may need to log in again, or access is rate-limited)`,
            badResponse: "Server returned an unparseable response. Please try again later.",
            notArtwork: "Not an artwork page",
            noInfo: "Failed to fetch artwork info",
            noImages: "Failed to fetch image list",
            ugoiraUnsupported: "This is an animated artwork (ugoira). Only static images are supported, so it cannot be parsed or downloaded.",
            noDownloadableImages: "No downloadable images were returned for this artwork.",
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
            downloadImage: (n) => `画像 ${n} をダウンロード`,
            batchTip: "一括ダウンロードを開始します。複数回の保存を許可してください。",

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
            httpError: (code) => `サーバーが ${code} を返しました（再ログインが必要か、アクセス制限の可能性があります）`,
            badResponse: "サーバーが解析できない応答を返しました。しばらくしてから再試行してください。",
            notArtwork: "作品ページではありません",
            noInfo: "作品情報の取得に失敗",
            noImages: "画像リストの取得に失敗",
            ugoiraUnsupported: "これはうごきらす（アニメーション作品）です。現在は静止画のみ対応しているため、解析・ダウンロードできません。",
            noDownloadableImages: "この作品からダウンロード可能な画像を取得できませんでした。",
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

    function createPanelButton(text, callback) {
        const btn = document.createElement("button");
        btn.textContent = text;
        Object.assign(btn.style, {
            display: "block", width: "100%",
            background: btnBgColor, color: btnTextColor,
            border: "none", outline: "none",
            borderRadius: "14px",
            padding: "12px", fontSize: "16px", fontWeight: "500",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            marginBottom: "12px",
            boxShadow: innerGlow,
            cursor: "pointer",
            transition: "box-shadow 0.15s, transform 0.15s",
            WebkitTapHighlightColor: "transparent"
        });
        pressEffect(
            btn,
            () => {
                btn.style.boxShadow = innerGlowPressed;
                btn.style.transform = "scale(0.98)";
            },
            () => {
                btn.style.boxShadow = innerGlow;
                btn.style.transform = "scale(1)";
            }
        );
        btn.onclick = callback;
        return btn;
    }

    function downloadFile(url, filename) {
        GM_download({ url, name: filename, saveAs: false });
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
                throw timedOut ? new Error(T.requestTimeout) : err;
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

    async function fetchPixivData() {
        const match = location.href.match(/artworks\/(\d+)/);
        if (!match) throw new Error(T.notArtwork);
        const illustId = match[1];

        const [detailResp, pagesResp] = await Promise.all([
            fetchWithTimeout(`https://www.pixiv.net/ajax/illust/${illustId}`, METADATA_TIMEOUT_MS),
            fetchWithTimeout(`https://www.pixiv.net/ajax/illust/${illustId}/pages`, METADATA_TIMEOUT_MS)
        ]);
        const detail = await readJson(detailResp, 'illust');
        const pages = await readJson(pagesResp, 'pages');

        if (detail.error || !detail.body) throw new Error(detail.message || T.noInfo);
        if (pages.error || !pages.body) throw new Error(pages.message || T.noImages);

        const illust = detail.body;
        // Some entries can lack both urls; filter them out instead of rendering
        // <img src="undefined"> and a download button pointing at "undefined".
        const imageUrls = pages.body
            .map(p => (p && p.urls) ? (p.urls.original || p.urls.regular) : null)
            .filter(Boolean);
        const user = illust.user || {};

        return {
            title: illust.illustTitle || illustId,
            desc: illust.illustComment || "",
            author: {
                name: illust.userName || user.userName || user.name || "",
                avatar: illust.userImage || user.image || "",
                id: illust.userId || user.id || ""
            },
            images: imageUrls,
            // Pixiv illustType: 0 = illustration, 1 = manga, 2 = ugoira.
            // The pages endpoint returns nothing for ugoira, so the panel needs
            // to say why instead of showing an empty gallery.
            type: Number(illust.illustType) === 2 ? "ugoira" : "image"
        };
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
                onerror: () => reject(new Error('Network error')),
                ontimeout: () => reject(new Error('Timeout'))
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

            if (data.images.length > 1) {
                content.appendChild(createPanelButton(
                    T.packZip(data.images.length),
                    () => packAndDownload(data.images, fileBase)
                ));
                content.appendChild(createPanelButton(
                    T.downloadAll(data.images.length),
                    () => {
                        if (batching) return;
                        batching = true;
                        const total = data.images.length;
                        data.images.forEach((url, idx) => {
                            setTimeout(() => {
                                try {
                                    downloadFile(url, `${fileBase}_${idx+1}.${extOf(url)}`);
                                } finally {
                                    // Release the guard even if GM_download throws,
                                    // otherwise every later "download all" click on
                                    // this page would be silently ignored.
                                    if (idx === total - 1) batching = false;
                                }
                            }, idx * 300);
                        });
                        alert(T.batchTip);
                    }
                ));
            }

            data.images.forEach((imgUrl, idx) => {
                const img = document.createElement("img");
                img.src = imgUrl;
                img.loading = "lazy";
                img.style.cssText = `width:100%;border-radius:16px;display:block;margin-bottom:10px;box-shadow:${innerGlow};`;
                content.appendChild(img);
                content.appendChild(createPanelButton(
                    T.downloadImage(idx + 1),
                    () => downloadFile(imgUrl, `${fileBase}_${idx+1}.${extOf(imgUrl)}`)
                ));
            });
        } else {
            // Nothing to download. An animated artwork (ugoira) yields an empty
            // pages list, so explain that case explicitly rather than leaving
            // the user with a blank gallery.
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
            msg.textContent = isUgoira ? T.ugoiraUnsupported : T.noDownloadableImages;
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