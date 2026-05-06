---
read_when:
    - OpenClaw 用のチャットチャネルを選択したい
    - サポートされているメッセージングプラットフォームを手早く把握したい場合
summary: OpenClawが接続できるメッセージングプラットフォーム
title: チャットチャンネル
x-i18n:
    generated_at: "2026-05-06T04:57:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw は、すでに使っているどのチャットアプリでもあなたと会話できます。各チャネルは Gateway 経由で接続します。
テキストはすべての場所でサポートされています。メディアとリアクションはチャネルによって異なります。

## 配信に関する注意

- `![alt](url)` のような Markdown 画像構文を含む Telegram の返信は、
  可能な場合、最終的な送信経路でメディア返信に変換されます。
- Slack の複数人 DM はグループチャットとしてルーティングされるため、グループポリシー、メンション
  動作、グループセッションルールが MPIM 会話に適用されます。
- WhatsApp のセットアップはオンデマンドインストールです。オンボーディングでは、
  Plugin パッケージがインストールされる前にセットアップフローを表示でき、Gateway は
  チャネルが実際にアクティブな場合にのみ WhatsApp ランタイムを読み込みます。

## サポートされているチャネル

- [BlueBubbles](/ja-JP/channels/bluebubbles) - **iMessage に推奨**。フル機能対応の BlueBubbles macOS サーバー REST API を使用します（バンドル Plugin、編集、送信取り消し、エフェクト、リアクション、グループ管理 - 編集は現在 macOS 26 Tahoe で壊れています）。
- [Discord](/ja-JP/channels/discord) - Discord Bot API + Gateway。サーバー、チャネル、DM をサポートします。
- [Feishu](/ja-JP/channels/feishu) - WebSocket 経由の Feishu/Lark bot（バンドル Plugin）。
- [Google Chat](/ja-JP/channels/googlechat) - HTTP Webhook 経由の Google Chat API アプリ（ダウンロード可能な Plugin）。
- [iMessage (レガシー)](/ja-JP/channels/imessage) - imsg CLI 経由のレガシー macOS 連携（非推奨。新しいセットアップには BlueBubbles を使用してください）。
- [IRC](/ja-JP/channels/irc) - 従来型の IRC サーバー。ペアリング/許可リスト制御付きのチャネル + DM。
- [LINE](/ja-JP/channels/line) - LINE Messaging API bot（ダウンロード可能な Plugin）。
- [Matrix](/ja-JP/channels/matrix) - Matrix プロトコル（ダウンロード可能な Plugin）。
- [Mattermost](/ja-JP/channels/mattermost) - Bot API + WebSocket。チャネル、グループ、DM（ダウンロード可能な Plugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) - Bot Framework。エンタープライズサポート（バンドル Plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) - Nextcloud Talk 経由のセルフホスト型チャット（バンドル Plugin）。
- [Nostr](/ja-JP/channels/nostr) - NIP-04 経由の分散型 DM（バンドル Plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) - QQ Bot API。プライベートチャット、グループチャット、リッチメディア（バンドル Plugin）。
- [Signal](/ja-JP/channels/signal) - signal-cli。プライバシー重視。
- [Slack](/ja-JP/channels/slack) - Bolt SDK。ワークスペースアプリ。
- [Synology Chat](/ja-JP/channels/synology-chat) - 送信 + 受信 Webhook 経由の Synology NAS Chat（バンドル Plugin）。
- [Telegram](/ja-JP/channels/telegram) - grammY 経由の Bot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) - Urbit ベースのメッセンジャー（バンドル Plugin）。
- [Twitch](/ja-JP/channels/twitch) - IRC 接続経由の Twitch チャット（バンドル Plugin）。
- [Voice Call](/ja-JP/plugins/voice-call) - Plivo または Twilio 経由の電話機能（Plugin、別途インストール）。
- [WebChat](/ja-JP/web/webchat) - WebSocket 上の Gateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) - QR ログイン経由の Tencent iLink Bot Plugin。プライベートチャットのみ（外部 Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) - 最も人気があります。Baileys を使用し、QR ペアリングが必要です。
- [Yuanbao](/ja-JP/channels/yuanbao) - Tencent Yuanbao bot（外部 Plugin）。
- [Zalo](/ja-JP/channels/zalo) - Zalo Bot API。ベトナムで人気のメッセンジャー（バンドル Plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) - QR ログイン経由の Zalo 個人アカウント（バンドル Plugin）。

## 注記

- チャネルは同時に実行できます。複数を設定すると、OpenClaw がチャットごとにルーティングします。
- 最も速いセットアップは通常 **Telegram** です（単純な bot トークン）。WhatsApp には QR ペアリングが必要で、
  より多くの状態をディスクに保存します。
- グループ動作はチャネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- 安全のため、DM ペアリングと許可リストが強制されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途ドキュメント化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
