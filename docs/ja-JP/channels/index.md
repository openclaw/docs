---
read_when:
    - OpenClaw 用のチャットチャネルを選びたい場合
    - サポートされているメッセージングプラットフォームの概要をすばやく確認したい場合
summary: OpenClaw が接続できるメッセージングプラットフォーム
title: チャットチャネル
x-i18n:
    generated_at: "2026-04-24T04:46:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw は、あなたがすでに使っている任意のチャットアプリで対話できます。各チャネルは Gateway 経由で接続されます。
テキストはどこでもサポートされていますが、メディアやリアクションはチャネルによって異なります。

## サポートされているチャネル

- [BlueBubbles](/ja-JP/channels/bluebubbles) — **iMessage に推奨**。BlueBubbles macOS server REST API を使用し、完全な機能サポートがあります（同梱 Plugin。編集、送信取り消し、エフェクト、リアクション、グループ管理。編集は現在 macOS 26 Tahoe で動作しません）。
- [Discord](/ja-JP/channels/discord) — Discord Bot API + Gateway。サーバー、チャネル、DM をサポートします。
- [Feishu](/ja-JP/channels/feishu) — WebSocket 経由の Feishu/Lark ボット（同梱 Plugin）。
- [Google Chat](/ja-JP/channels/googlechat) — HTTP Webhook 経由の Google Chat API アプリ。
- [iMessage (legacy)](/ja-JP/channels/imessage) — imsg CLI 経由の従来の macOS 統合（非推奨。新規セットアップでは BlueBubbles を使用してください）。
- [IRC](/ja-JP/channels/irc) — 従来型の IRC サーバー。ペアリング/許可リスト制御付きのチャネル + DM。
- [LINE](/ja-JP/channels/line) — LINE Messaging API ボット（同梱 Plugin）。
- [Matrix](/ja-JP/channels/matrix) — Matrix プロトコル（同梱 Plugin）。
- [Mattermost](/ja-JP/channels/mattermost) — Bot API + WebSocket。チャネル、グループ、DM（同梱 Plugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) — Bot Framework。エンタープライズ対応（同梱 Plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) — Nextcloud Talk 経由のセルフホストチャット（同梱 Plugin）。
- [Nostr](/ja-JP/channels/nostr) — NIP-04 経由の分散型 DM（同梱 Plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) — QQ Bot API。プライベートチャット、グループチャット、リッチメディア（同梱 Plugin）。
- [Signal](/ja-JP/channels/signal) — signal-cli。プライバシー重視。
- [Slack](/ja-JP/channels/slack) — Bolt SDK。ワークスペースアプリ。
- [Synology Chat](/ja-JP/channels/synology-chat) — 送信 + 受信 Webhook 経由の Synology NAS Chat（同梱 Plugin）。
- [Telegram](/ja-JP/channels/telegram) — grammY 経由の Bot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) — Urbit ベースのメッセンジャー（同梱 Plugin）。
- [Twitch](/ja-JP/channels/twitch) — IRC 接続経由の Twitch チャット（同梱 Plugin）。
- [Voice Call](/ja-JP/plugins/voice-call) — Plivo または Twilio 経由の電話通信（Plugin、別途インストール）。
- [WebChat](/ja-JP/web/webchat) — WebSocket 経由の Gateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) — QR ログイン経由の Tencent iLink Bot plugin。プライベートチャットのみ（外部 Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) — 最も一般的。Baileys を使用し、QR ペアリングが必要です。
- [Zalo](/ja-JP/channels/zalo) — Zalo Bot API。ベトナムで人気のメッセンジャー（同梱 Plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) — QR ログイン経由の Zalo 個人アカウント（同梱 Plugin）。

## 注意

- チャネルは同時に実行できます。複数を設定すると、OpenClaw はチャットごとにルーティングします。
- 最もすばやくセットアップできるのは通常 **Telegram** です（シンプルなボットトークン）。WhatsApp は QR ペアリングが必要で、より多くの状態をディスクに保存します。
- グループでの挙動はチャネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- DM ペアリングと許可リストは安全性のために強制されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途ドキュメント化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
