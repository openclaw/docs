---
read_when:
    - OpenClaw 用のチャットチャネルを選択したい
    - サポートされているメッセージングプラットフォームの概要をすばやく把握したい
summary: OpenClaw が接続できるメッセージングプラットフォーム
title: チャットチャンネル
x-i18n:
    generated_at: "2026-04-30T04:59:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58a1f1a0500419015985500a301d9f8ee4fa3a67b11e30561cabe2dc57b5049
    source_path: channels/index.md
    workflow: 16
---

OpenClaw は、すでに使っている任意のチャットアプリであなたと会話できます。各チャンネルは Gateway 経由で接続します。
テキストはすべての場所でサポートされます。メディアとリアクションはチャンネルによって異なります。

## 配信メモ

- `![alt](url)` のような Markdown 画像構文を含む Telegram 返信は、
  可能な場合、最終的な送信経路でメディア返信に変換されます。
- Slack の複数人 DM はグループチャットとしてルーティングされるため、グループポリシー、メンション
  動作、グループセッションルールが MPIM 会話に適用されます。
- WhatsApp のセットアップはオンデマンドインストールです。Baileys ランタイム依存関係が配置される前に
  オンボーディングでセットアップフローを表示でき、Gateway はチャンネルが実際にアクティブな場合にのみ WhatsApp
  ランタイムを読み込みます。

## サポートされるチャンネル

- [BlueBubbles](/ja-JP/channels/bluebubbles) — **iMessage に推奨**。完全な機能サポートを備えた BlueBubbles macOS server REST API を使用します（同梱 Plugin。編集、送信取り消し、エフェクト、リアクション、グループ管理。編集は現在 macOS 26 Tahoe で壊れています）。
- [Discord](/ja-JP/channels/discord) — Discord Bot API + Gateway。サーバー、チャンネル、DM をサポートします。
- [Feishu](/ja-JP/channels/feishu) — WebSocket 経由の Feishu/Lark ボット（同梱 Plugin）。
- [Google Chat](/ja-JP/channels/googlechat) — HTTP Webhook 経由の Google Chat API アプリ。
- [iMessage (legacy)](/ja-JP/channels/imessage) — imsg CLI 経由のレガシー macOS 統合（非推奨。新しいセットアップには BlueBubbles を使用してください）。
- [IRC](/ja-JP/channels/irc) — 従来型の IRC サーバー。ペアリング/許可リスト制御を備えたチャンネル + DM。
- [LINE](/ja-JP/channels/line) — LINE Messaging API ボット（同梱 Plugin）。
- [Matrix](/ja-JP/channels/matrix) — Matrix プロトコル（同梱 Plugin）。
- [Mattermost](/ja-JP/channels/mattermost) — Bot API + WebSocket。チャンネル、グループ、DM（同梱 Plugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) — Bot Framework。エンタープライズサポート（同梱 Plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) — Nextcloud Talk 経由のセルフホスト型チャット（同梱 Plugin）。
- [Nostr](/ja-JP/channels/nostr) — NIP-04 経由の分散型 DM（同梱 Plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) — QQ Bot API。プライベートチャット、グループチャット、リッチメディア（同梱 Plugin）。
- [Signal](/ja-JP/channels/signal) — signal-cli。プライバシー重視。
- [Slack](/ja-JP/channels/slack) — Bolt SDK。ワークスペースアプリ。
- [Synology Chat](/ja-JP/channels/synology-chat) — 送信 + 受信 Webhook 経由の Synology NAS Chat（同梱 Plugin）。
- [Telegram](/ja-JP/channels/telegram) — grammY 経由の Bot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) — Urbit ベースのメッセンジャー（同梱 Plugin）。
- [Twitch](/ja-JP/channels/twitch) — IRC 接続経由の Twitch チャット（同梱 Plugin）。
- [Voice Call](/ja-JP/plugins/voice-call) — Plivo または Twilio 経由の電話（Plugin、別途インストール）。
- [WebChat](/ja-JP/web/webchat) — WebSocket 経由の Gateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) — QR ログイン経由の Tencent iLink Bot Plugin。プライベートチャットのみ（外部 Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) — 最も人気があります。Baileys を使用し、QR ペアリングが必要です。
- [Yuanbao](/ja-JP/channels/yuanbao) — Tencent Yuanbao ボット（外部 Plugin）。
- [Zalo](/ja-JP/channels/zalo) — Zalo Bot API。ベトナムで人気のメッセンジャー（同梱 Plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) — QR ログイン経由の Zalo 個人アカウント（同梱 Plugin）。

## メモ

- チャンネルは同時に実行できます。複数を設定すると、OpenClaw はチャットごとにルーティングします。
- 最速のセットアップは通常 **Telegram** です（シンプルなボットトークン）。WhatsApp は QR ペアリングが必要で、
  ディスク上により多くの状態を保存します。
- グループ動作はチャンネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- DM ペアリングと許可リストは安全のために強制されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途ドキュメント化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
