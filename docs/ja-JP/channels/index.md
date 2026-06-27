---
read_when:
    - OpenClaw のチャットチャネルを選択したい場合
    - 対応しているメッセージングプラットフォームの概要をすばやく確認する必要がある
summary: OpenClaw が接続できるメッセージングプラットフォーム
title: チャットチャネル
x-i18n:
    generated_at: "2026-06-27T10:36:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw は、すでに使っている任意のチャットアプリで会話できます。各チャネルは Gateway 経由で接続します。
テキストはすべての場所でサポートされますが、メディアとリアクションはチャネルによって異なります。

## 配信に関する注意

- `![alt](url)` のような markdown 画像構文を含む Telegram の返信は、
  可能な場合、最終的な送信経路でメディア返信に変換されます。
- Slack の複数人 DM はグループチャットとしてルーティングされるため、MPIM 会話にはグループポリシー、メンション
  動作、グループセッションルールが適用されます。
- WhatsApp のセットアップは必要時インストールです。オンボーディングでは
  Plugin パッケージがインストールされる前にセットアップフローを表示でき、Gateway はチャネルが実際に有効になったときだけ外部の
  ClawHub/npm Plugin を読み込みます。
- bot が作成した受信メッセージを受け付けるチャネルでは、共有の
  [bot ループ保護](/ja-JP/channels/bot-loop-protection)を使って、bot 同士が
  無期限に返信し合うのを防げます。
- サポート対象の常時接続ルームでは、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を使うことで、
  エージェントが `message` ツールで送信しない限り、メンションされていないルーム内の会話を静かなコンテキストにできます。

## サポートされているチャネル

- [Discord](/ja-JP/channels/discord) - Discord Bot API + Gateway。サーバー、チャネル、DM をサポートします。
- [Feishu](/ja-JP/channels/feishu) - WebSocket 経由の Feishu/Lark bot（同梱Plugin）。
- [Google Chat](/ja-JP/channels/googlechat) - HTTP Webhook 経由の Google Chat API アプリ（ダウンロード可能なPlugin）。
- [iMessage](/ja-JP/channels/imessage) - サインイン済み Mac 上の `imsg` ブリッジ（または Gateway が別の場所で動作している場合は SSH ラッパー）経由のネイティブ macOS 統合。返信、tapback、エフェクト、添付ファイル、グループ管理のためのプライベート API アクションを含みます。ホスト権限と Messages アクセスが適合する場合、新しい OpenClaw iMessage セットアップに推奨されます。
- [IRC](/ja-JP/channels/irc) - 従来型の IRC サーバー。ペアリング/許可リスト制御付きのチャネル + DM。
- [LINE](/ja-JP/channels/line) - LINE Messaging API bot（ダウンロード可能なPlugin）。
- [Matrix](/ja-JP/channels/matrix) - Matrix プロトコル（ダウンロード可能なPlugin）。
- [Mattermost](/ja-JP/channels/mattermost) - Bot API + WebSocket。チャネル、グループ、DM（ダウンロード可能なPlugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) - Bot Framework。エンタープライズサポート（同梱Plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) - Nextcloud Talk 経由のセルフホストチャット（同梱Plugin）。
- [Nostr](/ja-JP/channels/nostr) - NIP-04 経由の分散型 DM（同梱Plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) - QQ Bot API。プライベートチャット、グループチャット、リッチメディア（同梱Plugin）。
- [Raft](/ja-JP/channels/raft) - 人間とエージェントのコラボレーション向け Raft CLI ウェイクブリッジ（外部Plugin）。
- [Signal](/ja-JP/channels/signal) - signal-cli。プライバシー重視。
- [Slack](/ja-JP/channels/slack) - Bolt SDK。ワークスペースアプリ。
- [SMS](/ja-JP/channels/sms) - Gateway Webhook 経由の Twilio ベース SMS（公式Plugin）。
- [Synology Chat](/ja-JP/channels/synology-chat) - 送信+受信 Webhook 経由の Synology NAS Chat（同梱Plugin）。
- [Telegram](/ja-JP/channels/telegram) - grammY 経由の Bot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) - Urbit ベースのメッセンジャー（同梱Plugin）。
- [Twitch](/ja-JP/channels/twitch) - IRC 接続経由の Twitch チャット（同梱Plugin）。
- [Voice Call](/ja-JP/plugins/voice-call) - Plivo または Twilio 経由の電話機能（Plugin、別途インストール）。
- [WebChat](/ja-JP/web/webchat) - WebSocket 上の Gateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) - QR ログイン経由の Tencent iLink Bot Plugin。プライベートチャットのみ（外部Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) - 最も人気があります。Baileys を使用し、QR ペアリングが必要です。
- [Yuanbao](/ja-JP/channels/yuanbao) - Tencent Yuanbao bot（外部Plugin）。
- [Zalo](/ja-JP/channels/zalo) - Zalo Bot API。ベトナムで人気のメッセンジャー（同梱Plugin）。
- [Zalo ClawBot](/ja-JP/channels/zaloclawbot) - QR ログイン経由の個人用 Zalo アシスタント。所有者に紐づきます（外部Plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) - QR ログイン経由の Zalo 個人アカウント（同梱Plugin）。

## 注意

- チャネルは同時に実行できます。複数を設定すると、OpenClaw はチャットごとにルーティングします。
- 最速のセットアップは通常 **Telegram**（シンプルな bot トークン）です。WhatsApp は QR ペアリングが必要で、
  ディスク上により多くの状態を保存します。
- グループの動作はチャネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- 安全のため、DM ペアリングと許可リストが適用されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途文書化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
