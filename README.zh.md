# PixivParse
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[English](README.md) | 简体中文 | [日本語](README.ja.md)

## 简介
PixivParse 是一个轻量级的 **Tampermonkey 油猴脚本**，可解析并以原画质量下载 Pixiv 作品。它会在任意 Pixiv 作品页注入一个悬浮按钮，提供以下能力：

- **原画下载** — 单张、批量、ZIP 三条路径**都**通过 `GM_xmlhttpRequest` 携带 `Referer` 绕过防盗链，拉取 `original` 尺寸图片
- **批量下载** — 逐张串行抓取并保存，带进度提示与成功 / 失败计数
- **一键打包 ZIP** — 使用 [fflate](https://github.com/101arrowz/fflate) 流式打包，无需服务器
- **统一的操作面板** — 单页与多页作品共用同一套界面，按钮按主次分三档
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
2. 点击后弹出作品面板。面板顶部固定是**操作区**，其下是缩略图。操作区里的按钮分三档，位置永远不变，只有"谁当主操作"会随图片数量变化：

   | 档位 | 外观 | 多页作品 (N > 1) | 单页作品 (N = 1) |
   |---|---|---|---|
   | 主操作 | 蓝色实心、字重更粗 | 一键打包下载 (N 张 ZIP) | 下载原图 |
   | 备选操作 | 蓝色描边 | 一键下载全部 (N 张) | 打包为 ZIP |
   | 逐张下载 | 中性灰，每张缩略图下方 | 下载图片 N | 不渲染（主操作已覆盖同一动作） |

   - **一键打包下载 (N 张 ZIP)** — 将所有图片打包为单个 ZIP（逐张串行抓取，仅存储不压缩）
   - **一键下载全部 (N 张)** — 逐张串行抓取并保存，中途显示 `下载中 i/N`，结束后报告成功 / 失败张数
   - **下载图片 N** — 单独保存某张图
   - **复制标题** — 将作品标题复制到剪贴板

   > 单页作品刻意**不**提供「一键下载全部」：它和「下载图片 1」会调用完全相同的函数与参数，放两个一样的按钮只会让人怀疑二者有区别。
3. 顶栏的主题切换器可在 🌗 跟随系统 / 🌙 深色 / ☀️ 浅色 之间切换；语言切换器（🌐）可切换界面语言。两者的选择都会被永久记住，且切换主题时面板不会重绘、滚动位置保持不变。

## 注意事项
- **需要登录。** 脚本通过浏览器会话 cookie 调用 Pixiv 的 `ajax` 接口，必须已登录 pixiv.net。
- **ZIP 打包与内存占用。** fflate 通过 CDN 按需加载；CDN 不可用时 ZIP 功能不可用（单图下载不受影响）。打包时图片逐张串行抓取、压缩过程是流式的，但**最终生成的 ZIP 会整体驻留在内存中**，峰值占用约等于全部原图的总大小（因为采用仅存储不压缩的方式）。因此超大图集（例如上百张大尺寸 PNG）可能占用大量内存甚至导致标签页崩溃，这种情况建议改用「一键下载全部」。
- **请求节流。** ZIP 打包与「一键下载全部」**都是逐张串行**抓取，同一时间只有一个请求在进行。1.1.2 起「一键下载全部」由原先的 300ms 错峰并发改为串行 `await`：每张图现在都要先取回 Blob 再交给浏览器保存，并发触发会让多张大图同时驻留内存，也更容易撞上浏览器的多文件下载拦截。即便如此，也请不要频繁重复解析或一次性大批量抓取，以免给 Pixiv 造成压力。
- **不再静默失败。** 每次下载的成功、兜底、失败三种结局都会弹出提示。失败时会带上具体原因（HTTP 状态码 / 超时 / 网络错误），控制台亦有完整日志。
- **无服务端。** 所有操作均在浏览器内完成，无需账号、密钥或后端。
- **仅支持静态图片。** 动态插画无法解析，面板会明确提示原因；静态插画与多页漫画均支持。
- **文件名净化。** 作品标题会用于下载文件名和 ZIP 内的文件夹名，因此其中的非法字符（`\` `/` `:` `*` `?` `"` `<` `>` `|`）与控制字符会被替换为下划线，首尾的点号和空格会被剥离，超长标题按 120 字节在字符边界处截断，`CON`、`NUL` 等 Windows 保留设备名会自动加后缀。这可避免下载静默失败，也避免标题形如 `..` 时 ZIP 解压写出目标目录之外。

## 配置项
脚本里这几个常量可以直接改，改完在 Tampermonkey 面板点一下「重新载入」即可生效：

| 常量 | 默认值 | 说明 |
|---|---|---|
| `SHOW_ZIP_FOR_SINGLE` | `true` | 单页作品是否显示「打包为 ZIP」。ZIP 内部结构是 `作品名/001.jpg`，按作品归档时有用；嫌多余可设为 `false` |
| `FILENAME_MAX_BYTES` | `120` | 文件名字节上限，预留了 `_000.png` / `.zip` 后缀的余量 |
| `METADATA_TIMEOUT_MS` | `20000` | 元数据接口超时（毫秒） |
| `CUSTOM_HEADERS` | `Referer: https://www.pixiv.net/` | 绕过防盗链用的请求头，一般不需要动 |

按钮的三档外观由 `BTN_VARIANTS` 定义，配色对应主题里的 `--pp-primary-*` / `--pp-secondary-*` 变量，想换风格改这两处即可。

## 常见问题
- **点「下载图片」没反应（1.1.0 及更早版本）：** 旧版单张下载调用 `GM_download`，它底层是浏览器的下载 API，**没有任何办法附加自定义请求头**；而 `i.pximg.net` 对缺少 `Referer` 的请求一律返回 403，于是下载在服务端就失败了，Tampermonkey 不回调也不报错 —— 表现就是"点了没反应"。单页作品受影响最重：那种情况下 ZIP 和「下载全部」按钮都不渲染，面板上唯一那个按钮就是坏的。1.1.1 起改为用 `GM_xmlhttpRequest` 带 `Referer` 取回 Blob 再保存（与 ZIP 同一条路径），请升级。
- **提示下载失败并给出状态码：** 面板现在会如实报告失败原因。若为 403，通常是登录态过期，重新登录 pixiv.net 后再试；若为超时，检查网络。
- **悬浮按钮不出现：** 确认页面 URL 匹配 `https://www.pixiv.net/artworks/*`，且脚本已启用。
- **图片无法加载：** 确认已登录 pixiv.net，且浏览器网络可达。
- **打包失败，提示 fflate 缺失：** CDN `@require` 加载失败，检查网络或刷新页面。
- **自动更新不生效：** `@updateURL` 指向 `PixivParse.meta.js`，请确保脚本从上方原始地址安装。

## 未来计划
- 支持更多类型的作品解析（如动态插画）
- 增加 PDF 输出功能
- 优化 ZIP 打包的内存占用
- 支持 Pixiv Novel 解析

## 更新日志

### 1.1.2
- 统一单页与多页作品的操作面板，删除 `if (data.images.length > 1)` 的数量分叉 —— 正是这个分叉让单页作品长期走一条没人看的代码路径
- 按钮分为主操作 / 备选操作 / 逐张下载三档；此前所有按钮外观完全相同，`--pp-accent` 只用在了标题旁一个 8px 的小方块上
- 单页作品不再渲染与主操作重复的逐张下载按钮
- 「一键下载全部」改为串行 `await`，带进度提示与成功 / 失败计数，移除阻塞式 `alert()`
- 新增配置项 `SHOW_ZIP_FOR_SINGLE`
- 新增中 / 英 / 日文案：`downloadOriginal`、`packZipSingle`

### 1.1.1
- **修复单张下载点击无反应。** 改用 `GM_xmlhttpRequest` 携带 `Referer` 取回 Blob 后保存，不再依赖无法附加请求头的 `GM_download`
- `GM_download` 降级为兜底路径
- 下载的成功 / 兜底 / 失败三种结局均有 toast 提示，不再静默失败
- 新增中 / 英 / 日文案：`downloadingSingle`、`dlStarted`、`dlFailed`、`dlFallback`、`batchDone`、`batchDoneWithFailed`

### 1.1.0 及更早
见 [commit 历史](https://github.com/Harry20120330/PixivParse/commits/main)。

## 许可证
本项目采用 **Apache License, Version 2.0** 许可。

完整许可证文本见 [LICENSE](LICENSE) 文件。
第三方归属声明见 [NOTICE](NOTICE) 文件。
