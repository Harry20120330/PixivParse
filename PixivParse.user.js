// ==UserScript==
// @name         PixivParse
// @namespace    https://github.com/Harry20120330/PixivParse
// @version      1.0.0
// @description  Parse and download Pixiv artworks (original images / batch ZIP).
// @author       Harry20120330
// @match        https://www.pixiv.net/artworks/*
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

    // ============================================================
    // i18n 字典
    // ============================================================
    const I18N = {
        zh: {
            parse: "解析",
            close: "关闭",
            loading: "正在解析作品...",
            title: "作品图集",
            copyTitle: "复制标题",
            copied: "已复制",
            copyFailed: "复制失败",

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
            notArtwork: "非作品页面",
            noInfo: "无法获取作品信息",
            noImages: "无法获取图片列表",
        },
        en: {
            parse: "Parse",
            close: "Close",
            loading: "Parsing artwork...",
            title: "Artwork Gallery",
            copyTitle: "Copy title",
            copied: "Copied",
            copyFailed: "Copy failed",

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
            notArtwork: "Not an artwork page",
            noInfo: "Failed to fetch artwork info",
            noImages: "Failed to fetch image list",
        },
        ja: {
            parse: "解析",
            close: "閉じる",
            loading: "作品を解析中...",
            title: "作品ギャラリー",
            copyTitle: "タイトルをコピー",
            copied: "コピーしました",
            copyFailed: "コピー失敗",

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
            notArtwork: "作品ページではありません",
            noInfo: "作品情報の取得に失敗",
            noImages: "画像リストの取得に失敗",
        },
    };

    const LANG_META = {
        zh: { short: "中", native: "中文" },
        en: { short: "EN", native: "English" },
        ja: { short: "日", native: "日本語" },
    };
    const LANG_ORDER = ["zh", "en", "ja"];

    // ============================================================
    // 语言检测
    // ============================================================
    function detectLang() {
        try {
            const saved = (typeof GM_getValue === 'function')
                ? GM_getValue("pixiv_lang", null)
                : null;
            if (saved && I18N[saved]) return saved;
        } catch (e) { /* ignore */ }

        const nav = (navigator.language || "en").toLowerCase();
        if (nav.startsWith("zh")) return "zh";
        if (nav.startsWith("ja")) return "ja";
        return "en";
    }

    let LANG = detectLang();
    let T = I18N[LANG] || I18N.en;
    let activeData = null;

    function setLang(newLang) {
        if (!I18N[newLang]) return;
        LANG = newLang;
        T = I18N[newLang];
        try {
            if (typeof GM_setValue === 'function') GM_setValue("pixiv_lang", newLang);
        } catch (e) { /* ignore */ }

        const fb = document.getElementById("pixivParseFloatBtn");
        if (fb) fb.textContent = T.parse;
    }

    // ============================================================
    // 样式注入
    // ============================================================
    function injectStyles() {
        if (document.getElementById("pixivParseStyles")) return;
        const style = document.createElement("style");
        style.id = "pixivParseStyles";
        style.textContent = `
            .pixiv-lang-wrap { position: relative; }

            .pixiv-lang-btn {
                display: inline-flex; align-items: center; gap: 6px;
                background: #252527; color: #fff;
                border: none; outline: none;
                border-radius: 14px; padding: 8px 12px;
                font-size: 13px; font-weight: 500; font-family: inherit;
                box-shadow: inset 0 0 6px rgba(255,255,255,0.1);
                cursor: pointer;
                transition: box-shadow 0.15s, transform 0.15s;
                -webkit-tap-highlight-color: transparent;
            }
            .pixiv-lang-btn:hover { transform: translateY(-1px); }
            .pixiv-lang-btn:active {
                box-shadow: inset 0 0 3px rgba(255,255,255,0.06);
                transform: scale(0.98);
            }

            .pixiv-lang-menu {
                position: absolute; top: calc(100% + 8px); right: 0;
                min-width: 150px;
                background: rgba(37,37,39,0.95);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-radius: 14px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
                padding: 6px;
                opacity: 0;
                transform: translateY(-6px) scale(0.96);
                transform-origin: top right;
                pointer-events: none;
                transition: opacity 0.18s ease, transform 0.18s ease;
                z-index: 1000;
            }
            .pixiv-lang-menu.open {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }

            .pixiv-lang-item {
                display: flex; align-items: center; justify-content: space-between;
                padding: 8px 12px;
                border-radius: 10px;
                color: #e5e5e7;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.12s;
                user-select: none;
            }
            .pixiv-lang-item:hover { background: rgba(255,255,255,0.06); }
            .pixiv-lang-item.active {
                color: #0096fa;
                font-weight: 600;
            }
            .pixiv-lang-item .check {
                font-size: 13px;
                opacity: 0;
                transition: opacity 0.15s;
            }
            .pixiv-lang-item.active .check { opacity: 1; }
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // 常量
    // ============================================================
    const CUSTOM_HEADERS = { 'Referer': 'https://www.pixiv.net/' };
    const GITHUB_URL = "https://github.com/Harry20120330/PixivParse/";

    const bgColor = "#1c1c1e";
    const cardColor = "#252527";
    const textColor = "#e5e5e7";
    const subTextColor = "#8e8e93";
    const btnBgColor = cardColor;
    const innerGlow = "inset 0 0 6px rgba(255,255,255,0.1)";
    const innerGlowPressed = "inset 0 0 3px rgba(255,255,255,0.06)";
    const accentColor = "#0096fa";

    // ============================================================
    // 界面开关
    // ============================================================
    let activeResultMask = null;

    function closeResultPage() {
        if (activeResultMask) {
            const langWrap = activeResultMask.querySelector(".pixiv-lang-wrap");
            if (langWrap && typeof langWrap._cleanup === "function") {
                langWrap._cleanup();
            }
            activeResultMask.remove();
            activeResultMask = null;
        }
        activeData = null;
    }

    // ============================================================
    // 悬浮球
    // ============================================================
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
            background: btnBgColor, color: "#ffffff",
            border: "none", outline: "none",
            fontSize: "14px", fontWeight: "600",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            boxShadow: innerGlow,
            cursor: "pointer",
            transition: "box-shadow 0.15s, transform 0.15s",
            WebkitTapHighlightColor: "transparent"
        });
        btn.addEventListener("pointerdown", () => {
            btn.style.boxShadow = innerGlowPressed;
            btn.style.transform = "translateY(-50%) scale(0.92)";
        });
        btn.addEventListener("pointerup", () => {
            btn.style.boxShadow = innerGlow;
            btn.style.transform = "translateY(-50%) scale(1)";
        });
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
            background: btnBgColor, color: "#ffffff",
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
        btn.addEventListener("pointerdown", () => {
            btn.style.boxShadow = innerGlowPressed;
            btn.style.transform = "scale(0.98)";
        });
        btn.addEventListener("pointerup", () => {
            btn.style.boxShadow = innerGlow;
            btn.style.transform = "scale(1)";
        });
        btn.onclick = callback;
        return btn;
    }

    function downloadFile(url, filename) {
        GM_download({ url, name: filename, saveAs: false });
    }

    // ============================================================
    // 数据获取
    // ============================================================
    async function fetchPixivData() {
        const match = location.href.match(/artworks\/(\d+)/);
        if (!match) throw new Error(T.notArtwork);
        const illustId = match[1];

        const [detailResp, pagesResp] = await Promise.all([
            fetch(`https://www.pixiv.net/ajax/illust/${illustId}`, { credentials: 'include' }),
            fetch(`https://www.pixiv.net/ajax/illust/${illustId}/pages`, { credentials: 'include' })
        ]);
        const detail = await detailResp.json();
        const pages = await pagesResp.json();

        if (detail.error || !detail.body) throw new Error(detail.message || T.noInfo);
        if (pages.error || !pages.body) throw new Error(pages.message || T.noImages);

        const illust = detail.body;
        const imageUrls = pages.body.map(p => p.urls.original || p.urls.regular);

        return {
            title: illust.illustTitle || illustId,
            desc: illust.illustComment || "",
            author: {
                name: illust.userName || "",
                avatar: illust.userImage || "",
                id: illust.userId || ""
            },
            images: imageUrls,
            type: "image"
        };
    }

    // ============================================================
    // 图片下载（绕过 Referer 防盗链）
    // ============================================================
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

    // ============================================================
    // fflate 流式打包
    // ============================================================
    async function packAndDownload(images, baseName) {
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
            const ext = url.split('.').pop().split('?')[0] || 'jpg';
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

    // ============================================================
    // 语言下拉菜单
    // ============================================================
    function createLangSwitcher(onSwitch) {
        const wrap = document.createElement("div");
        wrap.className = "pixiv-lang-wrap";

        const btn = document.createElement("button");
        btn.className = "pixiv-lang-btn";
        btn.innerHTML = `<span style="font-size:13px;line-height:1;">🌐</span><span>${LANG_META[LANG].short}</span>`;

        const menu = document.createElement("div");
        menu.className = "pixiv-lang-menu";

        LANG_ORDER.forEach(code => {
            const meta = LANG_META[code];
            const item = document.createElement("div");
            item.className = "pixiv-lang-item" + (code === LANG ? " active" : "");
            item.innerHTML = `
                <span>${meta.native}</span>
                <span class="check">✓</span>
            `;
            item.onclick = (e) => {
                e.stopPropagation();
                menu.classList.remove("open");
                if (code === LANG) return;
                onSwitch(code);
            };
            menu.appendChild(item);
        });

        btn.onclick = (e) => {
            e.stopPropagation();
            menu.classList.toggle("open");
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

    // ============================================================
    // 结果页渲染
    // ============================================================
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

        // ---- 顶部栏 ----
        const topBar = document.createElement("div");
        Object.assign(topBar.style, {
            position: "fixed", top: "0", left: "0", right: "0",
            background: cardColor, zIndex: "999",
            padding: "12px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            boxShadow: innerGlow,
            borderBottom: "1px solid rgba(255,255,255,0.05)"
        });

        const titleSpan = document.createElement("span");
        titleSpan.style.cssText = `display:flex;align-items:center;color:${textColor};font-size:18px;font-weight:600;`;
        const badge = document.createElement("span");
        badge.style.cssText = `display:inline-block;width:8px;height:8px;background:${accentColor};border-radius:2px;margin-right:8px;`;
        titleSpan.appendChild(badge);
        titleSpan.appendChild(document.createTextNode(T.title));

        const btnGroup = document.createElement("div");
        btnGroup.style.cssText = "display:flex;gap:8px;align-items:center;";

        function makeTopBtn(text, onClick) {
            const btn = document.createElement("button");
            btn.textContent = text;
            Object.assign(btn.style, {
                background: btnBgColor, color: "#ffffff",
                border: "none", outline: "none",
                borderRadius: "14px", padding: "8px 14px",
                fontSize: "14px", fontWeight: "500", fontFamily: "inherit",
                boxShadow: innerGlow, cursor: "pointer",
                WebkitTapHighlightColor: "transparent"
            });
            btn.addEventListener("pointerdown", () => btn.style.boxShadow = innerGlowPressed);
            btn.addEventListener("pointerup", () => btn.style.boxShadow = innerGlow);
            btn.onclick = onClick;
            return btn;
        }

        // 语言切换下拉菜单：切换后原地重建，滚动位置保持
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
            if (activeResultMask === mask) activeResultMask = null;
            mask.remove();
            activeData = null;
            // 关闭后恢复悬浮球
            injectButton();
        });

        btnGroup.appendChild(langSwitcher);
        btnGroup.appendChild(githubBtn);
        btnGroup.appendChild(closeBtn);
        topBar.appendChild(titleSpan);
        topBar.appendChild(btnGroup);
        mask.appendChild(topBar);

        // ---- 内容区 ----
        const content = document.createElement("div");
        content.style.cssText = "max-width:520px; width:100%; margin:0 auto; box-sizing:border-box;";

        if (data.title) {
            const descCard = document.createElement("div");
            Object.assign(descCard.style, {
                background: cardColor, borderRadius: "20px", padding: "16px",
                marginBottom: "20px", color: textColor, fontSize: "15px", lineHeight: "1.6",
                boxShadow: innerGlow,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px"
            });
            const descText = document.createElement("div");
            descText.textContent = data.title;
            descText.style.cssText = "white-space:pre-wrap;word-break:break-word;flex:1;";
            const copyBtn = document.createElement("button");
            copyBtn.textContent = T.copyTitle;
            Object.assign(copyBtn.style, {
                background: btnBgColor, color: "#ffffff",
                border: "none", outline: "none",
                borderRadius: "8px",
                padding: "4px 12px", fontSize: "12px", fontWeight: "500",
                flexShrink: "0", marginTop: "2px",
                boxShadow: innerGlow, cursor: "pointer",
                WebkitTapHighlightColor: "transparent"
            });
            copyBtn.onclick = () => copyText(data.title);
            descCard.appendChild(descText);
            descCard.appendChild(copyBtn);
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
                    objectFit: "cover", border: "2px solid rgba(255,255,255,0.15)"
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
            if (data.images.length > 1) {
                content.appendChild(createPanelButton(
                    T.packZip(data.images.length),
                    () => packAndDownload(data.images, data.title || "pixiv_album")
                ));
                content.appendChild(createPanelButton(
                    T.downloadAll(data.images.length),
                    () => {
                        data.images.forEach((url, idx) => {
                            setTimeout(() => downloadFile(url, `${data.title || "image"}_${idx+1}.jpg`), idx * 300);
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
                    () => downloadFile(imgUrl, `${data.title || "image"}_${idx+1}.jpg`)
                ));
            });
        }

        mask.appendChild(content);
        document.body.appendChild(mask);

        // 进入解析界面后隐藏悬浮球
        removeButton();
    }

    // ============================================================
    // 解析入口
    // ============================================================
    async function startParse() {
        const loading = showLoadingToast(T.loading);
        try {
            const data = await fetchPixivData();
            loading.remove();
            renderResultPage(data);
        } catch (e) {
            loading.remove();
            alert(T.parseFailed(e.message));
            console.error(e);
        }
    }

    // ============================================================
    // 悬浮球注入
    // ============================================================
    function injectButton() {
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

    // ============================================================
    // 页面切换监听
    // ============================================================
    let lastUrl = location.href;
    function checkPage() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            removeButton();
            closeResultPage();
            injectButton();
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