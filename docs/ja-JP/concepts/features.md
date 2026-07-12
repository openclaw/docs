---
read_when:
    - OpenClaw がサポートする機能の完全な一覧を確認したい場合
summary: チャンネル、ルーティング、メディア、UX にわたる OpenClaw の機能。
title: 機能
x-i18n:
    generated_at: "2026-07-11T22:06:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## ハイライト

<Columns>
  <Card title="チャネル" icon="message-square" href="/ja-JP/channels">
    1つのGatewayでDiscord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChatなどを利用できます。
  </Card>
  <Card title="プラグイン" icon="plug" href="/ja-JP/tools/plugin">
    公式プラグインを1つのインストールコマンドで導入すると、Matrix、Nextcloud Talk、Nostr、Twitch、Zaloなど数十種類を追加できます。
  </Card>
  <Card title="ルーティング" icon="route" href="/ja-JP/concepts/multi-agent">
    分離されたセッションによるマルチエージェントルーティング。
  </Card>
  <Card title="メディア" icon="image" href="/ja-JP/nodes/images">
    画像、音声、動画、ドキュメント、および画像・動画の生成。
  </Card>
  <Card title="アプリとUI" icon="monitor" href="/ja-JP/platforms">
    Windows Hub、ブラウザ版Control UI、macOSメニューバーアプリ、モバイルNode。
  </Card>
  <Card title="モバイルNode" icon="smartphone" href="/ja-JP/nodes">
    ペアリング、音声・チャット、豊富なデバイスコマンドに対応したiOSおよびAndroid Node。
  </Card>
</Columns>

## 全機能一覧

**チャネル：**

- iMessage、Telegram、WebChatはコアインストールに同梱されています。その他のチャネルはすべて、
  `openclaw plugins install @openclaw/<id>`でインストールする公式プラグインです
  （または`openclaw onboard` / `openclaw channels add`の実行中に必要に応じてインストールできます）
- 公式プラグインチャネル：Discord、Feishu、Google Chat、IRC、LINE、Matrix、Mattermost、
  Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Raft、Signal、Slack、SMS、Synology Chat、
  Tlon、Twitch、Voice Call、WhatsApp、Zalo、Zalo Personal
- OpenClawリポジトリ外で管理される外部プラグインチャネル：WeChat、Yuanbao、Zalo ClawBot
- メンションによる有効化に対応したグループチャット
- 許可リストとペアリングによるDMの安全対策

**エージェント：**

- ツールストリーミングに対応した組み込みエージェントランタイム
- ワークスペースまたは送信者ごとに分離されたセッションによるマルチエージェントルーティング
- セッション：ダイレクトチャットは共有`main`に統合され、グループは分離されます
- 長い応答のストリーミングとチャンク分割

**認証とプロバイダー：**

- 35種類以上のモデルプロバイダー（Anthropic、OpenAI、Googleなど）
- OAuthによるサブスクリプション認証（OpenAI Codexなど）
- カスタムおよびセルフホスト型プロバイダーをサポート（vLLM、SGLang、Ollama、llama.cpp、LM Studio、および
  OpenAI互換またはAnthropic互換の任意のエンドポイント）

**メディア：**

- 画像、音声、動画、ドキュメントの送受信
- 共通の画像生成および動画生成機能のサーフェス
- ボイスメモの文字起こし
- 複数のプロバイダーによる音声合成

**アプリとインターフェース：**

- WebChatとブラウザ版Control UI
- macOSメニューバー用コンパニオンアプリ
- ペアリング、Canvas、カメラ、画面収録、位置情報、音声に対応したiOS Node
- ペアリング、チャット、音声、Canvas、カメラ、デバイスコマンドに対応したAndroid Node

**ツールと自動化：**

- ブラウザ自動化、コマンド実行、サンドボックス化
- Web検索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- CronジョブとHeartbeatのスケジュール設定
- Skills、プラグイン、ワークフローパイプライン（Lobster）

## 関連項目

<CardGroup cols={2}>
  <Card title="実験的機能" href="/ja-JP/concepts/experimental-features" icon="flask">
    デフォルトのサーフェスにはまだリリースされていない、オプトイン形式の機能。
  </Card>
  <Card title="エージェントランタイム" href="/ja-JP/concepts/agent" icon="robot">
    エージェントランタイムモデルと実行の振り分け方法。
  </Card>
  <Card title="チャネル" href="/ja-JP/channels" icon="message-square">
    1つのGatewayからTelegram、WhatsApp、Discord、Slackなどに接続できます。
  </Card>
  <Card title="プラグイン" href="/ja-JP/tools/plugin" icon="plug">
    OpenClawを拡張する公式および外部プラグイン。
  </Card>
</CardGroup>
