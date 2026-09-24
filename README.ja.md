# PixivParse
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[English](README.md) | [简体中文](README.zh.md) | 日本語

## 紹介
PixivParse は軽量な **Tampermonkey/Greasemonkey ユーザースクリプト** で、Pixiv の作品を元画像の品質で解析・ダウンロードできます。Pixiv 作品ページにフローティングボタンを挿入し、以下を提供します：

- **元画像ダウンロード** — `Referer` を偽装して防盗链（ホットリンク防止）を回避し、`original` サイズの画像を取得
- **一括ダウンロード** — 複数ページ構成の作品を一度にダウンロード
- **ワンクリック ZIP 打包** — [fflate](https://github.com/101arrowz/fflate) を用いてストリーミング打包、サーバー不要
- **多言語 UI** — 中 / 英 / 日 自動検出、手動切替可能

## プロジェクト構成
- `PixivParse.user.js`: 完全なスクリプトファイル（インストール入口）
- `PixivParse.meta.js`: メタデータファイル（`@updateURL` の自動更新に使用）
- `LICENSE`: Apache License 2.0 本文
- `NOTICE`: サードパーティ归属の声明
- `lincenses/LICENSE-fflate.txt`: fflate MIT ライセンス

## クイックスタート

### 前提条件
- ユーザースクリプト対応ブラウザ：**Chrome / Edge**（Tampermonkey）または **Firefox**（Greasemonkey）
- 同一ブラウザで [pixiv.net](https://www.pixiv.net/) にログイン済み

### インストール
1. [Tampermonkey](https://www.tampermonkey.net/) または [Greasemonkey](https://add0n.mozilla.org/addons/greasemonkey/) 拡張機能をインストール。
2. 本リポジトリの生スクリプトアドレスを開く：
   - `https://raw.githubusercontent.com/Harry20120330/PixivParse/main/PixivParse.user.js`
3. スクリプトインストールページの「インストール」ボタンをクリック。
4. 任意の Pixiv 作品ページ、例 `https://www.pixiv.net/artworks/XXXX` にアクセス。

### 使用方法
1. ページ右端にフローティングの **解析** ボタンが表示されます。
2. クリックすると作品パネルが開きます：
   - **ZIPで一括ダウンロード (N枚)** — 全画像をストリーミングで単一の ZIP に打包（メモリ使用量小）
   - **全てダウンロード (N枚)** — 1枚ずつブラウザ保存をトリガー（複数保存の許可が必要）
   - **画像 N をダウンロード** — 個別画像を保存
   - **タイトルをコピー** — 作品タイトルをクリップボードにコピー
3. 上バーの言語切替（🌐）で UI 言語を変更、選択内容は記憶されます。

## 注意事項
- **ログイン必須。** スクリプトはブラウザセッション cookie を用いて Pixiv の `ajax` API を呼び出すため、pixiv.net にログイン済みである必要があります。
- **ZIP ストリーミング打包。** fflate は CDN から按需ロード；CDN が利用不能な場合 ZIP 功能是不可用（単体ダウンロードは影響なし）。
- **レートリミット。** 一括ダウンロードは大量の並列要求をトリガーします。程々に使用し、Pixiv に負荷をかけないよう心がけてください。
- **サーバーなし。** すべての操作はブラウザ内で完結し、アカウント・キー・バックエンドは不要です。

## トラブルシューティング
- **フローティングボタンが表示されない：** ページ URL が `https://www.pixiv.net/artworks/*` にマッチし、スクリプトが有効であることを確認してください。
- **画像が読み込まれない：** pixiv.net にログイン済みで、ブラウザから到達可能であることをご確認ください。
- **打包失敗、fflate 欠落と表示：** CDN `@require` のロード失敗です。ネットワークを確認するかページを再読み込みしてください。
- **自動更新が効かない：** `@updateURL` は `PixivParse.meta.js` を指しています。上記生アドレスからスクリプトがインストールされていることを確認してください。

## ライセンス
本プロジェクトは **Apache License, Version 2.0** でライセンスされています。

完全なライセンス本文は [LICENSE](LICENSE) を参照。
サードパーティ归属の声明は [NOTICE](NOTICE) を参照。