---
read_when:
    - anthropic-vertex Pluginをインストール、設定、または監査しています
summary: Google Vertex AI 上の Claude モデル向け OpenClaw Anthropic Vertex プロバイダー Plugin。
title: Anthropic Vertex Plugin
x-i18n:
    generated_at: "2026-07-11T22:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex Plugin

Google Vertex AI 上の Claude モデル向け OpenClaw Anthropic Vertex プロバイダー Plugin。

## 配布

- パッケージ: `@openclaw/anthropic-vertex-provider`
- インストール経路: npm、ClawHub

## 提供機能

プロバイダー: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

お使いの Google Cloud リージョンでモデルが利用可能な場合は、`anthropic-vertex/claude-fable-5` を使用します。
Fable 5 は常に適応型思考を使用し、デフォルトのエフォートは `high` です。モデルは思考の無効化をサポートしていないため、`/think off` と
`/think minimal` では `low` エフォートが使用されます。

## Claude Sonnet 5

Vertex の `global`、`us`、または `eu`
エンドポイントで `anthropic-vertex/claude-sonnet-5` を使用します。Sonnet 5 はデフォルトで `high` エフォートの適応型思考を使用し、
`/think off` またはネイティブの `/think xhigh|max` レベルをサポートします。OpenClaw は、
1,000,000 トークンのコンテキストウィンドウと 128,000 トークンの出力上限を自動的に公開します。

カタログの料金は、2026 年 8 月 31 日までは入力・出力 100 万トークンあたり
`$2/$10` という Vertex の導入時グローバル料金に従い、9 月 1 日以降は
`$3/$15` になります。`us` および `eu` のマルチリージョンエンドポイントでは、Vertex が文書化している
10% の追加料金が適用されます。

<!-- openclaw-plugin-reference:manual-end -->
