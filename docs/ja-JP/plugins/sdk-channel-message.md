---
summary: /plugins/sdk-channel-outbound にリダイレクト
title: チャンネルメッセージ API
x-i18n:
    generated_at: "2026-06-27T12:31:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

このページは [チャネル送信 API](/ja-JP/plugins/sdk-channel-outbound) に移動しました。

`openclaw/plugin-sdk/channel-message` と
`openclaw/plugin-sdk/channel-message-runtime` は、古いプラグイン向けの非推奨の互換性
サブパスとして残っています。新しいチャネルプラグインは、メッセージのライフサイクル、受信確認、耐久性のある
送信、ライブプレビューのヘルパーに
`openclaw/plugin-sdk/channel-outbound` を使用するべきです。非推奨のサブパスは、
共有チャネルメッセージコアと、焦点を絞ったインバウンド/アウトバウンド SDK サーフェスへの薄いエイリアスです。
そこに新しいヘルパーを追加しないでください。

削除計画: 外部プラグインの移行期間中はこれらのエイリアスを維持し、
呼び出し元が `channel-outbound` に移行した後、次のメジャー SDK クリーンアップで削除します。
