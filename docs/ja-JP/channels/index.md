---
read_when:
    - OpenClaw のチャットチャンネルを選びたい
    - 対応しているメッセージングプラットフォームの概要をすばやく把握したい
summary: OpenClaw が接続できるメッセージングプラットフォーム
title: チャットチャンネル
x-i18n:
    generated_at: "2026-05-02T04:48:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5937761c0aebc17e8633449d467219ea564b8b00a4a99f327aba7d73afe0c810
    source_path: channels/index.md
    workflow: 16
---

OpenClaw は、すでに使っているどのチャットアプリでもあなたと会話できます。各チャネルは Gateway 経由で接続します。
テキストはすべてのチャネルでサポートされます。メディアとリアクションはチャネルによって異なります。

## 配信メモ

- `![alt](url)` のような markdown 画像構文を含む Telegram 返信は、
  可能な場合、最終的な送信経路でメディア返信に変換されます。
- Slack の複数人 DM はグループチャットとしてルーティングされるため、グループポリシー、メンション
  動作、グループセッションのルールが MPIM 会話に適用されます。
- WhatsApp のセットアップは必要時インストール方式です。オンボーディングでは
  Plugin パッケージがインストールされる前にセットアップフローを表示でき、Gateway は
  チャネルが実際にアクティブな場合にのみ WhatsApp ランタイムを読み込みます。

## サポートされるチャネル

- [BlueBubbles](/ja-JP/channels/bluebubbles) — **iMessage に推奨**。完全な機能サポートを備えた BlueBubbles macOS サーバー REST API を使用します（同梱 Plugin。編集、送信取り消し、エフェクト、リアクション、グループ管理に対応。ただし編集は現在 macOS 26 Tahoe で壊れています）。
- [Discord](/ja-JP/channels/discord) — Discord Bot API + Gateway。サーバー、チャネル、DM をサポートします。
- [Feishu](/ja-JP/channels/feishu) — WebSocket 経由の Feishu/Lark ボット（同梱 Plugin）。
- [Google Chat](/ja-JP/channels/googlechat) — HTTP Webhook 経由の Google Chat API アプリ。
- [iMessage (legacy)](/ja-JP/channels/imessage) — imsg CLI 経由の従来の macOS 統合（非推奨。新規セットアップでは BlueBubbles を使用してください）。
- [IRC](/ja-JP/channels/irc) — クラシックな IRC サーバー。ペアリング/許可リスト制御付きのチャネル + DM。
- [LINE](/ja-JP/channels/line) — LINE Messaging API ボット（同梱 Plugin）。
- [Matrix](/ja-JP/channels/matrix) — Matrix プロトコル（同梱 Plugin）。
- [Mattermost](/ja-JP/channels/mattermost) — Bot API + WebSocket。チャネル、グループ、DM（同梱 Plugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) — Bot Framework。エンタープライズサポート（同梱 Plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) — Nextcloud Talk 経由のセルフホスト型チャット（同梱 Plugin）。
- [Nostr](/ja-JP/channels/nostr) — NIP-04 経由の分散型 DM（同梱 Plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) — QQ Bot API。プライベートチャット、グループチャット、リッチメディア（同梱 Plugin）。
- [Signal](/ja-JP/channels/signal) — signal-cli。プライバシー重視。
- [Slack](/ja-JP/channels/slack) — Bolt SDK。ワークスペースアプリ。
- [Synology Chat](/ja-JP/channels/synology-chat) — 送信用 + 受信用 Webhook 経由の Synology NAS Chat（同梱 Plugin）。
- [Telegram](/ja-JP/channels/telegram) — grammY 経由の Bot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) — Urbit ベースのメッセンジャー（同梱 Plugin）。
- [Twitch](/ja-JP/channels/twitch) — IRC 接続経由の Twitch チャット（同梱 Plugin）。
- [Voice Call](/ja-JP/plugins/voice-call) — Plivo または Twilio 経由の電話機能（Plugin、別途インストール）。
- [WebChat](/ja-JP/web/webchat) — WebSocket 上の Gateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) — QR ログイン経由の Tencent iLink Bot Plugin。プライベートチャットのみ（外部 Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) — 最も人気があります。Baileys を使用し、QR ペアリングが必要です。
- [Yuanbao](/ja-JP/channels/yuanbao) — Tencent Yuanbao ボット（外部 Plugin）。
- [Zalo](/ja-JP/channels/zalo) — Zalo Bot API。ベトナムで人気のメッセンジャー（同梱 Plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) — QR ログイン経由の Zalo 個人アカウント（同梱 Plugin）。

## メモ

- チャネルは同時に実行できます。複数を設定すると、OpenClaw がチャットごとにルーティングします。
- 最速のセットアップは通常 **Telegram** です（シンプルなボットトークン）。WhatsApp は QR ペアリングが必要で、
  より多くの状態をディスクに保存します。
- グループ動作はチャネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- 安全のため、DM ペアリングと許可リストが適用されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途文書化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
