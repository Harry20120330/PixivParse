# PixivParse
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[English](README.md) | 简体中文 | [日本語](README.ja.md)

## 简介
PixivParse 是一个轻量级的 **Tampermonkey 油猴脚本**，可解析并以原画质量下载 Pixiv 作品。它会在任意 Pixiv 作品页注入一个悬浮按钮，提供以下能力：

- **原画下载** — 通过伪造 `Referer` 请求头绕过防盗链，拉取 `original` 尺寸图片
- **批量下载** — 一次下载多页图集的全部图片
- **一键打包 ZIP** — 使用 [fflate](https://github.com/101arrowz/fflate) 流式打包，无需服务器
- **多语言界面** — 中 / 英 / 日 自动检测，可手动切换
- **深浅主题** — 跟随系统 / 深色 / 浅色 三种模式

## 项目结构
- `PixivParse.user.js`: 完整脚本文件（安装入口）
- `PixivParse.meta.js`: 元数据文件（用于 `@updateURL` 自动更新）
- `LICENSE`: Apache License 2.0 文本
- `NOTICE`: 第三方归属声明
- `licenses/LICENSE-fflate.txt`: fflate MIT 许可证
- `FastUpdate.sh` / `FastUpdate.ps1`: 维护脚本，从 `PixivParse.user.js` 抽取 UserScript 元数据块生成 `PixivParse.meta.js`（分别为 Bash 与 PowerShell 版本，产出字节一致）
- `.gitattributes`: 锁定 LF 行尾，避免 CRLF 工作副本导致上述脚本产出异常

## 快速开始

### 前置条件
- 支持用户脚本的浏览器：**Chrome / Edge / Firefox / Safari / Opera**（均需安装 Tampermonkey）
- 在同一浏览器中已登录 [pixiv.net](https://www.pixiv.net/)

### 安装
1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展。
2. 在浏览器中打开本仓库的原始脚本地址：
   - `https://raw.githubusercontent.com/Harry20120330/PixivParse/main/PixivParse.user.js`
3. 点击脚本安装页的「安装」按钮。
4. 访问任意 Pixiv 作品页，例如 `https://www.pixiv.net/artworks/XXXX`。

### 使用
1. 页面右边缘会出现一个悬浮的 **解析** 按钮。
2. 点击后弹出作品面板：
   - **一键打包下载 (N 张 ZIP)** — 将所有图片打包为单个 ZIP（逐张串行抓取，仅存储不压缩）
   - **一键下载全部 (N 张)** — 逐张触发浏览器保存（可能需要允许多次保存）
   - **下载图片 N** — 单独保存某张图
   - **复制标题** — 将作品标题复制到剪贴板
3. 顶栏的主题切换器可在 🌗 跟随系统 / 🌙 深色 / ☀️ 浅色 之间切换；语言切换器（🌐）可切换界面语言。两者的选择都会被永久记住，且切换主题时面板不会重绘、滚动位置保持不变。

## 注意事项
- **需要登录。** 脚本通过浏览器会话 cookie 调用 Pixiv 的 `ajax` 接口，必须已登录 pixiv.net。
- **ZIP 打包与内存占用。** fflate 通过 CDN 按需加载；CDN 不可用时 ZIP 功能不可用（单图下载不受影响）。打包时图片逐张串行抓取、压缩过程是流式的，但**最终生成的 ZIP 会整体驻留在内存中**，峰值占用约等于全部原图的总大小（因为采用仅存储不压缩的方式）。因此超大图集（例如上百张大尺寸 PNG）可能占用大量内存甚至导致标签页崩溃，这种情况建议改用「一键下载全部」。
- **请求节流。** ZIP 打包按顺序逐张下载，同一时间只有一个请求在进行；「一键下载全部」则以 300ms 的间隔依次触发保存。即便如此，也请不要频繁重复解析或一次性大批量抓取，以免给 Pixiv 造成压力。
- **无服务端。** 所有操作均在浏览器内完成，无需账号、密钥或后端。
- **仅支持静态图片。** 动态插画无法解析，面板会明确提示原因；静态插画与多页漫画均支持。
- **文件名净化。** 作品标题会用于下载文件名和 ZIP 内的文件夹名，因此其中的非法字符（`\` `/` `:` `*` `?` `"` `<` `>` `|`）与控制字符会被替换为下划线，首尾的点号和空格会被剥离，超长标题按 120 字节在字符边界处截断，`CON`、`NUL` 等 Windows 保留设备名会自动加后缀。这可避免下载静默失败，也避免标题形如 `..` 时 ZIP 解压写出目标目录之外。

## 常见问题
- **悬浮按钮不出现：** 确认页面 URL 匹配 `https://www.pixiv.net/artworks/*`，且脚本已启用。
- **图片无法加载：** 确认已登录 pixiv.net，且浏览器网络可达。
- **打包失败，提示 fflate 缺失：** CDN `@require` 加载失败，检查网络或刷新页面。
- **自动更新不生效：** `@updateURL` 指向 `PixivParse.meta.js`，请确保脚本从上方原始地址安装。

## 未来计划
- 支持更多类型的作品解析（如动态插画）
- 增加 PDF 输出功能
- 优化 ZIP 打包的内存占用
- 支持 Pixiv Novel 解析

## 许可证
本项目采用 **Apache License, Version 2.0** 许可。

完整许可证文本见 [LICENSE](LICENSE) 文件。
第三方归属声明见 [NOTICE](NOTICE) 文件。
