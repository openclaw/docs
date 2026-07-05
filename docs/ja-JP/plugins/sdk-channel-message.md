---
summary: /plugins/sdk-channel-outbound へリダイレクト
title: Channel メッセージ API
x-i18n:
    generated_at: "2026-07-05T11:38:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

このページは[チャネルアウトバウンド API](/ja-JP/plugins/sdk-channel-outbound)に移動しました。

`openclaw/plugin-sdk/channel-message` と
`openclaw/plugin-sdk/channel-message-runtime` は、古い plugins 向けの非推奨の互換
サブパスとして残ります。どちらも共有チャネルメッセージコアへの薄いエイリアスです。新しいチャネル plugins は、
非推奨のサブパスに新しいヘルパーを追加するのではなく、メッセージライフサイクル、受信確認、
永続送信、ライブプレビューのヘルパーに
`openclaw/plugin-sdk/channel-outbound` を使用してください。

削除計画: 外部 plugin の移行期間中はこれらのエイリアスを維持し、その後呼び出し元が
`channel-outbound` に移行した後の次回のメジャー SDK クリーンアップで削除します。
