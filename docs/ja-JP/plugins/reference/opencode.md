---
read_when:
    - opencode Pluginをインストール、設定、または監査しています
summary: OpenClaw に OpenCode モデルプロバイダーとネイティブセッションカタログのサポートを追加します。
title: OpenCode Plugin
x-i18n:
    generated_at: "2026-07-14T13:54:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 0a9a0b180b42ba26be21a95967a96d0012e7529076f38206c1442f77acb96647
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# OpenCode Plugin

OpenClaw に OpenCode モデルプロバイダーとネイティブセッションカタログのサポートを追加します。

## 配布

- パッケージ: `@openclaw/opencode-provider`
- インストール経路: OpenClaw に同梱

## 対象

プロバイダー: opencode; コントラクト: mediaUnderstandingProviders; セッションカタログ: opencode

## ネイティブセッション

OpenClaw は Gateway とペアリング済み Node 上の `opencode` CLI を自動検出します。保存された
セッションは **OpenCode** セッションサイドバーグループに表示され、公式の `opencode --pure db ... --format json`
および `opencode --pure export` コマンドを通じて、読み取り専用で
トランスクリプトを閲覧できます。制限付き環境と `--pure`
モードにより、カタログの閲覧時にプロジェクトの Plugin が読み込まれたり、無関係な
Gateway の認証情報が継承されたりすることを防ぎます。

検出を無効にするには、**Config > Plugins > OpenCode** の **OpenCode Session Catalog** をオフにします。
デフォルトでは有効です。

## 関連ドキュメント

- [opencode](/ja-JP/providers/opencode)
