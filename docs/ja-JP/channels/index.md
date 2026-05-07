---
read_when:
    - OpenClaw のチャットチャンネルを選択したい
    - サポートされているメッセージングプラットフォームの概要をすばやく把握したい場合
summary: OpenClaw が接続できるメッセージングプラットフォーム
title: チャットチャネル
x-i18n:
    generated_at: "2026-05-07T01:50:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw は、すでに使っている任意のチャットアプリであなたとやり取りできます。各チャンネルは Gateway 経由で接続します。
テキストはすべての場所でサポートされています。メディアとリアクションはチャンネルによって異なります。

## 配信に関する注意

- `![alt](url)` のような Markdown 画像構文を含む Telegram の返信は、
  可能な場合、最終的な送信経路でメディア返信に変換されます。
- Slack の複数人 DM はグループチャットとしてルーティングされるため、グループポリシー、メンション
  動作、グループセッションルールが MPIM 会話に適用されます。
- WhatsApp のセットアップはオンデマンドインストールです。オンボーディングでは、
  Plugin パッケージがインストールされる前にセットアップフローを表示でき、Gateway は
  チャンネルが実際にアクティブな場合にのみ WhatsApp ランタイムを読み込みます。

## サポートされるチャンネル

- [BlueBubbles](/ja-JP/channels/bluebubbles) - BlueBubbles macOS サーバー REST API 経由のレガシー iMessage ブリッジ。新しい OpenClaw セットアップでは非推奨ですが、既存の設定とより豊富なプライベート API アクションでは引き続きサポートされます。
- [Discord](/ja-JP/channels/discord) - Discord Bot API + Gateway。サーバー、チャンネル、DM をサポートします。
- [Feishu](/ja-JP/channels/feishu) - WebSocket 経由の Feishu/Lark bot（バンドル済み Plugin）。
- [Google Chat](/ja-JP/channels/googlechat) - HTTP Webhook 経由の Google Chat API アプリ（ダウンロード可能な Plugin）。
- [iMessage](/ja-JP/channels/imessage) - imsg CLI 経由のネイティブ macOS 統合。ホスト権限と Messages アクセスが適合する場合、新しい OpenClaw iMessage セットアップに推奨されます。
- [IRC](/ja-JP/channels/irc) - 従来の IRC サーバー。ペアリング/許可リスト制御付きのチャンネル + DM。
- [LINE](/ja-JP/channels/line) - LINE Messaging API bot（ダウンロード可能な Plugin）。
- [Matrix](/ja-JP/channels/matrix) - Matrix プロトコル（ダウンロード可能な Plugin）。
- [Mattermost](/ja-JP/channels/mattermost) - Bot API + WebSocket。チャンネル、グループ、DM（ダウンロード可能な Plugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) - Bot Framework。エンタープライズサポート（バンドル済み Plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) - Nextcloud Talk 経由のセルフホスト型チャット（バンドル済み Plugin）。
- [Nostr](/ja-JP/channels/nostr) - NIP-04 経由の分散型 DM（バンドル済み Plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) - QQ Bot API。プライベートチャット、グループチャット、リッチメディア（バンドル済み Plugin）。
- [Signal](/ja-JP/channels/signal) - signal-cli。プライバシー重視。
- [Slack](/ja-JP/channels/slack) - Bolt SDK。ワークスペースアプリ。
- [Synology Chat](/ja-JP/channels/synology-chat) - 送信 + 受信 Webhook 経由の Synology NAS Chat（バンドル済み Plugin）。
- [Telegram](/ja-JP/channels/telegram) - grammY 経由の Bot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) - Urbit ベースのメッセンジャー（バンドル済み Plugin）。
- [Twitch](/ja-JP/channels/twitch) - IRC 接続経由の Twitch チャット（バンドル済み Plugin）。
- [Voice Call](/ja-JP/plugins/voice-call) - Plivo または Twilio 経由の電話機能（Plugin、別途インストール）。
- [WebChat](/ja-JP/web/webchat) - WebSocket 上の Gateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) - QR ログイン経由の Tencent iLink Bot Plugin。プライベートチャットのみ（外部 Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) - 最も人気があります。Baileys を使用し、QR ペアリングが必要です。
- [Yuanbao](/ja-JP/channels/yuanbao) - Tencent Yuanbao bot（外部 Plugin）。
- [Zalo](/ja-JP/channels/zalo) - Zalo Bot API。ベトナムで人気のメッセンジャー（バンドル済み Plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) - QR ログイン経由の Zalo 個人アカウント（バンドル済み Plugin）。

## 注記

- チャンネルは同時に実行できます。複数を設定すると、OpenClaw はチャットごとにルーティングします。
- 通常、最も速いセットアップは **Telegram**（単純な bot トークン）です。WhatsApp では QR ペアリングが必要で、
  ディスク上により多くの状態を保存します。
- グループ動作はチャンネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- 安全性のため、DM ペアリングと許可リストが適用されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途文書化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
