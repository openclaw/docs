---
read_when:
    - opencode Plugin のインストール、設定、または監査を行っています
summary: OpenClaw に OpenCode モデルプロバイダーのサポートを追加します。
title: OpenCode Plugin
x-i18n:
    generated_at: "2026-07-16T12:05:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# OpenCode plugin

OpenClaw に OpenCode モデルプロバイダーのサポートを追加します。

## 配布

- パッケージ: `@openclaw/opencode-provider`
- インストール方法: OpenClaw に同梱

## 提供機能

プロバイダー: `opencode`; コントラクト: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## ネイティブセッション

OpenClaw は、Gateway およびペアリング済み Node 上の `opencode` CLI を自動検出します。保存された
セッションは **OpenCode** セッションサイドバーグループに表示され、公式の `opencode --pure db ... --format json`
および `opencode --pure export` コマンドを通じて、読み取り専用で
トランスクリプトを閲覧できます。制限された環境と `--pure`
モードにより、カタログの閲覧時にプロジェクトの plugin が読み込まれたり、無関係な
Gateway の認証情報が継承されたりすることを防ぎます。

検出を無効にするには、**Config > Plugins > OpenCode** で **OpenCode Session Catalog** をオフにします。
デフォルトでは有効です。

<!-- openclaw-plugin-reference:manual-end -->

## 関連ドキュメント

- [opencode](/ja-JP/providers/opencode)
