---
read_when:
    - OpenClaw がサポートしている内容の完全な一覧を確認したい場合
summary: チャネル、ルーティング、メディア、UX 全体にわたる OpenClaw の機能。
title: 機能
x-i18n:
    generated_at: "2026-05-06T05:00:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## ハイライト

<Columns>
  <Card title="Channels" icon="message-square" href="/ja-JP/channels">
    1つの Gateway で Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat などを利用できます。
  </Card>
  <Card title="Plugins" icon="plug" href="/ja-JP/tools/plugin">
    バンドルされたPluginにより、通常の現行リリースでは個別インストールなしで Matrix、Nextcloud Talk、Nostr、Twitch、Zalo などを追加できます。
  </Card>
  <Card title="Routing" icon="route" href="/ja-JP/concepts/multi-agent">
    分離されたセッションによるマルチエージェントルーティング。
  </Card>
  <Card title="Media" icon="image" href="/ja-JP/nodes/images">
    画像、音声、動画、ドキュメント、画像/動画生成。
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/ja-JP/web/control-ui">
    Web Control UI と macOS コンパニオンアプリ。
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/ja-JP/nodes">
    ペアリング、音声/チャット、高機能なデバイスコマンドに対応した iOS と Android ノード。
  </Card>
</Columns>

## 全一覧

**チャンネル:**

- 組み込みチャンネルには Discord、Google Chat、iMessage（レガシー）、IRC、Signal、Slack、Telegram、WebChat、WhatsApp が含まれます
- バンドルされたPluginチャンネルには iMessage 用 BlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo、Zalo Personal が含まれます
- 任意で別途インストールするチャンネルPluginには、Voice Call や WeChat などのサードパーティパッケージが含まれます
- サードパーティのチャンネルPluginは、WeChat などで Gateway をさらに拡張できます
- メンションベースの有効化によるグループチャット対応
- 許可リストとペアリングによるDMの安全性

**エージェント:**

- ツールストリーミング対応の組み込みエージェントランタイム
- ワークスペースまたは送信者ごとに分離されたセッションによるマルチエージェントルーティング
- セッション: ダイレクトチャットは共有 `main` に統合されます。グループは分離されます
- 長い応答向けのストリーミングとチャンク分割

**認証とプロバイダー:**

- 35以上のモデルプロバイダー（Anthropic、OpenAI、Google など）
- OAuth 経由のサブスクリプション認証（例: OpenAI Codex）
- カスタムおよびセルフホストプロバイダー対応（vLLM、SGLang、Ollama、および任意の OpenAI 互換または Anthropic 互換エンドポイント）

**メディア:**

- 画像、音声、動画、ドキュメントの入出力
- 共有の画像生成および動画生成機能サーフェス
- 音声メモの文字起こし
- 複数プロバイダーによるテキスト読み上げ

**アプリとインターフェイス:**

- WebChat とブラウザー Control UI
- macOS メニューバーコンパニオンアプリ
- ペアリング、Canvas、カメラ、画面録画、位置情報、音声に対応した iOS ノード
- ペアリング、チャット、音声、Canvas、カメラ、デバイスコマンドに対応した Android ノード

**ツールと自動化:**

- ブラウザー自動化、exec、サンドボックス化
- Web 検索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cron ジョブと Heartbeat スケジューリング
- Skills、Plugin、ワークフローパイプライン（Lobster）

## 関連

<CardGroup cols={2}>
  <Card title="Experimental features" href="/ja-JP/concepts/experimental-features" icon="flask">
    デフォルトのサーフェスにはまだ出荷されていないオプトイン機能。
  </Card>
  <Card title="Agent runtime" href="/ja-JP/concepts/agent" icon="robot">
    エージェントランタイムモデルと実行のディスパッチ方法。
  </Card>
  <Card title="Channels" href="/ja-JP/channels" icon="message-square">
    1つの Gateway から Telegram、WhatsApp、Discord、Slack などに接続します。
  </Card>
  <Card title="Plugins" href="/ja-JP/tools/plugin" icon="plug">
    OpenClaw を拡張する、バンドルおよびサードパーティのPlugin。
  </Card>
</CardGroup>
