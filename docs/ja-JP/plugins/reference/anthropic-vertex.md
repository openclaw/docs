---
read_when:
    - anthropic-vertex Pluginをインストール、設定、または監査している場合
summary: Google Vertex AI 上の Claude モデル向け OpenClaw Anthropic Vertex プロバイダー Plugin。
title: Anthropic Vertex Plugin
x-i18n:
    generated_at: "2026-07-16T11:53:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bd73b80b4e49a85cd6b1d8e47df6bf8d2d791c36a677124112f299027bfd9af5
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex Plugin

Google Vertex AI 上の Claude モデル向け OpenClaw Anthropic Vertex プロバイダー Plugin。

## 配布

- パッケージ: `@openclaw/anthropic-vertex-provider`
- インストール経路: npm、ClawHub

## サーフェス

プロバイダー: `anthropic-vertex`

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Google Cloud リージョンでモデルを利用できる場合は、`anthropic-vertex/claude-fable-5` を使用します。
Fable 5 は常に適応型思考を使用し、デフォルトのエフォートは `high` です。モデルは思考の無効化をサポートしていないため、`/think off` と
`/think minimal` では `low` のエフォートを使用します。

## Claude Sonnet 5

Vertex の `global`、`us`、または `eu`
エンドポイントで `anthropic-vertex/claude-sonnet-5` を使用します。Sonnet 5 はデフォルトで `high` のエフォートによる適応型思考を使用し、
`/think off` またはネイティブの `/think xhigh|max` レベルをサポートします。OpenClaw は
1,000,000 トークンのコンテキストウィンドウと 128,000 トークンの出力上限を自動的に公開します。

カタログ価格は、2026 年 8 月 31 日まで、100 万入力／出力トークン当たり `$2/$10` という Vertex の導入時グローバル料金に従い、
9 月 1 日以降は `$3/$15` となります。`us` および `eu` のマルチリージョンエンドポイントには、Vertex が明記する
10% の追加料金が適用されます。

<!-- openclaw-plugin-reference:manual-end -->
