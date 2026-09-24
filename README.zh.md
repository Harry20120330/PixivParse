# PixivParse
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[English](README.md) | 简体中文 | [日本語](README.ja.md)

## 简介
PixivParse 是一个轻量级的 **Tampermonkey/Greasemonkey 油猴脚本**，可解析并以原画质量下载 Pixiv 作品。它会在任意 Pixiv 作品页注入一个悬浮按钮，提供以下能力：

- **原画下载** — 通过伪造 `Referer` 请求头绕过防盗链，拉取 `original` 尺寸图片
- **批量下载** — 一次下载多页图集的全部图片
- **一键打包 ZIP** — 使用 [fflate](https://github.com/101arrowz/fflate) 流式打包，无需服务器
- **多语言界面** — 中 / 英 / 日 自动检测，可手动切换

## 项目结构
- `PixivParse.user.js`: 完整脚本文件（安装入口）
- `PixivParse.meta.js`: 元数据文件（用于 `@updateURL` 自动更新）
- `LICENSE`: Apache License 2.0 文本
- `NOTICE`: 第三方归属声明
- `lincenses/LICENSE-fflate.txt`: fflate MIT 许可证

## 快速开始

### 前置条件
- 支持用户脚本的浏览器：**Chrome / Edge**（Tampermonkey）或 **Firefox**（Greasemonkey）
- 在同一浏览器中已登录 [pixiv.net](https://www.pixiv.net/)

### 安装
1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [Greasemonkey](https://add0n.mozilla.org/addons/greasemonkey/) 扩展。
2. 在浏览器中打开本仓库的原始脚本地址：
   - `https://raw.githubusercontent.com/Harry20120330/PixivParse/main/PixivParse.user.js`
3. 点击脚本安装页的「安装」按钮。
4. 访问任意 Pixiv 作品页，例如 `https://www.pixiv.net/artworks/XXXX`。

### 使用
1. 页面右边缘会出现一个悬浮的 **解析** 按钮。
2. 点击后弹出作品面板：
   - **一键打包下载 (N 张 ZIP)** — 将所有图片流式打包为单个 ZIP（低内存占用）
   - **一键下载全部 (N 张)** — 逐张触发浏览器保存（可能需要允许多次保存）
   - **下载图片 N** — 单独保存某张图
   - **复制标题** — 将作品标题复制到剪贴板
3. 顶栏的语言切换器（🌐）可切换界面语言，选择会被记住。

## 注意事项
- **需要登录。** 脚本通过浏览器会话 cookie 调用 Pixiv 的 `ajax` 接口，必须已登录 pixiv.net。
- **ZIP 流式打包。** fflate 通过 CDN 按需加载；CDN 不可用时 ZIP 功能不可用（单图下载不受影响）。
- **限流。** 批量下载会触发大量并发请求，请适度使用，避免对 Pixiv 施压。
- **无服务端。** 所有操作均在浏览器内完成，无需账号、密钥或后端。

## 常见问题
- **悬浮按钮不出现：** 确认页面 URL 匹配 `https://www.pixiv.net/artworks/*`，且脚本已启用。
- **图片无法加载：** 确认已登录 pixiv.net，且浏览器网络可达。
- **打包失败，提示 fflate 缺失：** CDN `@require` 加载失败，检查网络或刷新页面。
- **自动更新不生效：** `@updateURL` 指向 `PixivParse.meta.js`，请确保脚本从上方原始地址安装。

## 许可证
本项目采用 **Apache License, Version 2.0** 许可。

完整许可证文本见 [LICENSE](LICENSE) 文件。
第三方归属声明见 [NOTICE](NOTICE) 文件。
