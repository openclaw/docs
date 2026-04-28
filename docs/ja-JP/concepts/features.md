---
read_when:
    - OpenClaw がサポートしている内容の完全な一覧が欲しい場合
summary: チャンネル、ルーティング、メディア、UX 全体にわたる OpenClaw の機能。
title: 機能
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T04:53:16Z"
  model: gpt-5.4
  provider: openai
  source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
  source_path: concepts/features.md
  workflow: 15
---

## ハイライト

<Columns>
  <Card title="チャンネル" icon="message-square" href="/ja-JP/channels">
    単一の Gateway で Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChat などに対応。
  </Card>
  <Card title="Plugins" icon="plug" href="/ja-JP/tools/plugin">
    通常の現行リリースでは別途インストールなしで、同梱 Plugin により Matrix、Nextcloud Talk、Nostr、Twitch、Zalo などを追加できます。
  </Card>
  <Card title="ルーティング" icon="route" href="/ja-JP/concepts/multi-agent">
    分離されたセッションを持つマルチエージェントルーティング。
  </Card>
  <Card title="メディア" icon="image" href="/ja-JP/nodes/images">
    画像、音声、動画、ドキュメント、および画像/動画生成。
  </Card>
  <Card title="アプリと UI" icon="monitor" href="/ja-JP/web/control-ui">
    Web Control UI と macOS コンパニオンアプリ。
  </Card>
  <Card title="モバイルノード" icon="smartphone" href="/ja-JP/nodes">
    ペアリング、音声/チャット、豊富なデバイスコマンドを備えた iOS および Android ノード。
  </Card>
</Columns>

## 完全な一覧

**チャンネル:**

- 組み込みチャンネルには Discord、Google Chat、iMessage（旧式）、IRC、Signal、Slack、Telegram、WebChat、WhatsApp が含まれます
- 同梱 Plugin チャンネルには、iMessage 向け BlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo、Zalo Personal が含まれます
- 任意で別途インストールするチャンネル Plugin には Voice Call と WeChat のようなサードパーティーパッケージが含まれます
- サードパーティーのチャンネル Plugin によって、WeChat などで Gateway をさらに拡張できます
- mention ベースのアクティベーションによるグループチャット対応
- 許可リストとペアリングによる DM の安全性

**エージェント:**

- tool ストリーミングを備えた組み込みエージェントランタイム
- ワークスペースまたは送信者ごとに分離されたセッションを持つマルチエージェントルーティング
- セッション: ダイレクトチャットは共有 `main` に集約され、グループは分離されます
- 長い応答向けのストリーミングとチャンク化

**認証とプロバイダー:**

- 35 以上のモデルプロバイダー（Anthropic、OpenAI、Google など）
- OAuth によるサブスクリプション認証（例: OpenAI Codex）
- カスタムおよびセルフホスト型プロバイダー対応（vLLM、SGLang、Ollama、および任意の OpenAI 互換または Anthropic 互換エンドポイント）

**メディア:**

- 画像、音声、動画、ドキュメントの入出力
- 共通の画像生成および動画生成の機能サーフェス
- ボイスノートの文字起こし
- 複数プロバイダーによる Text-to-speech

**アプリとインターフェース:**

- WebChat とブラウザ Control UI
- macOS メニューバーコンパニオンアプリ
- ペアリング、Canvas、カメラ、画面録画、位置情報、音声を備えた iOS ノード
- ペアリング、チャット、音声、Canvas、カメラ、デバイスコマンドを備えた Android ノード

**Tools と自動化:**

- ブラウザー自動化、exec、sandboxing
- Web 検索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cron jobs と Heartbeat スケジューリング
- Skills、Plugins、ワークフローパイプライン（Lobster）

## 関連

- [実験的機能](/ja-JP/concepts/experimental-features)
- [エージェントランタイム](/ja-JP/concepts/agent)
