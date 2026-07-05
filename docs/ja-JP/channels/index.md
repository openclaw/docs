---
read_when:
    - OpenClaw のチャットチャネルを選択する
    - サポートされているメッセージングプラットフォームの概要をすばやく把握したい
summary: OpenClaw が接続できるメッセージングプラットフォーム
title: チャットチャネル
x-i18n:
    generated_at: "2026-07-05T11:04:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw は、すでに使用している任意のチャットアプリで会話できます。各チャネルは Gateway 経由で接続します。
テキストはどこでもサポートされていますが、メディアとリアクションはチャネルによって異なります。

iMessage、Telegram、WebChat UI はコアインストールに含まれています。「official plugin」と示されたチャネルは、1 つのコマンド（`openclaw plugins install @openclaw/<id>`）でインストールできます。
または `openclaw onboard` / `openclaw channels add` の実行時にオンデマンドでインストールでき、その後 Gateway
の再起動が必要です。「External plugin」チャネルは OpenClaw リポジトリの外部で保守されています。

## サポートされるチャネル

- [Discord](/ja-JP/channels/discord) - Discord Bot API + Gateway。サーバー、チャネル、DM をサポート（official plugin）。
- [Feishu](/ja-JP/channels/feishu) - WebSocket 経由の Feishu/Lark ボット（official plugin）。
- [Google Chat](/ja-JP/channels/googlechat) - HTTP webhook 経由の Google Chat API アプリ（official plugin）。
- [iMessage](/ja-JP/channels/imessage) - コアに含まれています。サインイン済みの Mac 上の `imsg` ブリッジ（または Gateway が別の場所で実行される場合の SSH ラッパー）を介したネイティブ macOS 統合。返信、タップバック、エフェクト、添付ファイル、グループ管理のためのプライベート API アクションを含みます。
- [IRC](/ja-JP/channels/irc) - 従来型の IRC サーバー。ペアリング/許可リスト制御付きのチャネル + DM（official plugin）。
- [LINE](/ja-JP/channels/line) - LINE Messaging API ボット（official plugin）。
- [Matrix](/ja-JP/channels/matrix) - Matrix プロトコル（official plugin）。
- [Mattermost](/ja-JP/channels/mattermost) - Bot API + WebSocket。チャネル、グループ、DM（official plugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) - Bot Framework。エンタープライズサポート（official plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) - Nextcloud Talk 経由のセルフホスト型チャット（official plugin）。
- [Nostr](/ja-JP/channels/nostr) - NIP-04 経由の分散型 DM（official plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) - QQ Bot API。プライベートチャット、グループチャット、リッチメディア（official plugin）。
- [Raft](/ja-JP/channels/raft) - 人間とエージェントの協働のための Raft CLI ウェイクブリッジ（official plugin）。
- [Signal](/ja-JP/channels/signal) - signal-cli。プライバシー重視（official plugin）。
- [Slack](/ja-JP/channels/slack) - Bolt SDK。ワークスペースアプリ（official plugin）。
- [SMS](/ja-JP/channels/sms) - Gateway webhook を通じた Twilio ベースの SMS（official plugin）。
- [Synology Chat](/ja-JP/channels/synology-chat) - 送信 + 受信 webhook 経由の Synology NAS Chat（official plugin）。
- [Telegram](/ja-JP/channels/telegram) - コアに含まれています。grammY 経由の Bot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) - Urbit ベースのメッセンジャー（official plugin）。
- [Twitch](/ja-JP/channels/twitch) - IRC 接続経由の Twitch チャット（official plugin）。
- [Voice Call](/ja-JP/plugins/voice-call) - Plivo、Telnyx、または Twilio 経由の電話機能（official plugin）。
- [WebChat](/ja-JP/web/webchat) - コアに含まれています。WebSocket 経由の Gateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) - QR ログイン経由の Tencent iLink ボット。プライベートチャットのみ（external plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) - 最も人気があります。Baileys を使用し、QR ペアリングが必要です（official plugin）。
- [Yuanbao](/ja-JP/channels/yuanbao) - Tencent Yuanbao ボット（external plugin）。
- [Zalo](/ja-JP/channels/zalo) - Zalo Bot API。ベトナムで人気のメッセンジャー（official plugin）。
- [Zalo ClawBot](/ja-JP/channels/zaloclawbot) - QR ログイン経由の個人用 Zalo アシスタント。所有者に紐づきます（external plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) - QR ログイン経由の Zalo 個人アカウント（official plugin）。

## 配信メモ

- `![alt](url)` のような Markdown 画像構文を含む Telegram の返信は、可能な場合、最終的な送信パスでメディア返信に変換されます。
- Slack の複数人 DM はグループチャットとしてルーティングされるため、グループポリシー、メンション
  動作、グループセッションルールが MPIM 会話に適用されます。
- WhatsApp のセットアップはオンデマンドインストールです。オンボーディングでは、Plugin パッケージがインストールされる前にセットアップフローを表示でき、Gateway はチャネルが実際にアクティブになったときにのみ外部の ClawHub/npm Plugin を読み込みます。
- ボット作成の受信メッセージを受け入れるチャネルは、共有の
  [ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用して、ボット同士が無期限に返信し合うのを防げます。
- サポートされる常時接続ルームでは、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)
  を使用できます。これにより、エージェントが `message` ツールで送信しない限り、メンションされていないルーム内の雑談は静かなコンテキストになります。

## メモ

- チャネルは同時に実行できます。複数を設定すると、OpenClaw はチャットごとにルーティングします。
- 最速のセットアップは通常 **Telegram** です（シンプルなボットトークンで、Plugin インストール不要）。WhatsApp
  には QR ペアリングが必要で、より多くの状態をディスクに保存します。
- グループ動作はチャネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- DM ペアリングと許可リストは安全のために適用されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途文書化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
