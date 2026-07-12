---
summary: /plugins/sdk-channel-outbound へリダイレクト
title: チャンネルメッセージ API
x-i18n:
    generated_at: "2026-07-11T22:34:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

このページは[チャンネル送信 API](/ja-JP/plugins/sdk-channel-outbound)に移動しました。

`openclaw/plugin-sdk/channel-message` と
`openclaw/plugin-sdk/channel-message-runtime` は、古い Plugin 向けの非推奨の互換
サブパスとして引き続き残されています。どちらも共有チャンネルメッセージ
コアへの薄いエイリアスです。新しいチャンネル Plugin では、非推奨の
サブパスに新しいヘルパーを追加するのではなく、メッセージのライフサイクル、
受領確認、永続的送信、ライブプレビューの各ヘルパーに
`openclaw/plugin-sdk/channel-outbound` を使用してください。

削除計画: 外部 Plugin の移行期間中はこれらのエイリアスを維持し、
呼び出し元が `channel-outbound` へ移行した後、次回の SDK のメジャーな
クリーンアップで削除します。
