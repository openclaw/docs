---
read_when:
    - OpenClaw用のチャットチャネルを選択する場合
    - 対応しているメッセージングプラットフォームの概要をすぐに確認したい場合
summary: OpenClaw が接続できるメッセージングプラットフォーム
title: チャットチャネル
x-i18n:
    generated_at: "2026-07-14T13:27:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClawは、すでに使用しているどのチャットアプリでも対話できます。各チャンネルはGatewayを介して接続されます。
テキストはすべてのチャンネルでサポートされていますが、メディアとリアクションはチャンネルによって異なります。

iMessage、Telegram、WebChat UIはコアインストールに同梱されています。
「公式Plugin」と記載されたチャンネルは、1つのコマンド（`openclaw plugins install @openclaw/<id>`）、
または`openclaw onboard` / `openclaw channels add`の実行中に必要に応じてインストールでき、その後Gatewayの
再起動が必要です。「外部Plugin」チャンネルはOpenClawリポジトリの外部でメンテナンスされています。

## サポートされているチャンネル

- [Discord](/ja-JP/channels/discord) - Discord Bot API + Gateway。サーバー、チャンネル、DMをサポート（公式Plugin）。
- [Feishu](/ja-JP/channels/feishu) - WebSocket経由のFeishu/Larkボット（公式Plugin）。
- [Google Chat](/ja-JP/channels/googlechat) - HTTP Webhook経由のGoogle Chat APIアプリ（公式Plugin）。
- [iMessage](/ja-JP/channels/imessage) - コアに同梱。サインイン済みのMac上の`imsg`ブリッジ（またはGatewayが別の場所で動作している場合はSSHラッパー）を介したネイティブmacOS統合。返信、Tapback、エフェクト、添付ファイル、グループ管理用のプライベートAPIアクションを含みます。
- [IRC](/ja-JP/channels/irc) - 従来型のIRCサーバー。ペアリング/許可リスト制御付きのチャンネルとDM（公式Plugin）。
- [LINE](/ja-JP/channels/line) - LINE Messaging APIボット（公式Plugin）。
- [Matrix](/ja-JP/channels/matrix) - Matrixプロトコル（公式Plugin）。
- [Mattermost](/ja-JP/channels/mattermost) - Bot API + WebSocket。チャンネル、グループ、DMに対応（公式Plugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) - Bot Framework。エンタープライズ対応（公式Plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) - Nextcloud Talkによるセルフホスト型チャット（公式Plugin）。
- [Nostr](/ja-JP/channels/nostr) - NIP-04による分散型DM（公式Plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) - QQ Bot API。プライベートチャット、グループチャット、リッチメディアに対応（公式Plugin）。
- [Reef](/channels/reef) - 異なるユーザーのOpenClawエージェント間で、保護されたエンドツーエンド暗号化によるclaw間メッセージングを提供（同梱Plugin）。
- [Raft](/ja-JP/channels/raft) - 人間とエージェントの共同作業向けRaft CLIウェイクブリッジ（公式Plugin）。
- [Signal](/ja-JP/channels/signal) - signal-cli。プライバシー重視（公式Plugin）。
- [Slack](/ja-JP/channels/slack) - Bolt SDK。ワークスペースアプリ（公式Plugin）。
- [SMS](/ja-JP/channels/sms) - Gateway Webhookを介したTwilioベースのSMS（公式Plugin）。
- [Synology Chat](/ja-JP/channels/synology-chat) - 送信+受信Webhookを介したSynology NAS Chat（公式Plugin）。
- [Telegram](/ja-JP/channels/telegram) - コアに同梱。grammY経由のBot API。グループをサポート。
- [Tlon](/ja-JP/channels/tlon) - Urbitベースのメッセンジャー（公式Plugin）。
- [Twitch](/ja-JP/channels/twitch) - IRC接続経由のTwitchチャット（公式Plugin）。
- [音声通話](/ja-JP/plugins/voice-call) - Plivo、Telnyx、Twilio経由の電話通信（公式Plugin）。
- [WebChat](/ja-JP/web/webchat) - コアに同梱。WebSocket経由のGateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) - QRログインを使用するTencent iLinkボット。プライベートチャットのみ（外部Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) - 最も人気。Baileysを使用し、QRペアリングが必要（公式Plugin）。
- [Yuanbao](/ja-JP/channels/yuanbao) - Tencent Yuanbaoボット（外部Plugin）。
- [Zalo](/ja-JP/channels/zalo) - Zalo Bot API。ベトナムで人気のメッセンジャー（公式Plugin）。
- [Zalo ClawBot](/ja-JP/channels/zaloclawbot) - QRログインを使用する個人用Zaloアシスタント。所有者に紐付けられます（外部Plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) - QRログインを使用するZalo個人アカウント（公式Plugin）。

## 配信に関する注意事項

- `![alt](url)`のようなMarkdown画像構文を含むTelegramの返信は、
  可能な場合、最終的な送信処理でメディア返信に変換されます。
- Slackの複数人DMはグループチャットとしてルーティングされるため、グループポリシー、メンションの
  動作、グループセッションのルールがMPIM会話に適用されます。
- WhatsAppのセットアップはオンデマンドインストール方式です。オンボーディングでは、
  Pluginパッケージのインストール前にセットアップフローを表示でき、Gatewayはチャンネルが実際に
  アクティブな場合にのみ外部のClawHub/npm Pluginを読み込みます。
- ボットが作成した受信メッセージを受け入れるチャンネルでは、共有の
  [ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用して、ボット同士が
  無期限に返信し続けるのを防止できます。
- サポートされている常時稼働ルームでは、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を使用できます。
  これにより、メンションのないルーム内の会話は、エージェントが`message`ツールで
  送信しない限り、目立たないコンテキストになります。

## 注記

- チャンネルは同時に実行できます。複数を設定すると、OpenClawがチャットごとにルーティングします。
- 通常、最も迅速にセットアップできるのは**Telegram**です（シンプルなボットトークンで、Pluginのインストールは不要）。WhatsAppは
  QRペアリングが必要で、ディスク上により多くの状態を保存します。
- グループの動作はチャンネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- 安全のため、DMのペアリングと許可リストが適用されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング：[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーについては別途文書化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
