---
read_when:
    - OpenClaw がサポートする内容の完全な一覧を確認したい場合
summary: OpenClaw のチャネル、ルーティング、メディア、UX 全体の機能。
title: 機能
x-i18n:
    generated_at: "2026-07-05T11:17:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## ハイライト

<Columns>
  <Card title="チャンネル" icon="message-square" href="/ja-JP/channels">
    単一の Gateway で Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat などを利用できます。
  </Card>
  <Card title="Plugin" icon="plug" href="/ja-JP/tools/plugin">
    公式プラグインは、1つのインストールコマンドで Matrix、Nextcloud Talk、Nostr、Twitch、Zalo など数十種類を追加します。
  </Card>
  <Card title="ルーティング" icon="route" href="/ja-JP/concepts/multi-agent">
    分離されたセッションによるマルチエージェントルーティング。
  </Card>
  <Card title="メディア" icon="image" href="/ja-JP/nodes/images">
    画像、音声、動画、ドキュメント、画像/動画生成。
  </Card>
  <Card title="アプリと UI" icon="monitor" href="/ja-JP/platforms">
    Windows Hub、ブラウザー Control UI、macOS メニューバーアプリ、モバイルノード。
  </Card>
  <Card title="モバイルノード" icon="smartphone" href="/ja-JP/nodes">
    ペアリング、音声/チャット、豊富なデバイスコマンドに対応した iOS と Android ノード。
  </Card>
</Columns>

## 完全な一覧

**チャンネル:**

- iMessage、Telegram、WebChat はコアインストールに同梱されています。それ以外のすべてのチャンネルは
  `openclaw plugins install @openclaw/<id>` でインストールされる公式 Plugin です（または `openclaw onboard` /
  `openclaw channels add` の実行中にオンデマンドでインストールされます）
- 公式 Plugin チャンネル: Discord、Feishu、Google Chat、IRC、LINE、Matrix、Mattermost、
  Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Raft、Signal、Slack、SMS、Synology Chat、
  Tlon、Twitch、Voice Call、WhatsApp、Zalo、Zalo Personal
- OpenClaw リポジトリ外で保守されている外部 Plugin チャンネル: WeChat、Yuanbao、Zalo ClawBot
- メンションベースの有効化によるグループチャット対応
- allowlist とペアリングによる DM の安全性

**エージェント:**

- ツールストリーミング対応の組み込みエージェントランタイム
- ワークスペースまたは送信者ごとに分離されたセッションによるマルチエージェントルーティング
- セッション: ダイレクトチャットは共有 `main` に集約され、グループは分離されます
- 長い応答のストリーミングと分割

**認証とプロバイダー:**

- 35以上のモデルプロバイダー（Anthropic、OpenAI、Google など）
- OAuth によるサブスクリプション認証（例: OpenAI Codex）
- カスタムおよびセルフホストのプロバイダー対応（vLLM、SGLang、Ollama、llama.cpp、LM Studio、および
  OpenAI 互換または Anthropic 互換の任意のエンドポイント）

**メディア:**

- 画像、音声、動画、ドキュメントの入出力
- 共有の画像生成および動画生成ケイパビリティサーフェス
- ボイスメモの文字起こし
- 複数プロバイダーによるテキスト読み上げ

**アプリとインターフェイス:**

- WebChat とブラウザー Control UI
- macOS メニューバーのコンパニオンアプリ
- ペアリング、Canvas、カメラ、画面収録、位置情報、音声に対応した iOS ノード
- ペアリング、チャット、音声、Canvas、カメラ、デバイスコマンドに対応した Android ノード

**ツールと自動化:**

- ブラウザー自動化、exec、サンドボックス化
- Web 検索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cron ジョブと Heartbeat スケジューリング
- Skills、Plugin、ワークフローパイプライン（Lobster）

## 関連

<CardGroup cols={2}>
  <Card title="実験的機能" href="/ja-JP/concepts/experimental-features" icon="flask">
    まだデフォルトサーフェスに出荷されていないオプトイン機能。
  </Card>
  <Card title="エージェントランタイム" href="/ja-JP/concepts/agent" icon="robot">
    エージェントランタイムモデルと、実行がディスパッチされる仕組み。
  </Card>
  <Card title="チャンネル" href="/ja-JP/channels" icon="message-square">
    1つの Gateway から Telegram、WhatsApp、Discord、Slack などに接続します。
  </Card>
  <Card title="Plugin" href="/ja-JP/tools/plugin" icon="plug">
    OpenClaw を拡張する公式および外部 Plugin。
  </Card>
</CardGroup>
