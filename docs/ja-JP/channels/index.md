---
read_when:
    - OpenClaw のチャットチャンネルを選択したい場合
    - 対応しているメッセージングプラットフォームの概要をすばやく確認したい場合
summary: OpenClawが接続できるメッセージングプラットフォーム
title: チャットチャンネル
x-i18n:
    generated_at: "2026-05-02T20:41:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw は、すでに使っている任意のチャットアプリであなたとやり取りできます。各チャネルは Gateway 経由で接続します。
テキストはすべての場所でサポートされます。メディアとリアクションはチャネルによって異なります。

## 配信メモ

- `![alt](url)` のような Markdown 画像構文を含む Telegram の返信は、
  可能な場合、最終的な送信経路でメディア返信に変換されます。
- Slack の複数人 DM はグループチャットとしてルーティングされるため、グループポリシー、メンション
  動作、グループセッションルールが MPIM 会話に適用されます。
- WhatsApp のセットアップは必要時インストール方式です。オンボーディングでは
  Plugin パッケージのインストール前にセットアップフローを表示でき、Gateway はチャネルが実際にアクティブな場合にのみ WhatsApp ランタイムを読み込みます。

## サポートされているチャネル

- [BlueBubbles](/ja-JP/channels/bluebubbles) — **iMessage に推奨**。BlueBubbles macOS サーバー REST API を使用し、完全な機能サポートを提供します（バンドル済み Plugin。編集、送信取り消し、エフェクト、リアクション、グループ管理。編集は現在 macOS 26 Tahoe で壊れています）。
- [Discord](/ja-JP/channels/discord) — Discord Bot API + Gateway。サーバー、チャネル、DM をサポートします。
- [Feishu](/ja-JP/channels/feishu) — WebSocket 経由の Feishu/Lark ボット（バンドル済み Plugin）。
- [Google Chat](/ja-JP/channels/googlechat) — HTTP webhook 経由の Google Chat API アプリ（ダウンロード可能な Plugin）。
- [iMessage（レガシー）](/ja-JP/channels/imessage) — imsg CLI 経由のレガシー macOS 統合（非推奨。新規セットアップには BlueBubbles を使用してください）。
- [IRC](/ja-JP/channels/irc) — クラシック IRC サーバー。ペアリング/許可リスト制御付きのチャネル + DM。
- [LINE](/ja-JP/channels/line) — LINE Messaging API ボット（ダウンロード可能な Plugin）。
- [Matrix](/ja-JP/channels/matrix) — Matrix プロトコル（ダウンロード可能な Plugin）。
- [Mattermost](/ja-JP/channels/mattermost) — Bot API + WebSocket。チャネル、グループ、DM（ダウンロード可能な Plugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) — Bot Framework。エンタープライズサポート（バンドル済み Plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) — Nextcloud Talk 経由のセルフホスト型チャット（バンドル済み Plugin）。
- [Nostr](/ja-JP/channels/nostr) — NIP-04 経由の分散型 DM（バンドル済み Plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) — QQ Bot API。プライベートチャット、グループチャット、リッチメディア（バンドル済み Plugin）。
- [Signal](/ja-JP/channels/signal) — signal-cli。プライバシー重視。
- [Slack](/ja-JP/channels/slack) — Bolt SDK。ワークスペースアプリ。
- [Synology Chat](/ja-JP/channels/synology-chat) — 送信 + 受信 Webhook 経由の Synology NAS Chat（バンドル済み Plugin）。
- [Telegram](/ja-JP/channels/telegram) — grammY 経由の Bot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) — Urbit ベースのメッセンジャー（バンドル済み Plugin）。
- [Twitch](/ja-JP/channels/twitch) — IRC 接続経由の Twitch チャット（バンドル済み Plugin）。
- [Voice Call](/ja-JP/plugins/voice-call) — Plivo または Twilio 経由の電話通信（Plugin、別途インストール）。
- [WebChat](/ja-JP/web/webchat) — WebSocket 上の Gateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) — QR ログイン経由の Tencent iLink Bot Plugin。プライベートチャットのみ（外部 Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) — 最も人気があります。Baileys を使用し、QR ペアリングが必要です。
- [Yuanbao](/ja-JP/channels/yuanbao) — Tencent Yuanbao ボット（外部 Plugin）。
- [Zalo](/ja-JP/channels/zalo) — Zalo Bot API。ベトナムで人気のメッセンジャー（バンドル済み Plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) — QR ログイン経由の Zalo 個人アカウント（バンドル済み Plugin）。

## メモ

- チャネルは同時に実行できます。複数を構成すると、OpenClaw はチャットごとにルーティングします。
- 最速のセットアップは通常 **Telegram**（シンプルなボットトークン）です。WhatsApp は QR ペアリングが必要で、
  ディスク上により多くの状態を保存します。
- グループ動作はチャネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- 安全のため、DM ペアリングと許可リストが適用されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途文書化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
