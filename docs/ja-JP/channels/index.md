---
read_when:
    - OpenClaw のチャットチャネルを選択する場合
    - 対応しているメッセージングプラットフォームの概要をすばやく確認したい場合
summary: OpenClaw が接続できるメッセージングプラットフォーム
title: チャットチャンネル
x-i18n:
    generated_at: "2026-07-11T22:00:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw は、すでに使用しているどのチャットアプリでもあなたと会話できます。各チャンネルは Gateway 経由で接続します。
テキストはすべてのチャンネルでサポートされていますが、メディアとリアクションへの対応はチャンネルによって異なります。

iMessage、Telegram、WebChat UI はコアインストールに含まれています。「公式 Plugin」と記載されたチャンネルは、1 つのコマンド（`openclaw plugins install @openclaw/<id>`）で、または `openclaw onboard` / `openclaw channels add` の実行時にオンデマンドでインストールでき、その後 Gateway の再起動が必要です。「外部 Plugin」のチャンネルは OpenClaw リポジトリ外で保守されています。

## サポートされているチャンネル

- [Discord](/ja-JP/channels/discord) - Discord Bot API + Gateway。サーバー、チャンネル、DM をサポート（公式 Plugin）。
- [Feishu](/ja-JP/channels/feishu) - WebSocket 経由の Feishu/Lark ボット（公式 Plugin）。
- [Google Chat](/ja-JP/channels/googlechat) - HTTP Webhook 経由の Google Chat API アプリ（公式 Plugin）。
- [iMessage](/ja-JP/channels/imessage) - コアに含まれています。サインイン済みの Mac 上で `imsg` ブリッジを使用するネイティブ macOS 統合（Gateway が別の場所で動作している場合は SSH ラッパーを使用）。返信、Tapback、エフェクト、添付ファイル、グループ管理のためのプライベート API アクションも含まれます。
- [IRC](/ja-JP/channels/irc) - 従来型の IRC サーバー。ペアリングと許可リストによる制御を備えたチャンネル + DM（公式 Plugin）。
- [LINE](/ja-JP/channels/line) - LINE Messaging API ボット（公式 Plugin）。
- [Matrix](/ja-JP/channels/matrix) - Matrix プロトコル（公式 Plugin）。
- [Mattermost](/ja-JP/channels/mattermost) - Bot API + WebSocket。チャンネル、グループ、DM に対応（公式 Plugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) - Bot Framework。エンタープライズ対応（公式 Plugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) - Nextcloud Talk 経由のセルフホスト型チャット（公式 Plugin）。
- [Nostr](/ja-JP/channels/nostr) - NIP-04 経由の分散型 DM（公式 Plugin）。
- [QQ Bot](/ja-JP/channels/qqbot) - QQ Bot API。プライベートチャット、グループチャット、リッチメディアに対応（公式 Plugin）。
- [Raft](/ja-JP/channels/raft) - 人間とエージェントの共同作業向け Raft CLI ウェイクブリッジ（公式 Plugin）。
- [Signal](/ja-JP/channels/signal) - signal-cli。プライバシー重視（公式 Plugin）。
- [Slack](/ja-JP/channels/slack) - Bolt SDK。ワークスペースアプリ（公式 Plugin）。
- [SMS](/ja-JP/channels/sms) - Gateway Webhook を介した Twilio ベースの SMS（公式 Plugin）。
- [Synology Chat](/ja-JP/channels/synology-chat) - 送信 + 受信 Webhook を介した Synology NAS Chat（公式 Plugin）。
- [Telegram](/ja-JP/channels/telegram) - コアに含まれています。grammY を使用した Bot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) - Urbit ベースのメッセンジャー（公式 Plugin）。
- [Twitch](/ja-JP/channels/twitch) - IRC 接続経由の Twitch チャット（公式 Plugin）。
- [音声通話](/ja-JP/plugins/voice-call) - Plivo、Telnyx、または Twilio を使用した電話通信（公式 Plugin）。
- [WebChat](/ja-JP/web/webchat) - コアに含まれています。WebSocket 経由の Gateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) - QR ログインを使用する Tencent iLink ボット。プライベートチャットのみに対応（外部 Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) - 最も人気があります。Baileys を使用し、QR ペアリングが必要です（公式 Plugin）。
- [Yuanbao](/ja-JP/channels/yuanbao) - Tencent Yuanbao ボット（外部 Plugin）。
- [Zalo](/ja-JP/channels/zalo) - Zalo Bot API。ベトナムで人気のメッセンジャー（公式 Plugin）。
- [Zalo ClawBot](/ja-JP/channels/zaloclawbot) - QR ログインを使用する個人用 Zalo アシスタント。所有者に紐付けられます（外部 Plugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) - QR ログインを使用する Zalo 個人アカウント（公式 Plugin）。

## 配信に関する注意事項

- `![alt](url)` のような Markdown の画像構文を含む Telegram の返信は、可能な場合、最終送信経路でメディア返信に変換されます。
- Slack の複数人 DM はグループチャットとしてルーティングされるため、グループポリシー、メンション動作、グループセッションのルールが MPIM 会話に適用されます。
- WhatsApp のセットアップはオンデマンドインストール方式です。オンボーディングでは Plugin パッケージがインストールされる前にセットアップフローを表示でき、Gateway はチャンネルが実際に有効な場合にのみ外部の ClawHub/npm Plugin を読み込みます。
- ボットが作成した受信メッセージを受け付けるチャンネルでは、共有の[ボットループ保護](/ja-JP/channels/bot-loop-protection)を使用して、ボット同士が無期限に返信し続けるのを防止できます。
- 対応している常時稼働ルームでは、[アンビエントルームイベント](/ja-JP/channels/ambient-room-events)を使用できます。これにより、エージェントが `message` ツールで送信しない限り、メンションを伴わないルーム内の会話は控えめなコンテキストとして扱われます。

## 注記

- チャンネルは同時に実行できます。複数のチャンネルを設定すると、OpenClaw がチャットごとにルーティングします。
- 通常、最も迅速にセットアップできるのは **Telegram** です（単純なボットトークンのみで、Plugin のインストールは不要）。WhatsApp では QR ペアリングが必要で、ディスク上により多くの状態を保存します。
- グループでの動作はチャンネルによって異なります。[グループ](/ja-JP/channels/groups)を参照してください。
- 安全のため、DM のペアリングと許可リストが適用されます。[セキュリティ](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング：[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーについては別途文書化されています。[モデルプロバイダー](/ja-JP/providers/models)を参照してください。
