---
read_when:
    - OpenClaw が対応しているものの完全な一覧を確認したい場合
summary: チャネル、ルーティング、メディア、UX 全体にわたる OpenClaw の機能。
title: 機能
x-i18n:
    generated_at: "2026-05-10T19:30:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## ハイライト

<Columns>
  <Card title="チャンネル" icon="message-square" href="/ja-JP/channels">
    単一の Gateway で Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat などを利用できます。
  </Card>
  <Card title="Plugins" icon="plug" href="/ja-JP/tools/plugin">
    バンドル済み plugins により、通常の現行リリースでは個別インストールなしで Matrix、Nextcloud Talk、Nostr、Twitch、Zalo などを追加できます。
  </Card>
  <Card title="ルーティング" icon="route" href="/ja-JP/concepts/multi-agent">
    分離されたセッションによるマルチエージェントルーティング。
  </Card>
  <Card title="メディア" icon="image" href="/ja-JP/nodes/images">
    画像、音声、動画、ドキュメント、および画像/動画生成。
  </Card>
  <Card title="アプリと UI" icon="monitor" href="/ja-JP/web/control-ui">
    Web Control UI と macOS コンパニオンアプリ。
  </Card>
  <Card title="モバイルノード" icon="smartphone" href="/ja-JP/nodes">
    ペアリング、音声/チャット、豊富なデバイスコマンドを備えた iOS と Android ノード。
  </Card>
</Columns>

## 完全な一覧

**チャンネル:**

- 組み込みチャンネルには Discord、Google Chat、iMessage、IRC、Signal、Slack、Telegram、WebChat、WhatsApp が含まれます
- バンドル済み plugin チャンネルには Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo、Zalo Personal が含まれます
- 任意で個別にインストールするチャンネル plugins には Voice Call や WeChat などのサードパーティパッケージが含まれます
- サードパーティのチャンネル plugins は、WeChat などにより Gateway をさらに拡張できます
- メンションベースの有効化によるグループチャット対応
- 許可リストとペアリングによる DM の安全性

**エージェント:**

- ツールストリーミングを備えた組み込みエージェントランタイム
- ワークスペースまたは送信者ごとに分離されたセッションによるマルチエージェントルーティング
- セッション: ダイレクトチャットは共有 `main` に集約され、グループは分離されます
- 長い応答向けのストリーミングとチャンク分割

**認証とプロバイダー:**

- 35 以上のモデルプロバイダー (Anthropic、OpenAI、Google など)
- OAuth 経由のサブスクリプション認証 (例: OpenAI Codex)
- カスタムおよびセルフホストのプロバイダー対応 (vLLM、SGLang、Ollama、および任意の OpenAI 互換または Anthropic 互換エンドポイント)

**メディア:**

- 画像、音声、動画、ドキュメントの入出力
- 共有の画像生成および動画生成機能サーフェス
- ボイスメモの文字起こし
- 複数プロバイダーによるテキスト読み上げ

**アプリとインターフェイス:**

- WebChat とブラウザー Control UI
- macOS メニューバーコンパニオンアプリ
- ペアリング、Canvas、カメラ、画面録画、位置情報、音声を備えた iOS ノード
- ペアリング、チャット、音声、Canvas、カメラ、デバイスコマンドを備えた Android ノード

**ツールと自動化:**

- ブラウザー自動化、exec、サンドボックス化
- Web 検索 (Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily)
- Cron ジョブと Heartbeat スケジューリング
- Skills、plugins、ワークフローパイプライン (Lobster)

## 関連

<CardGroup cols={2}>
  <Card title="実験的機能" href="/ja-JP/concepts/experimental-features" icon="flask">
    まだデフォルトのサーフェスには出荷されていないオプトイン機能。
  </Card>
  <Card title="エージェントランタイム" href="/ja-JP/concepts/agent" icon="robot">
    エージェントランタイムモデルと実行のディスパッチ方法。
  </Card>
  <Card title="チャンネル" href="/ja-JP/channels" icon="message-square">
    1 つの Gateway から Telegram、WhatsApp、Discord、Slack などに接続します。
  </Card>
  <Card title="Plugins" href="/ja-JP/tools/plugin" icon="plug">
    OpenClaw を拡張するバンドル済みおよびサードパーティの plugins。
  </Card>
</CardGroup>
